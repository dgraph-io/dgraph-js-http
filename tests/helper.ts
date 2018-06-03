import * as dgraph from "../src";

export function createLinRead(...ids: [number, number][]): dgraph.LinRead {
    const lr = { ids: {} };
    for (const [k, v] of ids) {
        lr.ids[k.toString()] = v;
    }

    return lr;
}

export function areLinReadsEqual(a: dgraph.LinRead, b: dgraph.LinRead): boolean {
    let ans = true;
    Object.keys(a.ids).forEach((key: string) => {
        if (b.ids[key] !== a.ids[key]) {
            ans = false;
        }
    });
    Object.keys(b.ids).forEach((key: string) => {
        if (a.ids[key] !== b.ids[key]) {
            ans = false;
        }
    });

    return ans;
}

export const SERVER_ADDR = "http://localhost:8080"; // tslint:disable-line no-http-string

export function createClient(): dgraph.DgraphClient {
    return new dgraph.DgraphClient(new dgraph.DgraphClientStub(SERVER_ADDR));
}

export function setSchema(c: dgraph.DgraphClient, schema: string): Promise<dgraph.Payload> {
    return c.alter({ schema });
}

export function dropAll(c: dgraph.DgraphClient): Promise<dgraph.Payload> {
    return c.alter({ dropAll: true });
}

export async function setup(): Promise<dgraph.DgraphClient> {
    const c = createClient();
    await dropAll(c);
    return c;
}

export function wait(time: number): Promise<void> {
    return new Promise((resolve: (value?: void | PromiseLike<void>) => void): void => {
        const id = setTimeout(
            () => {
                clearTimeout(id);
                resolve();
            },
            time,
        );
    });
}
