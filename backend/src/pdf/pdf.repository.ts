import type { PrismaClient } from "@prisma/client";
import { prisma } from "../database/prisma.client.js";

export class PdfRepository {
  constructor(private readonly database: PrismaClient) {}

  findProject(id: bigint) { return this.database.project.findUnique({ where: { id } }); }
  deleteMetadata(projectId: bigint, annexureId: string) { return this.database.dsrFile.deleteMany({ where: { projectId, annexureId } }); }
  findFile(projectId: bigint, annexureId: string) {
    return this.database.dsrFile.findUnique({ where: { projectId_annexureId: { projectId, annexureId } } });
  }
  upsertFile(projectId: bigint, annexureId: string, fileName: string, objectKey: string, sizeBytes: number) {
    return this.database.dsrFile.upsert({
      where: { projectId_annexureId: { projectId, annexureId } },
      create: { projectId, annexureId, fileName, objectKey, sizeBytes },
      update: { fileName, objectKey, sizeBytes }
    });
  }
  updateProjectState(projectId: bigint, projectState: string) {
    return this.database.project.update({ where: { id: projectId }, data: { projectState } });
  }
  createWorkflow(reportId: bigint, remarks: string, performedBy: bigint) {
    return this.database.workflowHistory.create({
      data: { reportId, action: "DOCUMENT_UPLOADED", remarks, performedBy }
    });
  }
}

export type PdfRepositoryContract = Pick<PdfRepository, "findProject" | "deleteMetadata" | "findFile" | "upsertFile" | "updateProjectState" | "createWorkflow">;
export const pdfRepository = new PdfRepository(prisma);
