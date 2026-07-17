import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "../../src/common/exceptions/api-error.js";
import { SettingsService } from "../../src/settings/settings.service.js";
import type { SettingsRepositoryContract } from "../../src/settings/settings.repository.js";

function repository(overrides: Partial<SettingsRepositoryContract> = {}): SettingsRepositoryContract {
  return {
    findByKey: async () => null,
    upsert: async ({ key, value }) => ({ key, value, updatedAt: new Date(0) }),
    ...overrides
  };
}

test("settings service preserves the public default when no row exists", async () => {
  const service = new SettingsService(repository());
  const setting = await service.getByKey("noticeText");
  assert.equal(setting.key, "noticeText");
  assert.equal(setting.updatedAt, null);
});

test("settings service marks fallback data as degraded after a database failure", async () => {
  const service = new SettingsService(repository({ findByKey: async () => { throw new Error("offline"); } }));
  const setting = await service.getByKey("publicAnnouncements");
  assert.equal("degraded" in setting && setting.degraded, true);
});

test("unknown setting keeps the existing 404 behavior", async () => {
  const service = new SettingsService(repository());
  await assert.rejects(() => service.getByKey("unknown"), (error: unknown) => error instanceof ApiError && error.status === 404);
});
