import React from 'react';
import { useAuth } from '../../security/auth.context';

interface AccessControlProps {
  requiredPermissions?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AccessControl: React.FC<AccessControlProps> = ({ 
  requiredPermissions = [], 
  children, 
  fallback = null 
}) => {
  const { user, hasAnyPermission } = useAuth();

  if (!user) return <>{fallback}</>;

  if (requiredPermissions.length === 0) {
    return <>{children}</>;
  }

  const hasAccess = hasAnyPermission(requiredPermissions);

  if (hasAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
