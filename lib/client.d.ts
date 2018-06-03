import { DgraphClientStub } from "./clientStub";
import { Txn } from "./txn";
import { LinRead, Operation, Payload } from "./types";
export declare class DgraphClient {
    private readonly clients;
    private readonly linRead;
    private debugMode;
    constructor(...clients: DgraphClientStub[]);
    alter(op: Operation): Promise<Payload>;
    newTxn(): Txn;
    setDebugMode(mode?: boolean): void;
    debug(msg: string): void;
    getLinRead(): LinRead;
    mergeLinReads(src?: LinRead | null): void;
    anyClient(): DgraphClientStub;
}
