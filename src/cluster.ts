import { DgraphClient } from './client'
import { Response } from "./types";

/**
 * Cluster is a wrapper over client that provides access to clusters.
 */
export class DgraphCluster {
    private readonly client: DgraphClient;

    constructor(client: DgraphClient) {
        this.client = client;
    }

    /**
     * Gets health for a single alpha instance
     *
     */
    public getInstanceHealth(): Promise<Response> {
        const url = "health";
        const client = this.client.anyClient();

        return client.callAPI(url, {
            method: "GET",
        });
    }

    /**
     * Gets health for all instance
     *
     */
    public getClusterHealth() : Promise<Response> {
        const url = 'health?all';
        const client = this.client.anyClient();

        return client.callAPI(url, {
            method: "GET",
        });
    }

    /**
     * Gets information about the current cluster group membership info
     *
     */
    public getState(): Promise<Response> {
        const client = this.client.anyClient();

        return client.callAPI("state", {
            method: "GET",
        });
    }
}