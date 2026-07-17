import { apiClient } from "./client";

export interface SearchResult {
  id: string;
  type: "PROJECT" | "USER" | "REPORT" | "REPLENISHMENT";
  title: string;
  description?: string;
  url: string;
  metadata?: Record<string, unknown>;
}

export const searchApi = {
  /** Perform a global search across projects, reports, users, etc. */
  search: async (query: string): Promise<SearchResult[]> => {
    const { data } = await apiClient.post<SearchResult[]>("/search", { query });
    return data;
  },

  /** Reindex all searchable entities (admin only) */
  index: async (): Promise<{ message: string }> => {
    const { data } = await apiClient.post("/search/index");
    return data;
  },
};
