import assert from "node:assert/strict";
import test from "node:test";
import type { AuthUser } from "../../src/authentication/auth-user.js";
import { PdfService } from "../../src/pdf/pdf.service.js";
import type { PdfRepositoryContract } from "../../src/pdf/pdf.repository.js";
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

test("failed PDF metadata replacement keeps the previous object intact", async () => {
  const previousKey = "projects/9/pdf/anx3-previous.pdf";
  let uploadedKey = "";
  const deleted: string[] = [];
  const repository = {
    findProject: async () => ({ id: 9n, districtId: null, projectState: null }),
    saveUpload: async () => { throw new Error("database unavailable"); },
  } as unknown as PdfRepositoryContract;
  const storage: Pick<StorageService, "putFile" | "getFile" | "deleteFile"> = {
    putFile: async key => { uploadedKey = key; },
    getFile: async () => Buffer.alloc(0),
    deleteFile: async key => { deleted.push(key); },
  };

  await assert.rejects(
    () => new PdfService(repository, storage).upload({
      projectId: "9",
      annexureId: "anx3",
      fileName: "annexure.pdf",
      pdf: Buffer.from("%PDF-1.4").toString("base64"),
    }, admin),
    /database unavailable/
  );

  assert.match(uploadedKey, /^projects\/9\/pdf\/anx3-[a-f0-9-]+\.pdf$/);
  assert.notEqual(uploadedKey, previousKey);
  assert.deepEqual(deleted, [uploadedKey]);
});

test("PDF deletion removes metadata before the stored object", async () => {
  const events: string[] = [];
  const previousKey = "anx3-9.pdf";
  const repository = {
    findProject: async () => ({ id: 9n, districtId: null, projectState: null }),
    deleteMetadata: async () => {
      events.push("metadata");
      return { objectKey: previousKey };
    },
  } as unknown as PdfRepositoryContract;
  const storage: Pick<StorageService, "putFile" | "getFile" | "deleteFile"> = {
    putFile: async () => undefined,
    getFile: async () => Buffer.alloc(0),
    deleteFile: async () => { events.push("object"); },
  };

  await new PdfService(repository, storage).upload({
    projectId: "9",
    annexureId: "anx3",
    fileName: "",
    pdf: null,
  }, admin);

  assert.deepEqual(events, ["metadata", "object"]);
});
