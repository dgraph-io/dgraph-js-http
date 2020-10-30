import { APIError } from "./errors";
export function isAbortedError(error) {
    if (!(error instanceof APIError)) {
        return false;
    }
    if (error.errors.length === 0) {
        return false;
    }
    const firstError = error.errors[0];
    const message = firstError.message.toLowerCase();
    return message.indexOf("abort") >= 0 && message.indexOf("retry") >= 0;
}
export function isConflictError(error) {
    if (!(error instanceof APIError)) {
        return false;
    }
    if (error.errors.length === 0) {
        return false;
    }
    const firstError = error.errors[0];
    const message = firstError.message.toLowerCase();
    return message.indexOf("conflict") >= 0;
}
export function stringifyMessage(msg) {
    return JSON.stringify(msg);
}
