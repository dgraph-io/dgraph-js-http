declare module "errors" {
    export const ERR_NO_CLIENTS: Error;
    export const ERR_FINISHED: Error;
    export const ERR_ABORTED: Error;
    export class CustomError extends Error {
        readonly name: string;
        constructor(message?: string);
    }
    export interface APIResultError {
        code: string;
        message: string;
    }
    export class APIError extends CustomError {
        readonly url: string;
        readonly errors: APIResultError[];
        constructor(url: string, errors: APIResultError[]);
    }
}
declare module "types" {
    export interface Operation {
        schema?: string | null;
        dropAttr?: string | null;
        dropAll?: boolean | null;
    }
    export interface Payload {
        data: {};
    }
    export interface Request {
        query: string;
        vars?: {
            [k: string]: string;
        } | null;
        startTs?: number;
    }
    export interface Response {
        data: {};
        extensions: Extensions;
    }
    export interface LoginResponse {
        data: {
            accessJWT: string;
            refreshJWT: string;
        };
    }
    export interface Mutation {
        setJson?: object | null;
        deleteJson?: object | null;
        setNquads?: string | null;
        deleteNquads?: string | null;
        startTs?: number;
        commitNow?: boolean | null;
    }
    export interface Assigned {
        data: AssignedData;
        extensions: Extensions;
    }
    export interface AssignedData {
        uids: {
            [k: string]: string;
        };
    }
    export interface Extensions {
        server_latency: Latency;
        txn: TxnContext;
    }
    export interface TxnContext {
        start_ts: number;
        aborted?: boolean | null;
        keys?: string[] | null;
        preds?: string[] | null;
    }
    export interface Latency {
        parsing_ns?: number | null;
        processing_ns?: number | null;
        encoding_ns?: number | null;
    }
}
declare module "clientStub" {
    import "isomorphic-fetch";
    import { Assigned, Mutation, Operation, Payload, Request, Response, TxnContext } from "types";
    export class DgraphClientStub {
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
}
declare module "util" {
    export function isAbortedError(error: any): boolean;
    export function isConflictError(error: any): boolean;
    export function stringifyMessage(msg: object): string;
}
declare module "txn" {
    import { DgraphClient } from "client";
    import { Assigned, Mutation, Response } from "types";
    export class Txn {
        private readonly dc;
        private readonly ctx;
        private finished;
        private mutated;
        constructor(dc: DgraphClient);
        query(q: string): Promise<Response>;
        queryWithVars(q: string, vars?: {
            [k: string]: any;
        }): Promise<Response>;
        mutate(mu: Mutation): Promise<Assigned>;
        commit(): Promise<void>;
        discard(): Promise<void>;
        private mergeArrays;
        private mergeContext;
    }
}
declare module "client" {
    import { DgraphClientStub } from "clientStub";
    import { Txn } from "txn";
    import { Operation, Payload } from "types";
    export class DgraphClient {
        private readonly clients;
        private debugMode;
        constructor(...clients: DgraphClientStub[]);
        alter(op: Operation): Promise<Payload>;
        login(userid: string, password: string): Promise<boolean>;
        newTxn(): Txn;
        setDebugMode(mode?: boolean): void;
        debug(msg: string): void;
        anyClient(): DgraphClientStub;
    }
}
declare module "index" {
    export * from "types";
    export * from "clientStub";
    export * from "client";
    export * from "txn";
    export * from "errors";
}
