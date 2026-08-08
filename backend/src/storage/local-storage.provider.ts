import fs from "node:fs/promises";
import path from "node:path";
import type { StorageProvider } from "./storage-provider.js";

export class LocalStorageProvider implements StorageProvider {
  constructor(private readonly uploadsDirectory = path.resolve("uploads")) {}

  async put(objectKey: string, bytes: Buffer) {
    const target = this.pathFor(objectKey);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, bytes);
  }

  async get(objectKey: string) {
    try {
      return await fs.readFile(this.pathFor(objectKey));
    } catch (error) {
      if (!this.isMissing(error)) throw error;
      return fs.readFile(this.legacyPathFor(objectKey));
    }
  }

  async copy(sourceObjectKey: string, destinationObjectKey: string) {
    const source = await this.existingPathFor(sourceObjectKey);
    const destination = this.pathFor(destinationObjectKey);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(source, destination);
  }

  async delete(objectKey: string) {
    await fs.rm(this.pathFor(objectKey), { force: true });
    await fs.rm(this.legacyPathFor(objectKey), { force: true });
  }

  async ensurePrefix(prefix: string) {
    await fs.mkdir(this.pathFor(prefix), { recursive: true });
  }

  async deletePrefix(prefix: string) {
    const target = this.pathFor(prefix);
    const root = path.resolve(this.uploadsDirectory);
    if (target === root) throw new Error("Refusing to delete the storage root");
    await fs.rm(target, { recursive: true, force: true });
  }

  async signedDownloadUrl(objectKey: string) {
    return `/api/files/download/${encodeURIComponent(objectKey)}`;
  }

  private pathFor(objectKey: string) {
    const root = path.resolve(this.uploadsDirectory);
    const segments = String(objectKey).replace(/\\/g, "/").split("/").filter(Boolean);
    if (!segments.length || segments.some((segment) => segment === "." || segment === ".." || segment.includes("\0"))) {
      throw new Error("Unsafe storage object key");
    }
    const target = path.resolve(root, ...segments);
    const relative = path.relative(root, target);
    if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error("Storage object key escapes the upload directory");
    }
    return target;
  }

  private legacyPathFor(objectKey: string) {
    const root = path.resolve(this.uploadsDirectory);
    return path.join(root, String(objectKey).replace(/[\\/]/g, "_"));
  }

  private async existingPathFor(objectKey: string) {
    const nested = this.pathFor(objectKey);
    try {
      await fs.access(nested);
      return nested;
    } catch (error) {
      if (!this.isMissing(error)) throw error;
      const legacy = this.legacyPathFor(objectKey);
      await fs.access(legacy);
      return legacy;
    }
  }

  private isMissing(error: unknown) {
    return typeof error === "object" && error !== null && "code" in error &&
      (error as { code?: string }).code === "ENOENT";
  }
}
