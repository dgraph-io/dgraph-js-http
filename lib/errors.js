export const ERR_NO_CLIENTS = new Error("No clients provided in DgraphClient constructor");
export const ERR_FINISHED = new Error("Transaction has already been committed or discarded");
export const ERR_ABORTED = new Error("Transaction has been aborted. Please retry");
export const ERR_BEST_EFFORT_REQUIRED_READ_ONLY = new Error("Best effort only works for read-only queries");
export class CustomError extends Error {
    constructor(message) {
        super(message);
        this.name = new.target.name;
        const setPrototypeOf = Object.setPrototypeOf;
        setPrototypeOf !== undefined
            ? setPrototypeOf(this, new.target.prototype)
            : (this.__proto__ = new.target.prototype);
        const captureStackTrace = Error.captureStackTrace;
        if (captureStackTrace !== undefined) {
            captureStackTrace(this, this.constructor);
        }
    }
}
export class APIError extends CustomError {
    constructor(url, errors) {
        super(errors.length > 0 ? errors[0].message : "API returned errors");
        this.url = url;
        this.errors = errors;
    }
}
export class HTTPError extends CustomError {
    constructor(response) {
        super(`Invalid status code = ${response.status}`);
        this.errorResponse = response;
    }
}
