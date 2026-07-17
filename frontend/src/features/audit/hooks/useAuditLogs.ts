import { useState, useEffect, useCallback } from 'react';
import type { AuditEvent, AuditFilter } from '../types/audit.types';
import { auditApi } from '../../../api/audit.api';

export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<AuditFilter>({
    dateRange: null,
    user: '',
    action: '',
  });

  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0,
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, total } = await auditApi.fetchLogs({
        limit: pagination.limit,
        offset: pagination.offset,
        filters,
      });
      setLogs(data);
      setPagination(prev => ({ ...prev, total }));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit, pagination.offset]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const updateFilters = (newFilters: Partial<AuditFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, offset: 0 })); // Reset pagination on filter change
  };

  const handlePageChange = (newOffset: number) => {
    setPagination(prev => ({ ...prev, offset: newOffset }));
  };

  return {
    logs,
    loading,
    error,
    filters,
    updateFilters,
    pagination,
    handlePageChange,
    refresh: fetchLogs,
  };
}
