import { AwaitHelper } from "@withonevision/omnihive-core/helpers/AwaitHelper";
import { IsHelper } from "@withonevision/omnihive-core/helpers/IsHelper";
import { ITokenWorker } from "@withonevision/omnihive-core/interfaces/ITokenWorker";
import { HiveWorkerBase } from "@withonevision/omnihive-core/models/HiveWorkerBase";
import { AuthenticationClient, ClientCredentialsGrantOptions } from "auth0";
import axios, { AxiosResponse } from "axios";
import jwtDecode from "jwt-decode";
import jose from "node-jose";

export class AuthZeroTokenWorkerMetadata {
    public clientId: string = "";
    public clientSecret: string = "";
    public domain: string = "";
    public audience: string = "";
    public verifyOn: boolean = true;
}

export default class AuthZeroTokenWorker extends HiveWorkerBase implements ITokenWorker {
    private typedMetadata!: AuthZeroTokenWorkerMetadata;
    private token: string = "";
    private authClient!: AuthenticationClient;

    constructor() {
        super();
    }

    public async init(name: string, metadata?: any): Promise<void> {
        await AwaitHelper.execute(super.init(name, metadata));

        this.typedMetadata = this.checkObjectStructure<AuthZeroTokenWorkerMetadata>(
            AuthZeroTokenWorkerMetadata,
            metadata
        );

        this.authClient = new AuthenticationClient({
            domain: this.typedMetadata.domain,
            clientId: this.typedMetadata.clientId,
            clientSecret: this.typedMetadata.clientSecret,
        });
    }

    public get = async (): Promise<string> => {
        if (this.token !== "" && !this.expired(this.token)) {
            return this.token;
        }

        const options: ClientCredentialsGrantOptions = {
            audience: this.typedMetadata.audience,
        };

        this.token = (await AwaitHelper.execute(this.authClient.clientCredentialsGrant(options))).access_token;
        this.token = `${this.typedMetadata.clientId}||${this.token}`;
        return this.token;
    };

    public expired = async (token: string): Promise<boolean> => {
        const clientId = token.split("||")[0];
        token = token.split("||")[1];

        try {
            const currentTimestamp = Math.floor(Date.now().valueOf() / 1000);
            const decoded: any = jwtDecode(token);

            if (decoded.azp !== clientId || IsHelper.isUndefined(decoded.exp) || currentTimestamp > decoded.exp) {
                throw new Error("[ohAccessError] Access token is either the wrong client or expired");
            }

            return true;
        } catch {
            throw new Error("[ohAccessError] Access token is either the wrong client or expired");
        }
    };

    public verify = async (token: string): Promise<boolean> => {
        if (!this.typedMetadata.verifyOn) {
            return true;
        }

        if (IsHelper.isNullOrUndefined(token) || IsHelper.isEmptyStringOrWhitespace(token)) {
            throw new Error("[ohAccessError] No access token was given");
        }

        const clientId = (token as string).split("||")[0];
        token = (token as string).split("||")[1];

        const sections: string[] = token.split(".");

        // get the kid from the headers prior to verification
        const header: string = jose.util.base64url.decode(sections[0]).toString();
        const parsedHeader: any = JSON.parse(header);
        const kid: string = parsedHeader.kid;

        // download the public keys
        let jwks: AxiosResponse<any>;

        try {
            jwks = await AwaitHelper.execute(axios.get(`https://${this.typedMetadata.domain}/.well-known/jwks.json`));
        } catch (e) {
            throw new Error("[ohAccessError] JWKS Url Not Responding");
        }

        if (jwks.status !== 200) {
            throw new Error("[ohAccessError] Unknown validation error");
        }

        const keys: any = jwks.data.keys;

        // search for the kid in the downloaded public keys
        let keyIndex: number = -1;

        for (let i: number = 0; i < keys.length; i++) {
            if (kid === keys[i].kid) {
                keyIndex = i;
                break;
            }
        }

        if (keyIndex === -1) {
            throw new Error("No JWKS public key");
        }

        // construct the public key
        let jwkKey: jose.JWK.Key;

        try {
            jwkKey = await AwaitHelper.execute(jose.JWK.asKey(keys[keyIndex]));
        } catch (e) {
            throw new Error("[ohAccessError] Invalid key");
        }

        // verify the signature
        let jwkVerification: jose.JWS.VerificationResult;

        try {
            jwkVerification = await AwaitHelper.execute(jose.JWS.createVerify(jwkKey).verify(token));
        } catch (e) {
            throw new Error("[ohAccessError] Signature verification failed");
        }

        // now we can use the claims
        const claims = JSON.parse(jwkVerification.payload.toString());

        // additionally we can verify the token expiration
        const currentTimestamp = Math.floor(new Date().valueOf() / 1000);

        if (currentTimestamp > claims.exp) {
            throw new Error("[ohAccessError] Token expired");
        }

        // and the client ID the token was issued to
        if (claims.azp !== clientId) {
            throw new Error("[ohAccessError] No audience granted");
        }

        return true;
    };
}
