import { HiveWorkerType } from "@withonevision/omnihive-queen/enums/HiveWorkerType";
import { AwaitHelper } from "@withonevision/omnihive-queen/helpers/AwaitHelper";
import { IDatabaseWorker } from "@withonevision/omnihive-queen/interfaces/IDatabaseWorker";
import { IEncryptionWorker } from "@withonevision/omnihive-queen/interfaces/IEncryptionWorker";
import { QueenStore } from "@withonevision/omnihive-queen/stores/QueenStore";

export class ParseCustomSql {
    public parse = async (workerName: string, encryptedSql: string): Promise<any[][]> => {
        const encryptionWorker: IEncryptionWorker | undefined = await AwaitHelper.execute<IEncryptionWorker | undefined>(
            QueenStore.getInstance().getHiveWorker<IEncryptionWorker | undefined>(HiveWorkerType.Encryption));

        if (!encryptionWorker) {
            throw new Error("Encryption Worker Not Defined.  This graph converter will not work without an Encryption worker.");
        }

        const databaseWorker: IDatabaseWorker | undefined = await AwaitHelper.execute<IDatabaseWorker | undefined>(
            QueenStore.getInstance().getHiveWorker<IDatabaseWorker | undefined>(HiveWorkerType.Database, workerName));

        if (!databaseWorker) {
            throw new Error("Database Worker Not Defined.  This graph converter will not work without a Database worker.");
        }

        const decryptedSql = encryptionWorker.symmetricDecrypt(encryptedSql);
        return await AwaitHelper.execute<any[][]>(databaseWorker.executeQuery(decryptedSql));
    }
}