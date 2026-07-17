export type AuditRecorder = (action: string, metadata?: Record<string, unknown>, status?: number) => void;
export type ClientSecurityContext = { ip?: string; userAgent?: string };
