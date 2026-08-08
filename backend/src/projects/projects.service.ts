import { ProjectStatus, type Prisma } from "@prisma/client";
import { assignedDistrictFor, assertProjectDistrictAccess, assertProjectUnlocked, canAccessProjectDistrict } from "../authorization/project-access.policy.js";
import { ApiError } from "../common/exceptions/api-error.js";
import type { AuthUser } from "../authentication/auth-user.js";
import { canAdmin } from "../authorization/role.policy.js";
import { storageService, type StorageService } from "../storage/storage.service.js";
import { copiedProjectFileObjectKey } from "../storage/project-storage.js";
import { settleBestEffort, type BestEffortOperation } from "../storage/storage-cleanup.js";
import { projectsRepository, type ProjectsRepositoryContract } from "./projects.repository.js";
import { parseProjectStatus, phaseProjectName, readProjectState } from "./projects.validator.js";

export class ProjectsService {
  constructor(
    private readonly repository: ProjectsRepositoryContract,
    private readonly storage: Pick<StorageService, "copyFile" | "deleteFile" | "createProjectStorage" | "deleteProjectStorage">
  ) {}

  list(user: AuthUser) { return this.repository.list(assignedDistrictFor(user)); }

  async create(body: any, user: AuthUser) {
    const userDistrict = assignedDistrictFor(user);
    if (Array.isArray(body)) {
      this.requireAdmin(user.role, "Bulk project replacement is restricted to Administrators.");
      const existingProjects = await this.repository.list(null);
      const existingFiles = (await Promise.all(
        existingProjects.map(existing => this.repository.files(existing.id))
      )).flat();
      const projectInputs = body.map(project => ({
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
      } satisfies Prisma.ProjectUncheckedCreateInput));
      const projects = await this.repository.replaceAll(projectInputs);
      await settleBestEffort("bulk_project_storage_replace", [
        ...existingFiles.map(file => ({
          target: file.objectKey,
          run: () => this.storage.deleteFile(file.objectKey)
        })),
        ...existingProjects.map(existing => ({
          target: `projects/${existing.id.toString()}`,
          run: () => this.storage.deleteProjectStorage(existing.id)
        })),
        ...projects.map(project => ({
          target: `projects/${project.id.toString()}`,
          run: () => this.storage.createProjectStorage(project.id)
        }))
      ]);
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
    await this.ensureProjectStorage(created.id);
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
    assertProjectUnlocked(project);
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
    assertProjectUnlocked(project);
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
    if (source.phaseLocked) {
      throw new ApiError(409, "PROJECT_PHASE_LOCKED", "This project phase has already been finalized");
    }
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
    const reservation = await this.repository.reserveNextPhase(
      source.id,
      JSON.stringify(lockedSourceState),
      source.updatedAt
    );
    if (reservation.count !== 1) {
      throw new ApiError(409, "PROJECT_PHASE_CHANGED", "The project changed while the next phase was starting. Please retry.");
    }
    let pendingProject: { id: bigint } | null = null;
    try {
      const reservedSource = await this.repository.findWithFiles(source.id);
      if (!reservedSource?.phaseLocked) {
        throw new ApiError(409, "PROJECT_PHASE_RESERVATION_LOST", "The source phase reservation is no longer active");
      }
      pendingProject = await this.repository.create({
        projectName: name, title: name, districtId: source.districtId, year: source.year, mineral: source.mineral,
        rivers: source.rivers, description: source.description, progress: 0, status: ProjectStatus.IN_PROGRESS,
        signatures: 0, phaseNo: nextPhaseNo, parentPhaseId: source.id, phaseLocked: true,
        phaseOrigin: `Imported from project ${source.id} / Phase ${source.phaseNo || 1}`,
        createdBy: user.id, projectState: JSON.stringify(nextState)
      });
      const copiedFiles = reservedSource.files.map(file => ({
        ...file,
        objectKey: copiedProjectFileObjectKey(
          file.objectKey,
          source.id,
          pendingProject!.id,
          `${file.annexureId}-${file.fileName}`
        )
      }));
      await this.storage.createProjectStorage(pendingProject.id);
      for (let start = 0; start < copiedFiles.length; start += 4) {
        const copyResults = await Promise.allSettled(
          copiedFiles.slice(start, start + 4).map((file, offset) =>
            this.storage.copyFile(reservedSource.files[start + offset].objectKey, file.objectKey)
          )
        );
        const failedCopy = copyResults.find(
          (result): result is PromiseRejectedResult => result.status === "rejected"
        );
        if (failedCopy) throw failedCopy.reason;
      }
      const created = await this.repository.createNextPhase({
        sourceId: source.id,
        nextProjectId: pendingProject.id,
        files: copiedFiles,
        workflow: {
          reportId: pendingProject.id,
          action: "PROJECT_PHASE_INITIATED",
          remarks: `Phase ${nextPhaseNo} created from Phase ${source.phaseNo || 1}`,
          performedBy: user.id
        }
      });
      return created;
    } catch (error) {
      const cleanup: BestEffortOperation[] = [{
        target: `source-project:${source.id.toString()}`,
        run: () => this.repository.releaseNextPhase(source.id, source.projectState)
      }];
      if (pendingProject) {
        cleanup.push(
          {
            target: `projects/${pendingProject.id.toString()}`,
            run: () => this.storage.deleteProjectStorage(pendingProject!.id)
          },
          {
            target: `pending-project:${pendingProject.id.toString()}`,
            run: () => this.repository.delete(pendingProject!.id)
          }
        );
      }
      await settleBestEffort("project_phase_rollback", cleanup);
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        500,
        "PROJECT_PHASE_STORAGE_COPY_FAILED",
        `Project phase files could not be copied: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async get(id: bigint, user: AuthUser) {
    const project = await this.repository.findWithFiles(id);
    assertProjectDistrictAccess(project, user);
    return project;
  }

  async updateState(id: bigint, body: any, user: AuthUser) {
    const existing = await this.repository.find(id);
    assertProjectDistrictAccess(existing, user);
    assertProjectUnlocked(existing);
    const data: Prisma.ProjectUncheckedUpdateInput = {
      projectState: body?.state == null ? null : typeof body.state === "string" ? body.state : JSON.stringify(body.state)
    };
    if (typeof body?.progress === "number") data.progress = body.progress;
    return this.repository.update(id, data, true);
  }

  async delete(id: bigint, user: AuthUser) {
    this.requireAdmin(user.role, "Access denied");
    const files = await this.repository.files(id);
    await this.repository.delete(id);
    await settleBestEffort("project_delete", [
      ...files.map(file => ({
        target: file.objectKey,
        run: () => this.storage.deleteFile(file.objectKey)
      })),
      { target: `projects/${id.toString()}`, run: () => this.storage.deleteProjectStorage(id) }
    ]);
    return { success: true, message: "Project deleted successfully" };
  }

  private serializedState(state: unknown) {
    return typeof state === "string" ? state : state ? JSON.stringify(state) : null;
  }

  private async ensureProjectStorage(projectId: bigint) {
    try {
      await this.storage.createProjectStorage(projectId);
    } catch (error) {
      await settleBestEffort("project_creation_rollback", [
        {
          target: `projects/${projectId.toString()}`,
          run: () => this.storage.deleteProjectStorage(projectId)
        },
        { target: `project:${projectId.toString()}`, run: () => this.repository.delete(projectId) }
      ]);
      throw new ApiError(500, "PROJECT_STORAGE_CREATE_FAILED", `Project storage could not be created: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private requireAdmin(role: string, message: string) {
    if (!canAdmin(role)) throw new ApiError(403, "ACCESS_DENIED", message);
  }
}

export const projectsService = new ProjectsService(projectsRepository, storageService);
