import type { Request } from "express";
import { ApiError } from "../common/exceptions/api-error.js";
import { MAX_FILE_SIZE_BYTES } from "./upload.constants.js";

export function readRawUpload(req: Request) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on("data", (chunk: Buffer) => {
      total += chunk.length;
      if (total > MAX_FILE_SIZE_BYTES) {
        reject(new ApiError(400, "FILE_TOO_LARGE", "File exceeds the 200 MB upload limit"));
        req.destroy();
        return;
      }
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
