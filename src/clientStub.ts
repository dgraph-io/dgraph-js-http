import * as fetch from "isomorphic-fetch";
import * as jwt from "jsonwebtoken";

import { APIError, APIResultError, HTTPError } from "./errors";
import {
    Assigned,
    Config,
    ErrorNonJson,
    LoginResponse,
    Mutation,
    Operation,
    Options,
    Payload,
    Request,
    Response,
    TxnContext,
    UiKeywords,
} from "./types";

// milliseconds before doing automatic token refresh
const AUTO_REFRESH_PREFETCH_TIME = 5000;

const ACL_TOKEN_HEADER = "X-Dgraph-AccessToken";
const ALPHA_AUTH_TOKEN_HEADER = "X-Dgraph-AuthToken";
const DGRAPHCLOUD_API_KEY_HEADER = "X-Auth-Token";

/**
 * Stub is a stub/client connecting to a single dgraph server instance.
 */
export class DgraphClientStub {
    private readonly addr: string;
    private readonly options: Options;
    /*  eslint-disable-next-line @typescript-eslint/no-explicit-any */
    private readonly jsonParser: (text: string) => any;
    private legacyApi: boolean;
    private accessToken: string;
    private refreshToken: string;
    private autoRefresh: boolean;
    private autoRefreshTimer?: number;

    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    constructor(
        addr?: string,
        stubConfig: {
            legacyApi?: boolean;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            jsonParser?(text: string): any;
        } = {},
        options: Options = {},
    ) {
        if (addr === undefined) {
            this.addr = "http://localhost:8080";
        } else {
            this.addr = addr;
        }

        this.options = options;

        this.legacyApi = !!stubConfig.legacyApi;
        this.jsonParser =
            stubConfig.jsonParser !== undefined
                ? stubConfig.jsonParser
                : // eslint-disable-next-line @typescript-eslint/tslint/config
                JSON.parse.bind(JSON);
    }

    public async detectApiVersion(): Promise<string> {
        const health = await this.getHealth();
        // eslint-disable-next-line @typescript-eslint/tslint/config, @typescript-eslint/dot-notation
        let version: string = health["version"] || health[0].version;
        if (version === undefined) {
            version = "1.0.x";
        }
        this.legacyApi = version.startsWith("1.0.");
        return version;
    }

    public alter(op: Operation): Promise<Payload> {
        let body: string;
        if (op.schema !== undefined) {
            body = op.schema;
        } else if (op.dropAttr !== undefined) {
            body = JSON.stringify({ drop_attr: op.dropAttr });
        } else if (op.dropAll) {
            body = JSON.stringify({ drop_all: true });
        } else {
            return Promise.reject("Invalid op argument in alter");
        }

        return this.callAPI("alter", {
            ...this.options,
            method: "POST",
            body,
        });
    }

    public query(req: Request): Promise<Response> {
        const headers =
            this.options.headers !== undefined
                ? { ...this.options.headers }
                : {};
        if (req.vars !== undefined) {
            if (this.legacyApi) {
                headers["X-Dgraph-Vars"] = JSON.stringify(req.vars);
            } else {
                headers["Content-Type"] = "application/json";
                req.query = JSON.stringify({
                    query: req.query,
                    variables: req.vars,
                });
            }
        }
        if (headers["Content-Type"] === undefined && !this.legacyApi) {
            headers["Content-Type"] = "application/graphql+-";
        }

        let url = "query";

        if (this.legacyApi) {
            if (req.startTs !== 0) {
                url += `/${req.startTs}`;
            }
            if (req.debug) {
                url += "?debug=true";
            }
        } else {
            const params: { key: string; value: string }[] = [];
            if (req.startTs !== 0) {
                params.push({
                    key: "startTs",
                    value: `${req.startTs}`,
                });
            }
            if (req.timeout > 0) {
                params.push({
                    key: "timeout",
                    value: `${req.timeout}s`,
                });
            }
            if (req.debug) {
                params.push({
                    key: "debug",
                    value: "true",
                });
            }
            if (req.readOnly) {
                params.push({
                    key: "ro",
                    value: "true",
                });
            }
            if (req.bestEffort) {
                params.push({
                    key: "be",
                    value: "true",
                });
            }
            if (req?.hash?.length > 0) {
                params.push({
                    key: "hash",
                    value: `${req.hash}`,
                });
            }
            if (params.length > 0) {
                url += "?";
                url += params
                    .map(
                        ({
                            key,
                            value,
                        }: {
                            key: string;
                            value: string;
                        }): string => `${key}=${value}`,
                    )
                    .join("&");
            }
        }

        return this.callAPI(url, {
            ...this.options,
            method: "POST",
            body: req.query,
            headers,
        });
    }

