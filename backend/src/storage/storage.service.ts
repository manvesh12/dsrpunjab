import { environment } from "../config/environment.js";
import { LocalStorageProvider } from "./local-storage.provider.js";
import { S3StorageProvider } from "./s3-storage.provider.js";
import type { StorageProvider } from "./storage-provider.js";
import { projectStoragePrefix } from "./project-storage.js";

export class StorageService {
  constructor(private readonly provider: StorageProvider) {}

  putFile(objectKey: string, bytes: Buffer, contentType = "application/octet-stream") {
    return this.provider.put(objectKey, bytes, contentType);
  }
  getFile(objectKey: string) { return this.provider.get(objectKey); }
  copyFile(sourceObjectKey: string, destinationObjectKey: string) {
    return this.provider.copy(sourceObjectKey, destinationObjectKey);
  }
  deleteFile(objectKey: string) { return this.provider.delete(objectKey); }
  createProjectStorage(projectId: bigint | number | string) {
    return this.provider.ensurePrefix(projectStoragePrefix(projectId));
  }
  deleteProjectStorage(projectId: bigint | number | string) {
    return this.provider.deletePrefix(projectStoragePrefix(projectId));
  }
  signedDownloadUrl(objectKey: string, expiresIn = 3600) { return this.provider.signedDownloadUrl(objectKey, expiresIn); }
}

const provider = environment.localFileStorage
  ? new LocalStorageProvider()
  : new S3StorageProvider(environment);

export const storageService = new StorageService(provider);
