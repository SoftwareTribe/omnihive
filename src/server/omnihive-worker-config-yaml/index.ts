/// <reference path="../../types/globals.omnihive.d.ts" />

import { AwaitHelper } from "@withonevision/omnihive-core/helpers/AwaitHelper";
import { ObjectHelper } from "@withonevision/omnihive-core/helpers/ObjectHelper";
import { IConfigWorker } from "@withonevision/omnihive-core/interfaces/IConfigWorker";
import { HiveWorkerBase } from "@withonevision/omnihive-core/models/HiveWorkerBase";
import { ServerConfig } from "@withonevision/omnihive-core/models/ServerConfig";
import fse from "fs-extra";
import yaml from "yaml";

export class JsonConfigWorkerMetadata {
    public configPath: string = "";
}

export default class JsonConfigWorker extends HiveWorkerBase implements IConfigWorker {
    private configPath: string = "";

    constructor() {
        super();
    }

    public async init(name: string, metadata?: any): Promise<void> {
        await AwaitHelper.execute(super.init(name, metadata));
        const typedMetadata: JsonConfigWorkerMetadata = this.checkObjectStructure<JsonConfigWorkerMetadata>(
            JsonConfigWorkerMetadata,
            metadata
        );

        this.configPath = global.omnihive.getFilePath(typedMetadata.configPath);

        if (!fse.existsSync(this.configPath)) {
            throw new Error("Config path cannot be found");
        }
    }

    public get = async (): Promise<ServerConfig> => {
        const loadedFile = ObjectHelper.create<ServerConfig>(
            ServerConfig,
            yaml.parse(fse.readFileSync(this.configPath, { encoding: "utf8" }))
        );

        loadedFile.environmentVariables.forEach((value) => {
            value.isSystem = false;
        });

        return loadedFile;
    };

    public set = async (serverConfig: ServerConfig): Promise<boolean> => {
        serverConfig.environmentVariables.forEach((value) => {
            delete value.isSystem;
        });

        fse.writeFileSync(this.configPath, yaml.stringify(serverConfig));
        return true;
    };
}
