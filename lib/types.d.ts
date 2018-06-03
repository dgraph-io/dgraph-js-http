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
    startTs?: number | null;
    linRead?: LinRead | null;
}
export interface Response {
    data: {};
    extensions: Extensions;
}
export interface Mutation {
    setJson?: object | null;
    deleteJson?: object | null;
    setNquads?: string | null;
    deleteNquads?: string | null;
    startTs?: number | null;
    commitNow?: boolean | null;
}
export interface Assigned {
    data: AssignedData;
    extensions: Extensions;
}
export interface AssignedData {
    uids: {
        [k: string]: number;
    };
}
export interface Extensions {
    server_latency: Latency;
    txn: TxnContext;
}
export interface LinRead {
    ids: {
        [k: string]: number;
    };
}
export interface TxnContext {
    start_ts: number;
    commit_ts?: number | null;
    aborted?: boolean | null;
    keys?: string[] | null;
    lin_read: LinRead;
}
export interface Latency {
    parsing_ns?: number | null;
    processing_ns?: number | null;
    encoding_ns?: number | null;
}
