import { ApiError } from "../common/exceptions/api-error.js";
import { boundedString } from "../common/validators/shared.validator.js";
import { MAX_PDF_SIZE_BYTES } from "./pdf.constants.js";

export function pdfProjectId(value: unknown) {
  const normalized = String(value || "");
  if (!/^\d+$/.test(normalized)) throw new ApiError(400, "PDF_PROJECT_REQUIRED", "Missing projectId");
  return BigInt(normalized);
}

export function pdfAnnexureId(value: unknown) { return boundedString(value || "anx3", 32); }
export function pdfFileName(value: unknown) { return boundedString(value, 255); }

export function decodePdf(value: unknown) {
  const text = String(value);
  if (!/^[A-Za-z0-9+/=]+$/.test(text)) throw new ApiError(400, "PDF_PAYLOAD_INVALID", "Invalid PDF payload");
  const bytes = Buffer.from(text, "base64");
  if (bytes.byteLength > MAX_PDF_SIZE_BYTES || bytes.subarray(0, 4).toString("utf8") !== "%PDF") {
    throw new ApiError(400, "PDF_INVALID", "Only PDF files up to 200 MB are allowed");
  }
  return bytes;
}
