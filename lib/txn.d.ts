import { DgraphClient } from "./client";
import { Assigned, Mutation, Response, TxnOptions } from "./types";
export declare class Txn {
    private readonly dc;
    private readonly ctx;
    private finished;
    private mutated;
    constructor(dc: DgraphClient, options?: TxnOptions);
    query(q: string, options?: {
        debug?: boolean;
    }): Promise<Response>;
    queryWithVars(q: string, vars?: {
        [k: string]: any;
    }, options?: {
        debug?: boolean;
    }): Promise<Response>;
    mutate(mu: Mutation): Promise<Assigned>;
    commit(): Promise<void>;
    discard(): Promise<void>;
    private mergeArrays;
    private mergeContext;
}
