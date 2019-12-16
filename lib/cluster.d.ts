import { DgraphClient } from './client';
import { Response } from "./types";
export declare class DgraphCluster {
    private readonly client;
    constructor(client: DgraphClient);
    getInstanceHealth(): Promise<Response>;
    getClusterHealth(): Promise<Response>;
    getState(): Promise<Response>;
}
