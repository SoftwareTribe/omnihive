import { describe, it } from "mocha";
import { expect } from "chai";
import { CommandLineArgs } from "../models/CommandLineArgs";

describe("OmniHive Model Tests", () => {
    it("CommandLineArgs.ts", () => {
        const model: CommandLineArgs = new CommandLineArgs();
        expect(model.environmentFile).to.equal("");
        expect(model.ipcServerId).to.equal("");
        expect(model.taskRunnerWorker).to.equal("");
        expect(model.taskRunnerArgs).to.equal("");
    });
});
