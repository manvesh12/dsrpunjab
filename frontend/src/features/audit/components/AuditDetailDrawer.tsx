import React from 'react';
import type { AuditEvent } from '../types/audit.types';

interface AuditDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  event: AuditEvent | null;
}

export const AuditDetailDrawer: React.FC<AuditDetailDrawerProps> = ({ isOpen, onClose, event }) => {
  if (!isOpen || !event) return null;

  return (
    <>
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 999
        }}
        onClick={onClose}
      />
      <div 
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '400px',
          backgroundColor: 'white',
          boxShadow: '-4px 0 15px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-in-out'
        }}
      >
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Audit Event Details</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            &times;
          </button>
        </div>
        
        <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Event ID</label>
            <div style={{ fontSize: '14px', fontWeight: 500 }}>{event.id}</div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Date & Time</label>
            <div style={{ fontSize: '14px', fontWeight: 500 }}>{new Date(event.performedAt).toLocaleString()}</div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>User</label>
            <div style={{ fontSize: '14px', fontWeight: 500 }}>{event.performedBy}</div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Action</label>
            <div style={{ fontSize: '14px', fontWeight: 500 }}>{event.action}</div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Project Name</label>
            <div style={{ fontSize: '14px', fontWeight: 500 }}>{event.projectName || 'N/A'}</div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Remarks</label>
            <div style={{ 
              fontSize: '14px', 
              padding: '12px', 
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              border: '1px solid #e5e7eb'
            }}>
              {event.remarks || 'No remarks provided.'}
            </div>
          </div>
        </div>
        
        <div style={{ padding: '20px', borderTop: '1px solid #e5e7eb', textAlign: 'right' }}>
          <button 
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#e5e7eb',
              color: '#374151',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};
