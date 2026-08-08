import { apiClient } from "./client";

function isNotFound(error: unknown) {
  return typeof error === "object" && error !== null &&
    "response" in error &&
    (error as { response?: { status?: number } }).response?.status === 404;
}

/**
 * NOTE: The backend currently has a progress-stream service for SSE notifications.
 * A full Notification entity on the User model exists in the Prisma schema.
 * This API module is prepared for when the backend exposes a /notifications endpoint.
 * Until then, it gracefully handles 404 errors.
 */

export interface Notification {
  id: string | number;
  message: string;
  type: "info" | "warning" | "error" | "success";
  read: boolean;
  createdAt: string;
  link?: string;
  category?: string;
}

export const notificationsApi = {
  /** Fetch all notifications for the current user */
  list: async (): Promise<Notification[]> => {
    try {
      const { data } = await apiClient.get<Notification[]>("/notifications");
      return data;
    } catch (err: unknown) {
      if (isNotFound(err)) return [];
      throw err;
    }
  },

  /** Mark a single notification as read */
  markRead: async (id: string | number): Promise<void> => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
    } catch (err: unknown) {
      if (isNotFound(err)) return;
      throw err;
    }
  },

  /** Mark all notifications as read */
  markAllRead: async (): Promise<void> => {
    try {
      await apiClient.patch("/notifications/read-all");
    } catch (err: unknown) {
      if (isNotFound(err)) return;
      throw err;
    }
  },

  /** Delete one notification owned by the current user */
  remove: async (id: string | number): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },

  /**
   * Subscribe to a Server-Sent Events stream for real-time job progress.
   * Used in Import DSR and DSR generation flows.
   */
  streamJobProgress: (jobId: string, onMessage: (data: unknown) => void): EventSource => {
    const baseUrl = apiClient.defaults.baseURL || "http://localhost:8080/api";
    const token = localStorage.getItem("dsr:auth_token") || "";
    const es = new EventSource(`${baseUrl}/stream/job/${jobId}?token=${token}`);
    es.onmessage = (e) => {
      try {
        onMessage(JSON.parse(e.data));
      } catch {
        onMessage(e.data);
      }
    };
    return es;
  },
};
