/// <reference path="../../../types/globals.omnihive.test.d.ts" />

import { describe, it, before, beforeEach } from "mocha";
import { RegisteredHiveWorkerSection } from "@withonevision/omnihive-core/enums/RegisteredHiveWorkerSection";
import { AwaitHelper } from "@withonevision/omnihive-core/helpers/AwaitHelper";
import { IsHelper } from "@withonevision/omnihive-core/helpers/IsHelper";
import { IDatabaseWorker } from "@withonevision/omnihive-core/interfaces/IDatabaseWorker";
import { HiveWorkerMetadataDatabase } from "@withonevision/omnihive-core/models/HiveWorkerMetadataDatabase";
import { ProcFunctionSchema } from "@withonevision/omnihive-core/models/ProcFunctionSchema";
import { expect } from "chai";
import fs from "fs";
import path from "path";
import MySqlDatabaseWorker from "..";
import { GlobalTestObject } from "../../../tests/GlobalTestObject";
import NullLogWorker from "../../omnihive-worker-log-null";

const testValues = {
    metadata: {
        connectionPoolLimit: 25,
        databaseName: "testing",
        ignoreSchema: false,
        password: "mZtag2yfWAvYTqwy",
        procFunctionGraphSchemaName: "",
        getProcFunctionSqlFile: "",
        requireSsl: false,
        rowLimit: 10000,
        schemas: ["testing"],
        serverAddress: "localhost",
        serverPort: 3306,
        sslCertPath: "",
        getSchemaSqlFile: "",
        urlRoute: "test",
        userName: "root",
    },
    workerName: "testMySqlDatabaseWorker",
};

const initWorker = async (metadata?: HiveWorkerMetadataDatabase): Promise<IDatabaseWorker> => {
    if (IsHelper.isNullOrUndefined(metadata)) {
        metadata = testValues.metadata;
    }
    const worker: MySqlDatabaseWorker = new MySqlDatabaseWorker();
    await AwaitHelper.execute(worker.init(testValues.workerName, metadata));
    return worker;
};

const buildWorkers = async (): Promise<void> => {
    const logWorker: NullLogWorker = new NullLogWorker();
    logWorker.init("testLogWorker");

    global.omnihive.registeredWorkers.push({
        name: "log-worker",
        type: "log",
        metadata: {},
        section: RegisteredHiveWorkerSection.User,
        instance: logWorker,
    });
};

const createDatabase = async () => {
    const masterWorker = await AwaitHelper.execute(
        initWorker({ ...Object.assign({}, testValues.metadata), databaseName: "mysql" })
    );
    const sqlContentsDb: string = fs.readFileSync(path.join(__dirname, "scripts", "initializeDatabase.sql"), {
        encoding: "utf8",
    });

    await AwaitHelper.execute(masterWorker.executeQuery(sqlContentsDb));

    const testingWorker = await AwaitHelper.execute(initWorker());

    const sqlContentsTable: string = fs.readFileSync(path.join(__dirname, "scripts", "initializeTable.sql"), {
        encoding: "utf8",
    });

    await AwaitHelper.execute(testingWorker.executeQuery(sqlContentsTable));

    const sqlContentsSprocWithoutParams: string = fs.readFileSync(
        path.join(__dirname, "scripts", "initializeStoredProcedureWithoutParams.sql"),
        {
            encoding: "utf8",
        }
    );

    await AwaitHelper.execute(testingWorker.executeQuery(sqlContentsSprocWithoutParams));

    const sqlContentsSprocWithParams: string = fs.readFileSync(
        path.join(__dirname, "scripts", "initializeStoredProcedureWithParams.sql"),
        {
            encoding: "utf8",
        }
    );

    await AwaitHelper.execute(testingWorker.executeQuery(sqlContentsSprocWithParams));
};

