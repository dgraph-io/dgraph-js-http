export const ERR_NO_CLIENTS = new Error(
    "No clients provided in DgraphClient constructor",
);
export const ERR_FINISHED = new Error(
    "Transaction has already been committed or discarded",
);
export const ERR_ABORTED = new Error(
    "Transaction has been aborted. Please retry",
);
export const ERR_BEST_EFFORT_REQUIRED_READ_ONLY = new Error(
    "Best effort only works for read-only queries",
);

/**
 * CustomError is base class used for defining custom error classes.
 */
export class CustomError extends Error {
    public readonly name: string;

    constructor(message?: string) {
        super(message);

        // tslint:disable no-any no-unsafe-any
        this.name = new.target.name;

        // fix the extended error prototype chain because typescript __extends implementation can't
        const setPrototypeOf: Function = (<any>Object).setPrototypeOf;
        setPrototypeOf !== undefined
            ? setPrototypeOf(this, new.target.prototype)
            : ((<any>this).__proto__ = new.target.prototype);

        // try to remove contructor from stack trace
        const captureStackTrace: Function = (<any>Error).captureStackTrace;
        if (captureStackTrace !== undefined) {
            captureStackTrace(this, this.constructor);
        }
        // tslint:enable no-any no-unsafe-any
    }
}

export interface APIResultError {
    code: string;
    message: string;
}

/**
 * APIError represents an error returned by Dgraph's HTTP server API.
 */
export class APIError extends CustomError {
    public readonly url: string;
    public readonly errors: APIResultError[];

    constructor(url: string, errors: APIResultError[]) {
        super(errors.length > 0 ? errors[0].message : "API returned errors");
        this.url = url;
        this.errors = errors;
    }
}

/**
 * HTTPError used for errors in the HTTP protocol (HTTP 404, HTTP 500, etc.)
 */
export class HTTPError extends CustomError {
    public readonly errorResponse: Response;

    constructor(response: Response) {
        super(`Invalid status code = ${response.status}`);
        this.errorResponse = response;
    }
}
