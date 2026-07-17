import { apiClient } from "./client";

export interface DashboardStats {
  totalProjects: number;
  completedReports: number;
  pendingReports: number;
  generatedPdfs: number;
}

export const dashboardApi = {
  /** Fetch dashboard statistics from the backend */
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get<DashboardStats>("/dashboard/stats");
    return data;
  },
};
