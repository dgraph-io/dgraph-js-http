"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DgraphCluster = (function () {
    function DgraphCluster(client) {
        this.client = client;
    }
    DgraphCluster.prototype.getInstanceHealth = function () {
        var url = "health";
        var client = this.client.anyClient();
        return client.callAPI(url, {
            method: "GET",
        });
    };
    DgraphCluster.prototype.getClusterHealth = function () {
        var url = 'health?all';
        var client = this.client.anyClient();
        return client.callAPI(url, {
            method: "GET",
        });
    };
    DgraphCluster.prototype.getState = function () {
        var client = this.client.anyClient();
        return client.callAPI("state", {
            method: "GET",
        });
    };
    return DgraphCluster;
}());
exports.DgraphCluster = DgraphCluster;
