import type { Prisma, PrismaClient } from "@prisma/client";
import { ApiError } from "../common/exceptions/api-error.js";
import { prisma } from "../database/prisma.client.js";

export class PdfRepository {
  constructor(private readonly database: PrismaClient) {}

  findProject(id: bigint) { return this.database.project.findUnique({ where: { id } }); }
  deleteMetadata(projectId: bigint, annexureId: string) {
    return this.database.$transaction(async tx => {
      await this.requireUnlocked(tx, projectId);
      const previous = await tx.dsrFile.findUnique({
        where: { projectId_annexureId: { projectId, annexureId } }
      });
      await tx.dsrFile.deleteMany({ where: { projectId, annexureId } });
      return previous;
    });
  }
  findFile(projectId: bigint, annexureId: string) {
    return this.database.dsrFile.findUnique({ where: { projectId_annexureId: { projectId, annexureId } } });
  }
  saveUpload(input: {
    projectId: bigint;
    annexureId: string;
    fileName: string;
    objectKey: string;
    sizeBytes: number;
    projectState?: string;
    remarks: string;
    performedBy: bigint;
  }) {
    return this.database.$transaction(async tx => {
      await this.requireUnlocked(tx, input.projectId);
      const previous = await tx.dsrFile.findUnique({
        where: { projectId_annexureId: { projectId: input.projectId, annexureId: input.annexureId } },
        select: { objectKey: true }
      });
      const file = await tx.dsrFile.upsert({
        where: { projectId_annexureId: { projectId: input.projectId, annexureId: input.annexureId } },
        create: {
          projectId: input.projectId,
          annexureId: input.annexureId,
          fileName: input.fileName,
          objectKey: input.objectKey,
          sizeBytes: input.sizeBytes
        },
        update: { fileName: input.fileName, objectKey: input.objectKey, sizeBytes: input.sizeBytes }
      });
      if (input.projectState !== undefined) {
        await tx.project.update({ where: { id: input.projectId }, data: { projectState: input.projectState } });
      }
      await tx.workflowHistory.create({
        data: {
          reportId: input.projectId,
          action: "DOCUMENT_UPLOADED",
          remarks: input.remarks,
          performedBy: input.performedBy
        }
      });
      return { file, previousObjectKey: previous?.objectKey || null };
    });
  }

  private async requireUnlocked(
    tx: Prisma.TransactionClient,
    projectId: bigint
  ) {
    const unlocked = await tx.project.updateMany({
      where: { id: projectId, phaseLocked: false },
      data: { phaseLocked: false }
    });
    if (unlocked.count !== 1) {
      throw new ApiError(409, "PROJECT_PHASE_LOCKED", "This project phase is locked and cannot be modified");
    }
  }
}

export type PdfRepositoryContract = Pick<PdfRepository, "findProject" | "deleteMetadata" | "findFile" | "saveUpload">;
export const pdfRepository = new PdfRepository(prisma);
