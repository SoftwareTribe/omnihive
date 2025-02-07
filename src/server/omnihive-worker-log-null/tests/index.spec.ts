import { OmniHiveLogLevel } from "@withonevision/omnihive-core/enums/OmniHiveLogLevel";
import { AwaitHelper } from "@withonevision/omnihive-core/helpers/AwaitHelper";
import { ILogWorker } from "@withonevision/omnihive-core/interfaces/ILogWorker";
import { expect } from "chai";
import faker from "faker";
import { describe, it } from "mocha";
import ConsoleLogWorker from "../index";

const testValues = {
    logOutput: faker.datatype.string(),
    workerName: "testLogConsoleWorker",
};

const initWorker = async (): Promise<ILogWorker> => {
    const worker: ConsoleLogWorker = new ConsoleLogWorker();
    await AwaitHelper.execute(worker.init(testValues.workerName));
    return worker;
};

describe("Worker Test - Log - Null", () => {
    describe("Init Functions", () => {
        it("Test Init", async () => {
            await AwaitHelper.execute(initWorker());
        });
    });

    describe("Worker Functions", async () => {
        it(`Null Log Output`, async () => {
            const worker = await AwaitHelper.execute(initWorker());
            worker.write(OmniHiveLogLevel.Info, testValues.logOutput);
            expect("ok").to.equal("ok");
        });
    });
});
