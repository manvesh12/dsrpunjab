import assert from "node:assert/strict";
import test from "node:test";
import type { AuthUser } from "../../src/authentication/auth-user.js";
import type { StorageService } from "../../src/storage/storage.service.js";
import { UploadsService } from "../../src/uploads/uploads.service.js";
import type { UploadsRepositoryContract } from "../../src/uploads/uploads.repository.js";

const admin = {
  id: 1n,
  username: "admin",
  email: "admin@example.test",
  fullName: "Admin",
  role: "SUPER_ADMIN",
  districtId: null,
  blockName: null,
  sectionName: null,
  accessScope: null,
} satisfies AuthUser;

const unusedStorage = {
  putFile: async () => undefined,
  getFile: async () => Buffer.alloc(0),
  deleteFile: async () => undefined,
} satisfies Pick<StorageService, "putFile" | "getFile" | "deleteFile">;

test("file listing is project-scoped and supports modern plus legacy prefixes", async () => {
  let listedProjectId = 0n;
  let listedPrefixes: string[] = [];
  const repository = {
    findProject: async () => ({ id: 81n, districtId: null }),
    list: async (projectId: bigint, prefixes: string[]) => {
      listedProjectId = projectId;
      listedPrefixes = prefixes;
      return [{
        id: 7n,
        projectId,
        annexureId: "file-front-matter-1",
        fileName: "cover.pdf",
        objectKey: "projects/81/files/front-matter/cover/file-front-matter-1-cover.pdf",
        contentType: "application/pdf",
        sizeBytes: 123,
        createdAt: new Date("2026-08-08T10:00:00Z"),
      }];
    },
  } as unknown as UploadsRepositoryContract;

  const files = await new UploadsService(repository, unusedStorage).list(
    "81",
    "front-matter",
    "cover",
    admin
  );

  assert.equal(listedProjectId, 81n);
  assert.deepEqual(listedPrefixes, [
    "projects/81/files/front-matter/cover/",
    "files/81/front-matter/cover/",
  ]);
  assert.equal(files[0].savedName, "file-front-matter-1");
  assert.match(files[0].url, /projectId=81&inline=true$/);
});

test("file listing rejects a partial module filter", async () => {
  const repository = {
    findProject: async () => ({ id: 81n, districtId: null }),
  } as unknown as UploadsRepositoryContract;

  await assert.rejects(
    () => new UploadsService(repository, unusedStorage).list("81", "front-matter", "", admin),
    (error: unknown) => typeof error === "object" && error !== null &&
      "code" in error && error.code === "FILE_FILTER_INVALID"
  );
});
