import * as Sentry from '@sentry/node';
import { AwaitHelper } from "@withonevision/omnihive-queen/helpers/AwaitHelper";
import { IErrorWorker } from "@withonevision/omnihive-queen/interfaces/IErrorWorker";
import { HiveWorker } from "@withonevision/omnihive-queen/models/HiveWorker";
import { HiveWorkerBase } from "@withonevision/omnihive-queen/models/HiveWorkerBase";
import { serializeError } from 'serialize-error';

export class SentryErrorWorkerMetadata {
    public sentryDsn: string = "";
    public environment: string = "";
    public hostname: string = "";
}

export default class SentryErrorWorker extends HiveWorkerBase implements IErrorWorker {

    constructor() {
        super();
    }

    public async init(config: HiveWorker): Promise<void> {
        try {
            await AwaitHelper.execute<void>(super.init(config));
            const metadata: SentryErrorWorkerMetadata = this.checkMetadata<SentryErrorWorkerMetadata>(SentryErrorWorkerMetadata, config.metadata);

            Sentry.init({
                dsn: metadata.sentryDsn,
                environment: metadata.environment,
                serverName: metadata.hostname,
            });
        } catch (err) {
            throw new Error("Sentry Error Worker Error => " + JSON.stringify(serializeError(err)));
        }
    }

    public handleException = async (error: string): Promise<void> => {
        Sentry.captureException(new Error(error));
    };
}