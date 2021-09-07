import chalk from "chalk";
import figlet from "figlet";
import fse from "fs-extra";
import path from "path";
import replaceInFile, { ReplaceInFileConfig } from "replace-in-file";
import yargs from "yargs";
import axios from "axios";
import { Listr } from "listr2";
import execa from "execa";
import { IsHelper } from "src/packages/omnihive-core/helpers/IsHelper";
import readPkgUp from "read-pkg-up";

interface IArgs {
    ohVersion: string;
    workspace: string;
    packageList: string[];
    publish: boolean;
    publishAccess: string;
    publishTag: string;
    publishVersion: string;
}

let args: IArgs;

const build = async (): Promise<void> => {
    // Handle args
    const cmdLineArgs = yargs(process.argv.slice(2));

    cmdLineArgs
        .help(false)
        .version(false)
        .strict()
        .option("ohVersion", {
            alias: "ohv",
            type: "string",
            demandOption: false,
            description: "OmniHive version to build against.  Will use latest if not provided",
        })
        .option("workspace", {
            alias: "w",
            type: "string",
            demandOption: false,
            default: "custom",
            choices: ["custom", "extras"],
            description: "Workspace to build and/or publish.  Only custom and extras are allowed.",
        })
        .option("packageList", {
            alias: "pl",
            array: true,
            type: "array",
            demandOption: false,
            default: "*",
            description:
                "List of packages to build and/or publish.  Asterisk is the default and will handle all packages in the workspace",
        })
        .array("packageList")
        .option("publish", {
            alias: "p",
            type: "boolean",
            demandOption: false,
            description: "Publish to NPM",
            default: false,
        })
        .option("publishAccess", {
            alias: "pa",
            type: "string",
            demandOption: false,
            description: "Access to use when publishing to NPM",
            default: "public",
            choices: ["public", "restricted"],
        })
        .option("publishTag", {
            alias: "pt",
            type: "string",
            demandOption: false,
            description: "Tag to use when publishing",
        })
        .option("publishVersion", {
            alias: "pv",
            type: "string",
            demandOption: false,
            description: "Version number of package",
        })
        .check((args) => {
            if (args.packageList.some((value) => value === "*")) {
                return true;
            }

            args.packageList.forEach((value) => {
                const pathName: string = path.join(".", "src", args.workspace, value);
                if (!fse.pathExistsSync(pathName)) {
                    throw new Error(`Path: ${pathName} does not exist`);
                }
            });

            if (args.publish === true && IsHelper.isNullOrUndefined(args.publishVersion)) {
                throw new Error("If publish is set you must set a publish version");
            }

            return true;
        });

    const responseArgs = await cmdLineArgs.argv;
    args = responseArgs as unknown as IArgs;

    // Populate OmniHive version number

    if (!IsHelper.isNullOrUndefined(args.ohVersion) && IsHelper.isString(args.ohVersion)) {
        args.ohVersion = args.ohVersion as string;
    } else {
        const versions = (await axios.get("https://registry.npmjs.org/-/package/omnihive/dist-tags")).data;
        args.ohVersion = versions.latest;
    }

    // Header
    console.log(chalk.yellow(figlet.textSync("OMNIHIVE")));
    console.log();

    const tasks = setupTasks();
    await tasks.run();
};

// Main Listr setup
const setupTasks = (): Listr<any> => {
    return new Listr<any>([
        {
            title: "Clear Out Existing Dist Directories",
            task: clearOutExistingDist,
            options: {
                showTimer: true,
            },
        },
        {
            title: "Build Repo",
            task: buildRepo,
            options: {
                showTimer: true,
            },
        },
        {
            title: "Update Package Versions",
            task: async () => await updateVersions(),
            options: {
                showTimer: true,
            },
        },
        {
            title: "Publish Packages",
            skip: (_ctx) => !args.publish as boolean,
            task: (_ctx, task): Listr =>
                task.newListr(
                    getPublishFolders().map((directory) => ({
                        title: `Publishing ${directory}`,
                        task: () => publish(directory),
                        options: {
                            showTimer: true,
                            showSubtasks: true,
                        },
                    })),
                    { concurrent: true }
                ),
            options: {
                showTimer: true,
            },
        },
    ]);
};

// Listr task helpers
const buildRepo = () => {
    execa.commandSync("npx tsc -b --force", { cwd: path.join(`.`) });
};

const clearOutExistingDist = () => {
    fse.rmSync(path.join(`.`, `dist`), { recursive: true, force: true });
};

