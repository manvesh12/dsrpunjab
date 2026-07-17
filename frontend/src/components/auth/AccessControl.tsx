import React from 'react';
import { useAuth } from '../../security/auth.context';
import type { Permission } from '../../security/permissions';
import { hasPermission } from '../../security/permissions';

interface AccessControlProps {
  requiredPermissions?: Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AccessControl: React.FC<AccessControlProps> = ({ 
  requiredPermissions = [], 
  children, 
  fallback = null 
}) => {
  const { user } = useAuth();

  if (!user) return <>{fallback}</>;

  if (requiredPermissions.length === 0) {
    return <>{children}</>;
  }

  const hasAccess = requiredPermissions.some(p => hasPermission(user.role, p));

  if (hasAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
