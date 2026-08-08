import { apiClient } from "./client";

export type ReplenishmentStatus =
  "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

export interface ReplenishmentStudy {
  id: string;
  projectId: number;
  title: string;
  status: ReplenishmentStatus;
  approvalState: string;
  currentVersion: number;
  parentDsrId?: number;
  leaseId?: number;
  river?: string;
  miningBlock?: string;
  surveyData: Record<string, unknown>;
  reportState: Record<string, unknown>;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  files?: ReplenishmentFile[];
}

export interface CreateReplenishmentPayload {
  title: string;
  parentDsrId?: number;
  leaseId?: number;
  river?: string;
  miningBlock?: string;
}

export interface ReplenishmentFile {
  id: string;
  sectionId: string;
  fileName: string;
  objectKey: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
}

export const replenishmentApi = {
  /** List replenishment studies for a project */
  list: async (projectId: string | number): Promise<ReplenishmentStudy[]> => {
    const { data } = await apiClient.get<ReplenishmentStudy[]>(
      `/projects/${projectId}/replenishment`,
    );
    return data;
  },

  /** Create a new replenishment study */
  create: async (
    projectId: string | number,
    payload: CreateReplenishmentPayload,
  ): Promise<ReplenishmentStudy> => {
    const { data } = await apiClient.post<ReplenishmentStudy>(
      `/projects/${projectId}/replenishment`,
      payload,
    );
    return data;
  },

  /** Get a single replenishment study */
  get: async (id: string): Promise<ReplenishmentStudy> => {
    const { data } = await apiClient.get<ReplenishmentStudy>(
      `/replenishment/${id}`,
    );
    return data;
  },

  /** Update a replenishment study */
  update: async (
    id: string,
    payload: Partial<ReplenishmentStudy>,
  ): Promise<ReplenishmentStudy> => {
    const { data } = await apiClient.put<ReplenishmentStudy>(
      `/replenishment/${id}`,
      payload,
    );
    return data;
  },

  /** Delete a replenishment study */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/replenishment/${id}`);
  },

  /** Fetch and auto-import data from the parent Final DSR */
  fetchFinalDsr: async (
    id: string,
  ): Promise<{ imported: Record<string, unknown> }> => {
    const { data } = await apiClient.post(
      `/replenishment/${id}/fetch-final-dsr`,
    );
    return data;
  },

  /** Save replenishment report state (autosave) */
  saveState: async (
    id: string,
    state: Record<string, unknown>,
  ): Promise<void> => {
    await apiClient.put(`/replenishment/${id}/state`, state);
  },

  /** Upload a file for a specific section */
  uploadFile: async (
    id: string,
    sectionId: string,
    file: File,
  ): Promise<ReplenishmentFile> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sectionId", sectionId);
    const { data } = await apiClient.post<ReplenishmentFile>(
      `/replenishment/${id}/upload`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 0,
      },
    );
    return data;
  },

  /** Download a stored replenishment attachment with the active session. */
  downloadFile: async (id: string, fileId: string): Promise<Blob> => {
    const { data } = await apiClient.get(
      `/replenishment/${encodeURIComponent(id)}/files/${encodeURIComponent(fileId)}`,
      { responseType: "blob", timeout: 0 },
    );
    return data;
  },

  /** Delete one stored replenishment attachment. */
  deleteFile: async (id: string, fileId: string): Promise<void> => {
    await apiClient.delete(
      `/replenishment/${encodeURIComponent(id)}/files/${encodeURIComponent(fileId)}`,
    );
  },

  /** Trigger a workflow action */
  workflow: async (
    id: string,
    action: { action: string; remarks?: string },
  ): Promise<{ success: boolean }> => {
    const { data } = await apiClient.post(
      `/replenishment/${id}/workflow`,
      action,
    );
    return data;
  },

  /** Generate AI content for a section */
  generateAi: async (
    id: string,
    sectionId: string,
  ): Promise<{ generatedText: string }> => {
    const { data } = await apiClient.post(`/replenishment/${id}/generate-ai`, {
      sectionId,
    });
    return data;
  },

  /** List approved Final DSRs for replenishment reference */
  listApprovedDsrs: async (): Promise<
    { id: number; projectName: string; district: string }[]
  > => {
    const { data } = await apiClient.get("/replenishment/approved-dsrs");
    return data;
  },
};
