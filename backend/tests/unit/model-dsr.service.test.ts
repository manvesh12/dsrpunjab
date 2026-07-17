import assert from "node:assert/strict";
import test from "node:test";
import { Role, SectionContentType } from "@prisma/client";
import { ApiError } from "../../src/common/exceptions/api-error.js";
import type { AuthUser } from "../../src/lib/auth.js";
import { ModelDsrService } from "../../src/model-dsr/model-dsr.service.js";
import type { ModelDsrRepositoryContract } from "../../src/model-dsr/model-dsr.repository.js";
import { defaultModelDsrSections, normalizeSections, splitSections } from "../../src/model-dsr/section-normalizer.js";

const officer: AuthUser = {
  id: 9n, username: "officer", email: "officer@example.test", fullName: "Officer", role: Role.OFFICER,
  district: "Jalandhar", blockName: null, sectionName: null, accessScope: null
};

test("default Model DSR structure keeps ten chapters and five annexures", () => {
  const sections = defaultModelDsrSections();
  const split = splitSections(sections.map((section, index) => ({ id: String(index), ...section, configuration: section.configuration as any })));
  assert.equal(split.chapters.length, 10);
  assert.equal(split.annexures.length, 5);
});

test("unknown section content types fall back to TEXT", () => {
  assert.equal(normalizeSections([{ sectionName: "Custom", contentType: "UNKNOWN" }])[0].contentType, SectionContentType.TEXT);
});

test("non-admin users cannot create Model DSR templates", async () => {
  const service = new ModelDsrService({} as ModelDsrRepositoryContract);
  await assert.rejects(
    () => service.create({ title: "Template" }, officer),
    (error: unknown) => error instanceof ApiError && error.status === 403 && error.message === "Access denied. Only Admins can manage Model DSRs."
  );
});

test("Model DSR import enforces target project district access", async () => {
  const repository = {
    sectionCount: async () => 1,
    findTemplate: async () => ({ id: "model", title: "Model", sections: [] }),
    findProject: async () => ({ id: 2n, district: "Ludhiana", projectState: null })
  } as ModelDsrRepositoryContract;
  const service = new ModelDsrService(repository);
  await assert.rejects(
    () => service.import("model", { projectId: "2" }, officer),
    (error: unknown) => error instanceof ApiError && error.status === 403
  );
});
