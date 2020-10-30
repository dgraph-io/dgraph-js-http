var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ERR_ABORTED, ERR_BEST_EFFORT_REQUIRED_READ_ONLY, ERR_FINISHED } from "./errors";
import { isAbortedError, isConflictError, stringifyMessage, } from "./util";
export class Txn {
    constructor(dc, options = {}) {
        this.finished = false;
        this.mutated = false;
        this.dc = dc;
        if (options.bestEffort && !options.readOnly) {
            this.dc.debug("Client attempted to query using best-effort without setting the transaction to read-only");
            throw ERR_BEST_EFFORT_REQUIRED_READ_ONLY;
        }
        this.ctx = {
            start_ts: 0,
            keys: [],
            preds: [],
            readOnly: options.readOnly,
            bestEffort: options.bestEffort,
        };
    }
    query(q, options) {
        return this.queryWithVars(q, undefined, options);
    }
    queryWithVars(q, vars, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.finished) {
                this.dc.debug(`Query request (ERR_FINISHED):\nquery = ${q}\nvars = ${vars}`);
                throw ERR_FINISHED;
            }
            const req = {
                query: q,
                startTs: this.ctx.start_ts,
                timeout: this.dc.getQueryTimeout(),
                debug: options.debug,
                readOnly: this.ctx.readOnly,
                bestEffort: this.ctx.bestEffort,
            };
            if (vars !== undefined) {
                const varsObj = {};
                Object.keys(vars).forEach((key) => {
                    const value = vars[key];
                    if (typeof value === "string" || value instanceof String) {
                        varsObj[key] = value.toString();
                    }
                });
                req.vars = varsObj;
            }
            this.dc.debug(`Query request:\n${stringifyMessage(req)}`);
            const c = this.dc.anyClient();
            const res = yield c.query(req);
            this.mergeContext(res.extensions.txn);
            this.dc.debug(`Query response:\n${stringifyMessage(res)}`);
            return res;
        });
    }
    mutate(mu) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.finished) {
                this.dc.debug(`Mutate request (ERR_FINISHED):\nmutation = ${stringifyMessage(mu)}`);
                throw ERR_FINISHED;
            }
            this.mutated = true;
            mu.startTs = this.ctx.start_ts;
            this.dc.debug(`Mutate request:\n${stringifyMessage(mu)}`);
            const c = this.dc.anyClient();
            try {
                const ag = yield c.mutate(mu);
                if (mu.commitNow) {
                    this.finished = true;
                }
                this.mergeContext(ag.extensions.txn);
                this.dc.debug(`Mutate response:\n${stringifyMessage(ag)}`);
                return ag;
            }
            catch (e) {
                try {
                    yield this.discard();
                }
                catch (e) {
                }
                throw (isAbortedError(e) || isConflictError(e)) ? ERR_ABORTED : e;
            }
        });
    }
    commit() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.finished) {
                throw ERR_FINISHED;
            }
            this.finished = true;
            if (!this.mutated) {
                return;
            }
            const c = this.dc.anyClient();
            try {
                yield c.commit(this.ctx);
            }
            catch (e) {
                throw isAbortedError(e) ? ERR_ABORTED : e;
            }
        });
    }
    discard() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.finished) {
                return;
            }
            this.finished = true;
            if (!this.mutated) {
                return;
            }
            this.ctx.aborted = true;
            const c = this.dc.anyClient();
            yield c.abort(this.ctx);
        });
    }
    mergeArrays(a, b) {
        const res = a.slice();
        res.push(...b);
        res.sort();
        return res.filter((item, idx, arr) => idx === 0 || arr[idx - 1] !== item);
    }
    mergeContext(src) {
        if (src === undefined) {
            return;
        }
        if (this.ctx.start_ts === 0) {
            this.ctx.start_ts = src.start_ts;
        }
        else if (this.ctx.start_ts !== src.start_ts) {
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
