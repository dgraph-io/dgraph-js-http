var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ERR_NO_CLIENTS } from "./errors";
import { Txn } from "./txn";
import { stringifyMessage } from "./util";
export class DgraphClient {
    constructor(...clients) {
        this.debugMode = false;
        this.queryTimeout = 600;
        if (clients.length === 0) {
            throw ERR_NO_CLIENTS;
        }
        this.clients = clients;
    }
    setQueryTimeout(timeout) {
        this.queryTimeout = timeout;
        return this;
    }
    getQueryTimeout() {
        return this.queryTimeout;
    }
    alter(op) {
        return __awaiter(this, void 0, void 0, function* () {
            this.debug(`Alter request:\n${stringifyMessage(op)}`);
            const c = this.anyClient();
            return c.alter(op);
        });
    }
    setAlphaAuthToken(authToken) {
        this.clients.forEach((c) => c.setAlphaAuthToken(authToken));
    }
    setSlashApiKey(apiKey) {
        this.clients.forEach((c) => c.setSlashApiKey(apiKey));
    }
    login(userid, password) {
        return __awaiter(this, void 0, void 0, function* () {
            this.debug(`Login request:\nuserid: ${userid}`);
            const c = this.anyClient();
            return c.login(userid, password);
        });
    }
    logout() {
        this.debug("Logout");
        this.clients.forEach((c) => c.logout());
    }
    newTxn(options) {
        return new Txn(this, options);
    }
    setDebugMode(mode = true) {
        this.debugMode = mode;
    }
    fetchUiKeywords() {
        return this.anyClient().fetchUiKeywords();
    }
    getHealth(all = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.anyClient().getHealth(all);
        });
    }
    getState() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.anyClient().getState();
        });
    }
    debug(msg) {
        if (this.debugMode) {
            console.log(msg);
        }
    }
    anyClient() {
        return this.clients[Math.floor(Math.random() * this.clients.length)];
    }
}
