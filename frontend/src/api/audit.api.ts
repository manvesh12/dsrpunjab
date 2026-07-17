import type { AuditEvent, AuditFilter } from "../features/audit/types/audit.types";

const MOCK_LOGS: AuditEvent[] = [
  { id: '1', performedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), projectName: 'Jalandhar DSR 2026', performedBy: 'Admin User', action: 'APPROVE', remarks: 'Approved the initial draft.' },
  { id: '2', performedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), projectName: 'Ludhiana Sand Mining', performedBy: 'John Doe', action: 'PROJECT_CREATED', remarks: 'Created new project for Ludhiana.' },
  { id: '3', performedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), projectName: 'Amritsar Quarry', performedBy: 'Jane Smith', action: 'REJECT', remarks: 'Rejected due to incomplete documentation.' },
  { id: '4', performedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), projectName: null, performedBy: 'System', action: 'LOGIN', remarks: 'Admin user logged in.' },
  { id: '5', performedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), projectName: 'Patiala Mining', performedBy: 'District Officer', action: 'DOCUMENT_UPLOADED', remarks: 'Uploaded site survey report.' },
  { id: '6', performedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), projectName: 'Pathankot Quarry', performedBy: 'Reviewer', action: 'SECTION_REVIEW_REPLY', remarks: 'Added comment on section 3.' },
  { id: '7', performedAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), projectName: 'Jalandhar DSR 2026', performedBy: 'Admin User', action: 'FORWARD', remarks: 'Forwarded to higher authority for review.' },
];

export const auditApi = {
  fetchLogs: async (
    params: { limit?: number; offset?: number; filters?: AuditFilter }
  ): Promise<{ data: AuditEvent[]; total: number }> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    let filteredData = [...MOCK_LOGS];

    if (params.filters) {
      if (params.filters.action) {
        filteredData = filteredData.filter(log => log.action === params.filters?.action);
      }
      if (params.filters.user) {
        filteredData = filteredData.filter(log => 
          log.performedBy.toLowerCase().includes(params.filters?.user?.toLowerCase() ?? '')
        );
      }
    }

    const offset = params.offset || 0;
    const limit = params.limit || 50;
    
    return {
      data: filteredData.slice(offset, offset + limit),
      total: filteredData.length,
    };
  }
};
