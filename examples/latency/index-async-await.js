const dgraph = require("dgraph-js-http");
const minimist = require("minimist");

// Create a client stub.
function newClientStub(addr) {
    return new dgraph.DgraphClientStub(addr);
}

// Create a client.
function newClient(clientStub, apiKey) {
    c = new dgraph.DgraphClient(clientStub);
    if (apiKey != "") {
        c.setSlashApiKey(apiKey);
    }
    return c;
}

// Drop All - discard all data and start from a clean slate.
async function dropAll(dgraphClient) {
    await dgraphClient.alter({ dropAll: true });
}

// Set schema.
async function setSchema(dgraphClient) {
    const schema = `
        name: string @index(exact) .
        age: int .
        married: bool .
        loc: geo .
        dob: datetime .
    `;
    await dgraphClient.alter({ schema: schema });
}

// Create data using JSON.
async function createData(dgraphClient) {
    // Create a new transaction.
    const txn = dgraphClient.newTxn();
    try {
        // Create data.
        const p = {
            uid: "_:blank-0",
            name: "Alice",
            age: 26,
            married: true,
            loc: {
                type: "Point",
                coordinates: [1.1, 2],
            },
            dob: new Date(1980, 1, 1, 23, 0, 0, 0),
            friend: [
                {
                    name: "Bob",
                    age: 24,
                },
                {
                    name: "Charlie",
                    age: 29,
                }
            ],
            school: [
                {
                    name: "Crown Public School",
                }
            ]
        };

        // Run mutation.
        const assigned = await txn.mutate({ setJson: p });

        // Commit transaction.
        await txn.commit();

        // Get uid of the outermost object (person named "Alice").
        // Assigned#getUidsMap() returns a map from blank node names to uids.
        // For a json mutation, blank node names "blank-0", "blank-1", ... are used
        // for all the created nodes.
        console.log(`Created person named "Alice" with uid = ${assigned.data.uids["blank-0"]}\n`);

        console.log("All created nodes (map from blank node names to uids):");
        Object.keys(assigned.data.uids).forEach((key) => console.log(`${key} => ${assigned.data.uids[key]}`));
        console.log();
    } finally {
        // Clean up. Calling this after txn.commit() is a no-op
        // and hence safe.
        await txn.discard();
    }
}

// Query for data.
// This function also logs the client-side and server-side latency for running the query.
async function queryData(dgraphClient) {
    // Run query.
    const query = `query all($a: string) {
        all(func: eq(name, $a)) {
            uid
            name
            age
            married
            loc
            dob
            friend {
                name
                age
            }
            school {
                name
            }
        }
    }`;
    const vars = { $a: "Alice" };

    console.log("Query:", query.replace(/[\t\n ]+/gm, " "), "Vars:", vars);
    console.time('Query client latency');
    const res = await dgraphClient.newTxn().queryWithVars(query, vars);
    console.timeEnd('Query client latency');
    console.log("Query server latency:", JSON.stringify(res.extensions.server_latency));

    const ppl = res.data;

    // Print results.
    console.log(`Number of people named "Alice": ${ppl.all.length}`);
    ppl.all.forEach((person) => console.log(person));
    return res;
}

async function main() {
    const args = minimist(process.argv.slice(2), {
        string: 'addr',
        string: 'api-key',
        boolean: 'drop-all',
        default: {
            'addr': 'http://localhost:8080'
        },
        alias: { apiKey: 'api-key', dropAll: 'drop-all' }
    });
    const dgraphClientStub = newClientStub(args.addr);
    const dgraphClient = newClient(dgraphClientStub, args.apiKey);
    if (args.dropAll) {
        await dropAll(dgraphClient);
    }
    await setSchema(dgraphClient);
    await createData(dgraphClient);
    await queryData(dgraphClient);
}

main().then(() => {
    console.log("\nDONE!");
}).catch((e) => {
    console.log("ERROR: ", e);
});
