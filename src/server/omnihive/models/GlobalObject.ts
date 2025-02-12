/// <reference path="../../../types/globals.omnihive.d.ts" />

import { OmniHiveClient } from "@withonevision/omnihive-core/client/OmniHiveClient";
import { AdminEventType } from "@withonevision/omnihive-core/enums/AdminEventType";
import { AdminRoomType } from "@withonevision/omnihive-core/enums/AdminRoomType";
import { RegisteredHiveWorkerSection } from "@withonevision/omnihive-core/enums/RegisteredHiveWorkerSection";
import { ServerStatus } from "@withonevision/omnihive-core/enums/ServerStatus";
import { AwaitHelper } from "@withonevision/omnihive-core/helpers/AwaitHelper";
import { IsHelper } from "@withonevision/omnihive-core/helpers/IsHelper";
import { IHiveWorker } from "@withonevision/omnihive-core/interfaces/IHiveWorker";
import { AdminRequest } from "@withonevision/omnihive-core/models/AdminRequest";
import { AdminResponse } from "@withonevision/omnihive-core/models/AdminResponse";
import { ConnectionSchema } from "@withonevision/omnihive-core/models/ConnectionSchema";
import { EnvironmentVariable } from "@withonevision/omnihive-core/models/EnvironmentVariable";
import { HiveWorkerConfig } from "@withonevision/omnihive-core/models/HiveWorkerConfig";
import { RegisteredHiveWorker } from "@withonevision/omnihive-core/models/RegisteredHiveWorker";
import { RegisteredUrl } from "@withonevision/omnihive-core/models/RegisteredUrl";
import { ServerConfig } from "@withonevision/omnihive-core/models/ServerConfig";
import express from "express";
import fse from "fs-extra";
import { Server } from "http";
import path from "path";
import socketIo from "socket.io";
import { CommandLineArgs } from "./CommandLineArgs";
import importFresh from "import-fresh";
import { RuntimeMode } from "../enums/RuntimeMode";

export class GlobalObject {
    public adminServer: socketIo.Server | undefined = undefined;
    public appServer: express.Express | undefined = undefined;
    public commandLineArgs: CommandLineArgs = new CommandLineArgs();
    public ohDirName: string = "";
    public registeredSchemas: ConnectionSchema[] = [];
    public registeredUrls: RegisteredUrl[] = [];
    public registeredWorkers: RegisteredHiveWorker[] = [];
    public serverClient: OmniHiveClient = OmniHiveClient.getSingleton();
    public serverConfig: ServerConfig = new ServerConfig();
    public serverError: any = {};
    public serverStatus: ServerStatus = ServerStatus.Unknown;
    public webServer: Server | undefined = undefined;

    public checkWorkerImportPath = (hiveWorker: HiveWorkerConfig) => {
        const runtimeProjectPath = this.getEnvironmentVariable<string>("OH_RUNTIME_PROJECT_PATH") ?? "";
        const runtimeMode = this.getEnvironmentVariable<string>("OH_RUNTIME_MODE") ?? "production";

        if (
            IsHelper.isNullOrUndefined(hiveWorker.importPath) ||
            IsHelper.isEmptyStringOrWhitespace(hiveWorker.importPath)
        ) {
            throw new Error(`Hive worker type ${hiveWorker.type} with name ${hiveWorker.name} has no import path`);
        }

        if (IsHelper.isEmptyStringOrWhitespace(hiveWorker.package)) {
            if (
                hiveWorker.importPath.includes("${ohProjectPath}") &&
                !IsHelper.isNullOrUndefinedOrEmptyStringOrWhitespace(runtimeProjectPath) &&
                runtimeMode === RuntimeMode.Project
            ) {
                hiveWorker.importPath = hiveWorker.importPath.replace("${ohProjectPath}", runtimeProjectPath);
            } else {
                if (!IsHelper.isEmptyStringOrWhitespace(this.ohDirName)) {
                    hiveWorker.importPath = path.join(this.ohDirName, hiveWorker.importPath);
                } else {
                    hiveWorker.importPath = path.join(process.cwd(), hiveWorker.importPath);
                }
            }
        }
    };

    public emitToCluster = async (event: AdminEventType, message?: any): Promise<void> => {
        if (IsHelper.isNullOrUndefined(this.adminServer)) {
            return;
        }

        const adminPassword = this.getEnvironmentVariable<string>("OH_ADMIN_PASSWORD");
        const serverGroupId = this.getEnvironmentVariable<string>("OH_ADMIN_SERVER_GROUP_ID");

        if (
            IsHelper.isNullOrUndefinedOrEmptyStringOrWhitespace(adminPassword) ||
            IsHelper.isNullOrUndefinedOrEmptyStringOrWhitespace(serverGroupId)
        ) {
            throw new Error("Admin password or server group ID is undefined");
        }

        const eventMessage: AdminRequest = {
            adminPassword,
            serverGroupId,
            data: message,
        };

        this.adminServer.emit(event, eventMessage);
    };

    public emitToNamespace = async (room: AdminRoomType, event: AdminEventType, message?: any): Promise<void> => {
        if (IsHelper.isNullOrUndefined(this.adminServer)) {
            return;
        }

        const serverGroupId = this.getEnvironmentVariable<string>("OH_ADMIN_SERVER_GROUP_ID");

        if (IsHelper.isNullOrUndefinedOrEmptyStringOrWhitespace(serverGroupId)) {
            throw new Error("Server group ID is undefined");
        }

        const eventMessage: AdminResponse = {
            serverGroupId,
            requestComplete: true,
            requestError: undefined,
            data: message,
        };

        this.adminServer
            .of(`/${this.getEnvironmentVariable<string>("OH_ADMIN_SERVER_GROUP_ID")}`)
            .to(`${this.getEnvironmentVariable<string>("OH_ADMIN_SERVER_GROUP_ID")}-${room}`)
            .emit(event, eventMessage);
    };

