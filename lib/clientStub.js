var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as fetch from "isomorphic-fetch";
import * as jwt from "jsonwebtoken";
import { APIError, HTTPError } from "./errors";
const AUTO_REFRESH_PREFETCH_TIME = 5000;
const ACL_TOKEN_HEADER = "X-Dgraph-AccessToken";
const ALPHA_AUTH_TOKEN_HEADER = "X-Dgraph-AuthToken";
const SLASH_API_KEY_HEADER = "X-Auth-Token";
export class DgraphClientStub {
    constructor(addr, stubConfig = {}, options = {}) {
        if (addr === undefined) {
            this.addr = "http://localhost:8080";
        }
        else {
            this.addr = addr;
        }
        this.options = options;
        this.legacyApi = !!stubConfig.legacyApi;
        this.jsonParser =
            stubConfig.jsonParser !== undefined
                ? stubConfig.jsonParser
                :
                    JSON.parse.bind(JSON);
    }
    detectApiVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            const health = yield this.getHealth();
            let version = health["version"] || health[0].version;
            if (version === undefined) {
                version = "1.0.x";
            }
            this.legacyApi = version.startsWith("1.0.");
            return version;
        });
    }
    alter(op) {
        let body;
        if (op.schema !== undefined) {
            body = op.schema;
        }
        else if (op.dropAttr !== undefined) {
            body = JSON.stringify({ drop_attr: op.dropAttr });
        }
        else if (op.dropAll) {
            body = JSON.stringify({ drop_all: true });
        }
        else {
            return Promise.reject("Invalid op argument in alter");
        }
        return this.callAPI("alter", Object.assign(Object.assign({}, this.options), { method: "POST", body }));
    }
    query(req) {
        const headers = this.options.headers !== undefined
            ? Object.assign({}, this.options.headers) : {};
        if (req.vars !== undefined) {
            if (this.legacyApi) {
                headers["X-Dgraph-Vars"] = JSON.stringify(req.vars);
            }
            else {
                headers["Content-Type"] = "application/json";
                req.query = JSON.stringify({
                    query: req.query,
                    variables: req.vars,
                });
            }
        }
        if (headers["Content-Type"] === undefined && !this.legacyApi) {
            headers["Content-Type"] = "application/graphql+-";
        }
        let url = "query";
        if (this.legacyApi) {
            if (req.startTs !== 0) {
                url += `/${req.startTs}`;
            }
            if (req.debug) {
                url += "?debug=true";
            }
        }
        else {
            const params = [];
            if (req.startTs !== 0) {
                params.push({
                    key: "startTs",
                    value: `${req.startTs}`,
                });
            }
            if (req.timeout > 0) {
                params.push({
                    key: "timeout",
                    value: `${req.timeout}s`,
                });
            }
            if (req.debug) {
                params.push({
                    key: "debug",
                    value: "true",
                });
            }
            if (req.readOnly) {
                params.push({
                    key: "ro",
                    value: "true",
                });
            }
            if (req.bestEffort) {
                params.push({
                    key: "be",
                    value: "true",
                });
            }
            if (params.length > 0) {
                url += "?";
                url += params
                    .map(({ key, value, }) => `${key}=${value}`)
                    .join("&");
            }
        }
        return this.callAPI(url, Object.assign(Object.assign({}, this.options), { method: "POST", body: req.query, headers }));
    }
    mutate(mu) {
        let body;
        let usingJSON = false;
        if (mu.setJson !== undefined || mu.deleteJson !== undefined) {
            usingJSON = true;
            const obj = {};
            if (mu.setJson !== undefined) {
                obj.set = mu.setJson;
            }
            if (mu.deleteJson !== undefined) {
                obj.delete = mu.deleteJson;
            }
            body = JSON.stringify(obj);
        }
        else if (mu.setNquads !== undefined ||
            mu.deleteNquads !== undefined) {
            body = `{
                ${mu.setNquads === undefined
                ? ""
                : `set {
                    ${mu.setNquads}
                }`}
                ${mu.deleteNquads === undefined
                ? ""
                : `delete {
                    ${mu.deleteNquads}
                }`}
            }`;
        }
        else if (mu.mutation !== undefined) {
            body = mu.mutation;
            if (mu.isJsonString !== undefined) {
                usingJSON = mu.isJsonString;
            }
            else {
                try {
                    JSON.parse(mu.mutation);
                    usingJSON = true;
                }
                catch (e) {
                    usingJSON = false;
                }
            }
        }
        else {
            return Promise.reject("Mutation has no data");
        }
        const headers = Object.assign(Object.assign({}, (this.options.headers !== undefined ? this.options.headers : {})), { "Content-Type": `application/${usingJSON ? "json" : "rdf"}` });
        if (usingJSON && this.legacyApi) {
            headers["X-Dgraph-MutationType"] = "json";
        }
        let url = "mutate";
        let nextDelim = "?";
        if (mu.startTs > 0) {
            url +=
                (!this.legacyApi ? `?startTs=` : `/`) + mu.startTs.toString();
            nextDelim = "&";
        }
        if (mu.commitNow) {
            if (!this.legacyApi) {
                url += `${nextDelim}commitNow=true`;
            }
            else {
                headers["X-Dgraph-CommitNow"] = "true";
            }
        }
        return this.callAPI(url, Object.assign(Object.assign({}, this.options), { method: "POST", body,
            headers }));
    }
    commit(ctx) {
        let body;
        if (ctx.keys === undefined) {
            body = "[]";
        }
        else {
            body = JSON.stringify(ctx.keys);
        }
        const url = !this.legacyApi
            ? `commit?startTs=${ctx.start_ts}`
            : `commit/${ctx.start_ts}`;
        return this.callAPI(url, Object.assign(Object.assign({}, this.options), { method: "POST", body }));
    }
    abort(ctx) {
        const url = !this.legacyApi
            ? `commit?startTs=${ctx.start_ts}&abort=true`
            : `abort/${ctx.start_ts}`;
        return this.callAPI(url, Object.assign(Object.assign({}, this.options), { method: "POST" }));
    }
    login(userid, password, refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.legacyApi) {
                throw new Error("Pre v1.1 clients do not support Login methods");
            }
            const body = {};
            if (userid === undefined &&
                refreshToken === undefined &&
                this.refreshToken === undefined) {
                throw new Error("Cannot find login details: neither userid/password nor refresh token are specified");
            }
            if (userid === undefined) {
                body.refresh_token =
                    refreshToken !== undefined ? refreshToken : this.refreshToken;
            }
            else {
                body.userid = userid;
                body.password = password;
            }
            const res = yield this.callAPI("login", Object.assign(Object.assign({}, this.options), { method: "POST", body: JSON.stringify(body) }));
            this.accessToken = res.data.accessJWT;
            this.refreshToken = res.data.refreshJWT;
            this.maybeStartRefreshTimer(this.accessToken);
            return true;
        });
    }
    logout() {
        this.accessToken = undefined;
        this.refreshToken = undefined;
    }
    getAuthTokens() {
        return {
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
        };
    }
    fetchUiKeywords() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.callAPI("ui/keywords", this.options);
        });
    }
    getHealth(all = false) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.callAPI(`health${all ? "?all" : ""}`, Object.assign(Object.assign({}, this.options), { acceptRawText: true }));
        });
    }
    getState() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.callAPI("state", this.options);
        });
    }
    setAutoRefresh(val) {
        if (!val) {
            this.cancelRefreshTimer();
        }
        this.autoRefresh = val;
        this.maybeStartRefreshTimer(this.accessToken);
    }
    setAlphaAuthToken(authToken) {
        this.options.headers === undefined && (this.options.headers = {});
        this.options.headers[ALPHA_AUTH_TOKEN_HEADER] = authToken;
    }
    setSlashApiKey(apiKey) {
        this.options.headers[SLASH_API_KEY_HEADER] = apiKey;
    }
    cancelRefreshTimer() {
        if (this.autoRefreshTimer !== undefined) {
            clearTimeout(this.autoRefreshTimer);
            this.autoRefreshTimer = undefined;
        }
    }
    maybeStartRefreshTimer(accessToken) {
        if (accessToken === undefined || !this.autoRefresh) {
            return;
        }
        this.cancelRefreshTimer();
        const timeToWait = Math.max(2000, jwt.decode(accessToken).exp * 1000 -
            Date.now() -
            AUTO_REFRESH_PREFETCH_TIME);
        this.autoRefreshTimer = (setTimeout(() => (this.refreshToken !== undefined ? this.login() : 0), timeToWait));
    }
    callAPI(path, config) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = this.getURL(path);
            if (this.accessToken !== undefined && path !== "login") {
                config.headers = config.headers !== undefined ? config.headers : {};
                config.headers[ACL_TOKEN_HEADER] = this.accessToken;
            }
            const response = yield fetch(url, config);
            if (response.status >= 300 || response.status < 200) {
                throw new HTTPError(response);
            }
            let json;
            const responseText = yield response.text();
            try {
                json = this.jsonParser(responseText);
            }
            catch (e) {
                if (config.acceptRawText) {
                    return responseText;
                }
                const err = (new Error("Response is not JSON"));
                err.responseText = responseText;
                throw err;
            }
            const errors = json.errors;
            if (errors !== undefined) {
                throw new APIError(url, errors);
            }
            return json;
        });
    }
    getURL(path) {
        return `${this.addr}${this.addr.endsWith("/") ? "" : "/"}${path}`;
    }
}
