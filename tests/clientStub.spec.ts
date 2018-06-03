import * as dgraph from "../src";

import { setup } from "./helper";

async function checkHealth(stub: dgraph.DgraphClientStub): Promise<void> {
    expect(await stub.health()).toEqual("OK");
}

describe("clientStub", () => {
    describe("constructor", () => {
        it("should accept undefined and null arguments", async () => {
            await checkHealth(new dgraph.DgraphClientStub());
            await checkHealth(new dgraph.DgraphClientStub(null));
        });
    });

    describe("health", () => {
        it("should check health", async () => {
            const client = await setup();
            await checkHealth(client.anyClient());
        });
    });
});
