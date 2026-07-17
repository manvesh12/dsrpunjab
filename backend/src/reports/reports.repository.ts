import type { Prisma, PrismaClient, ReportStatus } from "@prisma/client";
import { prisma } from "../database/prisma.client.js";
import type { CreateReportDto, ReportWorkflowDto } from "./reports.dto.js";

export class ReportsRepository {
  constructor(private readonly database: PrismaClient) {}

  list() { return this.database.report.findMany({ orderBy: { createdAt: "desc" } }); }

  create(input: CreateReportDto, submittedBy: bigint) {
    return this.database.report.create({ data: { ...input, submittedBy } });
  }

  updateStatus(id: bigint, status: ReportStatus) {
    return this.database.report.update({ where: { id }, data: { status } });
  }

  findProject(id: bigint) { return this.database.project.findUnique({ where: { id } }); }

  createWorkflow(input: ReportWorkflowDto, performedBy: bigint) {
    return this.database.workflowHistory.create({
      data: { reportId: input.reportId, action: input.action, remarks: input.remarks, performedBy }
    });
  }

  history(reportId: bigint) {
    return this.database.workflowHistory.findMany({ where: { reportId }, orderBy: { performedAt: "desc" } });
  }

  allHistory() { return this.database.workflowHistory.findMany({ orderBy: { performedAt: "desc" } }); }

  projectsByIds(ids: bigint[]) {
    return this.database.project.findMany({ where: { id: { in: ids } } });
  }
}

export type ReportsRepositoryContract = Pick<
  ReportsRepository,
  "list" | "create" | "updateStatus" | "findProject" | "createWorkflow" | "history" | "allHistory" | "projectsByIds"
>;

export const reportsRepository = new ReportsRepository(prisma);
