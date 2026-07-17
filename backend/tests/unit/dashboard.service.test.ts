import assert from "node:assert/strict";
import test from "node:test";
import { DashboardService } from "../../src/dashboard/dashboard.service.js";
import type { DashboardStatsRepository } from "../../src/dashboard/dashboard.repository.js";

test("dashboard stats preserve the existing API calculation", async () => {
  const repository: DashboardStatsRepository = {
    countProjects: async () => 9,
    countCompletedReports: async () => 4,
    countGeneratedPdfs: async () => 3
  };

  const service = new DashboardService(repository);

  assert.deepEqual(await service.getStats(), {
    totalProjects: 9,
    completedReports: 4,
    pendingReports: 5,
    generatedPdfs: 3
  });
});

test("dashboard pending count never becomes negative", async () => {
  const repository: DashboardStatsRepository = {
    countProjects: async () => 1,
    countCompletedReports: async () => 2,
    countGeneratedPdfs: async () => 0
  };

  const service = new DashboardService(repository);
  assert.equal((await service.getStats()).pendingReports, 0);
});
