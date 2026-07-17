import { ReportStatus } from "@prisma/client";
import { ApiError } from "../common/exceptions/api-error.js";
import { boundedString } from "../common/validators/shared.validator.js";
import type { CreateReportDto, ReportWorkflowDto, UpdateReportStatusDto } from "./reports.dto.js";

export function reportId(value: string | string[] | undefined): bigint {
  const normalized = String(value || "");
  if (!/^\d+$/.test(normalized)) throw new ApiError(400, "INVALID_REPORT_ID", "Invalid report id");
  return BigInt(normalized);
}

export function createReportDto(body: any): CreateReportDto {
  return {
    reportNumber: body?.reportNumber,
    projectId: body?.projectId ? BigInt(body.projectId) : null,
    title: body?.title || "District Survey Report",
    description: body?.description,
    reportType: body?.reportType
  };
}

export function updateReportStatusDto(id: string | string[] | undefined, query: any, body: any): UpdateReportStatusDto {
  const status = String(query?.status || body?.status || "UNDER_REVIEW").toUpperCase() as ReportStatus;
  if (!Object.values(ReportStatus).includes(status)) throw new ApiError(400, "INVALID_REPORT_STATUS", "Invalid report status");
  return { reportId: reportId(id), status };
}

export function reportWorkflowDto(id: string | string[] | undefined, body: any): ReportWorkflowDto {
  return {
    reportId: reportId(id),
    action: String(body?.action || "SUBMIT").trim().toUpperCase(),
    remarks: boundedString(body?.remarks, 2000)
  };
}
