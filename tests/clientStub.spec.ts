import * as dgraph from "../src";
import { Request } from "../src/types";

import { setup } from "./helper";

async function checkHealth(stub: dgraph.DgraphClientStub): Promise<void> {
    await expect(stub.health()).resolves.toHaveProperty("health", "OK");
}

describe("clientStub", () => {
    describe("constructor", () => {
        it("should accept undefined argument", async () => {
            await checkHealth(new dgraph.DgraphClientStub());
        });
    });

    describe("health", () => {
        it("should check health", async () => {
            const client = await setup();
            await checkHealth(client.anyClient());
        });
    });

    describe("fetchUiKeywords", () => {
        it("should return keywords object", async () => {
            const client = await setup();
            await expect(client.anyClient().fetchUiKeywords())
                .resolves
                .toHaveProperty("keywords");
            const resp = await client.anyClient().fetchUiKeywords();
            expect(resp.keywords).toContainEqual({
                type: "",
                name: "alloftext",
            });
        });
    });

    describe("timeout", () => {
        it("should add timeout to the query string", async () => {
            const stub = new dgraph.DgraphClientStub();
            // tslint:disable-next-line no-any
            (<any>stub).callAPI = jest.fn();

            const req: Request = {
                query: "",
                startTs: 100,
                timeout: 777,
            };

            // tslint:disable-next-line no-unsafe-any
            await stub.query(req);

            // tslint:disable-next-line no-any
            expect((<any>stub).callAPI).toHaveBeenCalledTimes(1);
            // tslint:disable-next-line no-unsafe-any no-any
            expect((<any>stub).callAPI.mock.calls[0][0]).toContain("timeout=777s");

            req.timeout = 0;
            req.startTs = 0;
            // tslint:disable-next-line no-unsafe-any
            await stub.query(req);

            // tslint:disable-next-line no-any
            expect((<any>stub).callAPI).toHaveBeenCalledTimes(2);
            // tslint:disable-next-line no-unsafe-any no-any
            expect((<any>stub).callAPI.mock.calls[1][0]).toBe("query");
        });
    });
});
