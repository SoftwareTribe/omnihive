import { describe, it } from "mocha";
import { AdminRequest } from "../models/AdminRequest";
import { AdminResponse } from "../models/AdminResponse";
import { AuthUser } from "../models/AuthUser";
import { ConnectionSchema } from "../models/ConnectionSchema";
import { ConverterSqlInfo } from "../models/ConverterSqlInfo";
import { EnvironmentVariable } from "../models/EnvironmentVariable";
import { expect } from "chai";
import { EnvironmentVariableType } from "../enums/EnvironmentVariableType";
import { IsHelper } from "../helpers/IsHelper";
import { GraphContext } from "../models/GraphContext";
import { HiveWorkerConfig } from "../models/HiveWorkerConfig";
import { HiveWorkerType } from "../enums/HiveWorkerType";
import { HiveWorkerMetadataConfigDatabase } from "../models/HiveWorkerMetadataConfigDatabase";
import { HiveWorkerMetadataDatabase } from "../models/HiveWorkerMetadataDatabase";
import { HiveWorkerMetadataGraphBuilder } from "../models/HiveWorkerMetadataGraphBuilder";
import { HiveWorkerMetadataLifecycleFunction } from "../models/HiveWorkerMetadataLifecycleFunction";
import { LifecycleWorkerAction } from "../enums/LifecycleWorkerAction";
import { LifecycleWorkerStage } from "../enums/LifecycleWorkerStage";
import { HiveWorkerMetadataRestFunction } from "../models/HiveWorkerMetadataRestFunction";
import { RestMethod } from "../enums/RestMethod";
import { HiveWorkerMetadataServer } from "../models/HiveWorkerMetadataServer";
import { ProcFunctionSchema } from "../models/ProcFunctionSchema";
import { PubSubListener } from "../models/PubSubListener";
import { RegisteredHiveWorker } from "../models/RegisteredHiveWorker";
import { RegisteredHiveWorkerSection } from "../enums/RegisteredHiveWorkerSection";
import { RegisteredUrl } from "../models/RegisteredUrl";
import { RestEndpointExecuteResponse } from "../models/RestEndpointExecuteResponse";
import { ServerConfig } from "../models/ServerConfig";
import { TableSchema } from "../models/TableSchema";

