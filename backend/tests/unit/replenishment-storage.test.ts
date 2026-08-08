import assert from "node:assert/strict";
import test from "node:test";
import type { AuthUser } from "../../src/authentication/auth-user.js";
import { ReplenishmentService } from "../../src/replenishment/replenishment.service.js";
import type { ReplenishmentRepositoryContract } from "../../src/replenishment/replenishment.repository.js";
import type { StorageService } from "../../src/storage/storage.service.js";

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

test("replenishment uploads are persisted inside their project folder", async () => {
  let storedKey = "";
  let createdData: Record<string, unknown> | undefined;
  const repository = {
    findById: async () => ({ id: "study-1", projectId: 44n }),
    findProject: async () => ({ id: 44n, districtId: null }),
    createFile: async (data: Record<string, unknown>) => {
      createdData = data;
      return { id: "file-1", createdAt: new Date("2026-08-08T00:00:00Z"), ...data };
    },
  } as unknown as ReplenishmentRepositoryContract;
  const storage: Pick<StorageService, "putFile" | "getFile" | "deleteFile"> = {
    putFile: async (key) => { storedKey = key; },
    getFile: async () => Buffer.alloc(0),
    deleteFile: async () => undefined,
  };

  const uploaded = await new ReplenishmentService(repository, storage).upload("study-1", {
    sectionId: "evidence",
    originalName: "survey.pdf",
    bytes: Buffer.from("pdf"),
    declaredContentType: "application/pdf",
  }, admin);

  assert.match(storedKey, /^projects\/44\/replenishment\/study-1\/evidence\/[a-f0-9-]+-survey\.pdf$/);
  assert.equal(createdData?.objectKey, storedKey);
  assert.equal(createdData?.replenishmentId, "study-1");
  assert.equal(createdData?.uploadedBy, 1n);
  assert.equal(uploaded.objectKey, storedKey);
});

test("replenishment upload removes the object when metadata persistence fails", async () => {
  const deleted: string[] = [];
  const repository = {
    findById: async () => ({ id: "study-2", projectId: 45n }),
    findProject: async () => ({ id: 45n, districtId: null }),
    createFile: async () => { throw new Error("database unavailable"); },
  } as unknown as ReplenishmentRepositoryContract;
  const storage: Pick<StorageService, "putFile" | "getFile" | "deleteFile"> = {
    putFile: async () => undefined,
    getFile: async () => Buffer.alloc(0),
    deleteFile: async key => { deleted.push(key); },
  };

  await assert.rejects(
    () => new ReplenishmentService(repository, storage).upload("study-2", {
      sectionId: "maps",
      originalName: "river.png",
      bytes: Buffer.from("png"),
      declaredContentType: "image/png",
    }, admin),
    /database unavailable/
  );
  assert.equal(deleted.length, 1);
  assert.match(deleted[0], /^projects\/45\/replenishment\/study-2\/maps\//);
});
