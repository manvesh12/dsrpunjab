export type AuditAction = 
  | 'APPROVE' 
  | 'PROJECT_CREATED' 
  | 'REJECT' 
  | 'DOCUMENT_DELETED' 
  | 'RETURN' 
  | 'SECTION_STATUS_CHANGED' 
  | 'FORWARD' 
  | 'SUBMIT' 
  | 'PROJECT_PHASE_CHANGED' 
  | 'DOCUMENT_UPLOADED' 
  | 'SECTION_REVIEW_REPLY' 
  | 'DEO_REPLY'
  | 'LOGIN'
  | 'LOGOUT';

export interface AuditEvent {
  id: string;
  performedAt: string;
  projectName: string | null;
  performedBy: string;
  action: AuditAction | string;
  remarks: string;
}

export interface AuditFilter {
  dateRange: [string, string] | null;
  user: string;
  action: string;
}
