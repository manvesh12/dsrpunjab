

export type Permission = "view_all" | "edit_all" | "approve_reports" | "submit_reports" |
  "view_district" | "edit_district" | "view_block" | "edit_block";

export const rolePermissions: Readonly<Record<string, Permission[]>> = Object.freeze({
  SUPER_ADMIN: ["view_all", "edit_all", "approve_reports", "submit_reports"],
  STATE_ADMIN: ["view_all", "approve_reports"],
  DISTRICT_ADMIN: ["view_district", "approve_reports", "edit_district"],
  DISTRICT_OFFICER: ["view_district", "submit_reports"],
  GEOLOGIST: ["view_district", "submit_reports"],
  SURVEY_OFFICER: ["view_district", "submit_reports"],
  REVIEWER: ["view_district", "approve_reports"],
  DATA_ENTRY_OPERATOR: ["view_district", "submit_reports"],
  REPORT_GENERATOR: ["view_district"],
  PUBLIC_USER: ["view_district"]
});

export function hasPermission(role: string, permission: Permission) {
  return rolePermissions[role]?.includes(permission) || false;
}
