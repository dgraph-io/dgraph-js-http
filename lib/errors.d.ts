export declare const ERR_NO_CLIENTS: Error;
export declare const ERR_FINISHED: Error;
export declare const ERR_ABORTED: Error;
export declare class CustomError extends Error {
    readonly name: string;
    constructor(message?: string);
}
export interface APIResultError {
    code: string;
    message: string;
}
export declare class APIError extends CustomError {
    readonly url: string;
    readonly errors: APIResultError[];
    constructor(url: string, errors: APIResultError[]);
}
