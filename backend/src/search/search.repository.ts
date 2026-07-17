import type { PrismaClient } from "@prisma/client";
import { prisma } from "../database/prisma.client.js";

export class SearchRepository {
  constructor(private readonly database: PrismaClient) {}

  semanticSearch(embedding: number[], limit: number) {
    return this.database.$queryRaw`
      SELECT "id", "projectId", "section", "content",
        1 - ("embedding" <=> ${embedding}::vector) as similarity
      FROM "DsrReportChunk"
      ORDER BY "embedding" <=> ${embedding}::vector
      LIMIT ${limit};
    `;
  }

  async index(projectId: bigint, section: string, content: string, embedding: number[]) {
    await this.database.$executeRaw`
      INSERT INTO "DsrReportChunk" ("id", "projectId", "section", "content", "embedding", "createdAt")
      VALUES (gen_random_uuid(), ${projectId}, ${section}, ${content}, ${embedding}::vector, NOW())
    `;
  }
}

export type SearchRepositoryContract = Pick<SearchRepository, "semanticSearch" | "index">;
export const searchRepository = new SearchRepository(prisma);
