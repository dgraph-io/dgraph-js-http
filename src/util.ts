import { APIError, APIResultError } from "./errors";

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
export function isAbortedError(error: any): boolean {
    if (!(error instanceof APIError)) {
        return false;
    }

    if (error.errors.length === 0) {
        return false;
    }
    const firstError: APIResultError = error.errors[0];

    const message = firstError.message.toLowerCase();
    return message.indexOf("abort") >= 0 && message.indexOf("retry") >= 0;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
export function isConflictError(error: any): boolean {
    if (!(error instanceof APIError)) {
        return false;
    }

    if (error.errors.length === 0) {
        return false;
    }
    const firstError: APIResultError = error.errors[0];

    const message = firstError.message.toLowerCase();
    return message.indexOf("conflict") >= 0;
}

export function stringifyMessage(msg: object): string {
    return JSON.stringify(msg);
}
