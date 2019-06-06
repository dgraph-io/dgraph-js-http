import { DgraphClientStub } from "./clientStub";
import { Txn } from "./txn";
import { Operation, Payload } from "./types";
export declare class DgraphClient {
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
