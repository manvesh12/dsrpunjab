import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "../../src/common/exceptions/api-error.js";
import { PasswordService } from "../../src/auth/security/password.service.js";

test("password policy preserves the existing ten-character letter/number rule", () => {
  const passwords = new PasswordService();
  assert.throws(
    () => passwords.validate("short"),
    (error: unknown) => error instanceof ApiError && error.status === 400
  );
  passwords.validate("securepass1");
});
