import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../database/prisma.client.js";

export class AuditRepository {
  constructor(private readonly database: PrismaClient) {}
  create(data: Prisma.AuditLogUncheckedCreateInput) { return this.database.auditLog.create({ data }); }
}

export const auditRepository = new AuditRepository(prisma);
