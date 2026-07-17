export type UserRole = 
  | 'Super Admin'
  | 'State Admin'
  | 'District Admin'
  | 'Survey Lead'
  | 'Field Surveyor'
  | 'Data Entry'
  | 'GIS Expert'
  | 'Geologist'
  | 'Environment'
  | 'Reviewer'
  | 'Approver'
  | 'Auditor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  district: string;
}

export type PermissionAction = 
  | 'upload:all'
  | 'upload:view'
  | 'upload:survey'
  | 'upload:documents'
  | 'upload:gis'
  | 'approve:yes'
  | 'approve:forward'
  | 'approve:recommend'
  | 'publish:yes'
  | 'publish:no';

export type AppResource = 
  | 'system:full'
  | 'system:readonly'
  | 'district:all'
  | 'district:crud'
  | 'module:survey_mgmt'
  | 'module:survey_uploads'
  | 'module:draft_forms'
  | 'module:gis'
  | 'module:geology'
  | 'module:environment'
  | 'module:review'
  | 'module:final_approval';

// We map routes/paths to necessary resources
export const RouteResourceMap: Record<string, AppResource[]> = {
  '/dashboard': [], // Everyone can access dashboard
  '/projects': [],
  '/users': ['system:full', 'district:all', 'district:crud'], // Admin routes
  '/audit': ['system:full', 'system:readonly', 'district:all'], // Admins and auditors
  '/districts': ['system:full', 'district:all'],
  '/reports': ['system:full', 'district:all', 'district:crud', 'module:review', 'module:final_approval'],
  '/analytics': ['system:full', 'system:readonly', 'district:all'],
  '/workflow': ['system:full', 'module:review', 'module:final_approval'],
};
