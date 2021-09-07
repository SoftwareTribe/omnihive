import { describe, it, beforeEach, afterEach, after } from "mocha";
import { AwaitHelper } from "@withonevision/omnihive-core/helpers/AwaitHelper";
import { expect } from "chai";
import path from "path";
import FileSystemWorker from "..";
import faker from "faker";
import fse from "fs-extra";

const testValues = {
    workerName: "testFilesystemFsExtra",
    dirnamePath: __dirname,
    workDirectoryPath: path.join(__dirname, "work-directory"),
    copyDirectoryPath: path.join(__dirname, "work-copy-folder"),
    testData: JSON.parse(faker.datatype.json()),
    testJsonFileName: "test-json-file.json",
    testJsonFilePath: path.join(__dirname, "work-directory", "test-json-file.json"),
};

const initWorker = async (): Promise<FileSystemWorker> => {
    const worker: FileSystemWorker = new FileSystemWorker();
    await AwaitHelper.execute(worker.init(testValues.workerName));
    return worker;
};

describe("Worker Test - File - FSExtra", () => {
    describe("Init Functions", () => {
        it("Test Init", async () => {
            await AwaitHelper.execute(initWorker());
        });
    });

    describe("Worker Functions", () => {
        beforeEach(() => {
            fse.ensureDirSync(testValues.copyDirectoryPath);
            fse.emptyDirSync(testValues.copyDirectoryPath);

            fse.ensureDirSync(testValues.workDirectoryPath);
            fse.emptyDirSync(testValues.workDirectoryPath);

            fse.writeFileSync(testValues.testJsonFilePath, JSON.stringify(testValues.testData), { encoding: "utf8" });
        });

        afterEach(() => {
            if (fse.existsSync(testValues.workDirectoryPath)) {
                if (fse.readdirSync(testValues.workDirectoryPath).length > 0) {
                    fse.emptyDirSync(testValues.workDirectoryPath);
                }

                fse.rmdirSync(testValues.workDirectoryPath);
            }

            if (fse.existsSync(testValues.copyDirectoryPath)) {
                if (fse.readdirSync(testValues.copyDirectoryPath).length > 0) {
                    fse.emptyDirSync(testValues.copyDirectoryPath);
                }

                fse.rmdirSync(testValues.copyDirectoryPath);
            }
        });

        after(() => {
            if (fse.pathExistsSync(testValues.copyDirectoryPath)) {
                fse.rmdirSync(testValues.copyDirectoryPath);
            }

            if (fse.pathExistsSync(testValues.workDirectoryPath)) {
                fse.rmdirSync(testValues.workDirectoryPath);
            }
        });

        it("Directory Has Files", async () => {
            const worker = await AwaitHelper.execute(initWorker());
            const results: boolean = worker.directoryHasFiles("./");
            expect(results).to.be.true;
        });

        it("Read Files From Directory", async () => {
            const worker = await AwaitHelper.execute(initWorker());
            const results: string[] = worker.readFileNamesFromDirectory(testValues.workDirectoryPath);
            expect(results).to.deep.equal([testValues.testJsonFileName]);
        });

        it("Read File", async () => {
            const worker = await AwaitHelper.execute(initWorker());
            const fileContents: string = worker.readFile(testValues.testJsonFilePath);
            expect(fileContents).to.equal(JSON.stringify(testValues.testData));
        });

        it("Ensure Folder Exists", async () => {
            const worker = await AwaitHelper.execute(initWorker());
            worker.ensureFolderExists(testValues.workDirectoryPath);
            const result: boolean = worker.pathExists(testValues.workDirectoryPath);
            expect(result).to.be.true;
        });

        it("Remove File", async () => {
            const worker = await AwaitHelper.execute(initWorker());
            worker.removeFile(testValues.testJsonFilePath);
            const result: string[] = worker.readFileNamesFromDirectory(testValues.workDirectoryPath);
            expect(result).to.deep.equal([]);
        });

        it("Remove Files In Directory", async () => {
            const worker = await AwaitHelper.execute(initWorker());
            worker.removeFilesFromDirectory(testValues.workDirectoryPath);
            const result: string[] = worker.readFileNamesFromDirectory(testValues.workDirectoryPath);
            expect(result).to.deep.equal([]);
        });

        it("Remove Directory - Valid Directory", async () => {
            const worker = await AwaitHelper.execute(initWorker());
            worker.removeDirectory(testValues.workDirectoryPath);
            const result: boolean = worker.pathExists(testValues.workDirectoryPath);
            expect(result).to.be.false;
        });

        it("Remove Directory - Valid Directory - With Files", async () => {
            const worker = await AwaitHelper.execute(initWorker());
            worker.ensureFolderExists(testValues.workDirectoryPath);

            for (let i = 0; i < 3; i++) {
                const fileContents: string = faker.lorem.paragraphs();
                worker.writeDataToFile(
                    path.join(testValues.workDirectoryPath, `${faker.system.fileName()}.txt`),
                    fileContents
                );
            }

            worker.removeDirectory(testValues.workDirectoryPath);
            const result: boolean = worker.pathExists(testValues.workDirectoryPath);
            expect(result).to.be.false;
        });

        it("Remove Directory - Valid Directory - Without Files", async () => {
            const worker = await AwaitHelper.execute(initWorker());
            worker.ensureFolderExists(testValues.workDirectoryPath);
            worker.removeFilesFromDirectory(testValues.workDirectoryPath);
            worker.removeDirectory(testValues.workDirectoryPath);
            const result: boolean = worker.pathExists(testValues.workDirectoryPath);
            expect(result).to.be.false;
        });

        it("Remove Directory - Invalid Directory", async () => {
            const badPath: string = path.join(".", "bad-directory");
            const worker = await AwaitHelper.execute(initWorker());

            try {
                worker.removeDirectory(badPath);
                const result: boolean = worker.pathExists(badPath);
                expect(result).to.be.false;
            } catch (err) {
                expect(err).to.not.be.an.instanceOf(Error);
            }
        });

        it("Write Data To File", async () => {
            const worker = await AwaitHelper.execute(initWorker());
            const testPath: string = path.join(testValues.workDirectoryPath, `${faker.system.fileName()}.txt`);
            const testData: string = faker.lorem.paragraphs();
            worker.writeDataToFile(testPath, testData);

            // Verify file creation
            const exists: boolean = worker.pathExists(testPath);
            expect(exists).to.be.true;

            // Verify file content
            const result: string = worker.readFile(testPath);
            expect(result).to.deep.equal(testData);
        });

        it("Write JSON To File", async () => {
            const worker = await AwaitHelper.execute(initWorker());
            const testPath: string = path.join(testValues.workDirectoryPath, `${faker.system.fileName()}.json`);
            worker.writeJsonToFile(testPath, testValues.testData);

            // Verify file creation
            const exists: boolean = worker.pathExists(testPath);
            expect(exists).to.be.true;

            // Verify file content
            const fileContents: string = worker.readFile(testPath);
            expect(fileContents).to.equal(JSON.stringify(testValues.testData));
        });

        it("Copy File", async () => {
            const worker = await AwaitHelper.execute(initWorker());
            const sourcePath: string = path.join(testValues.workDirectoryPath, `${faker.system.fileName()}.json`);
            const sourceData: string = JSON.parse(faker.datatype.json());
            worker.writeJsonToFile(sourcePath, sourceData);

            const destPath: string = path.join(testValues.copyDirectoryPath, `${faker.system.fileName()}.json`);
            worker.copyFile(sourcePath, destPath);

            const result: boolean = worker.pathExists(destPath);
            expect(result).to.be.true;
        });

        it("Copy Directory", async () => {
            const worker = await AwaitHelper.execute(initWorker());
            const sourceFiles: string[] = worker.readFileNamesFromDirectory(testValues.workDirectoryPath);
            const destPath: string = path.join(testValues.copyDirectoryPath);
            worker.copyDirectory(testValues.workDirectoryPath, destPath);

            const result: string[] = worker.readFileNamesFromDirectory(destPath);
            expect(result).to.deep.equal(sourceFiles);
        });
    });
});
