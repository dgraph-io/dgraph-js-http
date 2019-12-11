import { DgraphClient } from "./client";
import { ERR_ABORTED, ERR_FINISHED } from "./errors";
import { Assigned, Mutation, Request, Response, TxnContext } from "./types";
import {
    isAbortedError,
    isConflictError,
    stringifyMessage,
} from "./util";

/**
 * Txn is a single atomic transaction.
 *
 * A transaction lifecycle is as follows:
 *
 * 1. Created using Client.newTxn.
 *
 * 2. Various query and mutate calls made.
 *
 * 3. commit or discard used. If any mutations have been made, It's important
 * that at least one of these methods is called to clean up resources. discard
 * is a no-op if commit has already been called, so it's safe to call discard
 * after calling commit.
 */
export class Txn {
    private readonly dc: DgraphClient;
    private readonly ctx: TxnContext;
    private finished: boolean = false;
    private mutated: boolean = false;

    constructor(dc: DgraphClient) {
        this.dc = dc;
        this.ctx = {
          start_ts: 0,
          keys: [],
          preds: [],
        };
    }

    /**
     * query sends a query to one of the connected Dgraph instances. If no mutations
     * need to be made in the same transaction, it's convenient to chain the method,
     * e.g. client.newTxn().query("...").
     */
    public query(q: string, options?: { debug?: boolean, readOnly?: boolean, bestEffort?: boolean }): Promise<Response> {
        return this.queryWithVars(q, undefined, options);
    }

    /**
     * queryWithVars is like query, but allows a variable map to be used. This can
     * provide safety against injection attacks.
     */
    public async queryWithVars(
        q: string,
        vars?: { [k: string]: any }, // tslint:disable-line no-any
        options: { debug?: boolean, readOnly?: boolean, bestEffort?: boolean } = {},
    ): Promise<Response> {
        if (this.finished) {
            this.dc.debug(`Query request (ERR_FINISHED):\nquery = ${q}\nvars = ${vars}`);
            throw ERR_FINISHED;
        }

        if (options.bestEffort && !options.readOnly) {
            this.dc.debug('Best effort only works with read-only queries.');
            throw ERR_FINISHED;
        }

        const req: Request = {
            query: q,
            startTs: this.ctx.start_ts,
            timeout: this.dc.getQueryTimeout(),
            debug: options.debug,
            readOnly: options.readOnly,
            bestEffort: options.bestEffort
        };
        if (vars !== undefined) {
            const varsObj: { [k: string]: string } = {};
            Object.keys(vars).forEach((key: string) => {
                const value = vars[key];
                if (typeof value === "string" || value instanceof String) {
                    varsObj[key] = value.toString();
                }
            });

            req.vars = varsObj;
        }

        this.dc.debug(`Query request:\n${stringifyMessage(req)}`);

        const c = this.dc.anyClient();
        const res = await c.query(req);
        this.mergeContext(res.extensions.txn);
        this.dc.debug(`Query response:\n${stringifyMessage(res)}`);

        return res;
    }

    /**
     * mutate allows data stored on Dgraph instances to be modified. The fields in
     * Mutation come in pairs, set and delete. Mutations can either be encoded as
     * JSON or as RDFs.
     *
     * If commitNow is set, then this call will result in the transaction being
     * committed. In this case, an explicit call to commit doesn't need to
     * subsequently be made.
     *
     * If the mutation fails, then the transaction is discarded and all future
     * operations on it will fail.
     */
    public async mutate(mu: Mutation): Promise<Assigned> {
        if (this.finished) {
            this.dc.debug(`Mutate request (ERR_FINISHED):\nmutation = ${stringifyMessage(mu)}`);
            throw ERR_FINISHED;
        }

        this.mutated = true;
        mu.startTs = this.ctx.start_ts;
        this.dc.debug(`Mutate request:\n${stringifyMessage(mu)}`);

        const c = this.dc.anyClient();
        try {
            const ag = await c.mutate(mu);
            if (mu.commitNow) {
                this.finished = true;
            }

            this.mergeContext(ag.extensions.txn);
            this.dc.debug(`Mutate response:\n${stringifyMessage(ag)}`);

            return ag;
        } catch (e) {
            // Since a mutation error occurred, the txn should no longer be used (some
            // mutations could have applied but not others, but we don't know which ones).
            // Discarding the transaction enforces that the user cannot use the txn further.
            try {
                await this.discard();
            } catch (e) {
                // Ignore error - user should see the original error.
            }

            // Transaction could be aborted(status.ABORTED) if commitNow was true, or server
            // could send a message that this mutation conflicts(status.FAILED_PRECONDITION)
            // with another transaction.
            throw (isAbortedError(e) || isConflictError(e)) ? ERR_ABORTED : e;
        }
    }

    /**
     * commit commits any mutations that have been made in the transaction. Once
     * commit has been called, the lifespan of the transaction is complete.
     *
     * Errors could be thrown for various reasons. Notably, ERR_ABORTED could be
     * thrown if transactions that modify the same data are being run concurrently.
     * It's up to the user to decide if they wish to retry. In this case, the user
     * should create a new transaction.
     */
    public async commit(): Promise<void> {
        if (this.finished) {
            throw ERR_FINISHED;
        }

        this.finished = true;
        if (!this.mutated) {
            return;
        }

        const c = this.dc.anyClient();
        try {
            await c.commit(this.ctx);
        } catch (e) {
            throw isAbortedError(e) ? ERR_ABORTED : e;
        }
    }

    /**
     * discard cleans up the resources associated with an uncommitted transaction
     * that contains mutations. It is a no-op on transactions that have already been
     * committed or don't contain mutations. Therefore it is safe (and recommended)
     * to call it in a finally block.
     *
     * In some cases, the transaction can't be discarded, e.g. the grpc connection
     * is unavailable. In these cases, the server will eventually do the transaction
     * clean up.
     */
    public async discard(): Promise<void> {
        if (this.finished) {
            return;
        }

        this.finished = true;
        if (!this.mutated) {
            return;
        }

        this.ctx.aborted = true;
        const c = this.dc.anyClient();
        await c.abort(this.ctx);
    }

    private mergeArrays(a: string[], b: string[]) {
        const res = a.slice();
        res.push(...b);
        res.sort();
        // Filter unique in a sorted array.
        return res.filter(
            (item: string, idx: number, arr: string[]) => idx === 0 || arr[idx - 1] !== item);
    }

    private mergeContext(src?: TxnContext): void {
        if (src === undefined) {
            // This condition will be true only if the server doesn't return a txn context after a query or mutation.
            return;
        }

        if (this.ctx.start_ts === 0) {
            this.ctx.start_ts = src.start_ts;
        } else if (this.ctx.start_ts !== src.start_ts) {
            // This condition should never be true.
            throw new Error("StartTs mismatch");
        }

        if (src.keys !== undefined) {
            this.ctx.keys = this.mergeArrays(this.ctx.keys, src.keys);
        }
        if (src.preds !== undefined) {
            this.ctx.preds = this.mergeArrays(this.ctx.preds, src.preds);
        }
    }
}
