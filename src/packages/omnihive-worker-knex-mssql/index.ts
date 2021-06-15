/// <reference path="../../types/globals.omnihive.d.ts" />

import { HiveWorkerType } from "@withonevision/omnihive-core/enums/HiveWorkerType";
import { OmniHiveLogLevel } from "@withonevision/omnihive-core/enums/OmniHiveLogLevel";
import { AwaitHelper } from "@withonevision/omnihive-core/helpers/AwaitHelper";
import { StringBuilder } from "@withonevision/omnihive-core/helpers/StringBuilder";
import { IDatabaseWorker } from "@withonevision/omnihive-core/interfaces/IDatabaseWorker";
import { ILogWorker } from "@withonevision/omnihive-core/interfaces/ILogWorker";
import { ConnectionSchema } from "@withonevision/omnihive-core/models/ConnectionSchema";
import { HiveWorker } from "@withonevision/omnihive-core/models/HiveWorker";
import { HiveWorkerBase } from "@withonevision/omnihive-core/models/HiveWorkerBase";
import { HiveWorkerMetadataDatabase } from "@withonevision/omnihive-core/models/HiveWorkerMetadataDatabase";
import { ProcFunctionSchema } from "@withonevision/omnihive-core/models/ProcFunctionSchema";
import { TableSchema } from "@withonevision/omnihive-core/models/TableSchema";
import knex, { Knex } from "knex";
import sql from "mssql";
import { serializeError } from "serialize-error";
import fse from "fs-extra";
import path from "path";
import { IsHelper } from "@withonevision/omnihive-core/helpers/IsHelper";

export default class MssqlDatabaseWorker extends HiveWorkerBase implements IDatabaseWorker {
    public connection!: Knex;
    private connectionPool!: sql.ConnectionPool;
    private sqlConfig!: any;
    private metadata!: HiveWorkerMetadataDatabase;

    constructor() {
        super();
    }

    public async init(config: HiveWorker): Promise<void> {
        try {
            await AwaitHelper.execute(super.init(config));
            this.metadata = this.checkObjectStructure<HiveWorkerMetadataDatabase>(
                HiveWorkerMetadataDatabase,
                config.metadata
            );

            this.sqlConfig = {
                user: this.metadata.userName,
                password: this.metadata.password,
                server: this.metadata.serverAddress,
                port: this.metadata.serverPort,
                database: this.metadata.databaseName,
                options: {
                    enableArithAbort: true,
                    encrypt: false,
                },
            };

            this.connectionPool = new sql.ConnectionPool({ ...this.sqlConfig });
            await AwaitHelper.execute(this.connectionPool.connect());

            const connectionOptions: Knex.Config = {
                connection: {},
                pool: { min: 0, max: this.metadata.connectionPoolLimit },
            };
            connectionOptions.client = "mssql";
            connectionOptions.connection = this.sqlConfig;
            this.connection = knex(connectionOptions);
        } catch (err) {
            throw new Error("MSSQL Init Error => " + JSON.stringify(serializeError(err)));
        }
    }

    public executeQuery = async (query: string, disableLog?: boolean): Promise<any[][]> => {
        if (IsHelper.isNullOrUndefined(disableLog) || !disableLog) {
            const logWorker: ILogWorker | undefined = this.getWorker<ILogWorker | undefined>(HiveWorkerType.Log);
            logWorker?.write(OmniHiveLogLevel.Info, query);
        }

        const poolRequest = this.connectionPool.request();
        const result = await AwaitHelper.execute(poolRequest.query(query));
        return result.recordsets;
    };

    public executeProcedure = async (
        procFunctionSchema: ProcFunctionSchema[],
        args: { name: string; value: any; isString: boolean }[]
    ): Promise<any[][]> => {
        const builder: StringBuilder = new StringBuilder();

        builder.append(`exec `);

        if (
            IsHelper.isNullOrUndefined(procFunctionSchema[0].schemaName) ||
            IsHelper.isEmptyStringOrWhitespace(procFunctionSchema[0].schemaName)
        ) {
            builder.append(`dbo.` + procFunctionSchema[0].name + ` `);
        } else {
            builder.append(procFunctionSchema[0].schemaName + `.` + procFunctionSchema[0].name + ` `);
        }

        args.forEach((arg: { name: string; value: any; isString: boolean }, index: number) => {
            builder.append(`@${arg.name}=${arg.isString ? `'` : ""}${arg.value}${arg.isString ? `'` : ""}`);

            if (index < args.length - 1) {
                builder.append(`, `);
            }
        });

        return this.executeQuery(builder.outputString());
    };