    public mutate(mu: Mutation): Promise<Assigned> {
        let body: string;
        let usingJSON: boolean = false;
        if (mu.setJson !== undefined || mu.deleteJson !== undefined) {
            usingJSON = true;
            const obj: { [k: string]: object } = {};
            if (mu.setJson !== undefined) {
                obj.set = mu.setJson;
            }
            if (mu.deleteJson !== undefined) {
                obj.delete = mu.deleteJson;
            }

            body = JSON.stringify(obj);
        } else if (
            mu.setNquads !== undefined ||
            mu.deleteNquads !== undefined
        ) {
            body = `{
                ${
    mu.setNquads === undefined
        ? ""
        : `set {
                    ${mu.setNquads}
                }`
}
                ${
    mu.deleteNquads === undefined
        ? ""
        : `delete {
                    ${mu.deleteNquads}
                }`
}
            }`;
        } else if (mu.mutation !== undefined) {
            body = mu.mutation;
            if (mu.isJsonString !== undefined) {
                // Caller has specified mutation type
                usingJSON = mu.isJsonString;
            } else {
                // Detect content-type
                try {
                    JSON.parse(mu.mutation);
                    usingJSON = true;
                } catch (e) {
                    usingJSON = false;
                }
            }
        } else {
            return Promise.reject("Mutation has no data");
        }

        const headers = {
            ...(this.options.headers !== undefined ? this.options.headers : {}),
            "Content-Type": `application/${usingJSON ? "json" : "rdf"}`,
        };

        if (usingJSON && this.legacyApi) {
            headers["X-Dgraph-MutationType"] = "json";
        }

        let url = "mutate";
        let nextDelim = "?";
        if (mu.startTs > 0) {
            url +=
                (!this.legacyApi ? "?startTs=" : "/") + mu.startTs.toString();
            nextDelim = "&";
        }

        if (mu?.hash?.length > 0) {
            if (!this.legacyApi) {
                url += `${nextDelim}hash=${mu.hash}`;
            }
        }

        if (mu.commitNow) {
            if (!this.legacyApi) {
                url += `${nextDelim}commitNow=true`;
            } else {
                headers["X-Dgraph-CommitNow"] = "true";
            }
        }

        return this.callAPI(url, {
            ...this.options,
            method: "POST",
            body,
            headers,
        });
    }

    public commit(ctx: TxnContext): Promise<TxnContext> {
        let body: string;
        if (ctx.keys === undefined) {
            body = "[]";
        } else {
            body = JSON.stringify(ctx.keys);
        }

        let url = !this.legacyApi
            ? `commit?startTs=${ctx.start_ts}`
            : `commit/${ctx.start_ts}`;

        if (ctx?.hash?.length > 0) {
            if (!this.legacyApi) {
                url += `&hash=${ctx.hash}`;
            }
        }

        return this.callAPI(url, {
            ...this.options,
            method: "POST",
            body,
        });
    }

    public abort(ctx: TxnContext): Promise<TxnContext> {
        let url = !this.legacyApi
            ? `commit?startTs=${ctx.start_ts}&abort=true`
            : `abort/${ctx.start_ts}`;

        if (ctx?.hash?.length > 0) {
            if (!this.legacyApi) {
                url += `&hash=${ctx.hash}`;
            }
        }

        return this.callAPI(url, { ...this.options, method: "POST" });
    }

    public async login(
        userid?: string,
        password?: string,
        refreshToken?: string,
    ): Promise<boolean> {
        if (this.legacyApi) {
            throw new Error("Pre v1.1 clients do not support Login methods");
        }

        const body: { [k: string]: string } = {};
        if (
            userid === undefined &&
            refreshToken === undefined &&
            this.refreshToken === undefined
        ) {
            throw new Error(
                "Cannot find login details: neither userid/password nor refresh token are specified",
            );
        }
        if (userid === undefined) {
            body.refresh_token =
                refreshToken !== undefined ? refreshToken : this.refreshToken;
        } else {
            body.userid = userid;
            body.password = password;
        }

        const res: LoginResponse = await this.callAPI("login", {
            ...this.options,
            method: "POST",
            body: JSON.stringify(body),
        });
        this.accessToken = res.data.accessJWT;
        this.refreshToken = res.data.refreshJWT;

        this.maybeStartRefreshTimer(this.accessToken);
        return true;
    }

