import React, { useState } from 'react';
import type { AuditFilter } from '../types/audit.types';

interface AuditFiltersProps {
  filters: AuditFilter;
  onFilterChange: (filters: Partial<AuditFilter>) => void;
}

export const AuditFilters: React.FC<AuditFiltersProps> = ({ filters, onFilterChange }) => {
  const [user, setUser] = useState(filters.user);
  const [action, setAction] = useState(filters.action);

  const handleApply = () => {
    onFilterChange({ user, action });
  };

  const handleClear = () => {
    setUser('');
    setAction('');
    onFilterChange({ user: '', action: '' });
  };

  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
      padding: '16px',
      backgroundColor: '#f9fafb',
      borderBottom: '1px solid #e5e7eb',
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563' }}>Action</label>
        <select 
          value={action} 
          onChange={(e) => setAction(e.target.value)}
          style={{
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            minWidth: '150px'
          }}
        >
          <option value="">All Actions</option>
          <option value="APPROVE">Approve</option>
          <option value="REJECT">Reject</option>
          <option value="PROJECT_CREATED">Project Created</option>
          <option value="DOCUMENT_UPLOADED">Document Uploaded</option>
          <option value="LOGIN">Login</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563' }}>User</label>
        <input 
          type="text"
          placeholder="Search by user..."
          value={user}
          onChange={(e) => setUser(e.target.value)}
          style={{
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            minWidth: '200px'
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
        <button 
          onClick={handleApply}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Apply Filters
        </button>
        <button 
          onClick={handleClear}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#4b5563',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
};
