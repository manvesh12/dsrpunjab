import { Prisma, ReportStatus } from "@prisma/client";
import { assertProjectDistrictAccess } from "../authorization/project-access.policy.js";
import { ApiError } from "../common/exceptions/api-error.js";
import { logger } from "../common/logging/logger.js";
import type { AuthUser } from "../authentication/auth-user.js";
import { MAX_SYNCABLE_PROJECT_STATE_BYTES } from "./replenishment.constants.js";
import { replenishmentRepository, type ReplenishmentRepositoryContract } from "./replenishment.repository.js";

export class ReplenishmentService {
  constructor(private readonly repository: ReplenishmentRepositoryContract) {}

  async list(projectId: bigint, user: AuthUser) {
    const project = await this.repository.findProject(projectId);
    assertProjectDistrictAccess(project, user);
    return this.repository.list(projectId);
  }

  async listApprovedDsrs(user: AuthUser) {
    // A user can only fetch Approved DSRs for their assigned district
    const districtId = user.districtId || null;
    return this.repository.findApprovedDsrs(districtId);
  }

  async create(projectId: bigint, body: any, user: AuthUser) {
    const project = await this.repository.findProjectForSync(projectId);
    assertProjectDistrictAccess(project, user);
    
    const parentDsrId = body?.parentDsrId ? BigInt(body.parentDsrId) : null;
    let syncedState = {};
    if (parentDsrId) {
      const parentDsr = await this.repository.findProjectForSync(parentDsrId);
      if (parentDsr) {
        assertProjectDistrictAccess(parentDsr, user);
        syncedState = this.syncedProjectState(parentDsr);
      }
    } else {
      syncedState = this.syncedProjectState(project);
    }
    
    const incoming = body?.reportState && typeof body.reportState === "object" && !Array.isArray(body.reportState)
      ? body.reportState as Prisma.JsonObject
      : {};
      
    // Embed the static inherited DSR data cleanly
    const reportState = {
      inherited: syncedState,
      latestSurveyData: {},
      differences: {},
      ...incoming
    } as Prisma.InputJsonObject;

    return this.repository.create({
      projectId,
      parentDsrId,
      river: body?.river || null,
      miningBlock: body?.miningBlock || null,
      title: body?.title || `Replenishment Study - ${project.projectName || project.title}`,
      status: ReportStatus.DRAFT,
      createdBy: user.id,
      surveyData: (body?.surveyData || {}) as Prisma.InputJsonValue,
      reportState
    });
  }

  async get(id: string, user: AuthUser) {
    const study = await this.repository.findByIdWithProjectDistrict(id);
    if (!study) throw new ApiError(404, "REPLENISHMENT_NOT_FOUND", "Replenishment study not found");
    assertProjectDistrictAccess(study.project, user);
    return study;
  }

