import React from 'react';
import type { AuditEvent } from '../types/audit.types';

interface AuditTableProps {
  logs: AuditEvent[];
  loading: boolean;
  onRowClick: (log: AuditEvent) => void;
}

const getBadgeColor = (action: string) => {
  if (action === 'APPROVE' || action === 'PROJECT_CREATED') return '#10b981';
  if (action === 'REJECT' || action === 'DOCUMENT_DELETED') return '#ef4444';
  if (action === 'RETURN' || action === 'SECTION_STATUS_CHANGED') return '#f59e0b';
  if (action === 'FORWARD' || action === 'SUBMIT') return '#3b82f6';
  if (action === 'PROJECT_PHASE_CHANGED') return '#8b5cf6';
  if (action === 'DOCUMENT_UPLOADED') return '#06b6d4';
  if (action === 'SECTION_REVIEW_REPLY' || action === 'DEO_REPLY') return '#6366f1';
  return '#6b7280';
};

export const AuditTable: React.FC<AuditTableProps> = ({ logs, loading, onRowClick }) => {
  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading audit logs...</div>;
  }

  if (!logs || logs.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>No audit logs found.</div>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
            <th style={{ padding: '12px', color: '#6b7280', fontWeight: 600 }}>Date & Time</th>
            <th style={{ padding: '12px', color: '#6b7280', fontWeight: 600 }}>Project Name</th>
            <th style={{ padding: '12px', color: '#6b7280', fontWeight: 600 }}>User</th>
            <th style={{ padding: '12px', color: '#6b7280', fontWeight: 600 }}>Action</th>
            <th style={{ padding: '12px', color: '#6b7280', fontWeight: 600 }}>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr 
              key={log.id} 
              style={{ borderBottom: '1px solid #e5e7eb', cursor: 'pointer' }}
              onClick={() => onRowClick(log)}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <td style={{ padding: '12px', fontSize: '13px' }}>
                {new Date(log.performedAt).toLocaleString()}
              </td>
              <td style={{ padding: '12px', fontWeight: 500 }}>
                {log.projectName || '-'}
              </td>
              <td style={{ padding: '12px' }}>
                {log.performedBy}
              </td>
              <td style={{ padding: '12px' }}>
                <span style={{
                  background: getBadgeColor(log.action),
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}>
                  {log.action}
                </span>
              </td>
              <td style={{ 
                padding: '12px', 
                color: '#6b7280', 
                fontSize: '13px',
                maxWidth: '300px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }} title={log.remarks}>
                {log.remarks}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
