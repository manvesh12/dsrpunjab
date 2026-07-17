import assert from "node:assert/strict";
import test from "node:test";
import { Role } from "@prisma/client";
import { ApiError } from "../../src/common/exceptions/api-error.js";
import { assertProjectDistrictAccess, canAccessProjectDistrict } from "../../src/authorization/project-access.policy.js";
import type { AuthUser } from "../../src/lib/auth.js";

const user: AuthUser = {
  id: 1n,
  username: "officer",
  email: "officer@example.test",
  fullName: "District Officer",
  role: Role.OFFICER,
  district: "Shaheed  Bhagat Singh Nagar",
  blockName: null,
  sectionName: null,
  accessScope: null
};

test("district access normalizes case and repeated whitespace", () => {
  assert.equal(canAccessProjectDistrict(user, "shaheed bhagat singh nagar"), true);
});

test("district access returns the existing forbidden decision", () => {
  assert.throws(
    () => assertProjectDistrictAccess({ district: "Jalandhar" }, user),
    (error: unknown) => error instanceof ApiError && error.status === 403 && error.message === "This project belongs to another district."
  );
});
