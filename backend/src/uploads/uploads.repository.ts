import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../database/prisma.client.js";

export class UploadsRepository {
  constructor(private readonly database: PrismaClient) {}

  findProject(id: bigint) { return this.database.project.findUnique({ where: { id } }); }

  create(data: Prisma.DsrFileUncheckedCreateInput) { return this.database.dsrFile.create({ data }); }

  delete(id: bigint) { return this.database.dsrFile.delete({ where: { id } }); }

  async find(identifier: string, projectIdValue?: string) {
    const projectId = projectIdValue && /^\d+$/.test(projectIdValue) ? BigInt(projectIdValue) : null;
    if (projectId) {
      const byAnnexure = await this.database.dsrFile.findUnique({
        where: { projectId_annexureId: { projectId, annexureId: identifier } }
      });
      if (byAnnexure) return byAnnexure;
    }
    return this.database.dsrFile.findFirst({
      where: { OR: [{ annexureId: identifier }, { objectKey: identifier }, { fileName: identifier }] },
      orderBy: { createdAt: "desc" }
    });
  }
}

export type UploadsRepositoryContract = Pick<UploadsRepository, "findProject" | "create" | "delete" | "find">;
export const uploadsRepository = new UploadsRepository(prisma);
