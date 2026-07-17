import assert from "node:assert/strict";
import test from "node:test";
import { Role, type Prisma } from "@prisma/client";
import type { AuthUser } from "../../src/lib/auth.js";
import { ReplenishmentService } from "../../src/replenishment/replenishment.service.js";
import type { ReplenishmentRepositoryContract } from "../../src/replenishment/replenishment.repository.js";

const user: AuthUser = {
  id: 7n, username: "jalandhar", email: "j@example.test", fullName: "Jalandhar Officer",
  role: Role.OFFICER, district: "Jalandhar", blockName: null, sectionName: null, accessScope: null
};

test("replenishment creation preserves DSR sync and incoming override behavior", async () => {
  let created: Prisma.ReplenishmentStudyUncheckedCreateInput | undefined;
  const repository = {
    findProjectForSync: async () => ({
      id: 5n, projectName: "DSR Jalandhar", title: null, district: "Jalandhar", year: "2025-26",
      mineral: "Sand", rivers: "Sutlej", projectState: JSON.stringify({ rainfall: { annual: 700 }, geology: { type: "alluvial" } })
    }),
    create: async (data: Prisma.ReplenishmentStudyUncheckedCreateInput) => { created = data; return data as any; }
  } as ReplenishmentRepositoryContract;

  await new ReplenishmentService(repository).create(5n, { reportState: { rainfall: { annual: 800 } }, surveyData: { drone: true } }, user);

  assert.equal(created?.title, "Replenishment Study - DSR Jalandhar");
  assert.equal(created?.createdBy, 7n);
  assert.deepEqual((created?.reportState as any).rainfall, { annual: 800 });
  assert.deepEqual(created?.surveyData, { drone: true });
});
