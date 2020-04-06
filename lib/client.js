"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
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
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = require("./errors");
var txn_1 = require("./txn");
var util_1 = require("./util");
var DgraphClient = (function () {
    function DgraphClient() {
        var clients = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            clients[_i] = arguments[_i];
        }
        this.debugMode = false;
        this.queryTimeout = 600;
        if (clients.length === 0) {
            throw errors_1.ERR_NO_CLIENTS;
        }
        this.clients = clients;
    }
    DgraphClient.prototype.setQueryTimeout = function (timeout) {
        this.queryTimeout = timeout;
        return this;
    };
    DgraphClient.prototype.getQueryTimeout = function () {
        return this.queryTimeout;
    };
    DgraphClient.prototype.alter = function (op) {
        return __awaiter(this, void 0, void 0, function () {
            var c;
            return __generator(this, function (_a) {
                this.debug("Alter request:\n" + util_1.stringifyMessage(op));
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
    DgraphClient.prototype.logout = function () {
        this.debug("Logout");
        this.clients.forEach(function (c) { return c.logout(); });
    };
    DgraphClient.prototype.newTxn = function (options) {
        return new txn_1.Txn(this, options);
    };
    DgraphClient.prototype.setDebugMode = function (mode) {
        if (mode === void 0) { mode = true; }
        this.debugMode = mode;
    };
    DgraphClient.prototype.fetchUiKeywords = function () {
        return this.anyClient().fetchUiKeywords();
    };
    DgraphClient.prototype.getHealth = function (all) {
        if (all === void 0) { all = true; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.anyClient().getHealth(all)];
            });
        });
    };
    DgraphClient.prototype.getState = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.anyClient().getState()];
            });
        });
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
