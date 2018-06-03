export const ERR_NO_CLIENTS = new Error("No clients provided in DgraphClient constructor");
export const ERR_FINISHED = new Error("Transaction has already been committed or discarded");
export const ERR_ABORTED = new Error("Transaction has been aborted. Please retry");

export class CustomError extends Error {
    public readonly name: string;

    constructor(message?: string) {
        super(message);
        this.name = new.target.name;

        // fix the extended error prototype chain because typescript __extends implementation can't
        const setPrototypeOf: Function = (<any>Object).setPrototypeOf; // tslint:disable-line no-any
        setPrototypeOf
            ? setPrototypeOf(this, new.target.prototype)
            : ((<any>this).__proto__ = new.target.prototype); // tslint:disable-line no-any

        // try to remove contructor from stack trace
        const captureStackTrace: Function = (<any>Error).captureStackTrace; // tslint:disable-line no-any
        if (captureStackTrace) {
            captureStackTrace(this, this.constructor);
        }
    }
}

export interface APIResultError {
    code: string;
    message: string;
}

export class APIError extends CustomError {
    public readonly url: string;
    public readonly errors: APIResultError[];

    constructor(url: string, errors: APIResultError[]) {
        super(errors.length > 0 ? errors[0].message : "API returned errors");
        this.url = url;
        this.errors = errors;
    }
}
