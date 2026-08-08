export interface StorageProvider {
  put(objectKey: string, bytes: Buffer, contentType: string): Promise<void>;
  get(objectKey: string): Promise<Buffer>;
  copy(sourceObjectKey: string, destinationObjectKey: string): Promise<void>;
  delete(objectKey: string): Promise<void>;
  ensurePrefix(prefix: string): Promise<void>;
  deletePrefix(prefix: string): Promise<void>;
  signedDownloadUrl(objectKey: string, expiresIn: number): Promise<string>;
}
