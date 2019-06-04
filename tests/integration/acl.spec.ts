import { setSchema, setup } from "../helper";

const data = ["200", "300", "400"];

describe("ACL Login", () => {
    it("should login and use JWT tokens", async () => {
        const client = await setup("groot", "password");

        await client.login("groot", "password");

        try {
            await client.login("groot", "12345678");
            throw new Error("Server should not accept wrong password");
        } catch (e) {
          // Expected to throw an error for wrong password.
        }

        try {
            await client.login("Groot", "password");
            throw new Error("Server should not accept wrong userid");
        } catch (e) {
          // Expected to throw an error for wrong password.
        }

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
