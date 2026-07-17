export interface EmbeddingService {
  generate(text: string): Promise<number[]>;
}

// Compatibility implementation. Replace with a configured embedding provider
// only after search relevance and data-governance acceptance tests exist.
export class MockEmbeddingService implements EmbeddingService {
  async generate(_text: string) {
    return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
  }
}

export const embeddingService = new MockEmbeddingService();
