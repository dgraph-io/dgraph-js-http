"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = require("./errors");
function isAbortedError(error) {
    if (!(error instanceof errors_1.APIError)) {
        return false;
    }
    var firstError = error.errors.length > 0 ? error.errors[0] : null;
    if (firstError == null) {
        return false;
    }
    var message = firstError.message.toLowerCase();
    return message.indexOf("abort") >= 0 && message.indexOf("retry") >= 0;
}
exports.isAbortedError = isAbortedError;
function isConflictError(error) {
    if (!(error instanceof errors_1.APIError)) {
        return false;
    }
    var firstError = error.errors.length > 0 ? error.errors[0] : null;
    if (firstError == null) {
        return false;
    }
    var message = firstError.message.toLowerCase();
    return message.indexOf("conflict") >= 0;
}
exports.isConflictError = isConflictError;
function stringifyMessage(msg) {
    return JSON.stringify(msg);
}
exports.stringifyMessage = stringifyMessage;
