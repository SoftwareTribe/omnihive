import { AwaitHelper } from "@withonevision/omnihive-core/helpers/AwaitHelper";
import { IsHelper } from "@withonevision/omnihive-core/helpers/IsHelper";
import { IPubSubClientWorker } from "@withonevision/omnihive-core/interfaces/IPubSubClientWorker";
import { HiveWorkerBase } from "@withonevision/omnihive-core/models/HiveWorkerBase";
import { PubSubListener } from "@withonevision/omnihive-core/models/PubSubListener";
import * as socketio from "socket.io-client";

export class SocketIoPubSubClientWorkerMetadata {
    public serverUrl: string = "";
    public maxRetries: number = 5;
}

export default class SocketIoPubSubClientWorker extends HiveWorkerBase implements IPubSubClientWorker {
    private connected: boolean = false;
    private ioClient!: socketio.Socket;
    private listeners: PubSubListener[] = [];
    private rooms: string[] = [];
    private typedMetadata!: SocketIoPubSubClientWorkerMetadata;

    constructor() {
        super();
    }

    public async init(name: string, metadata?: any): Promise<void> {
        await AwaitHelper.execute(super.init(name, metadata));
        this.typedMetadata = this.checkObjectStructure<SocketIoPubSubClientWorkerMetadata>(
            SocketIoPubSubClientWorkerMetadata,
            metadata
        );
        this.ioClient = socketio.io({ path: this.typedMetadata.serverUrl });

        this.ioClient.on("connect", () => {
            this.connect();
        });

        this.ioClient.on("disconnect", () => {
            this.disconnect();
        });
    }

    public addListener = (channelName: string, eventName: string, callback?: Function): void => {
        this.checkConnection();

        if (!this.rooms.some((room: string) => room === channelName)) {
            this.joinChannel(channelName);
        }

        this.removeListener(channelName, eventName);

        if (!this.listeners.some((listener: PubSubListener) => listener.eventName === eventName)) {
            this.ioClient.on(eventName, (packet: { room: string; data: any }) => {
                if (packet.room === channelName && callback && IsHelper.isFunction(callback)) {
                    callback(packet.data);
                }
            });
        }

        this.listeners.push({ channelName, eventName, callback });
    };

    public emit = async (eventName: string, message: any): Promise<void> => {
        this.checkConnection();
        this.ioClient.emit(eventName, message);
        return;
    };

    public getJoinedChannels = (): string[] => {
        return this.rooms;
    };

    public getListeners = (): PubSubListener[] => {
        return this.listeners;
    };

    public removeListener = (channelName: string, eventName: string): void => {
        this.checkConnection();

        if (
            this.listeners.some(
                (listener: PubSubListener) => listener.channelName == channelName && listener.eventName === eventName
            )
        ) {
            this.listeners = this.listeners.filter(
                (listener: PubSubListener) => listener.channelName == channelName && listener.eventName !== eventName
            );

            if (
                !this.listeners.some((listener: PubSubListener) => listener.eventName === eventName) &&
                this.ioClient.hasListeners(eventName)
            ) {
                this.ioClient.off(eventName);
            }
        }
    };

    public connect = async (retry: number = 0): Promise<void> => {
        try {
            if (this.connected) {
                return;
            }

            this.ioClient.connect();
            this.connected = true;
        } catch (err) {
            if (retry <= this.typedMetadata.maxRetries) {
                this.connect(retry++);
            } else {
                throw new Error("The maximum amount of retries to connect has been reached.");
            }
        }
    };

    public disconnect = (): void => {
        if (IsHelper.isNullOrUndefined(this.ioClient)) {
            throw new Error("Socket.IO is not instantiated.");
        }

        this.checkConnection(false);

        if (this.connected) {
            this.listeners.filter((listener: PubSubListener) => {
                this.removeListener(listener.channelName, listener.eventName);
            });

            this.listeners = [];

            this.getJoinedChannels().forEach((channel: string) => {
                this.leaveChannel(channel);
            });

            this.rooms = [];

            this.ioClient.disconnect();
            this.connected = false;
        }
    };

    public joinChannel = (channelName: string): void => {
        if (IsHelper.isNullOrUndefined(this.ioClient)) {
            throw new Error("Socket.IO is not instantiated.");
        }

        this.checkConnection();

        if (!this.rooms.some((room: string) => room === channelName)) {
            this.ioClient.emit("join-room", channelName);
            this.rooms.push(channelName);
        }
    };

    public leaveChannel = (channelName: string): void => {
        if (IsHelper.isNullOrUndefined(this.ioClient)) {
            throw new Error("Socket.IO is not instantiated.");
        }

        this.checkConnection();

        if (this.rooms.some((room: string) => room === channelName)) {
            this.ioClient.emit("leave-room", channelName);
            this.rooms = this.rooms.filter((room: string) => room !== channelName);
        }
    };

    private checkConnection = (autoConnect: boolean = true): boolean => {
        if (!this.connected && autoConnect) {
            try {
                this.connect();

                return true;
            } catch (err) {
                throw new Error(err.message);
            }
        } else if (!this.connected && !autoConnect) {
            return false;
        } else {
            return true;
        }
    };
}
