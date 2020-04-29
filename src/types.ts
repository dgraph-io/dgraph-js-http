import * as https from "https";

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
    vars?: { [k: string]: string } | null;
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
  keywords: { "type": string; name: string }[];
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
    // Raw mutation text to send;
    mutation?: string | null;
    // Set to true if `mutation` field (above) contains a JSON mutation.
    isJsonString?: boolean;
}

export interface Assigned {
    data: AssignedData;
    extensions: Extensions;
}

export interface AssignedData {
    uids: { [k: string]: string };
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
    readOnly: boolean;
    bestEffort: boolean;
}

export interface Latency {
    parsing_ns?: number | null;
    processing_ns?: number | null;
    encoding_ns?: number | null;
}

export interface TxnOptions {
    readOnly?: boolean;
    bestEffort?: boolean;
}

export interface Options extends https.RequestOptions {
    agent?: https.Agent;
}

export interface Config extends Options {
    body?: string;
}
