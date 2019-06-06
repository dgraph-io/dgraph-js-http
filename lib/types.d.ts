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
