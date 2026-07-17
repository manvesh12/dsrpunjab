import type { ReportStatus } from "@prisma/client";

export type CreateReportDto = {
  reportNumber?: string;
  projectId: bigint | null;
  title: string;
  description?: string;
  reportType?: string;
};

export type ReportWorkflowDto = {
  reportId: bigint;
  action: string;
  remarks: string;
};

export type UpdateReportStatusDto = {
  reportId: bigint;
  status: ReportStatus;
};
