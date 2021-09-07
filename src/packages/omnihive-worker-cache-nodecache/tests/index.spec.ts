import { describe, it, beforeEach } from "mocha";
import { AwaitHelper } from "@withonevision/omnihive-core/helpers/AwaitHelper";
import NodeCacheWorker from "..";
import faker from "faker";
import { expect } from "chai";
import { ICacheWorker } from "@withonevision/omnihive-core/interfaces/ICacheWorker";

const testValues = {
    cacheKey: faker.datatype.string(),
    cacheValue: faker.datatype.string(),
    timeout: 5000,
    workerName: "testCacheNodeCacheWorker",
};

const initWorker = async (): Promise<ICacheWorker> => {
    const worker: NodeCacheWorker = new NodeCacheWorker();
    await AwaitHelper.execute(worker.init(testValues.workerName));
    return worker;
};

describe("Worker Test - Cache - NodeCache", () => {
    describe("Init Functions", () => {
        it("Test Init", async () => {
            await AwaitHelper.execute(initWorker());
        });
    });

    describe("Worker Functions", () => {
        beforeEach(async () => {
            const worker = await AwaitHelper.execute(initWorker());
            const exists = await AwaitHelper.execute(worker.exists(testValues.cacheKey));
            if (exists) await AwaitHelper.execute(worker.remove(testValues.cacheKey));
        });

        it(`Key "${testValues.cacheKey}" Does Not Exist`, async () => {
            const worker = await AwaitHelper.execute(initWorker());
            const result = await AwaitHelper.execute(worker.exists(testValues.cacheKey));
            expect(result).to.be.false;
        });

        it(`Get/Set Cache Key "${testValues.cacheKey}" With Value "${testValues.cacheValue}"`, async () => {
            const worker = await AwaitHelper.execute(initWorker());
            await AwaitHelper.execute(worker.set(testValues.cacheKey, testValues.cacheValue, testValues.timeout));
            const result = await AwaitHelper.execute(worker.get(testValues.cacheKey));
            expect(result).to.equal(testValues.cacheValue);
        });

        it(`Cache Value of ${testValues.cacheKey} is Undefined`, async () => {
            const worker = await AwaitHelper.execute(initWorker());
            const result = await AwaitHelper.execute(worker.get(testValues.cacheKey));
            expect(result).to.be.undefined;
        });

        it(`Delete Key ${testValues.cacheKey}`, async () => {
            const worker = await AwaitHelper.execute(initWorker());
            await AwaitHelper.execute(worker.set(testValues.cacheKey, testValues.cacheValue, testValues.timeout));
            await AwaitHelper.execute(worker.remove(testValues.cacheKey));
            const result = await AwaitHelper.execute(worker.exists(testValues.cacheKey));
            expect(result).to.be.false;
        });
    });
});
