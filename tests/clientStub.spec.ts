import * as dgraph from "../src";
import { Request } from "../src/types";

import { SERVER_ADDR, setup } from "./helper";

async function checkHealth(stub: dgraph.DgraphClientStub): Promise<void> {
    await expect(stub.getHealth()).resolves.toHaveProperty(
        "0.status",
        "healthy",
    );
}

describe("clientStub", () => {
    describe("constructor", () => {
        it("should accept undefined argument", async () => {
            await checkHealth(new dgraph.DgraphClientStub());
        });
        it("should accept custom JSON parser", async () => {
            const mockParser = jest.fn((input: string) => ({ input }));
            const stub = new dgraph.DgraphClientStub(SERVER_ADDR, {
                jsonParser: mockParser,
            });
            await expect(
                stub.query({
                    query: "{ q(func: uid(1)) { uid } }",
                }),
            ).resolves.toBeTruthy();
            expect(mockParser.mock.calls.length).toBe(1);
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
            await expect(
                client.anyClient().fetchUiKeywords(),
            ).resolves.toHaveProperty("keywords");
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (stub as any).callAPI = jest.fn();

            const req: Request = {
                query: "",
                startTs: 100,
                timeout: 777,
            };

            // eslint-disable-next-line
            await stub.query(req);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((stub as any).callAPI).toHaveBeenCalledTimes(1);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/tslint/config
            expect((stub as any).callAPI.mock.calls[0][0]).toContain(
                "timeout=777s",
            );

            req.timeout = 0;
            req.startTs = 0;
            await stub.query(req);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((stub as any).callAPI).toHaveBeenCalledTimes(2);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/tslint/config
            expect((stub as any).callAPI.mock.calls[1][0]).toBe("query");
        });
    });

    describe("mutate", () => {
        it("should detect Content-Type when none is specified", async () => {
            const stub = new dgraph.DgraphClientStub();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (stub as any).callAPI = jest.fn();

            await stub.mutate({
                mutation: "{ set: 123 }",
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((stub as any).callAPI).toHaveBeenCalledTimes(1);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/tslint/config
            expect((stub as any).callAPI.mock.calls[0][1].headers).toHaveProperty(
                "Content-Type",
                "application/rdf",
            );

            await stub.mutate({
                mutation: '{ "setJson": { "name": "Alice" } }',
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((stub as any).callAPI).toHaveBeenCalledTimes(2);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/tslint/config
            expect((stub as any).callAPI.mock.calls[1][1].headers).toHaveProperty(
                "Content-Type",
                "application/json",
            );
        });

        it("should use specified Content-Type if present", async () => {
            const stub = new dgraph.DgraphClientStub();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (stub as any).callAPI = jest.fn();

            await stub.mutate({
                mutation: "{ set: 123 }",
                isJsonString: true,
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((stub as any).callAPI).toHaveBeenCalledTimes(1);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/tslint/config
            expect((stub as any).callAPI.mock.calls[0][1].headers).toHaveProperty(
                "Content-Type",
                "application/json",
            );

            await stub.mutate({
                mutation: '{ "setJson": { "name": "Alice" } }',
                isJsonString: false,
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((stub as any).callAPI).toHaveBeenCalledTimes(2);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/tslint/config
            expect((stub as any).callAPI.mock.calls[1][1].headers).toHaveProperty(
                "Content-Type",
                "application/rdf",
            );
        });
    });

    describe("health", () => {
        it("should return health info", async () => {
            const client = await setup();
            await client.getHealth();
        });

        it("should return cluster health info", async () => {
            const client = await setup();
            await client.getHealth(true);
        });
    });

    describe("state", () => {
        it("should return state info", async () => {
            const client = await setup();
            await client.getState();
        });
    });
});
