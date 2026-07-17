import { ApiError } from "../common/exceptions/api-error.js";

export function replenishmentProjectId(value: string | string[] | undefined) {
  const normalized = String(value || "");
  if (!/^\d+$/.test(normalized)) throw new ApiError(400, "INVALID_PROJECT_ID", "Invalid project id");
  return BigInt(normalized);
}

export function replenishmentId(value: string | string[] | undefined) {
  const normalized = String(value || "").trim();
  if (!normalized) throw new ApiError(400, "INVALID_REPLENISHMENT_ID", "Invalid replenishment study id");
  return normalized;
}
