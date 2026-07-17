import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./auth.context";
import type { Role, Permission } from "./permissions";
import { hasPermission } from "./permissions";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-100">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

interface RoleGuardProps {
  roles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user && roles.includes(user.role)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

interface PermissionGuardProps {
  permissions: Permission[];
  requireAll?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({
  permissions,
  requireAll = false,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    const hasAccess = requireAll
      ? permissions.every((p) => hasPermission(user.role, p))
      : permissions.some((p) => hasPermission(user.role, p));

    if (hasAccess) {
      return <>{children}</>;
    }
  }

  return <>{fallback}</>;
}
