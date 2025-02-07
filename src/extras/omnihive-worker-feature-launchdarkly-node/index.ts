import { HiveWorkerType } from "@withonevision/omnihive-core/enums/HiveWorkerType";
import { OmniHiveLogLevel } from "@withonevision/omnihive-core/enums/OmniHiveLogLevel";
import { AwaitHelper } from "@withonevision/omnihive-core/helpers/AwaitHelper";
import { IsHelper } from "@withonevision/omnihive-core/helpers/IsHelper";
import { IFeatureWorker } from "@withonevision/omnihive-core/interfaces/IFeatureWorker";
import { ILogWorker } from "@withonevision/omnihive-core/interfaces/ILogWorker";
import { HiveWorkerBase } from "@withonevision/omnihive-core/models/HiveWorkerBase";
import LaunchDarkly, { LDUser } from "launchdarkly-node-server-sdk";

type LaunchDarklyFeatureClient = {
    clientSideId: string;
    instance: LaunchDarkly.LDClient;
    mobileKey: string;
    project: string;
    ready: boolean;
    sdkKey: string;
};

type LaunchDarklyFeature = {
    name: string;
    value: any;
};

export class LaunchDarklyNodeFeatureWorkerMetadata {
    public clientSideId: string = "";
    public mobileKey: string = "";
    public project: string = "";
    public sdkKey: string = "";
    public user: string = "";
}

export default class LaunchDarklyNodeFeatureWorker extends HiveWorkerBase implements IFeatureWorker {
    private client!: LaunchDarklyFeatureClient;
    private features: LaunchDarklyFeature[] = [];
    private user!: LDUser;
    private project!: string;

    constructor() {
        super();
    }

    public async init(name: string, metadata?: any): Promise<void> {
        await AwaitHelper.execute(super.init(name, metadata));
        const typedMetadata: LaunchDarklyNodeFeatureWorkerMetadata =
            this.checkObjectStructure<LaunchDarklyNodeFeatureWorkerMetadata>(
                LaunchDarklyNodeFeatureWorkerMetadata,
                metadata
            );

        const ldInstance: LaunchDarkly.LDClient = LaunchDarkly.init(typedMetadata.sdkKey);

        const featureClient: LaunchDarklyFeatureClient = {
            clientSideId: typedMetadata.clientSideId,
            mobileKey: typedMetadata.mobileKey,
            project: typedMetadata.project,
            sdkKey: typedMetadata.sdkKey,
            instance: ldInstance,
            ready: false,
        };
        this.user = { key: typedMetadata.user };
        this.project = typedMetadata.project;

        featureClient.instance.on("ready", () => {
            featureClient.ready = true;
            this.client = featureClient;
        });

        await AwaitHelper.execute(featureClient.instance.waitForInitialization());
    }

    public get = async <T extends unknown>(name: string, defaultValue?: unknown): Promise<T | undefined> => {
        if (IsHelper.isNullOrUndefined(name) || IsHelper.isEmptyStringOrWhitespace(name)) {
            throw new Error("No feature name given.");
        }

        const logWorker: ILogWorker | undefined = this.getWorker<ILogWorker | undefined>(HiveWorkerType.Log);

        const feature: LaunchDarklyFeature | undefined = this.features.find(
            (ff: LaunchDarklyFeature) => ff.name === name
        );

        if (!IsHelper.isNullOrUndefined(feature)) {
            logWorker?.write(
                OmniHiveLogLevel.Info,
                `Feature Evaluated => Project: ${this.project} => Flag: ${name} => Value: ${feature.value as string}`
            );
            return feature.value as T;
        }

        let value: any;

        try {
            value = await AwaitHelper.execute(this.client.instance.variation(name, this.user, defaultValue));
        } catch (error) {
            throw new Error(`Failed to retrieve LaunchDarkly feature ${name}`);
        }

        this.features.push({ name, value });

        this.client?.instance?.on(`update:${name}`, () => {
            this.client?.instance?.variation(name, this.user, defaultValue).then((newValue) => {
                logWorker?.write(
                    OmniHiveLogLevel.Info,
                    `Feature Changed => Project: ${this.project} => Flag: ${name} => New Value: ${newValue as string}`
                );

                const changeFeature: LaunchDarklyFeature | undefined = this.features.find(
                    (ff: LaunchDarklyFeature) => ff.name === name
                );

                if (IsHelper.isNullOrUndefined(changeFeature)) {
                    this.features.push({ name, value: newValue });
                } else {
                    this.features.filter((ff: LaunchDarklyFeature) => ff.name === name)[0].value = newValue;
                }
            });
        });

        logWorker?.write(
            OmniHiveLogLevel.Info,
            `Feature Evaluated and Listening => Project: ${this.project} => Flag: ${name} => Value: ${value as string}`
        );

        return value as T;
    };

    public isConnected = () => {
        if (!IsHelper.isNullOrUndefined(this.client)) {
            return this.client.ready;
        }

        return false;
    };

    public disconnect = async () => {
        if (!IsHelper.isNullOrUndefined(this.client)) {
            await AwaitHelper.execute(this.client.instance.flush());
            this.client.instance.close();
            this.client.ready = false;
        }
    };
}
