import { OmniHiveLogLevel } from "@withonevision/omnihive-core/enums/OmniHiveLogLevel";
import { AwaitHelper } from "@withonevision/omnihive-core/helpers/AwaitHelper";
import { ILogWorker } from "@withonevision/omnihive-core/interfaces/ILogWorker";
import { expect } from "chai";
import faker from "faker";
import { describe, it } from "mocha";
import sinon from "sinon";
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

describe("Worker Test - Log - Console", () => {
    describe("Init Functions", () => {
        it("Test Init", async () => {
            await AwaitHelper.execute(initWorker());
        });
    });

    describe("Worker Functions", async () => {
        it(`Console Log Output`, async () => {
            const worker = await AwaitHelper.execute(initWorker());
            const spy = sinon.spy(console, "log");
            worker.write(OmniHiveLogLevel.Info, testValues.logOutput);
            expect(spy.calledWith(testValues.logOutput)).to.be.true;
        });
    });
});
