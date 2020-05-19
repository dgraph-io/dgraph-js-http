/// <reference types="node" />
import * as https from "https";
export interface Operation {
    schema?: string;
    dropAttr?: string;
    dropAll?: boolean;
}
export interface Payload {
    data: {};
}
export interface Request {
    query: string;
    vars?: {
        [k: string]: string;
    };
    startTs?: number;
    timeout?: number;
    debug?: boolean;
    readOnly?: boolean;
    bestEffort?: boolean;
}
export interface Response {
    data: {};
    extensions: Extensions;
}
export interface UiKeywords {
    keywords: {
        type: string;
        name: string;
    }[];
}
export interface LoginResponse {
    data: {
        accessJWT: string;
        refreshJWT: string;
    };
}
export interface Mutation {
    setJson?: object;
    deleteJson?: object;
    setNquads?: string;
    deleteNquads?: string;
    startTs?: number;
    commitNow?: boolean;
    mutation?: string;
    isJsonString?: boolean;
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
    aborted?: boolean;
    keys?: string[];
    preds?: string[];
    readOnly: boolean;
    bestEffort: boolean;
}
export interface Latency {
    parsing_ns?: number;
    processing_ns?: number;
    encoding_ns?: number;
}
export interface TxnOptions {
    readOnly?: boolean;
    bestEffort?: boolean;
}
export interface ErrorNonJson extends Error {
    responseText?: string;
}
export interface Options extends https.RequestOptions {
    agent?: https.Agent;
}
export interface Config extends Options {
    acceptRawText?: boolean;
    body?: string;
}
