import assert from "node:assert/strict";
import test from "node:test";
import { ALL, GET, POST } from "../src/pages/api/storefront.ts";

test("retires the legacy storefront endpoint for every request method", async () => {
    for (const handler of [GET, POST, ALL]) {
        const response = await handler({});
        assert.equal(response.status, 410);
        assert.equal(response.headers.get("cache-control"), "no-store");
        assert.deepEqual(await response.json(), {
            error: "This storefront endpoint has been retired.",
        });
    }
});