const getPublishFolders = () => {
    const typedArgs: IArgs = args as IArgs;
    const returnDirectories: string[] = [];

    // Get all packages directories
    if (!typedArgs.packageList.some((value) => value === "*")) {
        typedArgs.packageList.forEach((value) => {
            returnDirectories.push(path.join(".", "dist", typedArgs.workspace, value));
        });

        return returnDirectories;
    }

    const allDirectories: string[] = fse
        .readdirSync(path.join(`.`, `dist`, typedArgs.workspace))
        .filter((f) => fse.statSync(path.join(`.`, `dist`, typedArgs.workspace, f)).isDirectory());

    allDirectories.forEach((value) => {
        returnDirectories.push(path.join(".", "dist", typedArgs.workspace, value));
    });

    return returnDirectories;
};

const publish = (directory: string) => {
    if (fse.existsSync(path.join(directory, "tests"))) {
        fse.rmdirSync(path.join(directory, `tests`), { recursive: true });
    }

    let publishString: string = "npm publish";

    if (
        IsHelper.isBoolean(args.publishAccess) &&
        !IsHelper.isNullOrUndefined(args.publishAccess) &&
        args.publishAccess
    ) {
        publishString = `${publishString} --access ${args.publishAccess as string}`;
    } else {
        publishString = `${publishString} --access public`;
    }

    if (IsHelper.isBoolean(args.publishTag) && !IsHelper.isNullOrUndefined(args.publishTag) && args.publishTag) {
        publishString = `${publishString} --tag ${args.publishTag as string}`;
    }

    console.log(`Publishing NPM Package at ${directory}`);
    execa.commandSync(publishString, { cwd: directory });
};

const updateVersions = async () => {
    // Patch package.json with latest OH version
    const replaceOhVersionOptions: ReplaceInFileConfig = {
        allowEmptyPaths: true,
        files: [path.join(`dist`, `**`, `package.json`)],
        from: /"@withonevision\/omnihive.*"\s*:\s*"workspace:\*"/g,
        to: `${args.ohVersion}`,
    };

    let publishVersion: string = args.publishVersion;

    await replaceInFile.replaceInFile(replaceOhVersionOptions);

    // Replace package versions for publishing if provided

    if (IsHelper.isNullOrUndefined(args.publish) || args.publish === false) {
        return;
    }

    // If version was not specified then get the max version and increment patch number
    if (IsHelper.isNullOrUndefinedOrEmptyStringOrWhitespace(args.publishVersion)) {
        const maxVersion: string = await getMaxVersionOfPackages();

        // Increment Patch Number
        const parts: string[] = maxVersion.split(".");
        parts[parts.length - 1] = (Number.parseInt(parts[parts.length - 1]) + 1).toString();

        // Build version string
        publishVersion = parts.join(".");
    }

    const replacePublishVersionOptions: ReplaceInFileConfig = {
        allowEmptyPaths: true,
        files: [path.join(`dist`, `**`, `package.json`)],
        from: /"version": ".*"/g,
        to: `"version": "${publishVersion}"`,
    };

    await replaceInFile.replaceInFile(replacePublishVersionOptions);

    const replaceDependentVersionOptions: ReplaceInFileConfig = {
        allowEmptyPaths: true,
        files: [path.join(`dist`, `**`, `package.json`)],
        from: /"workspace:\*"/g,
        to: `"${publishVersion}"`,
    };

    await replaceInFile.replaceInFile(replaceDependentVersionOptions);
};

const getMaxVersionOfPackages = async (): Promise<string> => {
    let version = "";

    // Find all valid workspace packages
    const packageFolders: string[] = await fse
        .readdirSync(path.join(`.`, `dist`, args.workspace))
        .filter(
            (f) =>
                args.packageList.some((x) => x === "*" || x === f) &&
                fse.statSync(path.join(`.`, `dist`, args.workspace, f)).isDirectory()
        );

    // Iterate through each package and grab the max version
    for (const item of packageFolders) {
        // Get package names
        const packageName: string | undefined = (
            await readPkgUp({
                cwd: path.join(`.`, `dist`, `custom`, item),
            })
        )?.packageJson.name;

        if (packageName) {
            try {
                const packageVersion: string = execa.commandSync(`npm view ${packageName} version`).stdout;

                if (parseVersionNumber(packageVersion) > parseVersionNumber(version)) {
                    version = packageVersion;
                }
            } catch (err) {
                continue;
            }
        }
    }

    return version;
};

const parseVersionNumber = (versionNumber: string) => {
    const parts: string[] = versionNumber.split(".");
    parts.forEach((x) => x.padStart(5, "0"));
    return Number.parseInt("1" + parts.join(""));
};

build();
