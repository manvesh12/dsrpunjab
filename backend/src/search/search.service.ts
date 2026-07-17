import { ApiError } from "../common/exceptions/api-error.js";
import { logger } from "../common/logging/logger.js";
import { embeddingService, type EmbeddingService } from "./embedding.service.js";
import { searchRepository, type SearchRepositoryContract } from "./search.repository.js";

export class SearchService {
  constructor(private readonly repository: SearchRepositoryContract, private readonly embeddings: EmbeddingService) {}

  async search(query: string, limit: number) {
    try {
      const vector = await this.embeddings.generate(query);
      return { query, results: await this.repository.semanticSearch(vector, limit) };
    } catch (error) {
      logger.error("semantic_search_failed", { error: error instanceof Error ? error.message : String(error) });
      throw new ApiError(500, "SEMANTIC_SEARCH_FAILED", "Failed to perform semantic search");
    }
  }

  async index(projectId: bigint, section: string, content: string) {
    try {
      await this.repository.index(projectId, section, content, await this.embeddings.generate(content));
      return { message: "Content indexed successfully" };
    } catch (error) {
      logger.error("semantic_index_failed", { projectId: projectId.toString(), error: error instanceof Error ? error.message : String(error) });
      throw new ApiError(500, "SEMANTIC_INDEX_FAILED", "Failed to index content");
    }
  }
}

export const searchService = new SearchService(searchRepository, embeddingService);
