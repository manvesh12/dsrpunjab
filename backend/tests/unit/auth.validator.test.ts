import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "../../src/common/exceptions/api-error.js";
import { loginInput, registerInvitedInput, resetPasswordInput } from "../../src/auth/auth.validator.js";

test("login validation preserves the required credential message", () => {
  assert.throws(
    () => loginInput({ username: "x" }),
    (error: unknown) => error instanceof ApiError && error.message === "Username and password are required"
  );
});

test("invited registration requires accepted terms", () => {
  assert.throws(
    () => registerInvitedInput({
      token: "token", fullName: "Officer", mobileNumber: "9876543210",
      password: "SecurePass!1", acceptedTerms: false
    }),
    (error: unknown) => error instanceof ApiError && error.message === "Please accept the terms and conditions to continue."
  );
});

test("password reset keeps uppercase/lowercase/number/symbol policy", () => {
  assert.throws(() => resetPasswordInput({ identifier: "a@b.test", otp: "123456", newPassword: "onlyletters" }));
  assert.equal(resetPasswordInput({ identifier: "a@b.test", otp: "123456", newPassword: "SecurePass!1" }).newPassword, "SecurePass!1");
});
