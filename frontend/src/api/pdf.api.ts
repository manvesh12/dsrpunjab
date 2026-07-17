import { apiClient } from "./client";

export const pdfApi = {
  /** Upload an existing PDF manually */
  upload: async (file: File, metadata?: Record<string, unknown>): Promise<{ id: string; url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    if (metadata) formData.append("metadata", JSON.stringify(metadata));
    
    const { data } = await apiClient.post("/upload-pdf", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  /** Download a PDF by identifier */
  download: async (identifier: string): Promise<Blob> => {
    const { data } = await apiClient.get(`/download-pdf`, {
      params: { id: identifier },
      responseType: "blob",
    });
    return data;
  },

  /** Email the final PDF to stakeholders */
  emailFinal: async (payload: { pdfId: string; recipients: string[]; subject?: string; body?: string }): Promise<{ success: boolean }> => {
    const { data } = await apiClient.post("/email-final-pdf", payload);
    return data;
  },
};
