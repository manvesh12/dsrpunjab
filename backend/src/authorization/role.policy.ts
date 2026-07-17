// Dynamic Role Policy for Normalized RBAC

export function roleToFrontend(role: string) {
  const reviewerRoles: string[] = ['REVIEWER', 'DISTRICT_ADMIN'];
  if (role === 'SUPER_ADMIN' || role === 'STATE_ADMIN') return 'admin';
  if (reviewerRoles.includes(role)) return 'reviewer';
  return 'user';
}

export function permissionsFor(role: string): string[] {
  return []; // Replaced by dynamic Session permissions
}

// These legacy helpers are mapped loosely for compatibility with untouched files, 
// but the true authorization uses PermissionsGuard in routers.
export function canUpload(role: string) { return role === 'SUPER_ADMIN' || role === 'DISTRICT_OFFICER' || role === 'DATA_ENTRY_OPERATOR'; }
export function canReview(role: string) { return role === 'SUPER_ADMIN' || role === 'REVIEWER' || role === 'DISTRICT_ADMIN'; }
export function canAdmin(role: string) { return role === 'SUPER_ADMIN' || role === 'STATE_ADMIN'; }
