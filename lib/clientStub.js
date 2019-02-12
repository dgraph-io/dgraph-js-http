"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("isomorphic-fetch");
var errors_1 = require("./errors");
var DgraphClientStub = (function () {
    function DgraphClientStub(addr) {
        if (addr == null) {
            this.addr = "http://localhost:8080";
        }
        else {
            this.addr = addr;
        }
    }
    DgraphClientStub.prototype.alter = function (op) {
        var body;
        if (op.schema != null) {
            body = op.schema;
        }
        else if (op.dropAttr != null) {
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
        if (req.vars != null) {
            headers["X-Dgraph-Vars"] = JSON.stringify(req.vars);
        }

        return this.callAPI("query" + (req.startTs == null ? "" : "/" + req.startTs), {
            method: "POST",
            body: req.query,
            headers: headers,
        });
    };
    DgraphClientStub.prototype.mutate = function (mu) {
        var body;
        var usingJSON = false;
        if (mu.setJson != null || mu.deleteJson != null) {
            usingJSON = true;
            var obj = {};
            if (mu.setJson != null) {
                obj.set = mu.setJson;
            }
            if (mu.deleteJson != null) {
                obj.delete = mu.deleteJson;
            }
            body = JSON.stringify(obj);
        }
        else if (mu.setNquads != null || mu.deleteNquads != null) {
            body = "{\n                " + (mu.setNquads == null ? "" : "set {\n                    " + mu.setNquads + "\n                }") + "\n                " + (mu.deleteNquads == null ? "" : "delete {\n                    " + mu.deleteNquads + "\n                }") + "\n            }";
        }
        else {
            return Promise.reject("Mutation mu argument in alter");
        }
        var headers = {};
        if (usingJSON) {
            headers["X-Dgraph-MutationType"] = "json";
        }
        if (mu.commitNow) {
            headers["X-Dgraph-CommitNow"] = "true";
        }
        return this.callAPI("mutate" + (mu.startTs == null ? "" : "/" + mu.startTs), {
            method: "POST",
            body: body,
            headers: headers,
        });
    };
    DgraphClientStub.prototype.commit = function (ctx) {
        var body;
        if (ctx.keys == null) {
            body = "[]";
        }
        else {
            body = JSON.stringify(ctx.keys);
        }
        return this.callAPI("commit/" + ctx.start_ts, {
            method: "POST",
            body: body,
        });
    };
    DgraphClientStub.prototype.abort = function (ctx) {
        return this.callAPI("abort/" + ctx.start_ts, {
            method: "POST",
        });
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
    DgraphClientStub.prototype.callAPI = function (path, config) {
        var url = this.getURL(path);
        return fetch(url, config)
            .then(function (response) {
            if (response.status >= 300 || response.status < 200) {
                throw new Error("Invalid status code = " + response.status);
            }
            return response.json();
        })
            .then(function (json) {
            var errors = json.errors;
            if (errors != null) {
                throw new errors_1.APIError(url, errors);
            }
            return json;
        });
    };
    DgraphClientStub.prototype.getURL = function (path) {
        return "" + this.addr + (this.addr.endsWith("/") ? "" : "/") + path;
    };
    return DgraphClientStub;
}());
exports.DgraphClientStub = DgraphClientStub;
