import "isomorphic-fetch"; // tslint:disable-line no-import-side-effect

import { APIError, APIResultError } from "./errors";
import {
    Assigned,
    Mutation,
    Operation,
    Payload,
    Request,
    Response,
    TxnContext,
} from "./types";

declare const fetch: any; // tslint:disable-line no-any

/**
 * Stub is a stub/client connecting to a single dgraph server instance.
 */
export class DgraphClientStub {
    private readonly addr: string;
    constructor(addr?: string | null) {
        if (addr === undefined) {
            this.addr = "http://localhost:8080"; // tslint:disable-line no-http-string
        } else {
            this.addr = addr;
        }
    }

    public alter(op: Operation): Promise<Payload> {
        let body: string;
        if (op.schema !== undefined) {
            body = op.schema;
        } else if (op.dropAttr !== undefined) {
            body = JSON.stringify({ drop_attr: op.dropAttr });
        } else if (op.dropAll) {
            body = JSON.stringify({ drop_all: true });
        } else {
            return Promise.reject("Invalid op argument in alter");
        }

        return this.callAPI("alter", {
            method: "POST",
            body,
        });
    }

    public query(req: Request): Promise<Response> {
        const headers: { [k: string]: string } = {};
        if (req.vars !== undefined) {
            headers["X-Dgraph-Vars"] = JSON.stringify(req.vars);
        }

        return this.callAPI(`query${req.startTs === 0 ? "" : `/${req.startTs}`}`, {
            method: "POST",
            body: req.query,
            headers,
        });
    }

    public mutate(mu: Mutation): Promise<Assigned> {
        let body: string;
        let usingJSON: boolean = false;
        if (mu.setJson !== undefined || mu.deleteJson !== undefined) {
            usingJSON = true;
            const obj: { [k: string]: object } = {};
            if (mu.setJson !== undefined) {
                obj.set = mu.setJson;
            }
            if (mu.deleteJson !== undefined) {
                obj.delete = mu.deleteJson;
            }

            body = JSON.stringify(obj);
        } else if (mu.setNquads !== undefined || mu.deleteNquads !== undefined) {
            body = `{
                ${mu.setNquads === undefined ? "" : `set {
                    ${mu.setNquads}
                }`}
                ${mu.deleteNquads === undefined ? "" : `delete {
                    ${mu.deleteNquads}
                }`}
            }`;
        } else {
            return Promise.reject("Mutation mu argument in alter");
        }

        const headers: { [k: string]: string } = {};
        if (usingJSON) {
            headers["X-Dgraph-MutationType"] = "json";
        }
        if (mu.commitNow) {
            headers["X-Dgraph-CommitNow"] = "true";
        }

        return this.callAPI(`mutate${mu.startTs === 0 ? "" : `/${mu.startTs}`}`, {
            method: "POST",
            body,
            headers,
        });
    }

    public commit(ctx: TxnContext): Promise<TxnContext> {
        let body: string;
        if (ctx.keys === undefined) {
            body = "[]";
        } else {
            body = JSON.stringify(ctx.keys);
        }

        return this.callAPI(`commit/${ctx.start_ts}`, {
            method: "POST",
            body,
        });
    }

    public abort(ctx: TxnContext): Promise<TxnContext> {
        return this.callAPI(`abort/${ctx.start_ts}`, {
            method: "POST",
        });
    }

    public health(): Promise<string> {
        return fetch(this.getURL("health"), { // tslint:disable-line no-unsafe-any
            method: "GET",
        })
            .then((response: { status: number; text(): string }) => {
                if (response.status >= 300 || response.status < 200) {
                    throw new Error(`Invalid status code = ${response.status}`);
                }
                return response.text();
            });
    }

    private callAPI<T>(path: string, config: {}): Promise<T> {
        const url = this.getURL(path);
        return fetch(url, config) // tslint:disable-line no-unsafe-any
            .then((response: { status: number; json(): T }) => {
                if (response.status >= 300 || response.status < 200) {
                    throw new Error(`Invalid status code = ${response.status}`);
                }
                return response.json();
            })
            .then((json: T) => {
                const errors = (<{ errors: APIResultError[] }><any>json).errors; // tslint:disable-line no-any
                if (errors !== undefined) {
                    throw new APIError(url, errors);
                }

                return json;
            });
    }

    private getURL(path: string): string {
        return `${this.addr}${this.addr.endsWith("/") ? "" : "/"}${path}`;
    }
}
