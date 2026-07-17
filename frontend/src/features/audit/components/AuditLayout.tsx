import React, { useState } from 'react';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { AuditTable } from './AuditTable';
import { AuditFilters } from './AuditFilters';
import { AuditDetailDrawer } from './AuditDetailDrawer';
import type { AuditEvent } from '../types/audit.types';

export const AuditLayout: React.FC = () => {
  const { logs, loading, error, filters, updateFilters } = useAuditLogs();
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleRowClick = (event: AuditEvent) => {
    setSelectedEvent(event);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedEvent(null), 300); // Wait for transition
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#111827' }}>
          System Audit Logs
        </h2>
        <button
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            color: '#4b5563',
            cursor: 'pointer',
            fontWeight: 500
          }}
          onClick={() => window.alert('Export functionality coming soon!')}
        >
          Export CSV
        </button>
      </div>

      <AuditFilters filters={filters} onFilterChange={updateFilters} />

      {error && (
        <div style={{ padding: '16px', backgroundColor: '#fef2f2', color: '#b91c1c', borderBottom: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto' }}>
        <AuditTable 
          logs={logs} 
          loading={loading} 
          onRowClick={handleRowClick}
        />
      </div>

      <AuditDetailDrawer 
        isOpen={isDrawerOpen} 
        onClose={closeDrawer} 
        event={selectedEvent}
      />
    </div>
  );
};
