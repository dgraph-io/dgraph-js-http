import { Assigned, Mutation, Operation, Options, Payload, Request, Response, TxnContext, UiKeywords } from "./types";
export declare class DgraphClientStub {
    private readonly addr;
    private readonly options;
    private readonly jsonParser;
    private legacyApi;
    private accessToken;
    private refreshToken;
    private autoRefresh;
    private autoRefreshTimer?;
    constructor(addr?: string, stubConfig?: {
        legacyApi?: boolean;
        jsonParser?(text: string): any;
    }, options?: Options);
    detectApiVersion(): Promise<string>;
    alter(op: Operation): Promise<Payload>;
    query(req: Request): Promise<Response>;
    mutate(mu: Mutation): Promise<Assigned>;
    commit(ctx: TxnContext): Promise<TxnContext>;
    abort(ctx: TxnContext): Promise<TxnContext>;
    login(userid?: string, password?: string, refreshToken?: string): Promise<boolean>;
    logout(): void;
    getAuthTokens(): {
        accessToken?: string;
        refreshToken?: string;
    };
    fetchUiKeywords(): Promise<UiKeywords>;
    getHealth(all?: boolean): Promise<Response>;
    getState(): Promise<Response>;
    setAutoRefresh(val: boolean): void;
    private cancelRefreshTimer;
    private maybeStartRefreshTimer;
    private callAPI;
    private getURL;
}
