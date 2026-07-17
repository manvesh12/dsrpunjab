import { ApiError } from "../common/exceptions/api-error.js";
import type { AuthUser } from "../authentication/auth-user.js";
import { canReview, canUpload } from "../authorization/role.policy.js";
import { projectName } from "../projects/projects.mapper.js";
import type { CreateReportDto, ReportWorkflowDto, UpdateReportStatusDto } from "./reports.dto.js";
import { reportsRepository, type ReportsRepositoryContract } from "./reports.repository.js";

export class ReportsService {
  constructor(private readonly repository: ReportsRepositoryContract) {}

  list() { return this.repository.list(); }

  create(input: CreateReportDto, user: AuthUser) {
    this.requireUpload(user.role);
    return this.repository.create(input, user.id);
  }

  updateStatus(input: UpdateReportStatusDto, user: AuthUser) {
    this.requireReview(user.role);
    return this.repository.updateStatus(input.reportId, input.status);
  }

  async runWorkflow(input: ReportWorkflowDto, user: AuthUser) {
    const reviewActions = ["RETURN", "REJECT", "APPROVE", "FORWARD"];
    if (reviewActions.includes(input.action)) this.requireReview(user.role);
    else if (!canUpload(user.role) && !canReview(user.role)) this.denied();

    const project = await this.repository.findProject(input.reportId).catch(() => null);
    const entry = await this.repository.createWorkflow(input, user.id);
    return {
      ...entry,
      projectId: Number(input.reportId),
      projectName: projectName(project),
      performedBy: user.fullName,
      performedAt: entry.performedAt.toISOString()
    };
  }

  history(id: bigint) { return this.repository.history(id); }

  async auditLogs() {
    const logs = await this.repository.allHistory();
    const projectIds = [...new Set(logs.map(log => log.reportId))];
    const projects = await this.repository.projectsByIds(projectIds);
    const projectsById = new Map(projects.map(project => [project.id.toString(), project]));
    return logs.map(log => ({
      projectId: Number(log.reportId),
      projectName: projectName(projectsById.get(log.reportId.toString())),
      performedBy: log.performedBy ? Number(log.performedBy) : "system",
      action: log.action,
      remarks: log.remarks || "",
      performedAt: log.performedAt.toISOString()
    }));
  }

  private requireUpload(role: string) { if (!canUpload(role)) this.denied(); }
  private requireReview(role: string) { if (!canReview(role)) this.denied(); }
  private denied(): never { throw new ApiError(403, "ACCESS_DENIED", "Access denied"); }
}

export const reportsService = new ReportsService(reportsRepository);
