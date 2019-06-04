import * as dgraph from "../src";

export const SERVER_ADDR = "http://localhost:8080"; // tslint:disable-line no-http-string
export const USE_LEGACY_API = false;

export function createClient(): dgraph.DgraphClient {
    return new dgraph.DgraphClient(new dgraph.DgraphClientStub(SERVER_ADDR, USE_LEGACY_API));
}

export function setSchema(c: dgraph.DgraphClient, schema: string): Promise<dgraph.Payload> {
    return c.alter({ schema });
}

export function dropAll(c: dgraph.DgraphClient): Promise<dgraph.Payload> {
    return c.alter({ dropAll: true });
}

export async function setup(userid?: string, password?: string): Promise<dgraph.DgraphClient> {
    const c = createClient();
    if (!USE_LEGACY_API) {
      if (userid === undefined) {
          await c.login("groot", "password");
      } else {
          await c.login(userid, password);
      }
    }
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