    public async loginIntoNamespace(
        userid?: string,
        password?: string,
        namespace?: number,
        refreshToken?: string,
    ): Promise<boolean> {
        if (this.legacyApi) {
            throw new Error("Pre v1.1 clients do not support Login methods");
        }

        const body: { [k: string]: string | number } = {};
        if (
            userid === undefined &&
            refreshToken === undefined &&
            this.refreshToken === undefined
        ) {
            throw new Error(
                "Cannot find login details: neither userid/password nor refresh token are specified",
            );
        }
        if (userid === undefined) {
            body.refresh_token =
                refreshToken !== undefined ? refreshToken : this.refreshToken;
        } else {
            body.userid = userid;
            body.password = password;
            body.namespace = namespace;
        }

        const res: LoginResponse = await this.callAPI("login", {
            ...this.options,
            method: "POST",
            body: JSON.stringify(body),
        });
        this.accessToken = res.data.accessJWT;
        this.refreshToken = res.data.refreshJWT;

        this.maybeStartRefreshTimer(this.accessToken);
        return true;
    }

    public logout(): void {
        this.accessToken = undefined;
        this.refreshToken = undefined;
    }

    public getAuthTokens(): { accessToken?: string; refreshToken?: string } {
        return {
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
        };
    }

    public async fetchUiKeywords(): Promise<UiKeywords> {
        return this.callAPI("ui/keywords", this.options);
    }

    /**
     * Gets instance or cluster health, based on the all param
     */
    public async getHealth(all: boolean = false): Promise<Response> {
        return this.callAPI(`health${all ? "?all" : ""}`, {
            ...this.options,
            acceptRawText: true,
        });
    }

    /**
     * Gets the state of the cluster
     */
    public async getState(): Promise<Response> {
        return this.callAPI("state", this.options);
    }

    public setAutoRefresh(val: boolean): void {
        if (!val) {
            this.cancelRefreshTimer();
        }
        this.autoRefresh = val;
        this.maybeStartRefreshTimer(this.accessToken);
    }

    public setAlphaAuthToken(authToken: string): void{
        if (this.options.headers === undefined) {
            this.options.headers = {};
        }
        this.options.headers[ALPHA_AUTH_TOKEN_HEADER] = authToken;
    }

    /**
     * @deprecated since v21.3 and will be removed in v21.07 release.
     * Please use {@link setCloudApiKey} instead.
     */
    public setSlashApiKey(apiKey: string): void {
        this.setCloudApiKey(apiKey);
    }

    public setCloudApiKey(apiKey: string): void {
        if (this.options.headers === undefined) {
            this.options.headers = {};
        }
        this.options.headers[DGRAPHCLOUD_API_KEY_HEADER] = apiKey;
    }

    private cancelRefreshTimer(): void {
        if (this.autoRefreshTimer !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            clearTimeout((this.autoRefreshTimer as any));
            this.autoRefreshTimer = undefined;
        }
    }

    private maybeStartRefreshTimer(accessToken?: string): void {
        if (accessToken === undefined || !this.autoRefresh) {
            return;
        }
        this.cancelRefreshTimer();

        const timeToWait = Math.max(
            2000,
            // eslint-disable-next-line @typescript-eslint/tslint/config
            (jwt.decode(accessToken) as { exp: number }).exp * 1000 -
                Date.now() -
                AUTO_REFRESH_PREFETCH_TIME,
        );

        // eslint-disable-next-line @typescript-eslint/tslint/config
        this.autoRefreshTimer = (setTimeout(
            () => (this.refreshToken !== undefined ? this.login() : 0),
            timeToWait,
        ) as unknown) as number;
    }

    private async callAPI<T>(path: string, config: Config): Promise<T> {
        const url = this.getURL(path);
        config.headers = config.headers !== undefined ? config.headers : {};
        if (this.accessToken !== undefined && path !== "login") {
            config.headers[ACL_TOKEN_HEADER] = this.accessToken;
        }

        // eslint-disable-next-line @typescript-eslint/tslint/config
        const response = await fetch(url, config);

        // eslint-disable-next-line @typescript-eslint/tslint/config
        if (response.status >= 300 || response.status < 200) {
            // eslint-disable-next-line @typescript-eslint/tslint/config
            throw new HTTPError(response);
        }

        let json;
        // eslint-disable-next-line @typescript-eslint/tslint/config
        const responseText: string = await response.text();

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            json = this.jsonParser(responseText);
        } catch (e) {
            if (config.acceptRawText) {
                return (responseText as unknown) as T;
            }
            const err: ErrorNonJson = new Error("Response is not JSON") as ErrorNonJson;
            err.responseText = responseText;
            throw err;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errors = (json as { errors: APIResultError[] }).errors;

        if (errors !== undefined) {
            throw new APIError(url, errors);
        }

        return json as T;
    }

    private getURL(path: string): string {
        return `${this.addr}${this.addr.endsWith("/") ? "" : "/"}${path}`;
    }
}