    public getEnvironmentVariable = <T extends string | number | boolean>(name: string): T | undefined => {
        const envVariable: EnvironmentVariable | undefined = this.serverConfig.environmentVariables.find(
            (variable: EnvironmentVariable) => variable.key === name
        );

        if (IsHelper.isNullOrUndefined(envVariable)) {
            return undefined;
        }

        try {
            return envVariable.value as T;
        } catch {
            return undefined;
        }
    };

    public getFilePath = (filePath: string): string => {
        let finalPath: string = "";

        if (IsHelper.isNullOrUndefined(filePath) || IsHelper.isEmptyStringOrWhitespace(filePath)) {
            return finalPath;
        }

        if (fse.existsSync(filePath)) {
            finalPath = filePath;
        }

        if (IsHelper.isEmptyStringOrWhitespace(finalPath) && fse.existsSync(path.join(this.ohDirName, filePath))) {
            finalPath = path.join(this.ohDirName, filePath);
        }

        if (
            IsHelper.isEmptyStringOrWhitespace(finalPath) &&
            !IsHelper.isEmptyStringOrWhitespace(this.commandLineArgs.environmentFile) &&
            fse.existsSync(path.join(path.parse(this.commandLineArgs.environmentFile).dir, filePath))
        ) {
            finalPath = path.join(path.parse(this.commandLineArgs.environmentFile).dir, filePath);
        }

        return finalPath;
    };

    public getWorker<T extends IHiveWorker | undefined>(type: string, name?: string): T | undefined {
        if (!IsHelper.isNullOrUndefined(name)) {
            const namedWorker: RegisteredHiveWorker | undefined = this.registeredWorkers.find(
                (value: RegisteredHiveWorker) => value.name === name && value.type === type
            );

            if (!IsHelper.isNullOrUndefined(namedWorker)) {
                return namedWorker.instance as T;
            }

            return undefined;
        }

        const anyWorkers: RegisteredHiveWorker[] | undefined = this.registeredWorkers.filter(
            (value: RegisteredHiveWorker) => value.type === type
        );

        if (!IsHelper.isNullOrUndefined(anyWorkers) && !IsHelper.isEmptyArray(anyWorkers)) {
            return anyWorkers[0].instance as T;
        }

        return undefined;
    }

    public async initWorkers(): Promise<void> {
        for (const hiveWorker of this.serverConfig.workers) {
            await AwaitHelper.execute(this.pushWorker(hiveWorker));
        }

        for (const hiveWorker of this.registeredWorkers) {
            (hiveWorker.instance as IHiveWorker).registeredWorkers = this.registeredWorkers;
        }
    }

    public async pushWorker(hiveWorker: HiveWorkerConfig, section?: RegisteredHiveWorkerSection): Promise<void> {
        const runtimeProjectPath: string | undefined = this.getEnvironmentVariable<string>("OH_RUNTIME_PROJECT_PATH");

        if (!hiveWorker.enabled) {
            return;
        }

        if (IsHelper.isNullOrUndefined(section)) {
            section = RegisteredHiveWorkerSection.User;
        }

        if (
            this.registeredWorkers?.find((value: RegisteredHiveWorker) => {
                return value.name === hiveWorker.name;
            })
        ) {
            return;
        }

        this.checkWorkerImportPath(hiveWorker);

        let newWorker: any;

        // Try all manner of imports

        const pathTries: string[] = [
            hiveWorker.importPath,
            `${hiveWorker.importPath}.js`,
            `${hiveWorker.importPath}.ts`,
            `${hiveWorker.importPath}/index.js`,
            `${hiveWorker.importPath}/index.ts`,
            `${runtimeProjectPath ?? ""}/node_modules/${hiveWorker.importPath}.js`,
            `${runtimeProjectPath ?? ""}/node_modules/${hiveWorker.importPath}.ts`,
            `${runtimeProjectPath ?? ""}/node_modules/${hiveWorker.importPath}/index.js`,
            `${runtimeProjectPath ?? ""}/node_modules/${hiveWorker.importPath}/index.ts`,
        ];

        for (let i = 0; i < pathTries.length; i++) {
            try {
                newWorker = await importFresh(pathTries[i]);
                if (!IsHelper.isNullOrUndefined(newWorker)) {
                    break;
                }
            } catch (err) {
                console.log(err);
                if (i === pathTries.length - 1) {
                    throw new Error(
                        `Could not find a worker module for ${hiveWorker.name} with import path ${hiveWorker.importPath}`
                    );
                }
                continue;
            }
        }

        const newWorkerInstance: any = new newWorker.default();
        (newWorkerInstance as IHiveWorker).environmentVariables = this.serverConfig.environmentVariables;
        await AwaitHelper.execute((newWorkerInstance as IHiveWorker).init(hiveWorker.name, hiveWorker.metadata));

        const registeredWorker: RegisteredHiveWorker = {
            ...hiveWorker,
            instance: newWorkerInstance,
            section,
        };
        this.registeredWorkers.push(registeredWorker);
    }

    private getImport = async (path: string) => {
        return await import(path);
    };
}