    public getSchema = async (): Promise<ConnectionSchema> => {
        const result: ConnectionSchema = {
            workerName: this.config.name,
            tables: [],
            procFunctions: [],
        };

        let tableResult: any[][], procResult: any[][];
        const logWorker: ILogWorker | undefined = this.getWorker<ILogWorker | undefined>(HiveWorkerType.Log);

        try {
            const tableFilePath = global.omnihive.getFilePath(this.metadata.getSchemaSqlFile);

            if (
                !IsHelper.isNullOrUndefined(this.metadata.getSchemaSqlFile) &&
                !IsHelper.isEmptyStringOrWhitespace(this.metadata.getSchemaSqlFile) &&
                fse.existsSync(tableFilePath)
            ) {
                tableResult = await AwaitHelper.execute(
                    this.executeQuery(fse.readFileSync(tableFilePath, "utf8"), true)
                );
            } else {
                if (
                    !IsHelper.isNullOrUndefined(this.metadata.getSchemaSqlFile) &&
                    !IsHelper.isEmptyStringOrWhitespace(this.metadata.getSchemaSqlFile)
                ) {
                    logWorker?.write(OmniHiveLogLevel.Warn, "Provided Schema SQL File is not found.");
                }
                if (fse.existsSync(path.join(__dirname, "defaultTables.sql"))) {
                    tableResult = await AwaitHelper.execute(
                        this.executeQuery(fse.readFileSync(path.join(__dirname, "defaultTables.sql"), "utf8"), true)
                    );
                } else {
                    throw new Error(`Cannot find a table executor for ${this.config.name}`);
                }
            }
        } catch (err) {
            throw new Error("Schema SQL File Location not found: " + JSON.stringify(serializeError(err)));
        }

        try {
            const procFilePath = global.omnihive.getFilePath(this.metadata.getProcFunctionSqlFile);

            if (
                !IsHelper.isNullOrUndefined(this.metadata.getProcFunctionSqlFile) &&
                !IsHelper.isEmptyStringOrWhitespace(this.metadata.getProcFunctionSqlFile) &&
                fse.existsSync(procFilePath)
            ) {
                procResult = await AwaitHelper.execute(this.executeQuery(fse.readFileSync(procFilePath, "utf8"), true));
            } else {
                if (
                    !IsHelper.isNullOrUndefined(this.metadata.getProcFunctionSqlFile) &&
                    !IsHelper.isEmptyStringOrWhitespace(this.metadata.getProcFunctionSqlFile)
                ) {
                    logWorker?.write(OmniHiveLogLevel.Warn, "Provided Proc SQL File is not found.");
                }
                if (fse.existsSync(path.join(__dirname, "defaultProcFunctions.sql"))) {
                    procResult = await AwaitHelper.execute(
                        this.executeQuery(
                            fse.readFileSync(path.join(__dirname, "defaultProcFunctions.sql"), "utf8"),
                            true
                        )
                    );
                } else {
                    throw new Error(`Cannot find a proc executor for ${this.config.name}`);
                }
            }
        } catch (err) {
            throw new Error("Schema SQL File Location not found: " + JSON.stringify(serializeError(err)));
        }

        tableResult[0].forEach((row) => {
            if (
                !this.metadata.ignoreSchema &&
                !this.metadata.schemas.includes("*") &&
                !this.metadata.schemas.includes(row.schema_name)
            ) {
                return;
            }

            const schemaRow = new TableSchema();

            schemaRow.schemaName = row.schema_name;
            schemaRow.tableName = row.table_name;
            schemaRow.columnNameDatabase = row.column_name_database;
            schemaRow.columnTypeDatabase = row.column_type_database;
            schemaRow.columnTypeEntity = row.column_type_entity;
            schemaRow.columnPosition = row.column_position;
            schemaRow.columnIsNullable = row.column_is_nullable;
            schemaRow.columnIsIdentity = row.column_is_identity;
            schemaRow.columnIsPrimaryKey = row.column_is_primary_key;
            schemaRow.columnIsForeignKey = row.column_is_foreign_key;
            schemaRow.columnForeignKeyTableName = row.column_foreign_key_table_name;
            schemaRow.columnForeignKeyColumnName = row.column_foreign_key_column_name;

            result.tables.push(schemaRow);
        });

        procResult[0].forEach((row) => {
            if (
                !this.metadata.ignoreSchema &&
                !this.metadata.schemas.includes("*") &&
                !this.metadata.schemas.includes(row.procfunc_schema)
            ) {
                return;
            }

            const schemaRow = new ProcFunctionSchema();

            schemaRow.schemaName = row.procfunc_schema;
            schemaRow.name = row.procfunc_name;
            schemaRow.type = row.procfunc_type;
            schemaRow.parameterOrder = row.parameter_order;
            schemaRow.parameterName = row.parameter_name;
            schemaRow.parameterTypeDatabase = row.parameter_type_database;
            schemaRow.parameterTypeEntity = row.parameter_type_entity;

            result.procFunctions.push(schemaRow);
        });

        return result;
    };
}
