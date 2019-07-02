import * as dgraph from "../src";

import { setSchema, setup } from "./helper";

const timeout = 1 * 60 * 1000; // 1 minute in milliseconds

jest.setTimeout(timeout * 2); // tslint:disable-line no-string-based-set-timeout

let client: dgraph.DgraphClient;

describe("txn", () => {
    describe("queryWithVars", () => {
        beforeAll(async () => {
            client = await setup();
            await setSchema(client, "name: string @index(exact) .");
            await client.newTxn().mutate({
                setJson: {
                    name: "Alice",
                },
                commitNow: true,
            });
        });

        it("should query with variables", async () => {
            let res = await client.newTxn().queryWithVars(
                "query me($a: string) { me(func: eq(name, $a)) { name }}",
                {
                    $a: "Alice",
                },
            );
            let resJson = <{ me: { name: string }[] }>res.data;
            expect(resJson.me).toHaveLength(1);
            expect(resJson.me[0].name).toEqual("Alice");

            res = await client.newTxn().queryWithVars(
                "query me($a: string) { me(func: eq(name, $a)) { name }}",
                {
                    $a: "Alice",
                    $b: true, // non-string properties are ignored
                },
            );
            resJson = <{ me: { name: string }[] }>res.data; // tslint:disable-line no-unsafe-any
            expect(resJson.me).toHaveLength(1);
            expect(resJson.me[0].name).toEqual("Alice");
        });

        it("should ignore properties with non-string values", async () => {
            const res = await client.newTxn().queryWithVars(
                "query me($a: string) { me(func: eq(name, $a)) { name }}",
                {
                    $a: 1, // non-string properties are ignored
                },
            );
            const resJson = <{ me: { name: string }[] }>res.data; // tslint:disable-line no-unsafe-any
            expect(resJson.me).toHaveLength(0);
        });

        it("should throw finished error if txn is already finished", async () => {
            const txn = client.newTxn();
            await txn.commit();

            const p = txn.queryWithVars(
                '{ me(func: eq(name, "Alice")) { name }}',
            );
            await expect(p).rejects.toBe(dgraph.ERR_FINISHED);
        });

        it("should pass debug option to the server", async () => {
          client = await setup();
          const txn = client.newTxn();
          await txn.mutate({
              setJson: { name: "Alice" },
          });
          await txn.commit();

          // This shouldn't be necessary, but https://github.com/dgraph-io/dgraph/issues/3622
          client.logout();

          const queryTxn = client.newTxn();

          const resp = queryTxn.query(
              "{ me(func: has(name)) { name }}",
              { debug: true },
          );

          await expect(resp).resolves.toHaveProperty("data.me.0.uid");

          const resp2 = queryTxn.query(
              "{ me(func: has(name)) { name }}",
          );
          // Query without debug shouldn't return uid.
          await expect(resp2).resolves.not.toHaveProperty("data.me.0.uid");
        });
    });

    describe("mutate", () => {
        beforeAll(async () => {
            client = await setup();
            await setSchema(client, "name: string @index(exact) .");
        });

        it("should throw finished error if txn is already finished", async () => {
            const txn = client.newTxn();
            await txn.commit();

            const p = txn.mutate({
                setJson: {
                    name: "Alice",
                },
            });
            await expect(p).rejects.toBe(dgraph.ERR_FINISHED);
        });

        it("should throw error and discard if Stub.mutate throws an error", async () => {
            const txn = client.newTxn();

            // There is an error in the mutation NQuad.
            const p1 = txn.mutate({
                setNquads: 'alice <name> "Alice" .',
            });
            await expect(p1).rejects.toBeDefined();

            const p2 = txn.commit();
            await expect(p2).rejects.toBe(dgraph.ERR_FINISHED);
        });
    });

    describe("commit", () => {
        beforeAll(async () => {
            client = await setup();
            await setSchema(client, "name: string @index(exact) .");
        });

        it("should throw finished error if txn is already finished", async () => {
            const txn = client.newTxn();
            await txn.commit();

            const p = txn.commit();
            await expect(p).rejects.toBe(dgraph.ERR_FINISHED);
        });

        it("should throw finished error after mutation with commitNow", async () => {
            const txn = client.newTxn();
            await txn.mutate({
                setJson: {
                    name: "Alice",
                },
                commitNow: true,
            });

            const p = txn.commit();
            await expect(p).rejects.toBe(dgraph.ERR_FINISHED);
        });
    });

    describe("discard", () => {
        beforeAll(async () => {
            client = await setup();
            await setSchema(client, "name: string @index(exact) .");
        });

        it("should resolve and do nothing if txn is already finished", async () => {
            const txn = client.newTxn();
            await txn.commit();

            const p = txn.discard();
            await expect(p).resolves.toBeUndefined();
        });

        it("should resolve and do nothing after mutation with commitNow", async () => {
            const txn = client.newTxn();
            await txn.mutate({
                setJson: {
                    name: "Alice",
                },
                commitNow: true,
            });

            const p = txn.discard();
            await expect(p).resolves.toBeUndefined();
        });
    });
});
