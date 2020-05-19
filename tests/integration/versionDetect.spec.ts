import { DgraphClientStub } from "../../src";

import { SERVER_ADDR, USE_LEGACY_API } from "../helper";

describe("clientStub version detection", () => {
    it("should not throw errors", () => {
        const stub = new DgraphClientStub(SERVER_ADDR, {
            legacyApi: USE_LEGACY_API,
        });
        return expect(stub.detectApiVersion()).resolves.toMatch(
            /^v[0-9]+(.[0-9]+){2}.*/,
        );
    });
});
