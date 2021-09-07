import { describe, it } from "mocha";
import { expect } from "chai";
import { ObjectHelper } from "../helpers/ObjectHelper";
import faker from "faker";

class TestObject {
    public name: string = "";
    public value: string = "";
}

describe("ObjectHelper Tests", () => {
    it("Create Object", () => {
        const testName: string = faker.datatype.string();
        const testValue: string = faker.datatype.string();
        const fakeValue: string = faker.datatype.string();

        const model = {
            name: testName,
            value: testValue,
            fakeKey: fakeValue,
        };

        const obj = ObjectHelper.create<TestObject>(TestObject, model);
        expect(obj).to.include({ name: testName, value: testValue }).but.not.include({ fakeKey: fakeValue });
    });

    it("Create Object - Generic", () => {
        const obj = ObjectHelper.create<TestObject>(TestObject, null);
        expect(obj).to.deep.equal(new TestObject());
    });

    it("Create Object Strict", () => {
        const testName: string = faker.datatype.string();
        const testValue: string = faker.datatype.string();

        const model = {
            name: testName,
            value: testValue,
        };

        const obj = ObjectHelper.createStrict<TestObject>(TestObject, model);
        expect(model).to.deep.equal(obj);
    });

    it("Create Object Strict - No Model", () => {
        try {
            ObjectHelper.createStrict<TestObject>(TestObject, null);
            expect.fail("Strict can not create without a model");
        } catch (err) {
            expect(err).to.be.an.instanceOf(Error);
        }
    });

    it("Create Object Strict - Bad Property", () => {
        try {
            const testString: string = faker.datatype.string();

            const model = {
                fakeProperty: testString,
            };

            ObjectHelper.createStrict<TestObject>(TestObject, model);
            expect.fail("Strict can not create with a bad property");
        } catch (err) {
            expect(err).to.be.an.instanceOf(Error);
        }
    });

    it("Create Array", () => {
        const testName: string = faker.datatype.string();
        const testValue: string = faker.datatype.string();
        const fakeValue: string = faker.datatype.string();

        const model = {
            name: testName,
            value: testValue,
            fakeKey: fakeValue,
        };

        const obj = ObjectHelper.createArray<TestObject>(TestObject, [model, model]);
        expect(obj.length).to.equal(2);

        obj.forEach((arrValue) => {
            expect(arrValue).to.include({ name: testName, value: testValue }).but.not.include({ fakeKey: fakeValue });
        });
    });

    it("Create Array Strict", () => {
        const testName: string = faker.datatype.string();
        const testValue: string = faker.datatype.string();

        const model = {
            name: testName,
            value: testValue,
        };

        const obj = ObjectHelper.createArrayStrict<TestObject>(TestObject, [model, model]);
        expect(obj.length).to.equal(2);
        expect([model, model]).to.deep.equal(obj);
    });

    it("Create Array Strict - Bad Property", () => {
        try {
            const testString: string = faker.datatype.string();

            const model = {
                fakeProperty: testString,
            };

            ObjectHelper.createArrayStrict<TestObject>(TestObject, [model, model]);
            expect.fail("Strict array can not create with a bad property");
        } catch (err) {
            expect(err).to.be.an.instanceOf(Error);
        }
    });
});
