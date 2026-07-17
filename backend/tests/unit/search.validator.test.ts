import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "../../src/common/exceptions/api-error.js";
import { indexRequest, searchRequest } from "../../src/search/search.validator.js";

test("semantic search keeps the default result limit", () => {
  assert.deepEqual(searchRequest({ query: "river sediment" }), { query: "river sediment", limit: 5 });
});

test("search indexing requires project and content", () => {
  assert.throws(
    () => indexRequest({ projectId: 1 }),
    (error: unknown) => error instanceof ApiError && error.status === 400
  );
});
