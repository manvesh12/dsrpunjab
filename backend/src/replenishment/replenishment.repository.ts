import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../database/prisma.client.js";

export class ReplenishmentRepository {
  constructor(private readonly database: PrismaClient) {}

  findProject(projectId: bigint) { return this.database.project.findUnique({ where: { id: projectId } }); }

  findProjectForSync(projectId: bigint) {
    return this.database.project.findUnique({
      where: { id: projectId },
      select: { id: true, projectName: true, title: true, district: true, year: true, mineral: true, rivers: true, projectState: true }
    });
  }

  findApprovedDsrs(districtId: bigint | null) {
    const where: Prisma.ProjectWhereInput = {
      // In production, you might restrict to COMPLETED, but for now we include IN_PROGRESS as well to ensure there's data for testing.
      status: { in: ["COMPLETED", "IN_PROGRESS"] }
    };
    if (districtId !== null) {
      where.districtId = districtId;
    }
    return this.database.project.findMany({
      where,
      select: { id: true, projectName: true, title: true, year: true, status: true, district: true },
      orderBy: { createdAt: "desc" }
    });
  }

  list(projectId: bigint) {
    return this.database.replenishmentStudy.findMany({
      where: { projectId },
      include: { files: true },
      orderBy: { createdAt: "desc" }
    });
  }

  create(data: Prisma.ReplenishmentStudyUncheckedCreateInput) {
    return this.database.replenishmentStudy.create({ data });
  }

  findById(id: string) { return this.database.replenishmentStudy.findUnique({ where: { id } }); }

  findByIdWithProjectDistrict(id: string) {
    return this.database.replenishmentStudy.findUnique({
      where: { id },
      include: { files: true, project: { select: { district: true } } }
    });
  }

  findByIdWithProject(id: string) {
    return this.database.replenishmentStudy.findUnique({ where: { id }, include: { project: true } });
  }

  update(id: string, data: Prisma.ReplenishmentStudyUncheckedUpdateInput) {
    return this.database.replenishmentStudy.update({ where: { id }, data });
  }

  createFile(data: Prisma.ReplenishmentFileUncheckedCreateInput) {
    return this.database.replenishmentFile.create({ data });
  }

  files(replenishmentId: string) {
    return this.database.replenishmentFile.findMany({ where: { replenishmentId } });
  }

  findFile(id: string) {
    return this.database.replenishmentFile.findUnique({
      where: { id },
      include: { replenishment: { include: { project: true } } }
    });
  }

  deleteFile(id: string) {
    return this.database.replenishmentFile.delete({ where: { id } });
  }

  delete(id: string) { return this.database.replenishmentStudy.delete({ where: { id } }); }
}

export type ReplenishmentRepositoryContract = Pick<
  ReplenishmentRepository,
  "findProject" | "findProjectForSync" | "findApprovedDsrs" | "list" | "create" | "findById" | "findByIdWithProjectDistrict" | "findByIdWithProject" | "update" | "createFile" | "files" | "findFile" | "deleteFile" | "delete"
>;

export const replenishmentRepository = new ReplenishmentRepository(prisma);
