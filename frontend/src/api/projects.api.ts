import { apiClient } from "./client";

export interface ProjectListItem {
  id: string | number;
  projectCode?: string;
  projectName: string;
  title?: string;
  district?: string;
  districtId?: number;
  year?: string;
  mineral?: string;
  rivers?: string;
  description?: string;
  progress: number;
  status: "ACTIVE" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED";
  phaseNo: number;
  phaseLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetail extends ProjectListItem {
  projectState?: Record<string, unknown>;
  lastReviewedState?: Record<string, unknown>;
  files?: ProjectFile[];
  generatedDsrs?: GeneratedDsr[];
}

export interface ProjectFile {
  id: string | number;
  annexureId: string;
  fileName: string;
  objectKey: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface GeneratedDsr {
  id: string;
  modelId: string;
  status: "DRAFT" | "FINAL";
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  projectName: string;
  district?: string;
  districtId?: number;
  year?: string;
  mineral?: string;
  rivers?: string;
  description?: string;
}

export interface UpdateProjectStatePayload {
  projectState?: Record<string, unknown>;
}

export interface ProjectListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  district?: string;
}

export interface ProjectListResponse {
  data: ProjectListItem[];
  total: number;
  page: number;
  limit: number;
}

export const projectsApi = {
  /** List projects with server-side pagination, filter, search */
  list: async (params?: ProjectListParams): Promise<ProjectListResponse> => {
    const { data } = await apiClient.get<ProjectListResponse>("/projects", { params });
    // Handle flat array responses from older endpoints
    if (Array.isArray(data)) {
      return { data: data as unknown as ProjectListItem[], total: (data as unknown as ProjectListItem[]).length, page: 1, limit: 50 };
    }
    return data;
  },

  /** Get a single project by ID with full detail */
  get: async (id: string | number): Promise<ProjectDetail> => {
    const { data } = await apiClient.get<ProjectDetail>(`/projects/${id}`);
    return data;
  },

  /** Create a new project */
  create: async (payload: CreateProjectPayload): Promise<ProjectDetail> => {
    const response = await apiClient.post<ProjectDetail | { project: ProjectDetail }>("/projects", payload);
    const d = response.data;
    return "project" in d ? d.project : d;
  },

  /** Update a project's state (autosave) */
  updateState: async (id: string | number, payload: UpdateProjectStatePayload): Promise<ProjectDetail> => {
    const { data } = await apiClient.put<ProjectDetail>(`/projects/${id}/state`, payload);
    return data;
  },

  /** Update a specific project section */
  updateSection: async (id: string | number, sectionName: string, content: Record<string, unknown>): Promise<void> => {
    await apiClient.patch(`/projects/${id}/sections/${sectionName}`, { content });
  },

  /** Save a project draft */
  saveDraft: async (id: string | number, draftData: Record<string, unknown>): Promise<void> => {
    await apiClient.post(`/projects/${id}/draft`, draftData);
  },

  /** Move project to next phase */
  nextPhase: async (id: string | number): Promise<ProjectDetail> => {
    const { data } = await apiClient.post<ProjectDetail>(`/projects/${id}/phases`);
    return data;
  },

  /** Rollback project to previous phase */
  rollback: async (id: string | number): Promise<ProjectDetail> => {
    const { data } = await apiClient.post<ProjectDetail>(`/projects/${id}/rollback`);
    return data;
  },

  /** Import a DSR package into a project */
  importPackage: async (id: string | number, payload: Record<string, unknown>): Promise<void> => {
    await apiClient.post(`/projects/${id}/import-package`, payload);
  },

  /** Delete a project */
  delete: async (id: string | number): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },
};
