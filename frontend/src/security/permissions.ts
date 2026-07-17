// ─── Roles & Permissions Mapping ──────────────────────────────────────────────

export type Role =
  | "SUPER_ADMIN"
  | "STATE_ADMIN"
  | "DISTRICT_ADMIN"
  | "DISTRICT_OFFICER"
  | "GEOLOGIST"
  | "SURVEY_OFFICER"
  | "REVIEWER"
  | "DATA_ENTRY_OPERATOR"
  | "REPORT_GENERATOR"
  | "PUBLIC_USER";

export type Permission =
  | "view_all"
  | "edit_all"
  | "approve_reports"
  | "submit_reports"
  | "view_district"
  | "edit_district"
  | "view_block"
  | "edit_block";

export const ROLE_PERMISSIONS: Readonly<Record<Role, Permission[]>> = Object.freeze({
  SUPER_ADMIN: ["view_all", "edit_all", "approve_reports", "submit_reports"],
  STATE_ADMIN: ["view_all", "approve_reports"],
  DISTRICT_ADMIN: ["view_district", "approve_reports", "edit_district"],
  DISTRICT_OFFICER: ["view_district", "submit_reports"],
  GEOLOGIST: ["view_district", "submit_reports"],
  SURVEY_OFFICER: ["view_district", "submit_reports"],
  REVIEWER: ["view_district", "approve_reports"],
  DATA_ENTRY_OPERATOR: ["view_district", "submit_reports"],
  REPORT_GENERATOR: ["view_district"],
  PUBLIC_USER: ["view_district"],
});

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}
