import assert from "node:assert/strict";
import test from "node:test";
import { ProjectStatus, Role } from "@prisma/client";
import { ApiError } from "../../src/common/exceptions/api-error.js";
import type { AuthUser } from "../../src/lib/auth.js";
import { ProjectsService } from "../../src/projects/projects.service.js";
import type { ProjectsRepositoryContract } from "../../src/projects/projects.repository.js";
import { parseProjectStatus, phaseProjectName } from "../../src/projects/projects.validator.js";
import type { StorageService } from "../../src/storage/storage.service.js";

const officer: AuthUser = {
  id: 8n, username: "officer", email: "officer@example.test", fullName: "Officer", role: Role.OFFICER,
  district: "Jalandhar", blockName: null, sectionName: null, accessScope: null
};

test("project status keeps legacy normalization and fallback", () => {
  assert.equal(parseProjectStatus("in progress"), ProjectStatus.IN_PROGRESS);
  assert.equal(parseProjectStatus("completed"), ProjectStatus.COMPLETED);
  assert.equal(parseProjectStatus("unknown"), ProjectStatus.IN_PROGRESS);
});

test("phase names replace an existing phase suffix", () => {
  assert.equal(phaseProjectName({ projectName: "Jalandhar DSR - Phase 2", district: "Jalandhar", phaseNo: 2 }, 3), "Jalandhar DSR - Phase 3");
});

test("district officer cannot create a project for another district", async () => {
  const repository = {} as ProjectsRepositoryContract;
  const storage = { deleteFile: async () => undefined } as Pick<StorageService, "deleteFile">;
  const service = new ProjectsService(repository, storage);
  await assert.rejects(
    () => service.create({ district: "Ludhiana" }, officer),
    (error: unknown) => error instanceof ApiError && error.status === 403 && error.message === "You can create reports only for your assigned district."
  );
});
