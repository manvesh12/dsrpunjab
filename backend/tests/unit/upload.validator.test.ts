import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "../../src/common/exceptions/api-error.js";
import { safeFileName, validateUpload } from "../../src/uploads/upload.validator.js";

test("upload names remove paths and unsafe characters", () => {
  assert.equal(safeFileName("../folder/river<>survey.pdf"), "..-folder-river_survey.pdf");
});

test("unsupported replenishment files return the existing 400 decision", () => {
  assert.throws(
    () => validateUpload("payload.exe", Buffer.from("x")),
    (error: unknown) => error instanceof ApiError && error.status === 400 && error.message === "Unsupported file format for replenishment upload"
  );
});