  async update(id: string, body: any, user: AuthUser) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      if (!body?.projectId) throw new ApiError(404, "REPLENISHMENT_PROJECT_REQUIRED", "Study not found and no projectId provided to re-create it");
      const projectId = BigInt(body.projectId);
      const project = await this.repository.findProject(projectId);
      assertProjectDistrictAccess(project, user);
      return this.repository.create({
        id,
        projectId,
        title: body.title !== undefined ? body.title : "Untitled",
        status: body.status !== undefined ? body.status : "DRAFT",
        surveyData: body.surveyData !== undefined ? body.surveyData : {},
        reportState: body.reportState !== undefined ? body.reportState : {},
        createdBy: user.id
      });
    }
    const project = await this.repository.findProject(existing.projectId);
    assertProjectDistrictAccess(project, user);
    return this.repository.update(id, {
      title: body?.title !== undefined ? body.title : existing.title,
      status: body?.status !== undefined ? body.status : existing.status,
      surveyData: body?.surveyData !== undefined ? body.surveyData : existing.surveyData,
      reportState: body?.reportState !== undefined ? body.reportState : existing.reportState
    });
  }

  async delete(id: string, user: AuthUser) {
    const existing = await this.repository.findByIdWithProject(id);
    if (!existing) throw new ApiError(404, "REPLENISHMENT_NOT_FOUND", "Replenishment study not found");
    assertProjectDistrictAccess(existing.project, user);
    await this.repository.delete(id);
    return { message: "Replenishment study deleted" };
  }

  private syncedProjectState(project: NonNullable<Awaited<ReturnType<ReplenishmentRepositoryContract["findProjectForSync"]>>>) {
    if (!project.projectState) return {};
    if (project.projectState.length > MAX_SYNCABLE_PROJECT_STATE_BYTES) {
      logger.warn("replenishment_project_state_too_large", { projectId: project.id.toString(), bytes: project.projectState.length });
      return {};
    }
    try {
      const state = JSON.parse(project.projectState);
      return {
        district: project.district || state.district,
        year: project.year || state.year,
        mineral: project.mineral || state.mineral,
        rivers: project.rivers || state.rivers,
        demographics: state.demographics || {},
        drainage: state.drainage || {},
        rainfall: state.rainfall || {},
        geology: state.geology || {},
        miningLeases: state.miningLeases || []
      };
    } catch {
      logger.warn("replenishment_project_state_invalid", { projectId: project.id.toString() });
      return {};
    }
  }

  async fetchFinalDsr(id: string, user: AuthUser) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new ApiError(404, "REPLENISHMENT_NOT_FOUND", "Replenishment study not found");
    const project = await this.repository.findProjectForSync(existing.projectId);
    assertProjectDistrictAccess(project, user);
    const syncedState = this.syncedProjectState(project);
    
    // Merge into reportState.inherited
    const currentState = (existing.reportState as Prisma.JsonObject) || {};
    const updatedState = { ...currentState, inherited: syncedState } as Prisma.InputJsonObject;
    
    return this.repository.update(id, { reportState: updatedState });
  }

  async saveState(id: string, body: any, user: AuthUser) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new ApiError(404, "REPLENISHMENT_NOT_FOUND", "Replenishment study not found");
    const project = await this.repository.findProject(existing.projectId);
    assertProjectDistrictAccess(project, user);
    
    // Support optimistic concurrency control
    if (body?.currentVersion && body.currentVersion !== existing.currentVersion) {
      throw new ApiError(409, "REPLENISHMENT_VERSION_CONFLICT", "Version conflict. Please refresh.");
    }
    
    return this.repository.update(id, {
      reportState: body?.reportState !== undefined ? body.reportState : existing.reportState,
      surveyData: body?.surveyData !== undefined ? body.surveyData : existing.surveyData,
      currentVersion: existing.currentVersion + 1
    });
  }

  async upload(id: string, body: any, user: AuthUser) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new ApiError(404, "REPLENISHMENT_NOT_FOUND", "Replenishment study not found");
    const project = await this.repository.findProject(existing.projectId);
    assertProjectDistrictAccess(project, user);
    // Real implementation will link to S3 and create ReplenishmentFile record
    return { success: true, objectKey: `fake-object-key-${Date.now()}` };
  }

  async workflow(id: string, body: any, user: AuthUser) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new ApiError(404, "REPLENISHMENT_NOT_FOUND", "Replenishment study not found");
    const project = await this.repository.findProject(existing.projectId);
    assertProjectDistrictAccess(project, user);
    
    const WORKFLOW_STAGES = [
      "DRAFT",
      "SURVEY_OFFICER_APPROVED",
      "GIS_EXPERT_APPROVED",
      "GEOLOGIST_APPROVED",
      "DISTRICT_OFFICER_APPROVED",
      "REVIEWER_APPROVED",
      "DISTRICT_ADMIN_APPROVED",
      "STATE_ADMIN_APPROVED",
      "FINAL_REPORT_GENERATED"
    ];
    
    const currentStateIndex = WORKFLOW_STAGES.indexOf(existing.approvalState || "DRAFT");
    const requestedState = body.action || existing.approvalState;
    const nextStateIndex = WORKFLOW_STAGES.indexOf(requestedState);
    
    if (nextStateIndex === -1) {
      throw new ApiError(400, "INVALID_WORKFLOW_STATE", "Invalid workflow state requested.");
    }
    
    // Strict linear enforcement: can only move forward one step at a time (or reject/rollback which we allow freely for now)
    if (nextStateIndex > currentStateIndex + 1) {
      throw new ApiError(403, "WORKFLOW_LOCKED", "Cannot skip workflow stages. Previous stages must be approved first.");
    }
    
    // In a real scenario, we'd check `user.role` against the requested stage here.
    
    return this.repository.update(id, { approvalState: requestedState });
  }

  async generateAi(id: string, body: any, user: AuthUser) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new ApiError(404, "REPLENISHMENT_NOT_FOUND", "Replenishment study not found");
    const project = await this.repository.findProject(existing.projectId);
    assertProjectDistrictAccess(project, user);
    
    // Simulate AI Generation
    const generatedText = `Generated analysis for ${body.section || 'General'}...`;
    return { success: true, generatedText };
  }
}

export const replenishmentService = new ReplenishmentService(replenishmentRepository);
