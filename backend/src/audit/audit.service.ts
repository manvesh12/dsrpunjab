import { Prisma } from "@prisma/client";
import { logger } from "../common/logging/logger.js";
import { auditRepository, type AuditRepository } from "./audit.repository.js";

export type AuditEntry = {
  userId?: bigint;
  action: string;
  method: string;
  path: string;
  ip?: string;
  userAgent?: string;
  status?: number;
  metadata?: Record<string, unknown>;
};

export class AuditService {
  constructor(private readonly repository: AuditRepository) {}
  record(entry: AuditEntry) {
    const metadata = entry.metadata
      ? JSON.parse(JSON.stringify(entry.metadata, (_key, item) => typeof item === "bigint" ? item.toString() : item)) as Prisma.InputJsonValue
      : undefined;
    this.repository.create({ ...entry, metadata })
      .catch(error => logger.error("audit_write_failed", { error: error instanceof Error ? error.message : String(error) }));
  }
}

export const auditService = new AuditService(auditRepository);
