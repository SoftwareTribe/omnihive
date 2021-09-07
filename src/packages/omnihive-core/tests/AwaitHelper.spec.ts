import { describe, it } from "mocha";
import { AwaitHelper } from "../helpers/AwaitHelper";
import { expect } from "chai";
import faker from "faker";

const testValues = {
    testString: faker.datatype.string(),
    milliseconds: 10,
};

const failFunction = async (): Promise<string> => {
    return new Promise<string>((_resolve, reject) =>
        setTimeout(() => reject(testValues.testString), testValues.milliseconds)
    );
};

const successFunction = async (): Promise<string> => {
    return new Promise<string>((resolve) => setTimeout(() => resolve(testValues.testString), testValues.milliseconds));
};

describe("AwaitHelper Tests", async () => {
    it("Success Call", async () => {
        const result = await AwaitHelper.execute(successFunction());
        expect(result).equal(testValues.testString);
    });

    it("Failure Call", async () => {
        try {
            await AwaitHelper.execute(failFunction());
            expect.fail("Function Should Have Failed");
        } catch (err) {
            expect(err).to.equal(testValues.testString);
        }
    });
});
