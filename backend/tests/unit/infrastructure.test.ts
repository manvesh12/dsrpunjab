import assert from "node:assert/strict";
import test from "node:test";
import { Role } from "@prisma/client";
import { TokenService } from "../../src/authentication/token.service.js";
import { canAdmin, canReview, canUpload, roleToFrontend } from "../../src/authorization/role.policy.js";
import { HealthService } from "../../src/health/health.service.js";
import type { AuthUser } from "../../src/authentication/auth-user.js";

test("token service preserves the authenticated user subject", () => {
  const service = new TokenService();
  const user = { id: 42n, username: "officer", role: Role.OFFICER } as AuthUser;
  assert.equal(service.subject(service.sign(user)), 42n);
});

test("role policy preserves frontend and capability mappings", () => {
  assert.equal(roleToFrontend(Role.STATE_ADMIN), "admin");
  assert.equal(roleToFrontend(Role.REVIEWER_2), "reviewer");
  assert.equal(canAdmin(Role.STATE_ADMIN), true);
  assert.equal(canReview(Role.DISTRICT_OWNER), true);
  assert.equal(canUpload(Role.OFFICER), true);
});

test("health readiness reports the existing dependency contract", async () => {
  const service = new HealthService({ checkDatabase: async () => undefined });
  assert.deepEqual(await service.ready(), { status: "ready", db: "ok", redis: "ok" });
});

test("health readiness propagates database failure to the controller boundary", async () => {
  const service = new HealthService({ checkDatabase: async () => { throw new Error("database offline"); } });
  await assert.rejects(() => service.ready(), /database offline/);
});
