import type { Response } from "express";
import type { Project } from "@prisma/client";
import { ApiError } from "../common/exceptions/api-error.js";
import { assignedDistrictFor, assertProjectDistrictAccess, canAccessProjectDistrict } from "../authorization/project-access.policy.js";
import type { AuthUser } from "./auth.js";

export function assignedDistrict(user: AuthUser, res: Response): bigint | null | undefined {
  try {
    return assignedDistrictFor(user);
  } catch (error) {
    if (error instanceof ApiError) res.status(error.status).json({ error: error.message });
    else res.status(500).json({ error: "Internal server error" });
    return undefined;
  }
}

export function canAccessDistrict(user: AuthUser, districtId?: bigint | null) {
  return canAccessProjectDistrict(user, districtId);
}

export function requireProjectDistrictAccess<T extends any>(project: T | null, user: AuthUser, res: Response): project is T {
  try {
    assertProjectDistrictAccess(project, user);
    return true;
  } catch (error) {
    if (error instanceof ApiError) res.status(error.status).json({ error: error.message });
    else res.status(500).json({ error: "Internal server error" });
    return false;
  }
}
