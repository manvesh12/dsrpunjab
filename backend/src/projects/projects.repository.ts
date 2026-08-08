import type { DsrFile, Prisma, PrismaClient } from "@prisma/client";
import { ApiError } from "../common/exceptions/api-error.js";
import { prisma } from "../database/prisma.client.js";

type PhasePersistenceInput = {
  sourceId: bigint;
  nextProjectId: bigint;
  files: DsrFile[];
  workflow: Prisma.WorkflowHistoryUncheckedCreateInput;
};

export class ProjectsRepository {
  constructor(private readonly database: PrismaClient) {}

  list(districtId: bigint | null) {
    return this.database.project.findMany({ where: districtId ? { districtId } : {}, include: { files: true }, orderBy: { createdAt: "desc" } });
  }

  deleteAll() { return this.database.project.deleteMany({}); }

  replaceAll(projects: Prisma.ProjectUncheckedCreateInput[]) {
    return this.database.$transaction(async tx => {
      await tx.project.deleteMany({});
      const created = [];
      for (const project of projects) {
        created.push(await tx.project.create({ data: project }));
      }
      return created;
    });
  }

  create(data: Prisma.ProjectUncheckedCreateInput, includeFiles = false) {
    return this.database.project.create({ data, ...(includeFiles ? { include: { files: true } } : {}) });
  }

  createWorkflow(data: Prisma.WorkflowHistoryUncheckedCreateInput) {
    return this.database.workflowHistory.create({ data });
  }

  find(id: bigint) { return this.database.project.findUnique({ where: { id } }); }

  findWithFiles(id: bigint) { return this.database.project.findUnique({ where: { id }, include: { files: true, projectDraft: true, projectSections: true } }); }

  update(id: bigint, data: Prisma.ProjectUncheckedUpdateInput, includeFiles = false) {
    return this.database.$transaction(async tx => {
      const unlocked = await tx.project.updateMany({
        where: { id, phaseLocked: false },
        data: { phaseLocked: false }
      });
      if (unlocked.count !== 1) {
        throw new ApiError(409, "PROJECT_PHASE_LOCKED", "This project phase is locked and cannot be modified");
      }
      return tx.project.update({ where: { id }, data, ...(includeFiles ? { include: { files: true } } : {}) });
    });
  }

  files(projectId: bigint) { return this.database.dsrFile.findMany({ where: { projectId } }); }

  delete(id: bigint) { return this.database.project.delete({ where: { id } }); }

  reserveNextPhase(sourceId: bigint, lockedSourceState: string, expectedUpdatedAt: Date) {
    return this.database.project.updateMany({
      where: { id: sourceId, phaseLocked: false, updatedAt: expectedUpdatedAt },
      data: { phaseLocked: true, projectState: lockedSourceState }
    });
  }

  releaseNextPhase(sourceId: bigint, originalProjectState: string | null) {
    return this.database.project.updateMany({
      where: { id: sourceId, phaseLocked: true },
      data: { phaseLocked: false, projectState: originalProjectState }
    });
  }

  createNextPhase(input: PhasePersistenceInput) {
    return this.database.$transaction(async tx => {
      const source = await tx.project.findUnique({
        where: { id: input.sourceId },
        select: { phaseLocked: true }
      });
      if (!source?.phaseLocked) {
        throw new ApiError(409, "PROJECT_PHASE_RESERVATION_LOST", "The source phase reservation is no longer active");
      }
      await tx.project.update({
        where: { id: input.nextProjectId },
        data: { phaseLocked: false }
      });
      if (input.files.length) {
        await tx.dsrFile.createMany({
          data: input.files.map(file => ({
            projectId: input.nextProjectId,
            annexureId: file.annexureId,
            fileName: file.fileName,
            objectKey: file.objectKey,
            contentType: file.contentType,
            sizeBytes: file.sizeBytes
          })),
          skipDuplicates: true
        });
      }
      await tx.workflowHistory.create({ data: { ...input.workflow, reportId: input.nextProjectId } });
      const created = await tx.project.findUnique({ where: { id: input.nextProjectId }, include: { files: true } });
      if (!created) throw new Error("The pending project phase no longer exists");
      return created;
    });
  }
}

export type ProjectsRepositoryContract = Pick<
  ProjectsRepository,
  "list" | "deleteAll" | "replaceAll" | "create" | "createWorkflow" | "find" | "findWithFiles" | "update" | "files" | "delete" | "reserveNextPhase" | "releaseNextPhase" | "createNextPhase"
>;

export const projectsRepository = new ProjectsRepository(prisma);
