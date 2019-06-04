import "isomorphic-fetch"; // tslint:disable-line no-import-side-effect

import { APIError, APIResultError } from "./errors";
import {
    Assigned,
    LoginResponse,
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
    private readonly legacyApi: boolean;
    private accessJWT: string;
    private refreshJWT: string;

    constructor(addr?: string, legacyApi?: boolean) {
        if (addr === undefined) {
            this.addr = "http://localhost:8080"; // tslint:disable-line no-http-string
        } else {
            this.addr = addr;
        }
        this.legacyApi = !!legacyApi;
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
          if (this.legacyApi) {
              headers["X-Dgraph-Vars"] = JSON.stringify(req.vars);
          } else {
            headers["Content-Type"] = "application/json";
            req.query = JSON.stringify({
                query: req.query,
                variables: req.vars,
            });
          }
        }
        if (headers["Content-Type"] === undefined) {
            headers["Content-Type"] = "application/graphqlpm";
        }

        const startTs = req.startTs === 0
            ? ""
            : (!this.legacyApi ? `?startTs=${req.startTs}` : `/${req.startTs}`);
        return this.callAPI(`query${startTs}`, {
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

        const headers: { [k: string]: string } = {
          "Content-Type": `application/${usingJSON ? "json" : "rdf"}`,
        };

        let url = "mutate";
        let nextDelim = "?";
        if (mu.startTs > 0) {
            url += (!this.legacyApi ? `?startTs=` : `/`) + mu.startTs.toString();
            nextDelim = "&";
        }

        if (mu.commitNow) {
            if (!this.legacyApi) {
              url += `${nextDelim}commitNow=true`;
            } else {
                headers["X-Dgraph-CommitNow"] = "true";
            }
        }

        return this.callAPI(url, {
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

        const url = !this.legacyApi
            ? `commit?startTs=${ctx.start_ts}`
            : `commit/${ctx.start_ts}`;

        return this.callAPI(url, {
            method: "POST",
            body,
        });
    }

    public abort(ctx: TxnContext): Promise<TxnContext> {
        const url = !this.legacyApi
            ? `commit?startTs=${ctx.start_ts}&abort=true`
            : `/abort/${ctx.start_ts}`;

        return this.callAPI(url, { method: "POST" });
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

    public async login(userid?: string, password?: string, refreshJWT?: string): Promise<boolean> {
      if (this.legacyApi) {
        throw new Error("Pre v1.1 clients do not support Login methods");
      }

      const body: { [k: string]: string } = {};
      if (userid === undefined && this.refreshJWT === undefined) {
        throw new Error("Cannot find login details: neither userid/password nor refresh token are specified");
      }
      if (userid === undefined) {
        body.refresh_token = refreshJWT !== undefined ? refreshJWT : this.refreshJWT;
      } else {
        body.userid = userid;
        body.password = password;
      }

      const res: LoginResponse = await this.callAPI("login", {
        method: "POST",
        body: JSON.stringify(body),
      });
      this.accessJWT = res.data.accessJWT;
      this.refreshJWT = res.data.refreshJWT;
      return true;
    }

    private async callAPI<T>(path: string, config: { method?: string; body?: string; headers?: { [k: string]: string } }): Promise<T> {
        const url = this.getURL(path);
        if (this.accessJWT !== undefined) {
          config.headers = config.headers !== undefined ? config.headers : {};
          config.headers["X-Dgraph-AccessToken"] = this.accessJWT;
        }

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
