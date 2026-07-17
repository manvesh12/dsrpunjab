import { environment } from "../config/environment.js";
import { LocalStorageProvider } from "./local-storage.provider.js";
import { S3StorageProvider } from "./s3-storage.provider.js";
import type { StorageProvider } from "./storage-provider.js";

export class StorageService {
  constructor(private readonly provider: StorageProvider) {}

  putFile(objectKey: string, bytes: Buffer, contentType = "application/octet-stream") {
    return this.provider.put(objectKey, bytes, contentType);
  }
  getFile(objectKey: string) { return this.provider.get(objectKey); }
  deleteFile(objectKey: string) { return this.provider.delete(objectKey); }
  signedDownloadUrl(objectKey: string, expiresIn = 3600) { return this.provider.signedDownloadUrl(objectKey, expiresIn); }
}

const provider = environment.localFileStorage
  ? new LocalStorageProvider()
  : new S3StorageProvider(environment);

export const storageService = new StorageService(provider);
