import { expect } from "chai";
import { AwaitHelper } from "@withonevision/omnihive-core/helpers/AwaitHelper";
import faker from "faker";
import CoreLogWorker from "..";
import sinon from "sinon";
import { OmniHiveLogLevel } from "@withonevision/omnihive-core/enums/OmniHiveLogLevel";
import { describe, it } from "mocha";

const testValues = {
    logOutput: faker.datatype.string(),
    workerName: "testLogConsoleWorker",
};

const initWorker = async (): Promise<CoreLogWorker> => {
    const worker: CoreLogWorker = new CoreLogWorker();
    await AwaitHelper.execute(worker.init(testValues.workerName));
    return worker;
};

describe("Worker Test - Log - Core", () => {
    describe("Init Functions", () => {
        it("Test Init", async () => {
            await AwaitHelper.execute(initWorker());
        });
    });

    describe("Worker Functions", async () => {
        before(function () {
            global.omnihive.emitToNamespace = async (_room: any, _event: any, _message?: any) => {
                return;
            };
        });

        it(`Core Log Info`, async () => {
            sinon.restore();

            const worker = await AwaitHelper.execute(initWorker());
            const spy = sinon.spy(console, "log");
            await worker.write(OmniHiveLogLevel.Info, testValues.logOutput);
            const calledArgs: string = spy.args[0][0];

            expect(calledArgs.includes(testValues.logOutput)).to.be.true;
        });

        it(`Core Log Warn`, async () => {
            sinon.restore();

            const worker = await AwaitHelper.execute(initWorker());
            const spy = sinon.spy(console, "log");
            await worker.write(OmniHiveLogLevel.Warn, testValues.logOutput);
            const calledArgs: string = spy.args[0][0];

            expect(calledArgs.includes(testValues.logOutput)).to.be.true;
        });

        it(`Core Log Error`, async () => {
            sinon.restore();

            const worker = await AwaitHelper.execute(initWorker());
            const spy = sinon.spy(console, "log");
            await worker.write(OmniHiveLogLevel.Error, testValues.logOutput);
            const calledArgs: string = spy.args[0][0];

            expect(calledArgs.includes(testValues.logOutput)).to.be.true;
        });
    });
});
