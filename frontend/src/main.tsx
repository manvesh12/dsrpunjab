import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any) => {
      // Global query error logging/handling (interceptors handle toasts)
      console.error(`[Query Error]: ${error.message}`);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: any) => {
      console.error(`[Mutation Error]: ${error.message}`);
    },
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 401, 403, 404
        if (error?.response?.status === 401 || error?.response?.status === 403 || error?.response?.status === 404) return false;
        // Retry network errors up to 3 times
        return failureCount < 3;
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Only retry network errors for mutations
        if (error.message === "Network Error" || error.code === "ECONNABORTED") {
          return failureCount < 2;
        }
        return false;
      },
    }
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);