describe("Core Model Tests", () => {
    it("AdminRequest.ts", () => {
        const model: AdminRequest = new AdminRequest();
        expect(model.adminPassword).to.equal("");
        expect(model.serverGroupId).to.equal("");
        expect(model.data).to.be.undefined;
    });

    it("AdminResponse.ts", () => {
        const model: AdminResponse = new AdminResponse();
        expect(model.data).to.be.undefined;
        expect(model.serverGroupId).to.equal("");
        expect(model.requestComplete).to.be.true;
        expect(model.requestError).to.be.undefined;
    });

    it("AuthUser.ts", () => {
        const model: AuthUser = new AuthUser();
        expect(model.email).to.equal("");
        expect(model.firstName).to.equal("");
        expect(model.lastName).to.equal("");
        expect(model.fullName).to.equal("");
        expect(model.nickname).to.equal("");
        expect(model.phoneNumber).to.equal("");
        expect(model.address).to.equal("");
    });

    it("ConnectionSchema.ts", () => {
        const model: ConnectionSchema = new ConnectionSchema();
        expect(model.workerName).to.equal("");
        expect(model.tables).to.be.empty;
        expect(model.procFunctions).to.be.empty;
    });

    it("ConverterSqlInfo.ts", () => {
        const model: ConverterSqlInfo = new ConverterSqlInfo();
        expect(model.workerName).to.equal("");
        expect(model.sql).to.equal("");
        expect(model.hydrationDefinition).to.be.an.instanceOf(Object).and.be.empty;
    });

    it("EnvironmentVariable.ts", () => {
        const model: EnvironmentVariable = new EnvironmentVariable();
        expect(model.key).to.equal("");
        expect(model.value).to.satisfy((value: unknown) => {
            return (
                IsHelper.isString(value) ||
                IsHelper.isBoolean(value) ||
                IsHelper.isNumber(value) ||
                IsHelper.isNullOrUndefined(value)
            );
        });
        expect(model.type).to.equal(EnvironmentVariableType.String);
        expect(model.isSystem).to.satisfy((value: unknown) => {
            return IsHelper.isNullOrUndefined(value) || value === false;
        });
    });

    it("GraphContext.ts", () => {
        const model: GraphContext = new GraphContext();
        expect(model.access).to.be.undefined;
        expect(model.auth).to.be.undefined;
        expect(model.cache).to.be.undefined;
        expect(model.cacheSeconds).to.be.undefined;
    });

    it("HiveWorkerConfig.ts", () => {
        const model: HiveWorkerConfig = new HiveWorkerConfig();
        expect(model.type).to.equal(HiveWorkerType.Custom);
        expect(model.name).to.equal("");
        expect(model.package).to.equal("");
        expect(model.version).to.equal("");
        expect(model.importPath).to.equal("");
        expect(model.default).to.be.true;
        expect(model.enabled).to.be.true;
        expect(model.metadata).to.be.instanceOf(Object).and.be.empty;
    });

    it("HiveWorkerMetadataConfigDatabase.ts", () => {
        const model: HiveWorkerMetadataConfigDatabase = new HiveWorkerMetadataConfigDatabase();
        expect(model.configName).to.equal("");
        expect(model.databaseName).to.equal("");
        expect(model.password).to.equal("");
        expect(model.requireSsl).to.be.false;
        expect(model.serverAddress).to.equal("");
        expect(model.serverPort).to.equal(0);
        expect(model.sslCertPath).to.equal("");
        expect(model.userName).to.equal("");
    });

    it("HiveWorkerMetadataDatabase.ts", () => {
        const model: HiveWorkerMetadataDatabase = new HiveWorkerMetadataDatabase();
        expect(model.connectionPoolLimit).to.equal(25);
        expect(model.databaseName).to.equal("");
        expect(model.getProcFunctionSqlFile).to.equal("");
        expect(model.getSchemaSqlFile).to.equal("");
        expect(model.ignoreSchema).to.be.true;
        expect(model.password).to.equal("");
        expect(model.procFunctionGraphSchemaName).to.equal("");
        expect(model.requireSsl).to.be.false;
        expect(model.rowLimit).to.equal(0);
        expect(model.schemas).to.be.empty;
        expect(model.serverAddress).to.equal("");
        expect(model.serverPort).to.equal(0);
        expect(model.sslCertPath).to.equal("");
        expect(model.urlRoute).to.equal("");
        expect(model.userName).to.equal("");
    });

    it("HiveWorkerMetadataGraphBuilder.ts", () => {
        const model: HiveWorkerMetadataGraphBuilder = new HiveWorkerMetadataGraphBuilder();
        expect(model.dbWorkers).to.be.empty;
        expect(model.urlRoute).to.equal("");
    });

    it("HiveWorkerMetadataLifecycleFunction.ts", () => {
        const model: HiveWorkerMetadataLifecycleFunction = new HiveWorkerMetadataLifecycleFunction();
        expect(model.action).to.equal(LifecycleWorkerAction.None);
        expect(model.stage).to.equal(LifecycleWorkerStage.None);
        expect(model.order).to.equal(0);
        expect(model.databaseWorker).to.equal("");
        expect(model.schema).to.equal("");
        expect(model.tables).to.be.empty;
    });

    it("HiveWorkerMetadataRestFunction.ts", () => {
        const model: HiveWorkerMetadataRestFunction = new HiveWorkerMetadataRestFunction();
        expect(model.restMethod).to.equal(RestMethod.POST);
        expect(model.urlRoute).to.equal("");
        expect(model.data).to.be.instanceOf(Object).and.be.empty;
    });

    it("HiveWorkerMetadataServer.ts", () => {
        const model: HiveWorkerMetadataServer = new HiveWorkerMetadataServer();
        expect(model.buildWorkers).to.be.empty;
        expect(model.urlRoute).to.equal("");
    });

    it("ProcFunctionSchema.ts", () => {
        const model: ProcFunctionSchema = new ProcFunctionSchema();
        expect(model.schemaName).to.equal("");
        expect(model.name).to.equal("");
        expect(model.type).to.equal("");
        expect(model.parameterOrder).to.equal(0);
        expect(model.parameterName).to.equal("");
        expect(model.parameterTypeDatabase).to.equal("");
        expect(model.parameterTypeEntity).to.equal("");
    });

    it("PubSubListener.ts", () => {
        const model: PubSubListener = new PubSubListener();
        expect(model.channelName).to.equal("");
        expect(model.eventName).to.equal("");
        expect(model.callback).to.be.undefined;
    });

    it("RegisteredHiveWorker.ts", () => {
        const model: RegisteredHiveWorker = new RegisteredHiveWorker();
        expect(model.instance).to.satisfy((value: unknown) => {
            return IsHelper.isNullOrUndefined(value);
        });
        expect(model.name).to.equal("");
        expect(model.type).to.equal(HiveWorkerType.User);
        expect(model.metadata).to.satisfy((value: unknown) => {
            return IsHelper.isNullOrUndefined(value);
        });
        expect(model.section).to.equal(RegisteredHiveWorkerSection.User);
    });

    it("RegisteredUrl.ts", () => {
        const model: RegisteredUrl = new RegisteredUrl();
        expect(model.path).to.equal("");
        expect(model.type).to.equal("");
        expect(model.metadata).to.be.instanceOf(Object).and.be.empty;
    });

    it("RestEndpointExecuteResponse.ts", () => {
        const model: RestEndpointExecuteResponse = new RestEndpointExecuteResponse();
        expect(model.response).to.be.undefined;
        expect(model.status).to.equal(200);
    });

    it("ServerConfig.ts", () => {
        const model: ServerConfig = new ServerConfig();
        expect(model.environmentVariables).to.be.empty;
        expect(model.workers).to.be.empty;
    });

    it("TableSchema.ts", () => {
        const model: TableSchema = new TableSchema();
        expect(model.schemaName).to.equal("");
        expect(model.tableName).to.equal("");
        expect(model.tableNameCamelCase).to.equal("");
        expect(model.tableNamePascalCase).to.equal("");
        expect(model.columnNameDatabase).to.equal("");
        expect(model.columnNameEntity).to.equal("");
        expect(model.columnTypeDatabase).to.equal("");
        expect(model.columnTypeEntity).to.equal("");
        expect(model.columnPosition).to.equal(0);
        expect(model.columnIsNullable).to.be.true;
        expect(model.columnIsIdentity).to.be.false;
        expect(model.columnIsPrimaryKey).to.be.false;
        expect(model.columnIsForeignKey).to.be.false;
        expect(model.columnForeignKeyTableName).to.equal("");
        expect(model.columnForeignKeyTableNameCamelCase).to.equal("");
        expect(model.columnForeignKeyTableNamePascalCase).to.equal("");
        expect(model.columnForeignKeyColumnName).to.equal("");
    });
});
