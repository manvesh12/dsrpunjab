import { ApiError } from "../common/exceptions/api-error.js";
import { ALLOWED_FILE_EXTENSIONS, MAX_FILE_SIZE_BYTES } from "./upload.constants.js";

export function uploadProjectId(value: unknown) {
  const normalized = String(value || "");
  if (!/^\d+$/.test(normalized)) throw new ApiError(400, "FILE_PROJECT_REQUIRED", "Missing projectId");
  return BigInt(normalized);
}

export function extensionOf(fileName: string) {
  const match = String(fileName || "").toLowerCase().match(/\.[a-z0-9]+$/);
  return match ? match[0] : "";
}

export function safeFileName(fileName: string) {
  return String(fileName || "upload.bin")
    .replace(/[\\/]/g, "-")
    .replace(/[^\w.\-() ]+/g, "_")
    .slice(0, 180) || "upload.bin";
}

export function validateUpload(originalName: string, bytes: Buffer) {
  const extension = extensionOf(originalName);
  if (!ALLOWED_FILE_EXTENSIONS.has(extension)) {
    throw new ApiError(400, "FILE_FORMAT_UNSUPPORTED", "Unsupported file format for replenishment upload");
  }
  if (!bytes.length) throw new ApiError(400, "FILE_REQUIRED", "File is required");
  if (bytes.byteLength > MAX_FILE_SIZE_BYTES) {
    throw new ApiError(400, "FILE_TOO_LARGE", "File exceeds the 200 MB upload limit");
  }
  return extension;
}
