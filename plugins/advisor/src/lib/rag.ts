/**
 * RAG operations via pgvector — aligned with charlotte-ingest patterns.
 *
 * Backported from frost. Uses the shared rag_collections/rag_documents/rag_chunks
 * tables on charlotte_db (Cloud SQL) with a configurable collection name.
 *
 * Documents are ingested as persistent base knowledge for the CMS advisor,
 * not scoped to individual sessions.
 */

import pg from 'pg';
import { embedText, embedTexts } from './embeddings.js';

const { Pool } = pg;

const COLLECTION_NAME = process.env.CMS_ADVISOR_COLLECTION || 'ncms_advisor';
const CHUNK_MIN_SIZE = 200;
const CHUNK_MAX_SIZE = 4000;

// ── pg pool (lazy) ───────────────────────────────

let pool: pg.Pool | null = null;

export function getRagPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'charlotte_db',
      user: process.env.DB_USER || 'charlotte_user',
      password: process.env.DB_PASS,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('[ncms/rag] Pool error:', err.message);
    });
  }
  return pool;
}

// ── Markdown-aware chunker (ported from charlotte-ingest) ──

interface RawChunk {
  text: string;
  sectionTitle: string | null;
}

interface DocumentChunk {
  chunkIndex: number;
  content: string;
  sectionTitle: string | null;
  source: string;
  contentType: string;
}

function chunkDocument(
  content: string,
  source: string,
  contentType: string = 'markdown',
): DocumentChunk[] {
  let rawChunks: RawChunk[];

  if (contentType === 'markdown') {
    rawChunks = chunkMarkdown(content, CHUNK_MAX_SIZE);
  } else if (contentType === 'code') {
    rawChunks = chunkCode(content, CHUNK_MAX_SIZE);
  } else {
    rawChunks = chunkParagraphs(content, CHUNK_MAX_SIZE);
  }

  const chunks: DocumentChunk[] = [];
  for (const rc of rawChunks) {
    const text = rc.text.trim();
    if (text.length < CHUNK_MIN_SIZE) continue;

    chunks.push({
      chunkIndex: chunks.length,
      content: text,
      sectionTitle: rc.sectionTitle,
      source,
      contentType,
    });
  }

  return chunks;
}

function chunkMarkdown(content: string, maxSize: number): RawChunk[] {
  const headingPattern = /^(#{1,4})\s+(.+)$/gm;
  const matches = [...content.matchAll(headingPattern)];

  if (matches.length === 0) {
    return chunkParagraphs(content, maxSize);
  }

  const sections: RawChunk[] = [];

  // Content before first heading
  if (matches[0].index! > 0) {
    const preamble = content.slice(0, matches[0].index!).trim();
    if (preamble) {
      sections.push({ text: preamble, sectionTitle: null });
    }
  }

  // Extract sections between headings
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index!;
    const end = i + 1 < matches.length ? matches[i + 1].index! : content.length;
    const sectionText = content.slice(start, end).trim();
    const sectionTitle = matches[i][2].trim();

    if (sectionText.length <= maxSize) {
      sections.push({ text: sectionText, sectionTitle });
    } else {
      for (const sub of splitByParagraphs(sectionText, maxSize)) {
        sections.push({ text: sub, sectionTitle });
      }
    }
  }

  return sections;
}

function chunkCode(content: string, maxSize: number): RawChunk[] {
  const blocks = content.split(/\n\n+/);
  const chunks: RawChunk[] = [];
  let current = '';

  for (const block of blocks) {
    if (current.length + block.length + 2 > maxSize && current) {
      chunks.push({ text: current, sectionTitle: null });
      current = block;
    } else {
      current = current ? current + '\n\n' + block : block;
    }
  }
  if (current.trim()) {
    chunks.push({ text: current, sectionTitle: null });
  }
  return chunks;
}

function chunkParagraphs(content: string, maxSize: number): RawChunk[] {
  return splitByParagraphs(content, maxSize).map((p) => ({
    text: p,
    sectionTitle: null,
  }));
}

