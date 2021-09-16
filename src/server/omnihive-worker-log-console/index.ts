import { HiveWorkerBase, ILogWorker, OmniHiveLogLevel } from "@withonevision/omnihive-core";

export default class ConsoleLogWorker extends HiveWorkerBase implements ILogWorker {
    constructor() {
        super();
    }
    public write = async (_logLevel: OmniHiveLogLevel, logString: string): Promise<void> => {
        console.log(logString);
    };
}
