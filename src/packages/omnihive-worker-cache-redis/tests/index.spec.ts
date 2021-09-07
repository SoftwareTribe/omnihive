import { describe, it, beforeEach } from "mocha";
import { expect } from "chai";
import { AwaitHelper } from "@withonevision/omnihive-core/helpers/AwaitHelper";
import faker from "faker";
import RedisCacheWorker from "..";
import { ICacheWorker } from "@withonevision/omnihive-core/interfaces/ICacheWorker";

const testValues = {
    cacheKey: faker.datatype.string(),
    cacheValue: faker.datatype.string(),
    connectionStringInvalid: "redis://localhost:9999",
    connectionStringValid: "redis://localhost:6379",
    timeout: 5000,
    workerName: "testCacheRedisCacheWorker",
};

const initWorker = async (connectionString: string): Promise<ICacheWorker> => {
    const worker: RedisCacheWorker = new RedisCacheWorker();
    await AwaitHelper.execute(worker.init(testValues.workerName, { connectionString }));
    return worker;
};

describe("Worker Test - Cache - Redis", () => {
    describe("Init Functions", () => {
        it("Test Init - Valid Connection String", async () => {
            await AwaitHelper.execute(initWorker(testValues.connectionStringValid));
        });

        it("Test Init - Invalid Connection String", async () => {
            try {
                await AwaitHelper.execute(initWorker(testValues.connectionStringInvalid));
                expect.fail("Method Expected to Fail");
            } catch (err) {
                expect(err).to.be.an.instanceOf(Error);
            }
        });
    });
    describe("Worker Functions", () => {
        beforeEach(async () => {
            const worker = await AwaitHelper.execute(initWorker(testValues.connectionStringValid));
            const exists = await AwaitHelper.execute(worker.exists(testValues.cacheKey));
            if (exists) await AwaitHelper.execute(worker.remove(testValues.cacheKey));
        });

        it(`Key "${testValues.cacheKey}" Does Not Exist`, async () => {
            const worker = await AwaitHelper.execute(initWorker(testValues.connectionStringValid));
            const result = await AwaitHelper.execute(worker.exists(testValues.cacheKey));
            expect(result).to.be.false;
        });

        it(`Get/Set Cache Key "${testValues.cacheKey}" With Value "${testValues.cacheValue}"`, async () => {
            const worker = await AwaitHelper.execute(initWorker(testValues.connectionStringValid));
            await AwaitHelper.execute(worker.set(testValues.cacheKey, testValues.cacheValue, testValues.timeout));
            const result = await AwaitHelper.execute(worker.get(testValues.cacheKey));
            expect(result).to.equal(testValues.cacheValue);
        });

        it(`Cache Value of ${testValues.cacheKey} is Undefined`, async () => {
            const worker = await AwaitHelper.execute(initWorker(testValues.connectionStringValid));
            const result = await AwaitHelper.execute(worker.get(testValues.cacheKey));
            expect(result).to.be.undefined;
        });

        it(`Delete Key ${testValues.cacheKey}`, async () => {
            const worker = await AwaitHelper.execute(initWorker(testValues.connectionStringValid));
            await AwaitHelper.execute(worker.set(testValues.cacheKey, testValues.cacheValue, testValues.timeout));
            await AwaitHelper.execute(worker.remove(testValues.cacheKey));
            const result = await AwaitHelper.execute(worker.exists(testValues.cacheKey));
            expect(result).to.be.false;
        });
    });
});
