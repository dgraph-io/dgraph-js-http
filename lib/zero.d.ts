import { Response } from "./types";
export declare class DgraphZero {
    private readonly addr;
    constructor(addr?: string);
    getState(): Promise<Response>;
    getClusterHealth(): Promise<Response>;
    private callAPI;
    private getURL;
}
