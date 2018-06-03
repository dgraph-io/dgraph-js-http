import * as dgraph from "../../src";

import { setSchema, setup } from "../helper";

const data = ["200", "300", "400"];

describe("mutate", () => {
    it("should insert NQuads", async () => {
        const client = await setup();
        await setSchema(client, "name: string @index(fulltext) .");

        const uids: string[] = [];
        let txn = client.newTxn();
        try {
            for (const datum of data) {
                const ag = await txn.mutate({ setNquads: `_:${datum} <name> "ok ${datum}" .` });
                uids.push(ag.data.uids[datum]);
            }

            await txn.commit();
        } finally {
            await txn.discard();
        }

        txn = client.newTxn();
        const query = `{ me(func: uid(${uids.join(",")})) { name }}`;
        const res = await txn.query(query);
        await txn.commit();

        expect(res.data).toEqual({ me: [{ name: "ok 200" }, { name: "ok 300" }, { name: "ok 400" }] });
    });
});
