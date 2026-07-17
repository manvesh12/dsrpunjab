import assert from "node:assert/strict";
import test from "node:test";
import { Role } from "@prisma/client";
import { InvitedRegistrationService } from "../../src/auth/invited-registration.service.js";

test("invited OTP verification accepts new and legacy purpose records", async () => {
  let requestedPurposes: string[] = [];
  const invitation = {
    id: "invite-1", email: "officer@example.test", role: Role.OFFICER, fullName: "Officer",
    district: "Jalandhar", department: null, designation: null, state: "Punjab", mobileNumber: "9876543210",
    token: "token", status: "OTP_SENT", expiresAt: new Date(Date.now() + 60_000), createdBy: 1n,
    pendingProfile: { fullName: "Officer", mobileNumber: "9876543210" }, pendingPasswordHash: "hash",
    otpResendCount: 0, otpLastSentAt: new Date(), registeredAt: null, createdAt: new Date()
  };
  const user = {
    id: 2n, username: invitation.email, email: invitation.email, fullName: "Officer", password: "hash",
    role: Role.OFFICER, district: "Jalandhar", blockName: null, sectionName: null, accessScope: null,
    mobileNumber: "9876543210", active: true, createdAt: new Date(), updatedAt: new Date()
  };
  const repository = {
    findInvitation: async () => invitation,
    findOtp: async (_email: string, purposes: string[]) => {
      requestedPurposes = purposes;
      return { id: 3n, otpHash: "otp-hash", expiresAt: new Date(Date.now() + 60_000), attemptCount: 0 };
    },
    completeInvitation: async () => user
  };
  const service = new InvitedRegistrationService(
    repository as any,
    { verify: async () => true } as any,
    {} as any,
    { create: async () => ({ token: "jwt", refreshToken: "refresh", response: { token: "jwt" } }) } as any,
    async () => true,
    async () => true
  );

  const result = await service.verify("token", "123456", () => undefined);
  assert.deepEqual(requestedPurposes, ["INVITE_REGISTER", "REGISTER"]);
  assert.equal(result.response.success, true);
});
