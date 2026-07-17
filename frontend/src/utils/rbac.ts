import type { UserRole, AppResource } from '../types/auth.types';

// Matrix based on the provided PDF
export const RolePermissions: Record<UserRole, AppResource[]> = {
  'Super Admin': ['system:full', 'district:all'],
  'State Admin': ['district:all'],
  'District Admin': ['district:crud'],
  'Survey Lead': ['module:survey_mgmt'],
  'Field Surveyor': ['module:survey_uploads'],
  'Data Entry': ['module:draft_forms'],
  'GIS Expert': ['module:gis'],
  'Geologist': ['module:geology'],
  'Environment': ['module:environment'],
  'Reviewer': ['module:review'],
  'Approver': ['module:final_approval'],
  'Auditor': ['system:readonly']
};

export function hasAccess(role: UserRole, requiredResources: AppResource[]): boolean {
  // If no specific resources are required, everyone has access
  if (!requiredResources || requiredResources.length === 0) {
    return true;
  }
  
  const userResources = RolePermissions[role] || [];
  
  // Super Admin can do everything practically (in a real system we'd map this, 
  // but let's check intersection for safety here or give Super Admin bypass)
  if (role === 'Super Admin') return true;
  
  // Check if user has ANY of the required resources for this route
  return requiredResources.some(resource => userResources.includes(resource));
}

export const RouteResourceMap: Record<string, AppResource[]> = {
  '/dashboard': [],
  '/projects': [],
  '/workflow': [],
  '/districts': [],
  '/reports': [],
  '/analytics': [],
  '/notifications': [],
  '/users': ['system:full'],
  '/audit': ['system:readonly', 'system:full'],
  '/settings': ['system:full']
};
