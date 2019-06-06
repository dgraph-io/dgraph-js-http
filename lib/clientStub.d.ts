import "isomorphic-fetch";
import { Assigned, Mutation, Operation, Payload, Request, Response, TxnContext } from "./types";
export declare class DgraphClientStub {
    private readonly addr;
    private readonly legacyApi;
    private accessJWT;
    private refreshJWT;
    constructor(addr?: string, legacyApi?: boolean);
    alter(op: Operation): Promise<Payload>;
    query(req: Request): Promise<Response>;
    mutate(mu: Mutation): Promise<Assigned>;
    commit(ctx: TxnContext): Promise<TxnContext>;
    abort(ctx: TxnContext): Promise<TxnContext>;
    health(): Promise<string>;
    login(userid?: string, password?: string, refreshJWT?: string): Promise<boolean>;
    private callAPI;
    private getURL;
}
