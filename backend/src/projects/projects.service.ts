import { ProjectStatus, type Prisma } from "@prisma/client";
import { assignedDistrictFor, assertProjectDistrictAccess, canAccessProjectDistrict } from "../authorization/project-access.policy.js";
import { ApiError } from "../common/exceptions/api-error.js";
import type { AuthUser } from "../authentication/auth-user.js";
import { canAdmin } from "../authorization/role.policy.js";
import { storageService, type StorageService } from "../storage/storage.service.js";
import { projectsRepository, type ProjectsRepositoryContract } from "./projects.repository.js";
import { parseProjectStatus, phaseProjectName, readProjectState } from "./projects.validator.js";

export class ProjectsService {
  constructor(
    private readonly repository: ProjectsRepositoryContract,
    private readonly storage: Pick<StorageService, "deleteFile">
  ) {}

  list(user: AuthUser) { return this.repository.list(assignedDistrictFor(user)); }

  async create(body: any, user: AuthUser) {
    const userDistrict = assignedDistrictFor(user);
    if (Array.isArray(body)) {
      this.requireAdmin(user.role, "Bulk project replacement is restricted to Administrators.");
      await this.repository.deleteAll();
      const projects = await Promise.all(body.map(project => this.repository.create({
        projectName: project.projectName || project.title || `District Survey Report`,
        title: project.title || project.projectName,
        districtId: userDistrict || null,
        year: project.year || "2025-26",
        mineral: project.mineral || "Sand",
        rivers: project.rivers || "Not specified",
        progress: Number(project.progress || 0),
        status: parseProjectStatus(project.status),
        signatures: Number(project.signatures || 0),
        createdBy: user.id,
        projectState: this.serializedState(project.projectState)
      })));
      return { bulk: true as const, projects };
    }

    const requestedDistrictId = body?.districtId ? BigInt(body.districtId) : null;
    if (userDistrict && requestedDistrictId && !canAccessProjectDistrict(user, requestedDistrictId)) {
      throw new ApiError(403, "PROJECT_CREATE_DISTRICT_FORBIDDEN", "You can create reports only for your assigned district.");
    }
    const districtId = userDistrict || requestedDistrictId || null;
    const created = await this.repository.create({
      projectName: body?.projectName || body?.title || `District Survey Report`,
      title: body?.title || body?.projectName,
      districtId,
      year: body?.year || "2025-26",
      mineral: body?.mineral || "Sand",
      rivers: body?.rivers || "Not specified",
      progress: 0,
      status: parseProjectStatus(body?.status),
      signatures: 0,
      createdBy: user.id,
      projectState: this.serializedState(body?.projectState)
    }, true);
    await this.repository.createWorkflow({
      reportId: created.id,
      action: "PROJECT_CREATED",
      remarks: `DSR project created for ${created.year || "2025-26"}`,
      performedBy: user.id
    });
    return { bulk: false as const, project: created };
  }

  async importPackage(id: bigint, body: any, user: AuthUser) {
    this.requireAdmin(user.role, "Only Administrators can import a project package.");
    const project = await this.repository.find(id);
    assertProjectDistrictAccess(project, user);
    const packageState = typeof body?.projectState === "string" ? readProjectState(body.projectState) : body?.projectState;
    if (!packageState || typeof packageState !== "object" || Array.isArray(packageState)) {
      throw new ApiError(400, "PROJECT_IMPORT_STATE_INVALID", "The import package does not contain a valid project state.");
    }
    const progress = Math.max(0, Math.min(100, Number(body?.progress ?? 100) || 100));
    const updated = await this.repository.update(id, {
      title: body?.title || project.title,
      projectName: body?.projectName || project.projectName,
      year: body?.year || project.year,
      mineral: body?.mineral || project.mineral,
      rivers: body?.rivers || project.rivers,
      progress,
      status: ProjectStatus.IN_PROGRESS,
      projectState: JSON.stringify(packageState)
    }, true);
    await this.repository.createWorkflow({
      reportId: id,
      action: "PROJECT_PACKAGE_IMPORTED",
      remarks: `Imported ${Array.isArray(packageState.sourceSections) ? packageState.sourceSections.length : 0} PDF sections into the project.`,
      performedBy: user.id
    });
    return updated;
  }

