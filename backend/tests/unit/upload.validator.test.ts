import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "../../src/common/exceptions/api-error.js";
import { displayFileName, safeFileName, validateUpload } from "../../src/uploads/upload.validator.js";

test("upload names remove paths and unsafe characters", () => {
  assert.equal(safeFileName("../folder/river<>survey.pdf"), "..-folder-river_survey.pdf");
  assert.equal(displayFileName("../ਪੰਜਾਬ/ਦਰਿਆ ਰਿਪੋਰਟ.pdf"), "..-ਪੰਜਾਬ-ਦਰਿਆ ਰਿਪੋਰਟ.pdf");
});

test("unsupported files return a 400 decision", () => {
  assert.throws(
    () => validateUpload("payload.exe", Buffer.from("x")),
    (error: unknown) => error instanceof ApiError && error.status === 400 && error.message === "Unsupported file format"
  );
});
