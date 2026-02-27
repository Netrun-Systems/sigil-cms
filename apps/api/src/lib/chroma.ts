/**
 * ChromaDB client for advisor document ingestion and retrieval.
 *
 * Charlotte VM runs ChromaDB on localhost:8001 (v2 API).
 * Documents are chunked, embedded (ChromaDB default embeddings),
 * and stored in a `ncms_advisor_docs` collection.
 */

import { ChromaClient, type Collection } from 'chromadb';

const CHROMA_HOST = process.env.CHROMADB_HOST || 'localhost';
const CHROMA_PORT = process.env.CHROMADB_PORT || '8001';
const COLLECTION_NAME = 'ncms_advisor_docs';

let client: ChromaClient | null = null;
let collection: Collection | null = null;

function getClient(): ChromaClient {
  if (!client) {
    client = new ChromaClient({ path: `http://${CHROMA_HOST}:${CHROMA_PORT}` });
  }
  return client;
}

async function getCollection(): Promise<Collection> {
  if (!collection) {
    const c = getClient();
    collection = await c.getOrCreateCollection({
      name: COLLECTION_NAME,
      metadata: {
        description: 'NetrunCMS AI Advisor uploaded documents for RAG grounding',
        'hnsw:space': 'cosine',
      },
    });
  }
  return collection;
}

function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 20) {
      chunks.push(chunk);
    }
    start += chunkSize - overlap;
  }
  return chunks;
}

export async function ingestDocument(
  sessionId: string,
  fileId: string,
  fileName: string,
  text: string,
): Promise<number> {
  const col = await getCollection();
  const chunks = chunkText(text);

  if (chunks.length === 0) return 0;

  const ids = chunks.map((_, i) => `${fileId}__chunk_${i}`);
  const metadatas = chunks.map((_, i) => ({
    sessionId,
    fileId,
    fileName,
    chunkIndex: i,
    totalChunks: chunks.length,
  }));

  await col.add({ ids, documents: chunks, metadatas });
  console.log(`[ncms/chroma] Ingested ${chunks.length} chunks from "${fileName}"`);
  return chunks.length;
}

export interface RetrievedChunk {
  text: string;
  fileName: string;
  distance: number;
}

export async function queryDocuments(
  sessionId: string,
  queryText: string,
  nResults = 5,
): Promise<RetrievedChunk[]> {
  const col = await getCollection();

  const results = await col.query({
    queryTexts: [queryText],
    nResults,
    where: { sessionId },
  });

  if (!results.documents?.[0]) return [];

  return results.documents[0].map((doc, i) => ({
    text: doc ?? '',
    fileName: (results.metadatas?.[0]?.[i]?.fileName as string) ?? 'unknown',
    distance: results.distances?.[0]?.[i] ?? 1,
  }));
}

export async function removeDocumentChunks(fileId: string): Promise<void> {
  const col = await getCollection();
  await col.delete({ where: { fileId } });
  console.log(`[ncms/chroma] Removed chunks for file ${fileId}`);
}

export async function removeSessionChunks(sessionId: string): Promise<void> {
  const col = await getCollection();
  await col.delete({ where: { sessionId } });
  console.log(`[ncms/chroma] Removed all chunks for session ${sessionId}`);
}

export async function chromaHealthCheck(): Promise<boolean> {
  try {
    const c = getClient();
    await c.heartbeat();
    return true;
  } catch {
    return false;
  }
}
