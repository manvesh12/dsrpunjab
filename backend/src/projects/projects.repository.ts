import type { DsrFile, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../database/prisma.client.js";

type PhasePersistenceInput = {
  sourceId: bigint;
  lockedSourceState: string;
  nextProject: Prisma.ProjectUncheckedCreateInput;
  files: DsrFile[];
  workflow: Prisma.WorkflowHistoryUncheckedCreateInput;
};

export class ProjectsRepository {
  constructor(private readonly database: PrismaClient) {}

  list(districtId: bigint | null) {
    return this.database.project.findMany({ where: districtId ? { districtId } : {}, include: { files: true }, orderBy: { createdAt: "desc" } });
  }

  deleteAll() { return this.database.project.deleteMany({}); }

  create(data: Prisma.ProjectUncheckedCreateInput, includeFiles = false) {
    return this.database.project.create({ data, ...(includeFiles ? { include: { files: true } } : {}) });
  }

  createWorkflow(data: Prisma.WorkflowHistoryUncheckedCreateInput) {
    return this.database.workflowHistory.create({ data });
  }

  find(id: bigint) { return this.database.project.findUnique({ where: { id } }); }

  findWithFiles(id: bigint) { return this.database.project.findUnique({ where: { id }, include: { files: true, projectDraft: true, projectSections: true } }); }

  update(id: bigint, data: Prisma.ProjectUncheckedUpdateInput, includeFiles = false) {
    return this.database.project.update({ where: { id }, data, ...(includeFiles ? { include: { files: true } } : {}) });
  }

  files(projectId: bigint) { return this.database.dsrFile.findMany({ where: { projectId } }); }

  delete(id: bigint) { return this.database.project.delete({ where: { id } }); }

  createNextPhase(input: PhasePersistenceInput) {
    return this.database.$transaction(async tx => {
      await tx.project.update({
        where: { id: input.sourceId },
        data: { phaseLocked: true, projectState: input.lockedSourceState }
      });
      const nextProject = await tx.project.create({ data: input.nextProject });
      if (input.files.length) {
        await tx.dsrFile.createMany({
          data: input.files.map(file => ({
            projectId: nextProject.id,
            annexureId: file.annexureId,
            fileName: file.fileName,
            objectKey: file.objectKey,
            contentType: file.contentType,
            sizeBytes: file.sizeBytes
          })),
          skipDuplicates: true
        });
      }
      await tx.workflowHistory.create({ data: { ...input.workflow, reportId: nextProject.id } });
      return tx.project.findUnique({ where: { id: nextProject.id }, include: { files: true } });
    });
  }
}

export type ProjectsRepositoryContract = Pick<
  ProjectsRepository,
  "list" | "deleteAll" | "create" | "createWorkflow" | "find" | "findWithFiles" | "update" | "files" | "delete" | "createNextPhase"
>;

export const projectsRepository = new ProjectsRepository(prisma);
