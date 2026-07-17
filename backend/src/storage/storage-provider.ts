export interface StorageProvider {
  put(objectKey: string, bytes: Buffer, contentType: string): Promise<void>;
  get(objectKey: string): Promise<Buffer>;
  delete(objectKey: string): Promise<void>;
  signedDownloadUrl(objectKey: string, expiresIn: number): Promise<string>;
}
