import { LinRead } from "./types";
export declare function mergeLinReads(target: LinRead, src?: LinRead | null): LinRead;
export declare function isAbortedError(error: any): boolean;
export declare function isConflictError(error: any): boolean;
export declare function stringifyMessage(msg: object): string;
