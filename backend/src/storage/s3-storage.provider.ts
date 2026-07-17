import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "node:stream";
import type { Environment } from "../config/environment.js";
import type { StorageProvider } from "./storage-provider.js";

export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;

  constructor(private readonly environment: Environment) {
    this.client = new S3Client({
      region: environment.awsRegion,
      endpoint: environment.s3Endpoint || undefined,
      forcePathStyle: environment.s3ForcePathStyle
    });
  }

  async put(objectKey: string, bytes: Buffer, contentType: string) {
    await this.client.send(new PutObjectCommand({ Bucket: this.environment.s3Bucket, Key: objectKey, Body: bytes, ContentType: contentType }));
  }

  async get(objectKey: string) {
    const response = await this.client.send(new GetObjectCommand({ Bucket: this.environment.s3Bucket, Key: objectKey }));
    if (!response.Body) throw new Error("Empty object");
    const chunks: Buffer[] = [];
    for await (const chunk of response.Body as Readable) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return Buffer.concat(chunks);
  }

  async delete(objectKey: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.environment.s3Bucket, Key: objectKey }));
  }

  signedDownloadUrl(objectKey: string, expiresIn: number) {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.environment.s3Bucket, Key: objectKey }),
      { expiresIn }
    );
  }
}
