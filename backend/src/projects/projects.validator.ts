import { ProjectStatus } from "@prisma/client";
import { ApiError } from "../common/exceptions/api-error.js";

export function projectId(value: string | string[] | undefined, label = "project id") {
  const normalized = String(value || "");
  if (!/^\d+$/.test(normalized)) throw new ApiError(400, "INVALID_PROJECT_ID", `Invalid ${label}`);
  return BigInt(normalized);
}

export function parseProjectStatus(status: unknown) {
  const value = String(status || "").toUpperCase().replaceAll(" ", "_");
  if (value === "COMPLETED") return ProjectStatus.COMPLETED;
  if (value === "ACTIVE") return ProjectStatus.ACTIVE;
  if (value === "ARCHIVED") return ProjectStatus.ARCHIVED;
  return ProjectStatus.IN_PROGRESS;
}

export function readProjectState(projectState?: string | null): Record<string, any> {
  if (!projectState) return {};
  try {
    const parsed = JSON.parse(projectState);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function phaseProjectName(source: { projectName: string; district?: string | null; phaseNo: number }, nextPhaseNo: number, title?: string) {
  if (title && title.trim()) return title.trim();
  const district = source.district || "Punjab";
  const base = source.projectName.replace(/\s+-\s+Phase\s+\d+$/i, "");
  return `${base || `District Survey Report - ${district}`} - Phase ${nextPhaseNo}`;
}
