import { apiClient } from "./client";

export type CreateProjectPayload = {
  projectName: string;
  district: string;
  year: string;
  mineral: "Sand" | "RBM" | "Bajri" | "Gravel";
  rivers: string;
  status: "ACTIVE";
};

export type CreatedProject = {
  id: string | number;
  projectName: string;
  district: string;
  year?: string;
  mineral?: string;
  rivers?: string;
  status?: string;
};

type CreateProjectResponse =
  | CreatedProject
  | { project: CreatedProject; bulk: false };

export async function createProject(
  payload: CreateProjectPayload,
): Promise<CreatedProject> {
  const response = await apiClient.post<CreateProjectResponse>(
    "/projects",
    payload,
  );

  return "project" in response.data
    ? response.data.project
    : response.data;
}