function splitByParagraphs(text: string, maxSize: number): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if (current.length + para.length + 2 > maxSize && current) {
      chunks.push(current.trim());
      current = para;
    } else {
      current = current ? current + '\n\n' + para : para;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  // Hard-split oversized chunks by sentences
  const final: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length <= maxSize) {
      final.push(chunk);
    } else {
      final.push(...hardSplit(chunk, maxSize));
    }
  }
  return final;
}

function hardSplit(text: string, maxSize: number): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const sent of sentences) {
    if (current.length + sent.length + 1 > maxSize && current) {
      chunks.push(current.trim());
      current = sent;
    } else {
      current = current ? current + ' ' + sent : sent;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// ── Content type detection ──────────────────────

const CODE_EXTENSIONS = new Set([
  '.py', '.js', '.ts', '.tsx', '.jsx', '.go', '.rs',
  '.java', '.sql', '.sh', '.bash', '.tf', '.bicep',
]);

function detectContentType(fileName: string, mimeType: string): string {
  const ext = fileName.includes('.') ? '.' + fileName.split('.').pop()!.toLowerCase() : '';
  if (CODE_EXTENSIONS.has(ext)) return 'code';
  if (ext === '.md' || ext === '.markdown') return 'markdown';
  if (mimeType.startsWith('text/markdown')) return 'markdown';
  return 'text';
}

// ── Document ingestion ─────────────────────────

/**
 * Format embedding as pgvector-compatible string.
 */
function formatEmbedding(vec: number[]): string {
  return '[' + vec.map((v) => v.toFixed(10)).join(',') + ']';
}

/**
 * Ingest a document's text content into pgvector as persistent base knowledge.
 * Not scoped to sessions — all documents are shared across the collection.
 */
export async function ingestDocument(
  fileId: string,
  fileName: string,
  text: string,
  mimeType: string = 'text/plain',
): Promise<number> {
  const p = getRagPool();
  const contentType = detectContentType(fileName, mimeType);
  const chunks = chunkDocument(text, fileName, contentType);
  if (chunks.length === 0) return 0;

  // Get or create collection
  const colRow = await p.query(
    `INSERT INTO rag_collections (name, description)
     VALUES ($1, 'NetrunCMS AI Advisor — base knowledge for RAG grounding')
     ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
     RETURNING id`,
    [COLLECTION_NAME],
  );
  const collectionId = colRow.rows[0].id;

  // Upsert document record
  const docRow = await p.query(
    `INSERT INTO rag_documents (collection_id, source, source_type, title, content_type, metadata)
     VALUES ($1, $2, 'upload', $3, $4, $5)
     ON CONFLICT (collection_id, source) DO UPDATE
       SET title = EXCLUDED.title, content_type = EXCLUDED.content_type,
           metadata = EXCLUDED.metadata, updated_at = NOW()
     RETURNING id`,
    [collectionId, fileId, fileName, contentType, JSON.stringify({ mimeType })],
  );
  const documentId = docRow.rows[0].id;

  // Delete existing chunks for idempotent re-ingestion
  await p.query('DELETE FROM rag_chunks WHERE document_id = $1', [documentId]);

  // Generate embeddings with RETRIEVAL_DOCUMENT task type
  const texts = chunks.map((c) => c.content);
  const embeddings = await embedTexts(texts, 'RETRIEVAL_DOCUMENT');

  // Insert chunks
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    await p.query(
      `INSERT INTO rag_chunks
         (document_id, collection_id, chunk_index, content, embedding,
          section_title, source, content_type, metadata)
       VALUES ($1, $2, $3, $4, $5::vector, $6, $7, $8, $9)`,
      [
        documentId,
        collectionId,
        chunk.chunkIndex,
        chunk.content,
        formatEmbedding(embeddings[i]),
        chunk.sectionTitle,
        chunk.source,
        chunk.contentType,
        JSON.stringify({ fileId }),
      ],
    );
  }

  // Update chunk count
  await p.query(
    'UPDATE rag_documents SET chunk_count = $2, updated_at = NOW() WHERE id = $1',
    [documentId, chunks.length],
  );

  console.log(`[ncms/rag] Ingested ${chunks.length} chunks from "${fileName}" (${contentType})`);
  return chunks.length;
}

// ── Retrieval ──────────────────────────────────

export interface RetrievedChunk {
  content: string;
  source: string;
  sectionTitle: string | null;
  similarityScore: number;
}

/**
 * Semantic search across the ncms_advisor collection.
 * Returns chunks ranked by cosine similarity, filtered by min_score.
 */
export async function queryDocuments(
  queryText: string,
  topK = 5,
  minScore = 0.3,
): Promise<RetrievedChunk[]> {
  const p = getRagPool();
  const queryEmbedding = await embedText(queryText, 'RETRIEVAL_QUERY');

  const result = await p.query(
    `SELECT ch.content, ch.source, ch.section_title,
            1 - (ch.embedding <=> $1::vector) AS similarity_score
     FROM rag_chunks ch
     JOIN rag_collections c ON c.id = ch.collection_id
     WHERE c.name = $2
       AND 1 - (ch.embedding <=> $1::vector) >= $3
     ORDER BY ch.embedding <=> $1::vector
     LIMIT $4`,
    [formatEmbedding(queryEmbedding), COLLECTION_NAME, minScore, topK],
  );

  return result.rows.map((row) => ({
    content: row.content,
    source: row.source ?? 'unknown',
    sectionTitle: row.section_title ?? null,
    similarityScore: parseFloat(row.similarity_score),
  }));
}

/**
 * Format retrieved chunks as context block for LLM injection.
 * Matches charlotte-ingest format_context_for_prompt pattern.
 */
export function formatContextForPrompt(
  results: RetrievedChunk[],
  maxTokens = 1500,
): string {
  if (results.length === 0) return '';

  const maxChars = maxTokens * 4;
  const sections: string[] = [];
  let total = 0;

  for (const r of results) {
    let header = `[Source: ${r.source}`;
    if (r.sectionTitle) header += ` > ${r.sectionTitle}`;
    header += ` | relevance: ${r.similarityScore.toFixed(2)}]`;

    const block = `${header}\n${r.content}\n`;

    if (total + block.length > maxChars) {
      const remaining = maxChars - total;
      if (remaining > 100) sections.push(block.slice(0, remaining) + '...');
      break;
    }

    sections.push(block);
    total += block.length;
  }

  return sections.join('\n---\n');
}

// ── Document list / cleanup ────────────────────

/**
 * Remove a document and all its chunks from the collection.
 */
export async function removeDocument(fileId: string): Promise<void> {
  const p = getRagPool();
  await p.query(
    `DELETE FROM rag_documents WHERE source = $1
     AND collection_id = (SELECT id FROM rag_collections WHERE name = $2)`,
    [fileId, COLLECTION_NAME],
  );
  console.log(`[ncms/rag] Removed document and chunks for file ${fileId}`);
}

/**
 * List all documents in the ncms_advisor collection.
 */
export async function listRagDocuments(): Promise<Array<{
  id: string;
  source: string;
  title: string;
  chunkCount: number;
  ingestedAt: string;
}>> {
  const p = getRagPool();
  const result = await p.query(
    `SELECT d.id, d.source, d.title, d.chunk_count, d.ingested_at
     FROM rag_documents d
     JOIN rag_collections c ON c.id = d.collection_id
     WHERE c.name = $1
     ORDER BY d.ingested_at DESC`,
    [COLLECTION_NAME],
  );

  return result.rows.map((row) => ({
    id: row.id,
    source: row.source,
    title: row.title,
    chunkCount: row.chunk_count ?? 0,
    ingestedAt: (row.ingested_at as Date).toISOString(),
  }));
}

/**
 * Health check — verify pgvector connection.
 */
export async function ragHealthCheck(): Promise<boolean> {
  try {
    const p = getRagPool();
    const result = await p.query('SELECT 1');
    return result.rowCount === 1;
  } catch {
    return false;
  }
}
