import { DgraphClientStub } from "./clientStub";
import { Txn } from "./txn";
import { Operation, Payload, Response, TxnOptions, UiKeywords } from "./types";
export declare class DgraphClient {
    private readonly clients;
    private debugMode;
    private queryTimeout;
    constructor(...clients: DgraphClientStub[]);
    setQueryTimeout(timeout: number): DgraphClient;
    getQueryTimeout(): number;
    alter(op: Operation): Promise<Payload>;
    setAlphaAuthToken(authToken: string): void;
    setSlashApiKey(apiKey: string): void;
    setCloudApiKey(apiKey: string): void;
    login(userid: string, password: string): Promise<boolean>;
    loginIntoNamespace(userid: string, password: string, namespace?: number): Promise<boolean>;
    logout(): void;
    newTxn(options?: TxnOptions): Txn;
    setDebugMode(mode?: boolean): void;
    fetchUiKeywords(): Promise<UiKeywords>;
    getHealth(all?: boolean): Promise<Response>;
    getState(): Promise<Response>;
    debug(msg: string): void;
    anyClient(): DgraphClientStub;
}
