import { apiClient } from "./client";

export interface ModelDsr {
  id: string;
  name: string;
  version: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  schemaDefinition: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedDsr {
  id: string;
  modelId: string;
  projectId: string;
  status: "GENERATING" | "COMPLETED" | "FAILED";
  pdfUrl?: string;
  createdAt: string;
}

export const modelDsrApi = {
  /** List all Model DSR templates */
  list: async (): Promise<ModelDsr[]> => {
    const { data } = await apiClient.get<ModelDsr[]>("/model-dsrs");
    return data;
  },

  /** Create a new Model DSR template */
  create: async (payload: { name: string; schemaDefinition: Record<string, unknown> }): Promise<ModelDsr> => {
    const { data } = await apiClient.post<ModelDsr>("/model-dsrs", payload);
    return data;
  },

  /** Get a single Model DSR template */
  get: async (id: string): Promise<ModelDsr> => {
    const { data } = await apiClient.get<ModelDsr>(`/model-dsrs/${id}`);
    return data;
  },

  /** Update an existing Model DSR template */
  update: async (id: string, payload: Partial<ModelDsr>): Promise<ModelDsr> => {
    const { data } = await apiClient.put<ModelDsr>(`/model-dsrs/${id}`, payload);
    return data;
  },

  /** Publish a Model DSR template */
  publish: async (id: string): Promise<ModelDsr> => {
    const { data } = await apiClient.post<ModelDsr>(`/model-dsrs/${id}/publish`);
    return data;
  },

  /** Delete a Model DSR template */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/model-dsrs/${id}`);
  },

  /** Duplicate an existing Model DSR template */
  duplicate: async (id: string): Promise<ModelDsr> => {
    const { data } = await apiClient.post<ModelDsr>(`/model-dsrs/${id}/duplicate`);
    return data;
  },

  /** Import a Model DSR from a JSON schema */
  importSchema: async (id: string, payload: { schemaDefinition: Record<string, unknown> }): Promise<ModelDsr> => {
    const { data } = await apiClient.post<ModelDsr>(`/model-dsrs/${id}/import`, payload);
    return data;
  },

  /** Generate a new DSR report for a project based on a Model DSR */
  generate: async (payload: { modelId: string; projectId: string; options?: Record<string, unknown> }): Promise<{ jobId: string }> => {
    const { data } = await apiClient.post<{ jobId: string }>("/model-dsrs/generate", payload);
    return data;
  },

  /** List generated DSRs */
  listGenerated: async (params?: { projectId?: string }): Promise<GeneratedDsr[]> => {
    const { data } = await apiClient.get<GeneratedDsr[]>("/model-dsrs/generated/list", { params });
    return data;
  },

  /** Get a single generated DSR */
  getGenerated: async (id: string): Promise<GeneratedDsr> => {
    const { data } = await apiClient.get<GeneratedDsr>(`/model-dsrs/generated/${id}`);
    return data;
  },
};
