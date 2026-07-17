import React, { useState } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import type { UserRole } from '../../../types/auth.types';

export const UserList: React.FC = () => {
  const { users, user: currentUser, updateUserRole, loginAs } = useAuthStore();
  const [editingUser, setEditingUser] = useState<string | null>(null);
  
  const allRoles: UserRole[] = [
    'Super Admin', 'State Admin', 'District Admin', 'Survey Lead',
    'Field Surveyor', 'Data Entry', 'GIS Expert', 'Geologist',
    'Environment', 'Reviewer', 'Approver', 'Auditor'
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Users & Roles</h2>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          Currently logged in as: <strong style={{ color: '#111827' }}>{currentUser?.name} ({currentUser?.role})</strong>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '12px', color: '#6b7280', fontWeight: 600 }}>Name</th>
              <th style={{ padding: '12px', color: '#6b7280', fontWeight: 600 }}>Email</th>
              <th style={{ padding: '12px', color: '#6b7280', fontWeight: 600 }}>District</th>
              <th style={{ padding: '12px', color: '#6b7280', fontWeight: 600 }}>Role</th>
              <th style={{ padding: '12px', color: '#6b7280', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px', fontWeight: 500 }}>{user.name}</td>
                <td style={{ padding: '12px', color: '#4b5563' }}>{user.email}</td>
                <td style={{ padding: '12px' }}>{user.district}</td>
                <td style={{ padding: '12px' }}>
                  {editingUser === user.id ? (
                    <select
                      value={user.role}
                      onChange={(e) => {
                        updateUserRole(user.id, e.target.value as UserRole);
                        setEditingUser(null);
                      }}
                      onBlur={() => setEditingUser(null)}
                      style={{ padding: '4px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                    >
                      {allRoles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  ) : (
                    <span 
                      style={{ 
                        background: '#e0e7ff', 
                        color: '#4338ca', 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      {user.role}
                    </span>
                  )}
                </td>
                <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setEditingUser(user.id)}
                    style={{
                      padding: '4px 8px',
                      background: 'transparent',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Change Role
                  </button>
                  <button
                    onClick={() => {
                      loginAs(user.id);
                      window.location.reload(); // Reload to apply role to layout/routes
                    }}
                    style={{
                      padding: '4px 8px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 500
                    }}
                  >
                    Login As
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
