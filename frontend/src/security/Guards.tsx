import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./auth.context";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="text-sm font-semibold text-slate-500">Verifying session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

interface RoleGuardProps {
  /** Backend uiRole strings e.g. "Super Admin" or raw role e.g. "ROLE_SUPER_ADMIN" */
  roles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Renders children only if the authenticated user's role matches one of the allowed roles.
 * Always prefer PermissionGuard where possible — roles are a last resort.
 */
export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user && (roles.includes(user.role) || roles.includes(user.uiRole))) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
}

interface PermissionGuardProps {
  /** Backend permission strings e.g. ["USER_VIEW", "USER_CREATE"] */
  permissions: string[];
  /** If true, user must have ALL listed permissions. Default: any one. */
  requireAll?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Renders children only when the user has the required backend permissions.
 * Uses live permissions array returned from the backend on login.
 */
export function PermissionGuard({
  permissions,
  requireAll = false,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, loading } = useAuth();
  if (loading) return null;

  const hasAccess = requireAll
    ? permissions.every((p) => hasPermission(p))
    : hasAnyPermission(permissions);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
