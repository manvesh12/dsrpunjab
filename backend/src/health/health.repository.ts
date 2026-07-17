import type { PrismaClient } from "@prisma/client";
import { prisma } from "../database/prisma.client.js";

export interface HealthRepositoryContract {
  checkDatabase(): Promise<void>;
}

export class HealthRepository implements HealthRepositoryContract {
  constructor(private readonly database: PrismaClient) {}
  async checkDatabase() { await this.database.$queryRaw`SELECT 1`; }
}

export const healthRepository = new HealthRepository(prisma);
