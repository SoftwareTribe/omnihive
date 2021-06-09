/// <reference path="../../../types/globals.omnihive.d.ts" />

import { AdminEventType } from "@withonevision/omnihive-core/enums/AdminEventType";
import { AdminRoomType } from "@withonevision/omnihive-core/enums/AdminRoomType";
import { HiveWorkerType } from "@withonevision/omnihive-core/enums/HiveWorkerType";
import { OmniHiveLogLevel } from "@withonevision/omnihive-core/enums/OmniHiveLogLevel";
import { RegisteredUrlType } from "@withonevision/omnihive-core/enums/RegisteredUrlType";
import { ServerStatus } from "@withonevision/omnihive-core/enums/ServerStatus";
import { AwaitHelper } from "@withonevision/omnihive-core/helpers/AwaitHelper";
import { ObjectHelper } from "@withonevision/omnihive-core/helpers/ObjectHelper";
import { ILogWorker } from "@withonevision/omnihive-core/interfaces/ILogWorker";
import { IRestEndpointWorker } from "@withonevision/omnihive-core/interfaces/IRestEndpointWorker";
import { IServerWorker } from "@withonevision/omnihive-core/interfaces/IServerWorker";
import { HiveWorkerMetadataRestFunction } from "@withonevision/omnihive-core/models/HiveWorkerMetadataRestFunction";
import { RegisteredHiveWorker } from "@withonevision/omnihive-core/models/RegisteredHiveWorker";
import { RestEndpointExecuteResponse } from "@withonevision/omnihive-core/models/RestEndpointExecuteResponse";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import http, { Server } from "http";
import path from "path";
import { serializeError } from "serialize-error";
import { IsHelper } from "@withonevision/omnihive-core/helpers/IsHelper";
import swaggerUi from "swagger-ui-express";
import { CommandLineArgs } from "../models/CommandLineArgs";
import { AdminService } from "./AdminService";
import { CommonService } from "./CommonService";

export class ServerService {
    public run = async (rootDir: string, commandLineArgs: CommandLineArgs): Promise<void> => {
        const commonService: CommonService = new CommonService();

        //Run environment loader
        await AwaitHelper.execute(commonService.bootLoader(rootDir, commandLineArgs));

        const webRootUrl = global.omnihive.getEnvironmentVariable<string>("OH_WEB_ROOT_URL");
        const webPortNumber = global.omnihive.getEnvironmentVariable<number>("OH_WEB_PORT_NUMBER");

        if (IsHelper.isNullOrUndefined(webRootUrl) || IsHelper.isNullOrUndefined(webPortNumber)) {
            throw new Error("Web root url or port number is undefined");
        }

        const logWorker: ILogWorker | undefined = global.omnihive.getWorker<ILogWorker>(
            HiveWorkerType.Log,
            "__ohBootLogWorker"
        );

        try {
            // Reboot admin service
            const adminService: AdminService = new AdminService();
            await AwaitHelper.execute(adminService.run());

            // Set server to rebuilding first
            await AwaitHelper.execute(this.changeServerStatus(ServerStatus.Rebuilding));

            // Run worker loader
            await AwaitHelper.execute(commonService.workerLoader());

            // Try to spin up full server
            let app: express.Express = await AwaitHelper.execute(this.getCleanAppServer());

            const servers: RegisteredHiveWorker[] = global.omnihive.registeredWorkers.filter(
                (rw: RegisteredHiveWorker) => rw.type === HiveWorkerType.Server && rw.enabled
            );

            for (const server of servers) {
                try {
                    app = await AwaitHelper.execute((server.instance as IServerWorker).buildServer(app));
                } catch (e) {
                    logWorker?.write(
                        OmniHiveLogLevel.Error,
                        `Skipping server worker ${server.name} due to error: ${serializeError(e)}`
                    );
                }
            }

            app.get("/", (_req, res) => {
                res.status(200).render("pages/index", {
                    rootUrl: webRootUrl,
                    registeredUrls: global.omnihive.registeredUrls,
                    status: global.omnihive.serverStatus,
                    error: global.omnihive.serverError,
                });
            });

            app.use((_req, res) => {
                return res.status(404).render("pages/404", {
                    rootUrl: webRootUrl,
                });
            });

            app.use((err: any, _req: any, res: any, _next: any) => {
                return res.status(500).render("pages/500", {
                    rootUrl: webRootUrl,
                    registeredUrls: global.omnihive.registeredUrls,
                    status: global.omnihive.serverStatus,
                    error: serializeError(err),
                });
            });

            global.omnihive.appServer = app;
            await AwaitHelper.execute(this.changeServerStatus(ServerStatus.Online));
        } catch (err) {
            // Problem...spin up admin server
            await AwaitHelper.execute(this.changeServerStatus(ServerStatus.Admin, err));
            logWorker?.write(OmniHiveLogLevel.Error, `Server Spin-Up Error => ${JSON.stringify(serializeError(err))}`);
        }
    };

