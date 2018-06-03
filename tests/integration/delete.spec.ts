import { setSchema, setup } from "../helper";

describe("delete", () => {
    it("should delete node", async () => {
        const client = await setup();

        const ag = await client.newTxn().mutate({ setJson: { name: "Alice" }, commitNow: true });
        const uid = ag.data.uids["blank-0"];

        const q = `{
            find_bob(func: uid(${uid})) {
                name
            }
        }`;
        let res = await client.newTxn().query(q);
        expect((<{ find_bob: { name: string }[] }>res.data).find_bob[0].name).toEqual("Alice");

        await client.newTxn().mutate({ deleteNquads: `<${uid}> * * .`, commitNow: true });
        res = await client.newTxn().query(q);
        expect((<{ find_bob: { name: string }[] }>res.data).find_bob).toHaveLength(0);
    });

    it("should delete edges", async () => {
        const client = await setup();
        await setSchema(client, "age: int .\nmarried: bool .");

        const ag = await client.newTxn().mutate({
            setJson: {
                name: "Alice",
                age: 26,
                loc: "Riley Street",
                married: true,
                schools: [
                    {
                        name: "Crown Public School",
                    },
                ],
                friends: [
                    {
                        name: "Bob",
                        age: 24,
                    },
                    {
                        name: "Charlie",
                        age: 29,
                    },
                ],
            },
            commitNow: true,
        });
        const uid = ag.data.uids["blank-0"];

        const q = `{
            me(func: uid(${uid})) {
                uid
                name
                age
                loc
                married
                friends {
                    uid
                    name
                    age
                }
                schools {
                    uid
                    name
                }
            }
        }`;
        let res = await client.newTxn().query(q);
        expect((<{ me: { friends: string[] }[] }>res.data).me[0].friends.length).toBe(2);

        await client.newTxn().mutate({ deleteNquads: `<${uid}> <friends> * .`, commitNow: true });
        res = await client.newTxn().query(q);
        expect((<{ me: { friends: string[] }[] }>res.data).me[0].friends).toBeFalsy();
    });
});
