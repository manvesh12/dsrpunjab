import { apiClient } from "./client";

export interface FileMetadata {
  id: string;
  originalName: string;
  fileName: string;
  savedName: string;
  objectKey: string;
  contentType: string;
  sizeBytes: number;
  url: string;
  downloadUrl: string;
  uploadedAt: string;
  uploadedBy?: string;
  success: boolean;
}

export interface ProjectUploadOptions {
  projectId: string | number;
  module: string;
  requirementId: string;
  uploadedBy?: string;
}

export type ProjectFileListOptions = {
  projectId: string | number;
  module?: string;
  requirementId?: string;
};

export const uploadsApi = {
  /** List files stored in one project/module/requirement slot. */
  list: async (options: ProjectFileListOptions): Promise<FileMetadata[]> => {
    const { data } = await apiClient.get<
      FileMetadata[] | { files: FileMetadata[] }
    >("/files", { params: options });
    return Array.isArray(data) ? data : data.files;
  },

  /** Download through the authenticated API client for safe inline previews. */
  downloadBlob: async (
    identifier: string,
    projectId: string | number,
  ): Promise<Blob> => {
    const { data } = await apiClient.get<Blob>(
      `/files/download/${encodeURIComponent(identifier)}`,
      {
        params: { projectId, inline: true },
        responseType: "blob",
        timeout: 0,
      },
    );
    return data;
  },

  /** Upload a file into a project's storage area. */
  upload: async (
    file: File,
    options: ProjectUploadOptions,
  ): Promise<FileMetadata> => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post<FileMetadata>(
      "/files/upload",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        params: options,
        timeout: 0,
      },
    );
    return data;
  },

  /** Delete a file only from the project it belongs to. */
  delete: async (
    identifier: string,
    projectId: string | number,
  ): Promise<void> => {
    await apiClient.delete(`/files/${encodeURIComponent(identifier)}`, {
      params: { projectId },
    });
  },
};
