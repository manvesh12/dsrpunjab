import { apiClient } from "./client";

export interface FileMetadata {
  id: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
}

export const uploadsApi = {
  /** Upload a file generically to the backend */
  upload: async (file: File): Promise<FileMetadata> => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post<FileMetadata>("/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  /** Get the download URL for a file */
  getDownloadUrl: (identifier: string): string => {
    return `${apiClient.defaults.baseURL}/files/download/${identifier}`;
  },

  /** Delete an uploaded file */
  delete: async (identifier: string): Promise<void> => {
    await apiClient.delete(`/files/${identifier}`);
  },
};
