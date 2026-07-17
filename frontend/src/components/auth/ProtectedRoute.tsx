import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { hasAccess, RouteResourceMap } from '../../utils/rbac';

export const ProtectedRoute: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Find base route pattern, e.g. /projects/123 -> /projects
  const basePath = '/' + location.pathname.split('/')[1];
  
  // If the path is mapped, check permissions
  if (basePath in RouteResourceMap) {
    const requiredResources = RouteResourceMap[basePath];
    if (!hasAccess(user.role, requiredResources)) {
      return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h1 style={{ color: '#ef4444', fontSize: '24px' }}>Access Denied</h1>
          <p style={{ color: '#4b5563', marginTop: '10px' }}>
            You don't have permission to access this section with your current role ({user.role}).
          </p>
        </div>
      );
    }
  }

  return <Outlet />;
};
