import { APIError, APIResultError } from "./errors";

export function isAbortedError(error: any): boolean { // tslint:disable-line no-any
    if (!(error instanceof APIError)) {
        return false;
    }

    const firstError: APIResultError | undefined | undefined = error.errors.length > 0 ? error.errors[0] : undefined;
    if (firstError === undefined) {
        return false;
    }

    const message = firstError.message.toLowerCase();
    return message.indexOf("abort") >= 0 && message.indexOf("retry") >= 0;
}

export function isConflictError(error: any): boolean { // tslint:disable-line no-any
    if (!(error instanceof APIError)) {
        return false;
    }

    const firstError: APIResultError | undefined | undefined = error.errors.length > 0 ? error.errors[0] : undefined;
    if (firstError === undefined) {
        return false;
    }

    const message = firstError.message.toLowerCase();
    return message.indexOf("conflict") >= 0;
}

export function stringifyMessage(msg: object): string {
    return JSON.stringify(msg);
}
