import "isomorphic-fetch";
import { Assigned, Mutation, Operation, Payload, Request, Response, TxnContext, UiKeywords } from "./types";
export declare class DgraphClientStub {
    private readonly addr;
    private legacyApi;
    private accessJWT;
    private refreshJWT;
    constructor(addr?: string, legacyApi?: boolean);
    detectApiVersion(): Promise<string>;
    alter(op: Operation): Promise<Payload>;
    query(req: Request): Promise<Response>;
    mutate(mu: Mutation): Promise<Assigned>;
    commit(ctx: TxnContext): Promise<TxnContext>;
    abort(ctx: TxnContext): Promise<TxnContext>;
    health(): Promise<{
        health: string;
        version: string;
        instance?: string;
        uptime?: number;
    }>;
    login(userid?: string, password?: string, refreshJWT?: string): Promise<boolean>;
    logout(): void;
    getAuthTokens(): {
        accessJWT?: string;
        refreshJWT?: string;
    };
    fetchUiKeywords(): Promise<UiKeywords>;
    private callAPI;
    private getURL;
}
