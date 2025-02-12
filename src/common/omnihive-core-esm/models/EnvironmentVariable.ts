import { EnvironmentVariableType } from "../enums/EnvironmentVariableType.js";

export class EnvironmentVariable {
    public key: string = "";
    public value!: string | boolean | number | undefined;
    public type: EnvironmentVariableType = EnvironmentVariableType.String;
    public isSystem?: boolean = false;
}
