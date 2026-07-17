import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "../../src/common/exceptions/api-error.js";
import { decodePdf, pdfProjectId } from "../../src/pdf/pdf.validator.js";

test("PDF validation accepts a base64 PDF signature", () => {
  const bytes = Buffer.from("%PDF-1.7 test");
  assert.deepEqual(decodePdf(bytes.toString("base64")), bytes);
});

test("PDF project validation preserves the missing-project decision", () => {
  assert.throws(
    () => pdfProjectId("bad"),
    (error: unknown) => error instanceof ApiError && error.status === 400 && error.message === "Missing projectId"
  );
});