  async rollback(id: bigint, user: AuthUser) {
    const project = await this.repository.find(id);
    assertProjectDistrictAccess(project, user);
    if (!project.projectState) throw new ApiError(400, "PROJECT_STATE_MISSING", "No state to rollback");
    const state = JSON.parse(project.projectState);
    if (!state.__backup) throw new ApiError(400, "PROJECT_BACKUP_MISSING", "No backup available to rollback to");
    await this.repository.update(id, { projectState: JSON.stringify(state.__backup) });
    return { message: "Rolled back successfully", projectState: state.__backup };
  }

  async nextPhase(id: bigint, body: any, user: AuthUser) {
    this.requireAdmin(user.role, "Only Administrators can initiate the next phase.");
    const source = await this.repository.findWithFiles(id);
    if (!source) throw new ApiError(404, "SOURCE_PHASE_NOT_FOUND", "Source DSR phase not found");
    assertProjectDistrictAccess(source, user);
    const nextPhaseNo = Math.max(2, Number(body?.phaseNo || source.phaseNo + 1));
    const uploadColor = String(body?.uploadColor || "#34C759");
    const importedAt = new Date().toISOString();
    const sourceState = readProjectState(source.projectState);
    const sourcePhaseMeta = sourceState.phaseMetadata && typeof sourceState.phaseMetadata === "object" && !Array.isArray(sourceState.phaseMetadata)
      ? sourceState.phaseMetadata : {};
    const lockedSourceState = {
      ...sourceState,
      phaseMetadata: { ...sourcePhaseMeta, phaseNo: source.phaseNo || 1, locked: true, lockedAt: importedAt, lockedReason: `Phase ${nextPhaseNo} initiated` }
    };
    const nextState = {
      ...sourceState,
      phaseMetadata: {
        phaseNo: nextPhaseNo, parentPhaseId: Number(source.id), parentPhaseTitle: source.title || source.projectName,
        parentPhaseNo: source.phaseNo || 1, importedAt, locked: false, defaultUploadColor: uploadColor, origin: "PHASE_IMPORTED"
      },
      phaseChangeLog: [{
        type: "PHASE_CREATED", section: "Project", label: `Imported data from Phase ${source.phaseNo || 1}`,
        color: "#94A3B8", at: importedAt, by: Number(user.id)
      }]
    };
    const name = phaseProjectName(source, nextPhaseNo, body?.title);
    const created = await this.repository.createNextPhase({
      sourceId: source.id,
      lockedSourceState: JSON.stringify(lockedSourceState),
      nextProject: {
        projectName: name, title: name, districtId: source.districtId, year: source.year, mineral: source.mineral,
        rivers: source.rivers, description: source.description, progress: 0, status: ProjectStatus.IN_PROGRESS,
        signatures: 0, phaseNo: nextPhaseNo, parentPhaseId: source.id, phaseLocked: false,
        phaseOrigin: `Imported from project ${source.id} / Phase ${source.phaseNo || 1}`,
        createdBy: user.id, projectState: JSON.stringify(nextState)
      },
      files: source.files,
      workflow: {
        reportId: source.id,
        action: "PROJECT_PHASE_INITIATED",
        remarks: `Phase ${nextPhaseNo} created from Phase ${source.phaseNo || 1}`,
        performedBy: user.id
      }
    });
    if (!created) throw new ApiError(500, "PROJECT_PHASE_CREATE_FAILED", "Failed to create project phase");
    return created;
  }

  async get(id: bigint, user: AuthUser) {
    const project = await this.repository.findWithFiles(id);
    assertProjectDistrictAccess(project, user);
    return project;
  }

  async updateState(id: bigint, body: any, user: AuthUser) {
    const existing = await this.repository.find(id);
    assertProjectDistrictAccess(existing, user);
    const data: Prisma.ProjectUncheckedUpdateInput = {
      projectState: body?.state == null ? null : typeof body.state === "string" ? body.state : JSON.stringify(body.state)
    };
    if (typeof body?.progress === "number") data.progress = body.progress;
    return this.repository.update(id, data, true);
  }

  async delete(id: bigint, user: AuthUser) {
    this.requireAdmin(user.role, "Access denied");
    const files = await this.repository.files(id);
    await Promise.all(files.map(file => this.storage.deleteFile(file.objectKey).catch(() => undefined)));
    await this.repository.delete(id);
    return { success: true, message: "Project deleted successfully" };
  }

  private serializedState(state: unknown) {
    return typeof state === "string" ? state : state ? JSON.stringify(state) : null;
  }

  private requireAdmin(role: string, message: string) {
    if (!canAdmin(role)) throw new ApiError(403, "ACCESS_DENIED", message);
  }
}

export const projectsService = new ProjectsService(projectsRepository, storageService);
