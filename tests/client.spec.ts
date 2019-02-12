import * as dgraph from "../src";

import { createClient } from "./helper";

describe("client", () => {
    describe("constructor", () => {
        it("should throw no clients error if no client stubs are passed", () => {
            expect.assertions(1);

            try {
                new dgraph.DgraphClient(); // tslint:disable-line no-unused-expression
            } catch (e) {
                expect(e).toBe(dgraph.ERR_NO_CLIENTS);
            }
        });

        it("should handle debug mode", () => {
            // tslint:disable no-console
            console.log = jest.fn();

            const msg = "test message";
            const client = createClient();

            client.debug(msg);
            expect(console.log).not.toHaveBeenCalled();

            client.setDebugMode();
            client.debug(msg);
            expect(console.log).toHaveBeenCalledTimes(1);

            client.setDebugMode(false);
            client.debug(msg);
            expect(console.log).toHaveBeenCalledTimes(1);
            // tslint:enable no-console
        });
    });
});
