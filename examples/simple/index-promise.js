const dgraph = require("dgraph-js-http");

// Create a client stub.
function newClientStub() {
    return new dgraph.DgraphClientStub("http://localhost:8080");
}

// Create a client.
function newClient(clientStub) {
    return new dgraph.DgraphClient(clientStub);
}

// Drop All - discard all data and start from a clean slate.
function dropAll(dgraphClient) {
    return dgraphClient.alter({ dropAll: true });
}

// Set schema.
function setSchema(dgraphClient) {
    const schema = `
        name: string @index(exact) .
        age: int .
        married: bool .
        loc: geo .
        dob: datetime .
    `;
    return dgraphClient.alter({ schema: schema });
}

// Create data using JSON.
function createData(dgraphClient) {
    // Create a new transaction.
    const txn = dgraphClient.newTxn();

    // Create data.
    const p = {
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

    let assigned;
    let err;

    // Run mutation.
    return txn.mutate({ setJson: p }).then((res) => {
        assigned = res;

        // Commit transaction.
        return txn.commit();
    }).then(() => {
        // Get uid of the outermost object (person named "Alice").
        // Assigned#getUidsMap() returns a map from blank node names to uids.
        // For a json mutation, blank node names "blank-0", "blank-1", ... are used
        // for all the created nodes.
        console.log(`Created person named "Alice" with uid = ${assigned.data.uids["blank-0"]}\n`);

        console.log("All created nodes (map from blank node names to uids):");
        for (let key in assigned.data.uids) {
            if (Object.hasOwnProperty(assigned.data.uids, key)) {
                console.log(`${key}: ${assigned.data.uids[key]}`);
            }
        }
        console.log();
    }).catch((e) => {
        err = e;
    }).then(() => {
        return txn.discard();
    }).then(() => {
        if (err != null) {
            throw err;
        }
    });
}

// Query for data.
function queryData(dgraphClient) {
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

    return dgraphClient.newTxn().queryWithVars(query, vars).then((res) => {
        const ppl = res.data;

        // Print results.
        console.log(`Number of people named "Alice": ${ppl.all.length}`);
        for (let i = 0; i < ppl.all.length; i++) {
            console.log(ppl.all[i]);
        }
    });
}

function main() {
    const dgraphClientStub = newClientStub();
    const dgraphClient = newClient(dgraphClientStub);
    return dropAll(dgraphClient).then(() => {
        return setSchema(dgraphClient);
    }).then(() => {
        return createData(dgraphClient);
    }).then(() => {
        return queryData(dgraphClient);
    });
}

main().then(() => {
    console.log("\nDONE!");
}).catch((e) => {
    console.log("ERROR: ", e);
});
