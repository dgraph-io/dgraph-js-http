import * as dgraph from "../src";
// Non-exported functions.
import { mergeLinReads } from "../src/util";

import { areLinReadsEqual, createLinRead } from "./helper";

describe("util", () => {
    describe("mergeLinReads", () => {
        it("should merge two different linReads", () => {
            const lr1 = createLinRead([1, 1]);
            const lr2 = createLinRead([2, 2], [3, 3]);
            const res = createLinRead([1, 1], [2, 2], [3, 3]);
            expect(areLinReadsEqual(mergeLinReads(lr1, lr2), res)).toBe(true);
            expect(areLinReadsEqual(lr1, res)).toBe(true);
        });

        it("should use max value if lower value merged", () => {
            const lr1 = createLinRead([1, 2]);
            const lr2 = createLinRead([1, 1]);
            const res = createLinRead([1, 2]);
            expect(areLinReadsEqual(mergeLinReads(lr1, lr2), res)).toBe(true);
            expect(areLinReadsEqual(lr1, res)).toBe(true);
        });

        it("should use max value if higher value merged", () => {
            const lr1 = createLinRead([1, 1]);
            const lr2 = createLinRead([1, 2]);
            const res = createLinRead([1, 2]);
            expect(areLinReadsEqual(mergeLinReads(lr1, lr2), res)).toBe(true);
            expect(areLinReadsEqual(lr1, res)).toBe(true);
        });

        it("should merge if values are same", () => {
            const lr1 = createLinRead([1, 1]);
            const lr2 = createLinRead([1, 1]);
            const res = createLinRead([1, 1]);
            expect(areLinReadsEqual(mergeLinReads(lr1, lr2), res)).toBe(true);
            expect(areLinReadsEqual(lr1, res)).toBe(true);
        });

        it("should merge if src linRead is null", () => {
            const lr1 = createLinRead([1, 1], [2, 2]);
            const lr2: dgraph.LinRead | null = null;
            const res = createLinRead([1, 1], [2, 2]);
            expect(areLinReadsEqual(mergeLinReads(lr1, lr2), res)).toBe(true);
            expect(areLinReadsEqual(lr1, res)).toBe(true);
        });

        it("should merge if target ids is not set", () => {
            const lr1 = createLinRead();
            const lr2 = createLinRead([1, 1], [2, 2]);
            const res = createLinRead([1, 1], [2, 2]);
            expect(areLinReadsEqual(mergeLinReads(lr1, lr2), res)).toBe(true);
            expect(areLinReadsEqual(lr1, res)).toBe(true);
        });

        it("should merge if src ids is not set", () => {
            const lr1 = createLinRead([1, 1], [2, 2]);
            const lr2 = createLinRead();
            const res = createLinRead([1, 1], [2, 2]);
            expect(areLinReadsEqual(mergeLinReads(lr1, lr2), res)).toBe(true);
            expect(areLinReadsEqual(lr1, res)).toBe(true);
        });
    });
});
