import axios, { AxiosError } from "axios";
import { toast } from "sonner";

let base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
if (base.endsWith('/')) base = base.slice(0, -1);
if (!base.endsWith('/api')) base = `${base}/api`;

export const apiClient = axios.create({
  baseURL: base,
  timeout: 15000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("dsr:auth_token") || localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  
  // Offline detection before sending
  if (!navigator.onLine) {
    const controller = new AbortController();
    config.signal = controller.signal;
    controller.abort("Offline");
  }
  
  return config;
});

// Automatic token refresh and global error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError | any) => {
    const originalRequest = error.config;

    // Handle Network Offline / Timeout
    if (error.message === "Network Error" || error.message === "canceled" || error.code === "ECONNABORTED") {
      if (!navigator.onLine || error.message === "Offline") {
        toast.error("You are offline. Changes have been queued and will sync when reconnected.", { id: "offline-error" });
      } else {
        toast.error("Network timeout. The server took too long to respond.", { id: "timeout-error" });
      }
      return Promise.reject(error);
    }

    if (error.response) {
      const { status, data } = error.response;

      // 401 Unauthorized - Token Refresh Logic
      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Assume backend refresh endpoint is /auth/refresh
          const { data: refreshData } = await axios.post(
            `${apiClient.defaults.baseURL}/auth/refresh`,
            {},
            { withCredentials: true }
          );

          if (refreshData.accessToken) {
            localStorage.setItem("dsr:auth_token", refreshData.accessToken);
            originalRequest.headers.Authorization = `Bearer ${refreshData.accessToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          localStorage.removeItem("dsr:auth_token");
          localStorage.removeItem("dsr:auth_user");
          toast.error("Session expired. Please log in again.");
          window.location.href = "/auth/login";
          return Promise.reject(refreshError);
        }
      }

      // 403 Forbidden
      if (status === 403) {
        toast.error("Access denied. You do not have permission to perform this action.");
      }

      // 404 Not Found
      if (status === 404) {
        toast.error("The requested resource was not found.");
      }

      // 422 Unprocessable Entity (Validation)
      if (status === 422) {
        const errorMsg = data.message || data.error || "Validation failed";
        toast.error(`Validation Error: ${errorMsg}`);
      }
      
      // 409 Conflict
      if (status === 409) {
        toast.error(`Conflict: ${data.message || 'Resource already exists.'}`);
      }

      // 500 Internal Server Error
      if (status >= 500) {
        toast.error("An unexpected server error occurred. Please try again later.");
      }
    } else {
      // Something happened in setting up the request that triggered an Error
      toast.error("An unknown error occurred while making the request.");
    }

    return Promise.reject(error);
  }
);
