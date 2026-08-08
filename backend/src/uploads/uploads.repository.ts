import type { Prisma, PrismaClient } from "@prisma/client";
import { ApiError } from "../common/exceptions/api-error.js";
import { prisma } from "../database/prisma.client.js";

export class UploadsRepository {
  constructor(private readonly database: PrismaClient) {}

  findProject(id: bigint) { return this.database.project.findUnique({ where: { id } }); }

  create(data: Prisma.DsrFileUncheckedCreateInput) {
    return this.database.$transaction(async tx => {
      const unlocked = await tx.project.updateMany({
        where: { id: data.projectId, phaseLocked: false },
        data: { phaseLocked: false }
      });
      if (unlocked.count !== 1) {
        throw new ApiError(409, "PROJECT_PHASE_LOCKED", "This project phase is locked and cannot be modified");
      }
      return tx.dsrFile.create({ data });
    });
  }

  delete(id: bigint) {
    return this.database.$transaction(async tx => {
      const file = await tx.dsrFile.findUnique({ where: { id }, select: { projectId: true } });
      if (!file) throw new ApiError(404, "FILE_NOT_FOUND", "File not found");
      const unlocked = await tx.project.updateMany({
        where: { id: file.projectId, phaseLocked: false },
        data: { phaseLocked: false }
      });
      if (unlocked.count !== 1) {
        throw new ApiError(409, "PROJECT_PHASE_LOCKED", "This project phase is locked and cannot be modified");
      }
      return tx.dsrFile.delete({ where: { id } });
    });
  }

  list(projectId: bigint, objectKeyPrefixes: string[]) {
    return this.database.dsrFile.findMany({
      where: {
        projectId,
        annexureId: { startsWith: "file-" },
        ...(objectKeyPrefixes.length ? {
          OR: objectKeyPrefixes.map(prefix => ({ objectKey: { startsWith: prefix } }))
        } : {})
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async find(identifier: string, projectIdValue: string) {
    if (!/^\d+$/.test(projectIdValue)) return null;
    const projectId = BigInt(projectIdValue);
    return this.database.dsrFile.findFirst({
      where: {
        projectId,
        annexureId: { startsWith: "file-" },
        OR: [{ annexureId: identifier }, { objectKey: identifier }, { fileName: identifier }],
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

export type UploadsRepositoryContract = Pick<UploadsRepository, "findProject" | "create" | "delete" | "list" | "find">;
export const uploadsRepository = new UploadsRepository(prisma);
