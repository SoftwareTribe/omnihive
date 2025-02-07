import { HiveWorkerBase } from "@withonevision/omnihive-core/models/HiveWorkerBase";
import { ILogWorker } from "@withonevision/omnihive-core/interfaces/ILogWorker";
import { OmniHiveLogLevel } from "@withonevision/omnihive-core/enums/OmniHiveLogLevel";

export default class ConsoleLogWorker extends HiveWorkerBase implements ILogWorker {
    constructor() {
        super();
    }
    public write = async (_logLevel: OmniHiveLogLevel, _logString: string): Promise<void> => {
        return;
    };
}
