import type { Project } from "@prisma/client";
import { ApiError } from "../common/exceptions/api-error.js";
import type { AuthUser } from "../authentication/auth-user.js";
import { canAdmin } from "./role.policy.js";

export function assignedDistrictFor(user: AuthUser): bigint | null {
  if (canAdmin(user.role)) return null;
  const districtId = user.districtId;
  if (!districtId) {
    throw new ApiError(403, "DISTRICT_NOT_ASSIGNED", "Your account has no district assignment. Please contact the administrator.");
  }
  return districtId;
}

export function canAccessProjectDistrict(user: AuthUser, districtId?: bigint | null) {
  return canAdmin(user.role) || (Boolean(districtId) && user.districtId === districtId);
}

export function assertProjectDistrictAccess<T extends any>(project: T | null, user: AuthUser): asserts project is T {
  if (!project) throw new ApiError(404, "PROJECT_NOT_FOUND", "Project not found");
  // Check if project has districtId directly or nested in district object
  const districtId = (project as any).districtId ?? (project as any).district?.id;
  if (!canAccessProjectDistrict(user, districtId)) {
    throw new ApiError(403, "PROJECT_DISTRICT_FORBIDDEN", "This project belongs to another district.");
  }
}
