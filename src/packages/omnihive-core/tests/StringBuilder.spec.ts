import { describe, it } from "mocha";
import { expect } from "chai";
import { StringBuilder } from "../helpers/StringBuilder";
import faker from "faker";

describe("StringBuilder Tests", () => {
    it("New String Builder - With Args", () => {
        const testString = faker.datatype.string();
        const builder = new StringBuilder(testString);
        expect(builder.outputString()).to.equal(testString);
    });

    it("New String Builder - No Args", () => {
        const builder = new StringBuilder();
        expect(builder.outputString()).to.equal("");
    });

    it("Append - With Args", () => {
        const testString = faker.datatype.string();
        const appendString = faker.datatype.string();

        const builder = new StringBuilder(testString);
        builder.append(` ${appendString}`);

        expect(builder.outputString()).to.equal(`${testString} ${appendString}`);
    });

    it("Append - No Args", () => {
        const testString = faker.datatype.string();

        const builder = new StringBuilder(testString);
        builder.append();

        expect(builder.outputString()).to.equal(`${testString}`);
    });

    it("AppendLine - With Args", () => {
        const testString = faker.datatype.string();
        const appendString = faker.datatype.string();

        const builder = new StringBuilder(testString);
        builder.appendLine(` ${appendString}`);

        expect(builder.outputString()).to.equal(`${testString} ${appendString}\r\n`);
    });

    it("AppendLine - No Args", () => {
        const testString = faker.datatype.string();

        const builder = new StringBuilder(testString);
        builder.appendLine();

        expect(builder.outputString()).to.equal(`${testString}\r\n`);
    });

    it("Clear", () => {
        const testString = faker.datatype.string();

        const builder = new StringBuilder(testString);
        builder.clear();

        expect(builder.outputString()).to.equal(``);
    });
});
