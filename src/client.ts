import { DgraphClientStub } from "./clientStub";
import { ERR_NO_CLIENTS } from "./errors";
import { Txn } from "./txn";
import { Operation, Payload, Response, TxnOptions, UiKeywords } from "./types";
import { stringifyMessage } from "./util";

/**
 * Client is a transaction aware client to a set of Dgraph server instances.
 */
export class DgraphClient {
    private readonly clients: DgraphClientStub[];
    private debugMode: boolean = false;
    private queryTimeout: number = 600;

    /**
     * Creates a new Client for interacting with the Dgraph store.
     *
     * The client can be backed by multiple connections (to the same server, or
     * multiple servers in a cluster).
     */
    public constructor(...clients: DgraphClientStub[]) {
        if (clients.length === 0) {
            throw ERR_NO_CLIENTS;
        }

        this.clients = clients;
    }

    /**
     * Set timeout applied to all queries made via this client.
     */
    public setQueryTimeout(timeout: number): DgraphClient {
        this.queryTimeout = timeout;
        return this;
    }

    public getQueryTimeout(): number {
        return this.queryTimeout;
    }

    /**
     * By setting various fields of api.Operation, alter can be used to do the
     * following:
     *
     * 1. Modify the schema.
     * 2. Drop a predicate.
     * 3. Drop the database.
     */
    public async alter(op: Operation): Promise<Payload> {
        this.debug(`Alter request:\n${stringifyMessage(op)}`);

        const c = this.anyClient();
        return c.alter(op);
    }

    public setAlphaAuthToken(authToken: string): void {
        this.clients.forEach((c: DgraphClientStub) =>
            c.setAlphaAuthToken(authToken),
        );
    }

    /**
     * @deprecated since v21.3 and will be removed in v21.07 release.
     * Please use {@link setCloudApiKey} instead.
     */
    public setSlashApiKey(apiKey: string): void {
        this.setCloudApiKey(apiKey);
    }

    public setCloudApiKey(apiKey: string): void {
        this.clients.forEach((c: DgraphClientStub) =>
            c.setCloudApiKey(apiKey),
        );
    }

    public async login(userid: string, password: string): Promise<boolean> {
        this.debug(`Login request:\nuserid: ${userid}`);

        const c = this.anyClient();
        return c.login(userid, password); // tslint:disable-line no-unsafe-any
    }

    /**
     * loginIntoNamespace obtains access tokens from Dgraph Server for the particular userid & namespace
     */
    public async loginIntoNamespace(userid: string, password: string, namespace?: number): Promise<boolean> {
        this.debug(`Login request:\nuserid: ${userid}`);

        const c = this.anyClient();
        return c.loginIntoNamespace(userid, password, namespace); // eslint:disable-line no-unsafe-any
    }

    /**
     * logout - forget all access tokens.
     */
    public logout(): void {
        this.debug("Logout");
        this.clients.forEach((c: DgraphClientStub) => c.logout());
    }

    /**
     * newTxn creates a new transaction.
     */
    public newTxn(options?: TxnOptions): Txn {
        return new Txn(this, options);
    }

    /**
     * setDebugMode switches on/off the debug mode which prints helpful debug messages
     * while performing alters, queries and mutations.
     */
    public setDebugMode(mode: boolean = true): void {
        this.debugMode = mode;
    }

    public fetchUiKeywords(): Promise<UiKeywords> {
        return this.anyClient().fetchUiKeywords();
    }

    /**
     * getHealth gets client or cluster health
     */
    public async getHealth(all: boolean = true): Promise<Response> {
        return this.anyClient().getHealth(all);
    }

    /**
     * getState gets cluster state
     */
    public async getState(): Promise<Response> {
        return this.anyClient().getState();
    }

    /**
     * debug prints a message on the console if debug mode is switched on.
     */
    public debug(msg: string): void {
        if (this.debugMode) {
            // eslint-disable-next-line no-console
            console.log(msg);
        }
    }

    public anyClient(): DgraphClientStub {
        return this.clients[Math.floor(Math.random() * this.clients.length)];
    }
}
