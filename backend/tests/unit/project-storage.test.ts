import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { ApiError } from "../../src/common/exceptions/api-error.js";
import { LocalStorageProvider } from "../../src/storage/local-storage.provider.js";
import { projectFileObjectKey, projectStoragePrefix } from "../../src/storage/project-storage.js";

async function withTemporaryStorage(
  run: (provider: LocalStorageProvider, uploadsDirectory: string, temporaryDirectory: string) => Promise<void>
) {
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "dsr-project-storage-"));
  const uploadsDirectory = path.join(temporaryDirectory, "uploads");
  const provider = new LocalStorageProvider(uploadsDirectory);

  try {
    await run(provider, uploadsDirectory, temporaryDirectory);
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
}

test("project storage helpers build stable project-scoped prefixes and object keys", () => {
  assert.equal(projectStoragePrefix(42n), "projects/42");
  assert.equal(projectStoragePrefix(7), "projects/7");
  assert.equal(projectStoragePrefix("19"), "projects/19");
  assert.equal(
    projectFileObjectKey(42n, "annexure-iv", "requirement-2", "file-123-evidence.pdf"),
    "projects/42/files/annexure-iv/requirement-2/file-123-evidence.pdf"
  );
});

test("project storage helpers reject invalid project identifiers", () => {
  for (const projectId of ["", "0", "-1", "1.5", "1/2", "../42", "project-42"]) {
    assert.throws(
      () => projectStoragePrefix(projectId),
      (error: unknown) => error instanceof ApiError &&
        error.status === 400 &&
        error.code === "PROJECT_STORAGE_ID_INVALID"
    );
  }
});

test("local storage preserves nested project paths for writes and reads", async () => {
  await withTemporaryStorage(async (provider, uploadsDirectory) => {
    const objectKey = "projects/11/files/annexure-iv/requirement-1/evidence.pdf";
    const bytes = Buffer.from("project eleven evidence");

    await provider.put(objectKey, bytes);

    assert.deepEqual(await provider.get(objectKey), bytes);
    assert.deepEqual(
      await fs.readFile(path.join(uploadsDirectory, "projects", "11", "files", "annexure-iv", "requirement-1", "evidence.pdf")),
      bytes
    );

    await provider.ensurePrefix("projects/12");
    assert.equal((await fs.stat(path.join(uploadsDirectory, "projects", "12"))).isDirectory(), true);
  });
});

test("local storage rejects traversal segments before writing outside its root", async () => {
  await withTemporaryStorage(async (provider, _uploadsDirectory, temporaryDirectory) => {
    for (const objectKey of ["../outside.txt", "projects/11/../../outside.txt", "projects/./11/file.txt", "projects/11/bad\0name.txt"]) {
      await assert.rejects(() => provider.put(objectKey, Buffer.from("unsafe")), /Unsafe storage object key/);
    }

    await assert.rejects(() => fs.access(path.join(temporaryDirectory, "outside.txt")), { code: "ENOENT" });
  });
});

test("local storage reads and deletes files written with the legacy flattened key", async () => {
  await withTemporaryStorage(async (provider, uploadsDirectory) => {
    const objectKey = "projects/22/files/module/requirement/legacy.txt";
    const legacyPath = path.join(uploadsDirectory, "projects_22_files_module_requirement_legacy.txt");
    const bytes = Buffer.from("legacy evidence");
    await fs.mkdir(uploadsDirectory, { recursive: true });
    await fs.writeFile(legacyPath, bytes);

    assert.deepEqual(await provider.get(objectKey), bytes);

    await provider.delete(objectKey);
    await assert.rejects(() => fs.access(legacyPath), { code: "ENOENT" });
  });
});

test("local storage copies nested and legacy objects into a project folder", async () => {
  await withTemporaryStorage(async (provider, uploadsDirectory) => {
    await provider.put("projects/25/files/source/nested.pdf", Buffer.from("nested"));
    await provider.copy(
      "projects/25/files/source/nested.pdf",
      "projects/26/files/inherited/nested.pdf"
    );
    assert.equal(
      (await provider.get("projects/26/files/inherited/nested.pdf")).toString(),
      "nested"
    );

    const legacyKey = "files/25/source/legacy.pdf";
    await fs.mkdir(uploadsDirectory, { recursive: true });
    await fs.writeFile(
      path.join(uploadsDirectory, "files_25_source_legacy.pdf"),
      Buffer.from("legacy")
    );
    await provider.copy(legacyKey, "projects/26/files/inherited/legacy.pdf");
    assert.equal(
      (await provider.get("projects/26/files/inherited/legacy.pdf")).toString(),
      "legacy"
    );
  });
});

test("deletePrefix removes only the exact project folder", async () => {
  await withTemporaryStorage(async provider => {
    const deletedProjectKey = "projects/31/files/module/requirement/remove.txt";
    const neighboringProjectKey = "projects/310/files/module/requirement/keep.txt";
    const otherProjectKey = "projects/32/files/module/requirement/keep-too.txt";

    await provider.put(deletedProjectKey, Buffer.from("remove"));
    await provider.put(neighboringProjectKey, Buffer.from("keep neighboring prefix"));
    await provider.put(otherProjectKey, Buffer.from("keep other project"));

    await provider.deletePrefix("projects/31");

    await assert.rejects(() => provider.get(deletedProjectKey), { code: "ENOENT" });
    assert.equal((await provider.get(neighboringProjectKey)).toString(), "keep neighboring prefix");
    assert.equal((await provider.get(otherProjectKey)).toString(), "keep other project");
  });
});
