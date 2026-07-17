export type ProjectStatus =
  | "Draft"
  | "In Progress"
  | "Under Review"
  | "Approved";

export type Project = {
  id: string;
  projectName: string;
  district: string;
  financialYear: string;
  mineral: string;
  status: ProjectStatus;
  progress: number;
  updatedAt: string;
};