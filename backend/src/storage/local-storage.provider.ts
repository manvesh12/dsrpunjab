import fs from "node:fs/promises";
import path from "node:path";
import type { StorageProvider } from "./storage-provider.js";

export class LocalStorageProvider implements StorageProvider {
  constructor(private readonly uploadsDirectory = path.resolve("uploads")) {}

  async put(objectKey: string, bytes: Buffer) {
    await fs.mkdir(this.uploadsDirectory, { recursive: true });
    await fs.writeFile(this.pathFor(objectKey), bytes);
  }

  get(objectKey: string) { return fs.readFile(this.pathFor(objectKey)); }

  async delete(objectKey: string) { await fs.rm(this.pathFor(objectKey), { force: true }); }

  async signedDownloadUrl(objectKey: string) {
    return `/api/files/download/${encodeURIComponent(objectKey)}`;
  }

  private pathFor(objectKey: string) {
    return path.join(this.uploadsDirectory, objectKey.replace(/[\\/]/g, "_"));
  }
}
