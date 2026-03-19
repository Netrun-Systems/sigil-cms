/**
 * ChromaDB stub — DEPRECATED.
 *
 * This module has been superseded by pgvector RAG (lib/rag.ts).
 * ChromaDB dependency removed in favor of postgresql pgvector on charlotte_db.
 *
 * Kept as a stub to preserve git history. All advisor routes now use lib/rag.ts.
 */

export async function ingestDocument(
  _sessionId: string,
  _fileId: string,
  _fileName: string,
  _text: string,
): Promise<number> {
  throw new Error('ChromaDB is deprecated. Use lib/rag.ts instead.');
}

export interface RetrievedChunk {
  text: string;
  fileName: string;
  distance: number;
}

export async function queryDocuments(
  _sessionId: string,
  _queryText: string,
  _nResults?: number,
): Promise<RetrievedChunk[]> {
  throw new Error('ChromaDB is deprecated. Use lib/rag.ts instead.');
}

export async function removeDocumentChunks(_fileId: string): Promise<void> {
  throw new Error('ChromaDB is deprecated. Use lib/rag.ts instead.');
}

export async function removeSessionChunks(_sessionId: string): Promise<void> {
  throw new Error('ChromaDB is deprecated. Use lib/rag.ts instead.');
}

export async function chromaHealthCheck(): Promise<boolean> {
  return false;
}
