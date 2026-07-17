import assert from "node:assert/strict";
import test from "node:test";
import { Role } from "@prisma/client";
import { ApiError } from "../../src/common/exceptions/api-error.js";
import { normalizeRole, normalizedBulkRole, requiredDistrict, rowValue } from "../../src/users/users.validator.js";

test("legacy DATA_ENTRY role still maps to OFFICER", () => {
  assert.equal(normalizeRole("data_entry"), Role.OFFICER);
  assert.equal(normalizedBulkRole("District Owner"), Role.DISTRICT_OWNER);
});

test("district remains mandatory for non-admin users", () => {
  assert.throws(
    () => requiredDistrict("", Role.OFFICER),
    (error: unknown) => error instanceof ApiError && error.status === 400 && error.message === "District is required for every non-admin account."
  );
  assert.equal(requiredDistrict("", Role.ADMIN), null);
});

test("bulk spreadsheet headers are matched case-insensitively", () => {
  assert.equal(rowValue({ "Phone/Mobile": "9876543210" }, "phone"), "9876543210");
});
