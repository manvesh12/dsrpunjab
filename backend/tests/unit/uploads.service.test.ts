import assert from "node:assert/strict";
import test from "node:test";
import { Role } from "@prisma/client";
import type { AuthUser } from "../../src/lib/auth.js";
import { UploadsService } from "../../src/uploads/uploads.service.js";
import type { UploadsRepositoryContract } from "../../src/uploads/uploads.repository.js";
import type { StorageService } from "../../src/storage/storage.service.js";

const admin: AuthUser = {
  id: 1n, username: "admin", email: "admin@example.test", fullName: "Admin", role: Role.ADMIN,
  district: null, blockName: null, sectionName: null, accessScope: null
};

test("failed metadata persistence compensates the stored object", async () => {
  const deleted: string[] = [];
  const repository = {
    findProject: async () => ({ id: 5n, district: "Jalandhar" }),
    create: async () => { throw new Error("database failed"); }
  } as UploadsRepositoryContract;
  const storage: Pick<StorageService, "putFile" | "getFile" | "deleteFile"> = {
    putFile: async () => undefined,
    getFile: async () => Buffer.alloc(0),
    deleteFile: async key => { deleted.push(key); }
  };

  const service = new UploadsService(repository, storage);
  await assert.rejects(() => service.upload({ projectIdValue: "5", originalName: "survey.pdf", bytes: Buffer.from("pdf") }, admin));
  assert.equal(deleted.length, 1);
  assert.match(deleted[0], /^files\/5\/replenishment\/upload\//);
});
