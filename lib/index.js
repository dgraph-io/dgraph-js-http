var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
define("errors", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ERR_NO_CLIENTS = new Error("No clients provided in DgraphClient constructor");
    exports.ERR_FINISHED = new Error("Transaction has already been committed or discarded");
    exports.ERR_ABORTED = new Error("Transaction has been aborted. Please retry");
    var CustomError = (function (_super) {
        __extends(CustomError, _super);
        function CustomError(message) {
            var _newTarget = this.constructor;
            var _this = _super.call(this, message) || this;
            _this.name = _newTarget.name;
            var setPrototypeOf = Object.setPrototypeOf;
            setPrototypeOf !== undefined
                ? setPrototypeOf(_this, _newTarget.prototype)
                : (_this.__proto__ = _newTarget.prototype);
            var captureStackTrace = Error.captureStackTrace;
            if (captureStackTrace !== undefined) {
                captureStackTrace(_this, _this.constructor);
            }
            return _this;
        }
        return CustomError;
    }(Error));
    exports.CustomError = CustomError;
    var APIError = (function (_super) {
        __extends(APIError, _super);
        function APIError(url, errors) {
            var _this = _super.call(this, errors.length > 0 ? errors[0].message : "API returned errors") || this;
            _this.url = url;
            _this.errors = errors;
            return _this;
        }
        return APIError;
    }(CustomError));
    exports.APIError = APIError;
});
define("types", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("clientStub", ["require", "exports", "errors", "isomorphic-fetch"], function (require, exports, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var DgraphClientStub = (function () {
        function DgraphClientStub(addr, legacyApi) {
            if (addr === undefined) {
                this.addr = "http://localhost:8080";
            }
            else {
                this.addr = addr;
            }
            this.legacyApi = !!legacyApi;
        }
        DgraphClientStub.prototype.alter = function (op) {
            var body;
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
            return this.callAPI("alter", {
                method: "POST",
                body: body,
            });
        };
        DgraphClientStub.prototype.query = function (req) {
            var headers = {};
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
            if (headers["Content-Type"] === undefined) {
                headers["Content-Type"] = "application/graphqlpm";
            }
            var startTs = req.startTs === 0
                ? ""
                : (!this.legacyApi ? "?startTs=" + req.startTs : "/" + req.startTs);
            return this.callAPI("query" + startTs, {
                method: "POST",
                body: req.query,
                headers: headers,
            });
        };
        DgraphClientStub.prototype.mutate = function (mu) {
            var body;
            var usingJSON = false;
            if (mu.setJson !== undefined || mu.deleteJson !== undefined) {
                usingJSON = true;
                var obj = {};
                if (mu.setJson !== undefined) {
                    obj.set = mu.setJson;
                }
                if (mu.deleteJson !== undefined) {
                    obj.delete = mu.deleteJson;
                }
                body = JSON.stringify(obj);
            }
            else if (mu.setNquads !== undefined || mu.deleteNquads !== undefined) {
                body = "{\n                " + (mu.setNquads === undefined ? "" : "set {\n                    " + mu.setNquads + "\n                }") + "\n                " + (mu.deleteNquads === undefined ? "" : "delete {\n                    " + mu.deleteNquads + "\n                }") + "\n            }";
            }
            else {
                return Promise.reject("Mutation has no data");
            }
            var headers = {
                "Content-Type": "application/" + (usingJSON ? "json" : "rdf"),
            };
            if (usingJSON && this.legacyApi) {
                headers["X-Dgraph-MutationType"] = "json";
            }
            var url = "mutate";
            var nextDelim = "?";
            if (mu.startTs > 0) {
                url += (!this.legacyApi ? "?startTs=" : "/") + mu.startTs.toString();
                nextDelim = "&";
            }
            if (mu.commitNow) {
                if (!this.legacyApi) {
                    url += nextDelim + "commitNow=true";
                }
                else {
                    headers["X-Dgraph-CommitNow"] = "true";
                }
            }
            return this.callAPI(url, {
                method: "POST",
                body: body,
                headers: headers,
            });
        };
        DgraphClientStub.prototype.commit = function (ctx) {
            var body;
            if (ctx.keys === undefined) {
                body = "[]";
            }
            else {
                body = JSON.stringify(ctx.keys);
            }
            var url = !this.legacyApi
                ? "commit?startTs=" + ctx.start_ts
                : "commit/" + ctx.start_ts;
            return this.callAPI(url, {
                method: "POST",
                body: body,
            });
        };
        DgraphClientStub.prototype.abort = function (ctx) {
            var url = !this.legacyApi
                ? "commit?startTs=" + ctx.start_ts + "&abort=true"
                : "/abort/" + ctx.start_ts;
            return this.callAPI(url, { method: "POST" });
        };
        DgraphClientStub.prototype.health = function () {
            return fetch(this.getURL("health"), {
                method: "GET",
            })
                .then(function (response) {
                if (response.status >= 300 || response.status < 200) {
                    throw new Error("Invalid status code = " + response.status);
                }
                return response.text();
            });
        };
        DgraphClientStub.prototype.login = function (userid, password, refreshJWT) {
            return __awaiter(this, void 0, void 0, function () {
                var body, res;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (this.legacyApi) {
                                throw new Error("Pre v1.1 clients do not support Login methods");
                            }
                            body = {};
                            if (userid === undefined && this.refreshJWT === undefined) {
                                throw new Error("Cannot find login details: neither userid/password nor refresh token are specified");
                            }
                            if (userid === undefined) {
                                body.refresh_token = refreshJWT !== undefined ? refreshJWT : this.refreshJWT;
                            }
                            else {
                                body.userid = userid;
                                body.password = password;
                            }
                            return [4, this.callAPI("login", {
                                    method: "POST",
                                    body: JSON.stringify(body),
                                })];
                        case 1:
                            res = _a.sent();
                            this.accessJWT = res.data.accessJWT;
                            this.refreshJWT = res.data.refreshJWT;
                            return [2, true];
                    }
                });
            });
        };
        DgraphClientStub.prototype.callAPI = function (path, config) {
            return __awaiter(this, void 0, void 0, function () {
                var url;
                return __generator(this, function (_a) {
                    url = this.getURL(path);
                    if (this.accessJWT !== undefined) {
                        config.headers = config.headers !== undefined ? config.headers : {};
                        config.headers["X-Dgraph-AccessToken"] = this.accessJWT;
                    }
                    return [2, fetch(url, config)
                            .then(function (response) {
                            if (response.status >= 300 || response.status < 200) {
                                throw new Error("Invalid status code = " + response.status);
                            }
                            return response.json();
                        })
                            .then(function (json) {
                            var errors = json.errors;
                            if (errors !== undefined) {
                                throw new errors_1.APIError(url, errors);
                            }
                            return json;
                        })];
                });
            });
        };
        DgraphClientStub.prototype.getURL = function (path) {
            return "" + this.addr + (this.addr.endsWith("/") ? "" : "/") + path;
        };
        return DgraphClientStub;
    }());
    exports.DgraphClientStub = DgraphClientStub;
});
define("util", ["require", "exports", "errors"], function (require, exports, errors_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function isAbortedError(error) {
        if (!(error instanceof errors_2.APIError)) {
            return false;
        }
        if (error.errors.length === 0) {
            return false;
        }
        var firstError = error.errors[0];
        var message = firstError.message.toLowerCase();
        return message.indexOf("abort") >= 0 && message.indexOf("retry") >= 0;
    }
    exports.isAbortedError = isAbortedError;
    function isConflictError(error) {
        if (!(error instanceof errors_2.APIError)) {
            return false;
        }
        if (error.errors.length === 0) {
            return false;
        }
        var firstError = error.errors[0];
        var message = firstError.message.toLowerCase();
        return message.indexOf("conflict") >= 0;
    }
    exports.isConflictError = isConflictError;
    function stringifyMessage(msg) {
        return JSON.stringify(msg);
    }
    exports.stringifyMessage = stringifyMessage;
});
define("txn", ["require", "exports", "errors", "util"], function (require, exports, errors_3, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Txn = (function () {
        function Txn(dc) {
            this.finished = false;
            this.mutated = false;
            this.dc = dc;
            this.ctx = {
                start_ts: 0,
                keys: [],
                preds: [],
            };
        }
        Txn.prototype.query = function (q) {
            return this.queryWithVars(q);
        };
        Txn.prototype.queryWithVars = function (q, vars) {
            return __awaiter(this, void 0, void 0, function () {
                var req, varsObj_1, c, res;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (this.finished) {
                                this.dc.debug("Query request (ERR_FINISHED):\nquery = " + q + "\nvars = " + vars);
                                throw errors_3.ERR_FINISHED;
                            }
                            req = {
                                query: q,
                                startTs: this.ctx.start_ts,
                            };
                            if (vars !== undefined) {
                                varsObj_1 = {};
                                Object.keys(vars).forEach(function (key) {
                                    var value = vars[key];
                                    if (typeof value === "string" || value instanceof String) {
                                        varsObj_1[key] = value.toString();
                                    }
                                });
                                req.vars = varsObj_1;
                            }
                            this.dc.debug("Query request:\n" + util_1.stringifyMessage(req));
                            c = this.dc.anyClient();
                            return [4, c.query(req)];
                        case 1:
                            res = _a.sent();
                            this.mergeContext(res.extensions.txn);
                            this.dc.debug("Query response:\n" + util_1.stringifyMessage(res));
                            return [2, res];
                    }
                });
            });
        };
        Txn.prototype.mutate = function (mu) {
            return __awaiter(this, void 0, void 0, function () {
                var c, ag, e_1, e_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (this.finished) {
                                this.dc.debug("Mutate request (ERR_FINISHED):\nmutation = " + util_1.stringifyMessage(mu));
                                throw errors_3.ERR_FINISHED;
                            }
                            this.mutated = true;
                            mu.startTs = this.ctx.start_ts;
                            this.dc.debug("Mutate request:\n" + util_1.stringifyMessage(mu));
                            c = this.dc.anyClient();
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 8]);
                            return [4, c.mutate(mu)];
                        case 2:
                            ag = _a.sent();
                            if (mu.commitNow) {
                                this.finished = true;
                            }
                            this.mergeContext(ag.extensions.txn);
                            this.dc.debug("Mutate response:\n" + util_1.stringifyMessage(ag));
                            return [2, ag];
                        case 3:
                            e_1 = _a.sent();
                            _a.label = 4;
                        case 4:
                            _a.trys.push([4, 6, , 7]);
                            return [4, this.discard()];
                        case 5:
                            _a.sent();
                            return [3, 7];
                        case 6:
                            e_2 = _a.sent();
                            return [3, 7];
                        case 7: throw (util_1.isAbortedError(e_1) || util_1.isConflictError(e_1)) ? errors_3.ERR_ABORTED : e_1;
                        case 8: return [2];
                    }
                });
            });
        };
        Txn.prototype.commit = function () {
            return __awaiter(this, void 0, void 0, function () {
                var c, e_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (this.finished) {
                                throw errors_3.ERR_FINISHED;
                            }
                            this.finished = true;
                            if (!this.mutated) {
                                return [2];
                            }
                            c = this.dc.anyClient();
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4, c.commit(this.ctx)];
                        case 2:
                            _a.sent();
                            return [3, 4];
                        case 3:
                            e_3 = _a.sent();
                            throw util_1.isAbortedError(e_3) ? errors_3.ERR_ABORTED : e_3;
                        case 4: return [2];
                    }
                });
            });
        };
        Txn.prototype.discard = function () {
            return __awaiter(this, void 0, void 0, function () {
                var c;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (this.finished) {
                                return [2];
                            }
                            this.finished = true;
                            if (!this.mutated) {
                                return [2];
                            }
                            this.ctx.aborted = true;
                            c = this.dc.anyClient();
                            return [4, c.abort(this.ctx)];
                        case 1:
                            _a.sent();
                            return [2];
                    }
                });
            });
        };
        Txn.prototype.mergeArrays = function (a, b) {
            var res = a.slice();
            res.push.apply(res, b);
            res.sort();
            return res.filter(function (item, idx, arr) { return idx === 0 || arr[idx - 1] !== item; });
        };
        Txn.prototype.mergeContext = function (src) {
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
        };
        return Txn;
    }());
    exports.Txn = Txn;
});
define("client", ["require", "exports", "errors", "txn", "util"], function (require, exports, errors_4, txn_1, util_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var DgraphClient = (function () {
        function DgraphClient() {
            var clients = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                clients[_i] = arguments[_i];
            }
            this.debugMode = false;
            if (clients.length === 0) {
                throw errors_4.ERR_NO_CLIENTS;
            }
            this.clients = clients;
        }
        DgraphClient.prototype.alter = function (op) {
            return __awaiter(this, void 0, void 0, function () {
                var c;
                return __generator(this, function (_a) {
                    this.debug("Alter request:\n" + util_2.stringifyMessage(op));
                    c = this.anyClient();
                    return [2, c.alter(op)];
                });
            });
        };
        DgraphClient.prototype.login = function (userid, password) {
            return __awaiter(this, void 0, void 0, function () {
                var c;
                return __generator(this, function (_a) {
                    this.debug("Login request:\nuserid: " + userid);
                    c = this.anyClient();
                    return [2, c.login(userid, password)];
                });
            });
        };
        DgraphClient.prototype.newTxn = function () {
            return new txn_1.Txn(this);
        };
        DgraphClient.prototype.setDebugMode = function (mode) {
            if (mode === void 0) { mode = true; }
            this.debugMode = mode;
        };
        DgraphClient.prototype.debug = function (msg) {
            if (this.debugMode) {
                console.log(msg);
            }
        };
        DgraphClient.prototype.anyClient = function () {
            return this.clients[Math.floor(Math.random() * this.clients.length)];
        };
        return DgraphClient;
    }());
    exports.DgraphClient = DgraphClient;
});
define("index", ["require", "exports", "clientStub", "client", "txn", "errors"], function (require, exports, clientStub_1, client_1, txn_2, errors_5) {
    "use strict";
    function __export(m) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    __export(clientStub_1);
    __export(client_1);
    __export(txn_2);
    __export(errors_5);
});
