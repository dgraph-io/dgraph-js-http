import { DgraphClientStub } from "../../src";

import { SERVER_ADDR, USE_LEGACY_API } from "../helper";

describe("clientStub version detection", () => {
    it("should not throw errors", () => {
        const stub = new DgraphClientStub(SERVER_ADDR, false);
        return expect(stub.DEPRECATED_detectApiVersion())
            .resolves
            .toBe(USE_LEGACY_API);
    });
});
