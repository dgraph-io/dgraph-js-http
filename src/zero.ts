import { Response } from "./types";
import { APIError, APIResultError } from "./errors";

declare const fetch: any; // tslint:disable-line no-any

/**
 * Zero is a  client to a Dgraph Zero instance.
 * This is a seperate class because it may be removed in the future.
 */
export class DgraphZero {
    private readonly addr: string;

    /**
     * Creates a new Client for interacting with Dgraph Zero.
     *
     */
    constructor(addr?: string) {
        if (addr === undefined) {
            this.addr = "http://localhost:6080"; // tslint:disable-line no-http-string
        } else {
            this.addr = addr;
        }
    }
    
    public async getState(): Promise<Response> {
        return await this.callAPI("state", {});
    }

    public async getHealth(all: boolean = false) : Promise<Response> {
        const url = "health" + (all? "?all" : "");
        return await this.callAPI(url, {});
    }

    private async callAPI<T>(path: string, config: { method?: string; body?: string; headers?: { [k: string]: string } }): Promise<T> {
        const url = this.getURL(path);
        const response = await fetch(url, config);

        if (response.status >= 300 || response.status < 200) {
            throw new Error(`Invalid status code = ${response.status}`);
        }

        const json = await response.json();
        const errors = (<{ errors: APIResultError[] }><any>json).errors; // tslint:disable-line no-any

        if (errors !== undefined) {
            throw new APIError(url, errors);
        }

        return json;
    }

    private getURL(path: string): string {
        return `${this.addr}${this.addr.endsWith("/") ? "" : "/"}${path}`;
    }
}