    public changeServerStatus = async (serverStatus: ServerStatus, error?: Error): Promise<void> => {
        const webRootUrl = global.omnihive.getEnvironmentVariable<string>("OH_WEB_ROOT_URL");
        const webPortNumber = global.omnihive.getEnvironmentVariable<number>("OH_WEB_PORT_NUMBER");

        if (IsHelper.isNullOrUndefined(webRootUrl) || IsHelper.isNullOrUndefined(webPortNumber)) {
            throw new Error("Web root url or port number is undefined");
        }

        const logWorker: ILogWorker | undefined = global.omnihive.getWorker<ILogWorker>(
            HiveWorkerType.Log,
            "__ohBootLogWorker"
        );

        logWorker?.write(OmniHiveLogLevel.Info, `Server Change Handler Started`);

        global.omnihive.serverStatus = serverStatus;

        if (!IsHelper.isNullOrUndefined(error)) {
            global.omnihive.serverError = serializeError(error);
        } else {
            global.omnihive.serverError = {};
        }

        if (serverStatus === ServerStatus.Admin || serverStatus === ServerStatus.Rebuilding) {
            const app: express.Express = await AwaitHelper.execute(this.getCleanAppServer());

            app.get("/", (_req, res) => {
                return res.status(200).render("pages/index", {
                    rootUrl: webRootUrl,
                    registeredUrls: global.omnihive.registeredUrls,
                    status: global.omnihive.serverStatus,
                    error: global.omnihive.serverError,
                });
            });

            app.use((_req, res) => {
                return res.status(404).render("404", { rootUrl: webRootUrl });
            });

            app.use((err: any, _req: any, res: any, _next: any) => {
                return res.status(500).render("pages/500", {
                    rootUrl: webRootUrl,
                    registeredUrls: global.omnihive.registeredUrls,
                    status: global.omnihive.serverStatus,
                    error: serializeError(err),
                });
            });

            global.omnihive.appServer?.removeAllListeners();
            global.omnihive.appServer = undefined;
            global.omnihive.appServer = app;
        }

        const server: Server = http.createServer(global.omnihive.appServer);
        global.omnihive.webServer?.removeAllListeners().close();
        global.omnihive.webServer = undefined;
        global.omnihive.webServer = server;

        global.omnihive.webServer?.listen(webPortNumber, () => {
            logWorker?.write(
                OmniHiveLogLevel.Info,
                `New Server Listening on process ${process.pid} using port ${webPortNumber}`
            );
        });

        global.omnihive.emitToNamespace(AdminRoomType.Command, AdminEventType.StatusResponse, {
            serverStatus: global.omnihive.serverStatus,
            serverError: global.omnihive.serverError,
        });

        logWorker?.write(OmniHiveLogLevel.Info, `Server Change Handler Completed`);

        const used = process.memoryUsage();
        logWorker?.write(
            OmniHiveLogLevel.Info,
            `Server Memory Usage => rss => ${Math.round((used.rss / 1024 / 1024) * 100) / 100} MB`
        );
        logWorker?.write(
            OmniHiveLogLevel.Info,
            `Server Memory Usage => external => ${Math.round((used.external / 1024 / 1024) * 100) / 100} MB`
        );
        logWorker?.write(
            OmniHiveLogLevel.Info,
            `Server Memory Usage => heapUsed => ${Math.round((used.heapUsed / 1024 / 1024) * 100) / 100} MB`
        );
        logWorker?.write(
            OmniHiveLogLevel.Info,
            `Server Memory Usage => heapTotal => ${Math.round((used.heapTotal / 1024 / 1024) * 100) / 100} MB`
        );
        logWorker?.write(OmniHiveLogLevel.Info, `Server Process Usage => listeners => ${process.listeners.length}`);
    };

