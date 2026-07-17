import { apiClient } from "./client";

export type ReportStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

export interface ReportListItem {
  id: string | number;
  reportNumber?: string;
  projectId?: number;
  title: string;
  description?: string;
  reportType?: string;
  status: ReportStatus;
  submittedBy?: number;
  reviewedBy?: number;
  approvedBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowAction {
  action: "SUBMIT" | "REVIEW" | "APPROVE" | "REJECT" | "RETURN";
  remarks?: string;
}

export interface WorkflowHistory {
  id: string | number;
  reportId: number;
  action: string;
  remarks?: string;
  performedBy?: number;
  performedAt: string;
}

export const reportsApi = {
  /** List all reports */
  list: async (params?: { projectId?: number; status?: ReportStatus }): Promise<ReportListItem[]> => {
    const { data } = await apiClient.get<ReportListItem[]>("/reports", { params });
    return data;
  },

  /** Create a new report */
  create: async (payload: { projectId: number; title: string; reportType?: string }): Promise<ReportListItem> => {
    const { data } = await apiClient.post<ReportListItem>("/reports", payload);
    return data;
  },

  /** Update report status directly */
  updateStatus: async (id: string | number, status: ReportStatus): Promise<ReportListItem> => {
    const { data } = await apiClient.patch<ReportListItem>(`/reports/${id}/status`, { status });
    return data;
  },

  /** Trigger a workflow action (submit, review, approve, reject) */
  workflow: async (id: string | number, action: WorkflowAction): Promise<{ success: boolean }> => {
    const { data } = await apiClient.post(`/reports/${id}/workflow`, action);
    return data;
  },

  /** Get the workflow history of a report */
  history: async (id: string | number): Promise<WorkflowHistory[]> => {
    const { data } = await apiClient.get<WorkflowHistory[]>(`/reports/${id}/history`);
    return data;
  },

  /** Get audit logs for all reports */
  auditLogs: async (): Promise<unknown[]> => {
    const { data } = await apiClient.get("/reports/audit-logs");
    return data;
  },
};
