export interface EmbeddingProvider {
  embedDocuments(texts: string[]): Promise<number[][]>;
  embedQuery(text: string): Promise<number[]>;
}

export const EMBEDDING_PROVIDER = Symbol('EMBEDDING_PROVIDER');
