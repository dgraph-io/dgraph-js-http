import * as dgraph from "../../src";

import { setup } from "../helper";

describe("conflict", () => {
    it("should abort on commit conflict", async () => {
        const client = await setup();
        const txn1 = client.newTxn();

        const ag = await txn1.mutate({ setJson: { name: "Alice" } });
        const uid = Object.entries(ag.data.uids)[0][1];

        const txn2 = client.newTxn();
        await txn2.mutate({ setJson: { uid, name: "Alice" } });

        const p1 = txn1.commit();
        await expect(p1).resolves.toBeUndefined();

        const p2 = txn2.commit();
        await expect(p2).rejects.toBe(dgraph.ERR_ABORTED);
    });
});