    public getCleanAppServer = async (): Promise<express.Express> => {
        const webRootUrl = global.omnihive.getEnvironmentVariable<string>("OH_WEB_ROOT_URL");
        const webPortNumber = global.omnihive.getEnvironmentVariable<number>("OH_WEB_PORT_NUMBER");

        if (IsHelper.isNullOrUndefined(webRootUrl) || IsHelper.isNullOrUndefined(webPortNumber)) {
            throw new Error("Web root url or port number is undefined");
        }

        const logWorker: ILogWorker | undefined = global.omnihive.getWorker<ILogWorker>(
            HiveWorkerType.Log,
            "__ohBootLogWorker"
        );

        const adminRoot: string = `/ohAdmin`;

        // Build app
        global.omnihive.registeredUrls = [];

        const app = express();

        app.use(helmet.dnsPrefetchControl());
        app.use(helmet.expectCt());
        app.use(helmet.frameguard());
        app.use(helmet.hidePoweredBy());
        app.use(helmet.hsts());
        app.use(helmet.ieNoOpen());
        app.use(helmet.noSniff());
        app.use(helmet.permittedCrossDomainPolicies());
        app.use(helmet.referrerPolicy());
        app.use(helmet.xssFilter());

        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(bodyParser.json());
        app.use(cors());

        // Setup View Engine
        app.set("view engine", "ejs");
        app.set("views", path.join(global.omnihive.ohDirName, `app`, `views`));
        app.use("/public", express.static(path.join(global.omnihive.ohDirName, `app`, `public`)));

        // Register system REST endpoints

        const swaggerDefinition: swaggerUi.JsonObject = {
            info: {
                title: "OmniHive System Workers REST Interface",
                version: "1.0.0",
                description: "All system REST endpoint workers provided for OmniHive functionality",
            },
            license: {},
            openapi: "3.0.0",
            servers: [
                {
                    url: `${webRootUrl}${adminRoot}/rest`,
                },
            ],
            paths: {},
            definitions: {},
        };

        global.omnihive.registeredWorkers
            .filter(
                (rw: RegisteredHiveWorker) => rw.type === HiveWorkerType.RestEndpointFunction && rw.enabled && rw.isCore
            )
            .forEach((rw: RegisteredHiveWorker) => {
                let workerMetaData: HiveWorkerMetadataRestFunction;

                try {
                    workerMetaData = ObjectHelper.createStrict<HiveWorkerMetadataRestFunction>(
                        HiveWorkerMetadataRestFunction,
                        rw.metadata
                    );
                } catch (e) {
                    logWorker?.write(
                        OmniHiveLogLevel.Error,
                        `Cannot register system REST worker ${rw.name}.  MetaData is incorrect.`
                    );

                    return;
                }

                const workerInstance: IRestEndpointWorker = rw.instance as IRestEndpointWorker;

                app[workerMetaData.restMethod](
                    `${adminRoot}/rest/${workerMetaData.urlRoute}`,
                    async (req: express.Request, res: express.Response) => {
                        res.setHeader("Content-Type", "application/json");

                        try {
                            const workerResponse: RestEndpointExecuteResponse = await AwaitHelper.execute(
                                workerInstance.execute(
                                    req.headers,
                                    `${req.protocol}://${req.get("host")}${req.originalUrl}`,
                                    req.body
                                )
                            );

                            if (!IsHelper.isNullOrUndefined(workerResponse.response)) {
                                res.status(workerResponse.status).json(workerResponse.response);
                            } else {
                                res.status(workerResponse.status).send(true);
                            }
                        } catch (e) {
                            return res.status(500).render("pages/500", {
                                rootUrl: webRootUrl,
                                error: serializeError(e),
                            });
                        }
                    }
                );

                global.omnihive.registeredUrls.push({
                    path: `${webRootUrl}${adminRoot}/rest/${workerMetaData.urlRoute}`,
                    type: RegisteredUrlType.RestFunction,
                    metadata: {},
                });

                const workerSwagger: swaggerUi.JsonObject | undefined = workerInstance.getSwaggerDefinition();

                if (!IsHelper.isNullOrUndefined(workerSwagger)) {
                    swaggerDefinition.paths = { ...swaggerDefinition.paths, ...workerSwagger.paths };
                    swaggerDefinition.definitions = {
                        ...swaggerDefinition.definitions,
                        ...workerSwagger.definitions,
                    };
                }
            });

        app.get(`${adminRoot}/api-docs/swagger.json`, async (_req: express.Request, res: express.Response) => {
            res.setHeader("Content-Type", "application/json");
            return res.status(200).json(swaggerDefinition);
        });

        app.use(`${adminRoot}/api-docs`, swaggerUi.serve, swaggerUi.setup(swaggerDefinition));

        global.omnihive.registeredUrls.push({
            path: `${webRootUrl}${adminRoot}/api-docs`,
            type: RegisteredUrlType.Swagger,
            metadata: {
                swaggerJsonUrl: `${webRootUrl}${adminRoot}/api-docs/swagger.json`,
            },
        });

        return app;
    };
}