describe("Worker Test - Knex - MySQL", () => {
    before(async () => {
        // @ts-ignore
        global.omnihive = new GlobalTestObject();
        global.omnihive.ohDirName = __dirname;

        await AwaitHelper.execute(createDatabase());
    });

    describe("Init Functions", () => {
        it("Test Init - Valid Connection String", async () => {
            await AwaitHelper.execute(initWorker());
        });

        it("Test Init - Invalid Connection String", async () => {
            try {
                await AwaitHelper.execute(
                    initWorker({ ...Object.assign({}, testValues.metadata), databaseName: "testbad" })
                );
                expect.fail("Method Expected to Fail");
            } catch (err) {
                expect(err).to.be.an.instanceOf(Error);
            }
        });
    });

    describe("Worker Functions", () => {
        beforeEach(async () => {
            const sqlContents: string = fs.readFileSync(path.join(__dirname, "scripts", "wipeTestData.sql"), {
                encoding: "utf8",
            });
            const worker = await AwaitHelper.execute(initWorker());
            await AwaitHelper.execute(worker.executeQuery(sqlContents));
        });

        it("Get Schema - Default", async () => {
            const worker = await AwaitHelper.execute(initWorker());
            const results = await worker.getSchema();

            expect(results.tables[0].tableName).to.equal("test_table");
            expect(results.tables.length).to.equal(1);
            expect(results.procFunctions.length).to.equal(3);
        });

        it("Get Schema - Default Schema Files - Default Tables Does Not Exist", async () => {
            const worker = await AwaitHelper.execute(initWorker());

            fs.renameSync(
                path.join(__dirname, "scripts", "defaultTables.sql"),
                path.join(__dirname, "scripts", "defaultTablesNot.sql")
            );
            fs.renameSync(
                path.join(__dirname, "..", "scripts", "defaultTables.sql"),
                path.join(__dirname, "..", "scripts", "defaultTablesNot.sql")
            );

            try {
                await AwaitHelper.execute(worker.getSchema());
                expect.fail("Schema file does not exist");
            } catch (err) {
                expect(err).to.be.an.instanceOf(Error);
            }

            fs.renameSync(
                path.join(__dirname, "scripts", "defaultTablesNot.sql"),
                path.join(__dirname, "scripts", "defaultTables.sql")
            );
            fs.renameSync(
                path.join(__dirname, "..", "scripts", "defaultTablesNot.sql"),
                path.join(__dirname, "..", "scripts", "defaultTables.sql")
            );
        });

        it("Get Schema - Default Schema Files - Default Procs Does Not Exist", async () => {
            const worker = await AwaitHelper.execute(initWorker());

            fs.renameSync(
                path.join(__dirname, "scripts", "defaultProcFunctions.sql"),
                path.join(__dirname, "scripts", "defaultProcFunctionsNot.sql")
            );

            fs.renameSync(
                path.join(__dirname, "..", "scripts", "defaultProcFunctions.sql"),
                path.join(__dirname, "..", "scripts", "defaultProcFunctionsNot.sql")
            );

            try {
                await AwaitHelper.execute(worker.getSchema());
                expect.fail("Schema file does not exist");
            } catch (err) {
                expect(err).to.be.an.instanceOf(Error);
            }

            fs.renameSync(
                path.join(__dirname, "scripts", "defaultProcFunctionsNot.sql"),
                path.join(__dirname, "scripts", "defaultProcFunctions.sql")
            );

            fs.renameSync(
                path.join(__dirname, "..", "scripts", "defaultProcFunctionsNot.sql"),
                path.join(__dirname, "..", "scripts", "defaultProcFunctions.sql")
            );
        });

        it("Get Schema - Default Schema - All Files Do Not Exist", async () => {
            const worker = await AwaitHelper.execute(initWorker());

            fs.renameSync(
                path.join(__dirname, "scripts", "defaultTables.sql"),
                path.join(__dirname, "scripts", "defaultTablesNot.sql")
            );
            fs.renameSync(
                path.join(__dirname, "..", "scripts", "defaultTables.sql"),
                path.join(__dirname, "..", "scripts", "defaultTablesNot.sql")
            );

            fs.renameSync(
                path.join(__dirname, "scripts", "defaultProcFunctions.sql"),
                path.join(__dirname, "scripts", "defaultProcFunctionsNot.sql")
            );

            fs.renameSync(
                path.join(__dirname, "..", "scripts", "defaultProcFunctions.sql"),
                path.join(__dirname, "..", "scripts", "defaultProcFunctionsNot.sql")
            );

            try {
                await AwaitHelper.execute(worker.getSchema());
                expect.fail("Schema file does not exist");
            } catch (err) {
                expect(err).to.be.an.instanceOf(Error);
            }

            fs.renameSync(
                path.join(__dirname, "scripts", "defaultTablesNot.sql"),
                path.join(__dirname, "scripts", "defaultTables.sql")
            );
            fs.renameSync(
                path.join(__dirname, "..", "scripts", "defaultTablesNot.sql"),
                path.join(__dirname, "..", "scripts", "defaultTables.sql")
            );
            fs.renameSync(
                path.join(__dirname, "scripts", "defaultProcFunctionsNot.sql"),
                path.join(__dirname, "scripts", "defaultProcFunctions.sql")
            );
            fs.renameSync(
                path.join(__dirname, "..", "scripts", "defaultProcFunctionsNot.sql"),
                path.join(__dirname, "..", "scripts", "defaultProcFunctions.sql")
            );
        });

        it("Get Schema - With Schema Files", async () => {
            const metadata: HiveWorkerMetadataDatabase = Object.assign({}, testValues.metadata);
            metadata.getSchemaSqlFile = path.join(__dirname, "scripts", "defaultTables.sql");
            metadata.getProcFunctionSqlFile = path.join(__dirname, "scripts", "defaultProcFunctions.sql");

            const worker = await AwaitHelper.execute(initWorker(metadata));
            const results = await AwaitHelper.execute(worker.getSchema());

            expect(results.tables[0].tableName).to.equal("test_table");
            expect(results.tables.length).to.equal(1);
            expect(results.procFunctions.length).to.equal(3);
        });

        it("Get Schema - With Schema Files - Table File Does Not Exist", async () => {
            const metadata: HiveWorkerMetadataDatabase = Object.assign({}, testValues.metadata);
            metadata.getSchemaSqlFile = path.join(__dirname, "scripts", "defaultTablesBad.sql");

            try {
                const worker = await AwaitHelper.execute(initWorker(metadata));
                await AwaitHelper.execute(worker.getSchema());
                expect.fail("Schema file does not exist");
            } catch (err) {
                expect(err).to.be.instanceOf(Error);
            }
        });

        it("Get Schema - With Schema Files - Proc File Does Not Exist", async () => {
            const metadata: HiveWorkerMetadataDatabase = Object.assign({}, testValues.metadata);
            metadata.getProcFunctionSqlFile = path.join(__dirname, "scripts", "defaultProcFunctionsBad.sql");

            try {
                const worker = await AwaitHelper.execute(initWorker(metadata));
                await AwaitHelper.execute(worker.getSchema());
                expect.fail("Schema file does not exist");
            } catch (err) {
                expect(err).to.be.instanceOf(Error);
            }
        });

        it("Get Schema - With Schema Files - All Files Do Not Exist", async () => {
            const metadata: HiveWorkerMetadataDatabase = Object.assign({}, testValues.metadata);
            metadata.getSchemaSqlFile = path.join(__dirname, "scripts", "defaultTablesBad.sql");
            metadata.getProcFunctionSqlFile = path.join(__dirname, "scripts", "defaultProcFunctionsBad.sql");

            try {
                const worker = await AwaitHelper.execute(initWorker(metadata));
                await AwaitHelper.execute(worker.getSchema());
                expect.fail("Schema file does not exist");
            } catch (err) {
                expect(err).to.be.instanceOf(Error);
            }
        });

        it("Get Schema - Default - Bad Schema", async () => {
            const metadata: HiveWorkerMetadataDatabase = {
                ...Object.assign({}, testValues.metadata),
                ignoreSchema: false,
                schemas: ["badSchema"],
            };

            try {
                const worker = await AwaitHelper.execute(initWorker(metadata));
                await AwaitHelper.execute(worker.getSchema());
                expect.fail("Schemas do not exist");
            } catch (err) {
                expect(err).to.be.instanceOf(Error);
            }
        });

        it("Execute Query", async () => {
            const worker = await AwaitHelper.execute(initWorker());
            const sqlContents: string = fs.readFileSync(path.join(__dirname, "scripts", "executeQueryTest.sql"), {
                encoding: "utf8",
            });
            const result = await worker.executeQuery(sqlContents);
            expect(result[1][0].test_data).to.equal("Testing Values 1");
        });

        it("Execute Query - With Log Worker", async () => {
            buildWorkers();
            const worker = await AwaitHelper.execute(initWorker());
            worker.registeredWorkers = global.omnihive.registeredWorkers;

            const sqlContents: string = fs.readFileSync(path.join(__dirname, "scripts", "executeQueryTest.sql"), {
                encoding: "utf8",
            });
            const result = await worker.executeQuery(sqlContents);
            expect(result[1][0].test_data).to.equal("Testing Values 1");
        });

        it("Execute Query - Without Log", async () => {
            const worker = await AwaitHelper.execute(initWorker());
            const sqlContents: string = fs.readFileSync(path.join(__dirname, "scripts", "executeQueryTest.sql"), {
                encoding: "utf8",
            });
            const result = await worker.executeQuery(sqlContents, true);
            expect(result[1][0].test_data).to.equal("Testing Values 1");
        });

        it("Execute Bad Query", async () => {
            const worker = await AwaitHelper.execute(initWorker());
            const sqlContents: string = fs.readFileSync(path.join(__dirname, "scripts", "executeBadQueryTest.sql"), {
                encoding: "utf8",
            });
            try {
                await worker.executeQuery(sqlContents);
                expect.fail("This is a bad query");
            } catch (err) {
                expect(err).to.be.instanceOf(Error);
            }
        });

        it("Execute Stored Procedure - With Schema", async function () {
            const worker = await AwaitHelper.execute(initWorker());
            const getSchema = await AwaitHelper.execute(worker.getSchema());

            const result = await worker.executeProcedure(
                getSchema.procFunctions.filter((value) => value.name === "test_stored_procedure_with_params"),
                [
                    { name: "paramString", value: "Testing Values", isString: true },
                    { name: "paramNumber", value: 1, isString: false },
                ]
            );

            expect(result[0][0].dataresult).to.equal("Testing Values 1");
        });

        it("Execute Stored Procedure - No Schema", async function () {
            const schema: ProcFunctionSchema[] = [];
            const worker = await AwaitHelper.execute(initWorker());

            schema[0] = new ProcFunctionSchema();
            schema[0].schemaName = "";
            schema[0].name = "test_stored_procedure_without_params";

            const result = await worker.executeProcedure(schema, []);

            expect(result[0][0].dataresult).to.equal("Success");
        });

        it("Execute Stored Procedure - Without Params", async function () {
            const worker = await AwaitHelper.execute(initWorker());
            const getSchema = await AwaitHelper.execute(worker.getSchema());

            const result = await worker.executeProcedure(
                getSchema.procFunctions.filter((value) => value.name === "test_stored_procedure_without_params"),
                []
            );

            expect(result[0][0].dataresult).to.equal("Success");
        });

        it("Execute Bad Stored Procedure", async function () {
            const schema: ProcFunctionSchema[] = [];
            const worker = await AwaitHelper.execute(initWorker());

            schema[0] = new ProcFunctionSchema();
            schema[0].schemaName = "dbo";
            schema[0].name = "bad_stored_procedure";

            try {
                await worker.executeProcedure(schema, []);
                expect.fail("This is a bad stored procedure");
            } catch (err) {
                expect(err).to.be.instanceOf(Error);
            }
        });
    });
});
