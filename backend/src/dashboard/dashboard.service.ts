import type { DashboardStatsDto } from "./dashboard.dto.js";
import { dashboardRepository, type DashboardStatsRepository } from "./dashboard.repository.js";

export class DashboardService {
  constructor(private readonly repository: DashboardStatsRepository) {}

  async getStats(): Promise<DashboardStatsDto> {
    const [totalProjects, completedReports, generatedPdfs] = await Promise.all([
      this.repository.countProjects(),
      this.repository.countCompletedReports(),
      this.repository.countGeneratedPdfs()
    ]);

    return {
      totalProjects,
      completedReports,
      pendingReports: Math.max(totalProjects - completedReports, 0),
      generatedPdfs
    };
  }
}

export const dashboardService = new DashboardService(dashboardRepository);
