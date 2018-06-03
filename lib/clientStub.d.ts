import "isomorphic-fetch";
import { Assigned, Mutation, Operation, Payload, Request, Response, TxnContext } from "./types";
export declare class DgraphClientStub {
    private addr;
    constructor(addr?: string | null);
    alter(op: Operation): Promise<Payload>;
    query(req: Request): Promise<Response>;
    mutate(mu: Mutation): Promise<Assigned>;
    commit(ctx: TxnContext): Promise<TxnContext>;
    abort(ctx: TxnContext): Promise<TxnContext>;
    health(): Promise<string>;
    private callAPI<T>(path, config);
    private getURL(path);
}
