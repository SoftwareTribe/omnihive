import { OmniHiveLogLevel } from "@withonevision/omnihive-core/enums/OmniHiveLogLevel";
import { AwaitHelper } from "@withonevision/omnihive-core/helpers/AwaitHelper";
import { assert } from "chai";
import { serializeError } from "serialize-error";
import ElasticLogWorker from "..";
import { TestConfigSettings } from "../../../tests/models/TestConfigSettings";
import { TestService } from "../../../tests/services/TestService";
import packageJson from "../package.json";

let settings: TestConfigSettings;
let worker: ElasticLogWorker = new ElasticLogWorker();
const testService: TestService = new TestService();

describe("log worker tests", function () {
    before(function () {
        const config: TestConfigSettings | undefined = testService.getTestConfig(packageJson.name);

        if (!config) {
            this.skip();
        }

        testService.clearWorkers();
        settings = config;
    });

    const init = async function (): Promise<void> {
        try {
            await AwaitHelper.execute(testService.initWorkers(settings.workers));
            const newWorker = testService.registeredWorkers.find((x) => x[0].package === packageJson.name);

            if (newWorker && newWorker[1]) {
                worker = newWorker[1];
            }
        } catch (err) {
            throw new Error("init failure: " + serializeError(JSON.stringify(err)));
        }
    };

    describe("Init functions", function () {
        it("test init", async function () {
            const result = await init();
            assert.isUndefined(result);
        });
    });

    describe("Worker Functions", function () {
        before(async function () {
            await init();
        });

        it("write to log", async function () {
            try {
                const result = await worker.write(
                    OmniHiveLogLevel.Info,
                    "OmniHive Test Case => Valid test log message."
                );
                assert.isUndefined(result);
            } catch (err) {
                console.log(serializeError(err));
                assert.fail(err);
            }
        });
    });
});
