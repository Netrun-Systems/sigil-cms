/**
 * Gemini text embeddings for pgvector RAG.
 *
 * Backported from frost — uses models/text-embedding-004 with 768-dim output,
 * matching the charlotte-ingest schema.
 *
 * Task types: RETRIEVAL_DOCUMENT for ingestion, RETRIEVAL_QUERY for search.
 */

import { getGeminiClient } from './gemini.js';

const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIMENSIONS = 768;

type TaskType = 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY';

/**
 * Generate a 768-dim embedding vector for a text.
 */
export async function embedText(
  text: string,
  taskType: TaskType = 'RETRIEVAL_QUERY',
): Promise<number[]> {
  const ai = await getGeminiClient();
  const result = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
    config: {
      outputDimensionality: EMBEDDING_DIMENSIONS,
      taskType,
    },
  });

  const values = result.embeddings?.[0]?.values;
  if (!values || values.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`Expected ${EMBEDDING_DIMENSIONS}-dim embedding, got ${values?.length ?? 0}`);
  }
  return values;
}

/**
 * Generate embeddings for multiple text chunks (batch).
 * Processes sequentially — Gemini embedContent handles one at a time.
 */
export async function embedTexts(
  texts: string[],
  taskType: TaskType = 'RETRIEVAL_DOCUMENT',
): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    results.push(await embedText(text, taskType));
  }
  return results;
}
