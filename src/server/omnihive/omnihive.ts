#!/usr/bin/env node
/// <reference path="../../types/globals.omnihive.d.ts" />

import { AwaitHelper } from "@withonevision/omnihive-core/helpers/AwaitHelper";
import { IsHelper } from "@withonevision/omnihive-core/helpers/IsHelper";
import chalk from "chalk";
import dotenv from "dotenv";
import figlet from "figlet";
import forever from "forever-monitor";
import fse from "fs-extra";
import ipc from "node-ipc";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import yargs from "yargs";
import exitHook from "./helpers/ExitHook";
import { CommandLineArgs } from "./models/CommandLineArgs";
import { TaskRunnerService } from "./services/TaskRunnerService";
import { RuntimeLanguage } from "./enums/RuntimeLanguage";
import { RuntimeMode } from "./enums/RuntimeMode";
import { StringBuilder } from "@withonevision/omnihive-core/helpers/StringBuilder";

// Setup IPC

let ipcId: string = uuidv4();
ipc.config.id = ipcId;
ipc.config.retry = 1500;
ipc.config.sync = true;

// Setup Child Process
let child: forever.Monitor;

// Get running directory
const runningDir: string = __dirname;

const init = async () => {
    // Interpret command line
    const cmdLineArgs = yargs(process.argv.slice(2));

    cmdLineArgs
        .help(false)
        .version(false)
        .strict()
        .command(["*", "server"], "Server Runner", (args) => {
            return args.option("environmentFile", {
                alias: "ef",
                type: "string",
                demandOption: false,
                description: "Path to environment file (absolute and relative will be checked)",
            });
        })
        .command("taskRunner", "Command-Line Task Runner", (args) => {
            return args
                .option("environmentFile", {
                    alias: "ef",
                    type: "string",
                    description: "Path to environment file (absolute and relative will be checked)",
                })
                .option("worker", {
                    alias: "w",
                    type: "string",
                    demandOption: true,
                    description: "Registered worker to invoke",
                })
                .option("args", {
                    alias: "a",
                    type: "string",
                    demandOption: false,
                    description: "Full path to JSON args file",
                });
        });

    const args = await cmdLineArgs.argv;
    const commandLineArgs: CommandLineArgs = {
        environmentFile: (args.environmentFile as string) ?? "",
        ipcServerId: ipcId,
        taskRunnerWorker: (args.worker as string) ?? "",
        taskRunnerArgs: (args.args as string) ?? "",
    };

    // Load environment file if present
    if (
        !IsHelper.isNullOrUndefined(commandLineArgs.environmentFile) &&
        !IsHelper.isEmptyStringOrWhitespace(commandLineArgs.environmentFile) &&
        fse.existsSync(commandLineArgs.environmentFile)
    ) {
        dotenv.config({ path: commandLineArgs.environmentFile });
    }

    if (
        !IsHelper.isNullOrUndefined(commandLineArgs.environmentFile) &&
        !IsHelper.isEmptyStringOrWhitespace(commandLineArgs.environmentFile) &&
        commandLineArgs.environmentFile &&
        !fse.existsSync(commandLineArgs.environmentFile)
    ) {
        if (fse.existsSync(path.join(runningDir, commandLineArgs.environmentFile))) {
            dotenv.config({
                path: path.join(runningDir, commandLineArgs.environmentFile),
            });
        }
    }

    // Print header
    console.log(chalk.yellow(figlet.textSync("OMNIHIVE")));
    console.log();

    // Check for task runner
    if (args._[0] === "taskRunner") {
        const taskRunnerService: TaskRunnerService = new TaskRunnerService();
        return await AwaitHelper.execute(taskRunnerService.run(runningDir, commandLineArgs));
    }

    // Server is necessary because it's not the taskRunner
    // Serve up IPC
    ipc.serve(() => {
        ipc.server.on("omnihive.reboot", () => {
            child.restart();
        });
    });

    ipc.server.start();

    // Create child process
    createServerChild(commandLineArgs);

    // Process termination (mostly from nodemon)
    process.on("SIGUSR2", () => {
        if (!IsHelper.isNullOrUndefined(child)) {
            child.kill(true);
        }
        process.kill(process.pid, "SIGHUP");
    });
};

// Child process spawner
const createServerChild = async (commandLineArgs: CommandLineArgs) => {
    let runtimeLanguage: RuntimeLanguage = RuntimeLanguage.JavaScript;
    let runtimeMode: RuntimeMode = RuntimeMode.Production;

    if (!IsHelper.isNullOrUndefined(process.env.OH_RUNTIME_MODE) && IsHelper.isString(process.env.OH_RUNTIME_MODE)) {
        switch (process.env.OH_RUNTIME_MODE.toLowerCase()) {
            case "debug":
                runtimeMode = RuntimeMode.Debug;
                break;
            case "project":
                runtimeMode = RuntimeMode.Project;
                break;
            default:
                runtimeMode = RuntimeMode.Production;
                break;
        }
    }

    if (
        !IsHelper.isNullOrUndefined(process.env.OH_RUNTIME_LANGUAGE) &&
        IsHelper.isString(process.env.OH_RUNTIME_LANGUAGE)
    ) {
        switch (process.env.OH_RUNTIME_LANGUAGE.toLowerCase()) {
            case "typescript":
                runtimeLanguage = RuntimeLanguage.TypeScript;
                break;
            default:
                runtimeLanguage = RuntimeLanguage.JavaScript;
                break;
        }
    }

    const executionCommand: StringBuilder = new StringBuilder("node ");

    if (runtimeLanguage === RuntimeLanguage.TypeScript) {
        executionCommand.append("-r ts-node/register ");
    }

    if (runtimeMode !== RuntimeMode.Production) {
        executionCommand.append("--inspect --inspect-port=0 ");
    }

    const executionScript: StringBuilder = new StringBuilder("serverRunner.");

    if (runtimeLanguage === RuntimeLanguage.JavaScript) {
        executionScript.append("js");
    } else if (runtimeLanguage === RuntimeLanguage.TypeScript) {
        if (runtimeMode === RuntimeMode.Debug) {
            executionScript.append("ts");
        } else {
            executionScript.append("js");
        }
    }

    child = new forever.Monitor(
        [
            `${executionCommand.outputString().trim()}`,
            `${executionScript.outputString().trim()}`,
            `${ipcId}`,
            `${
                !IsHelper.isEmptyStringOrWhitespace(commandLineArgs.environmentFile)
                    ? `${commandLineArgs.environmentFile}`
                    : ``
            }`,
        ],
        { cwd: runningDir, env: { ...process.env, FORCE_COLOR: "1" } }
    );

    child.on("exit:code", (code: number) => {
        if (IsHelper.isNullOrUndefined(child) || IsHelper.isNull(code)) {
            return;
        }

        child.kill(true);
        process.exit(code);
    });

    child.start();
};

// Kill child if parent dies
exitHook(() => {
    if (!IsHelper.isNullOrUndefined(child)) {
        child.kill(true);
    }
});

// Run init
init();
