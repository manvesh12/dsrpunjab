import { ProjectStatus, type PrismaClient } from "@prisma/client";
import { prisma } from "../database/prisma.client.js";

export interface DashboardStatsRepository {
  countProjects(): Promise<number>;
  countCompletedReports(): Promise<number>;
  countGeneratedPdfs(): Promise<number>;
}

export class DashboardRepository implements DashboardStatsRepository {
  constructor(private readonly database: PrismaClient) {}

  countProjects() {
    return this.database.project.count();
  }

  countCompletedReports() {
    return this.database.project.count({
      where: { OR: [{ status: ProjectStatus.COMPLETED }, { progress: 100 }] }
    });
  }

  countGeneratedPdfs() {
    return this.database.dsrFile.count({ where: { annexureId: "final" } });
  }
}

export const dashboardRepository = new DashboardRepository(prisma);
