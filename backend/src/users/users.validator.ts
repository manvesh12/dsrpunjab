import { ApiError } from "../common/exceptions/api-error.js";
import { canAdmin } from "../authorization/role.policy.js";

export function normalizeRole(value: unknown) {
  const VALID_ROLES = ["SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN", "DISTRICT_OFFICER", "GEOLOGIST", "SURVEY_OFFICER", "REVIEWER", "DATA_ENTRY_OPERATOR", "REPORT_GENERATOR", "PUBLIC_USER"];
  const role = String(value || "DISTRICT_OFFICER").toUpperCase();
  if (role === "DATA_ENTRY") return "DATA_ENTRY_OPERATOR";
  return VALID_ROLES.includes(role) ? role : "DISTRICT_OFFICER";
}

export function requiresDistrict(role: string) { return !canAdmin(role); }

export function requiredDistrict(value: unknown, role: string): bigint | null {
  const districtId = String(value || "").trim();
  if (requiresDistrict(role) && !districtId) {
    throw new ApiError(400, "DISTRICT_REQUIRED", "District is required for every non-admin account.");
  }
  return districtId ? BigInt(districtId) : null;
}

export function userId(value: string | string[] | undefined) {
  const normalized = String(value || "");
  if (!/^\d+$/.test(normalized)) throw new ApiError(400, "INVALID_USER_ID", "Invalid user id");
  return BigInt(normalized);
}

export function normalizedBulkRole(rawRole: string) {
  const clean = rawRole.toUpperCase().trim().replace(/[\s_-]+/g, "");
  const VALID_ROLES = ["SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN", "DISTRICT_OFFICER", "GEOLOGIST", "SURVEY_OFFICER", "REVIEWER", "DATA_ENTRY_OPERATOR", "REPORT_GENERATOR", "PUBLIC_USER"];
  return VALID_ROLES.find(role => clean === role.replace(/_/g, "")) || rawRole;
}

export function rowValue(row: any, targetKey: string) {
  if (!row || typeof row !== "object") return "";
  const target = targetKey.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const key of Object.keys(row)) {
    if (key.toLowerCase().replace(/[^a-z0-9]/g, "") === target) return String(row[key] || "").trim();
  }
  for (const key of Object.keys(row)) {
    if (key.toLowerCase().replace(/[^a-z0-9]/g, "").includes(target)) return String(row[key] || "").trim();
  }
  return "";
}
