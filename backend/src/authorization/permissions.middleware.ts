import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../common/exceptions/api-error.js';

const prisma = new PrismaClient();

// Simple in-memory cache for role permissions to avoid DB hits on every request
const rolePermissionsCache = new Map<string, Set<string>>();
let cacheLastUpdated = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

/**
 * Refresh the permissions cache from the database
 */
export async function refreshPermissionsCache() {
  const rolePermissions = await prisma.rolePermission.findMany({
    include: {
      role: true,
      permission: true
    }
  });

  rolePermissionsCache.clear();
  
  for (const rp of rolePermissions) {
    const roleName = rp.role.name;
    const action = rp.permission.action;
    
    if (!rolePermissionsCache.has(roleName)) {
      rolePermissionsCache.set(roleName, new Set());
    }
    rolePermissionsCache.get(roleName)!.add(action);
  }

  cacheLastUpdated = Date.now();
  console.log('[RBAC] Permissions cache refreshed.');
}

/**
 * Get permissions for a specific role (uses cache)
 */
export async function getPermissionsForRole(roleName: string): Promise<Set<string>> {
  if (Date.now() - cacheLastUpdated > CACHE_TTL) {
    await refreshPermissionsCache();
  }
  return rolePermissionsCache.get(roleName) || new Set();
}

/**
 * Express Middleware to require specific permissions
 */
export function requirePermissions(requiredPermissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      
      if (!user) {
        throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
      }

      // Bypass for super admin if needed, though they should have all permissions mapped in DB
      // We rely on DB-mapped permissions for strict normalized RBAC.
      const userRole = user.role;
      const userPermissions = await getPermissionsForRole(userRole);

      const hasAllPermissions = requiredPermissions.every(p => userPermissions.has(p));

      if (!hasAllPermissions) {
        throw new ApiError(403, 'FORBIDDEN', 'You do not have permission to perform this action');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Express Middleware to require at least ONE of the specific permissions
 */
export function requireAnyPermission(allowedPermissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
      }

      const userRole = user.role;
      const userPermissions = await getPermissionsForRole(userRole);

      const hasAnyPermission = allowedPermissions.some(p => userPermissions.has(p));

      if (!hasAnyPermission) {
        throw new ApiError(403, 'FORBIDDEN', 'You do not have permission to perform this action');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
