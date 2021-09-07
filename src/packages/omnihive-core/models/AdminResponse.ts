export class AdminResponse<T = {}> {
    public data?: T | undefined = undefined;
    public serverGroupId: string = "";
    public requestComplete?: boolean = true;
    public requestError?: string | undefined = undefined;
}
