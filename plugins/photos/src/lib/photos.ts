/**
 * Photo storage — Multi-provider object storage + PostgreSQL metadata.
 *
 * Supports Google Cloud Storage (default), Azure Blob Storage, and AWS S3.
 * Provider is auto-detected from environment variables via the storage
 * abstraction in @netrun-cms/plugin-runtime.
 *
 * Metadata stored in cms_photos PostgreSQL table.
 */

import pg from 'pg';
import {
  uploadFile,
  deleteFile,
  downloadFile,
  ensureStorage,
  getStorageProvider,
} from '@netrun-cms/plugin-runtime';

const { Pool } = pg;

// ── PostgreSQL Pool (lazy singleton) ──

let pool: pg.Pool | null = null;

function getPool(): pg.Pool {
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
  }
  return pool;
}

// ── Types ────────────────────────────────────────

export interface MediaPhoto {
  id: string;
  siteId: string;
  filename: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  selected: boolean;
  blobUrl?: string;
  aiScore?: number;
  aiReason?: string;
  tags?: string[];
}

export interface CurationResult {
  photoIndex: number;
  selected: boolean;
  score: number;
  reasoning: string;
  tags: string[];
}

export interface CurationResponse {
  selections: CurationResult[];
  summary: string;
}

// ── Storage Operations (provider-agnostic) ──────

export async function ensureBlobContainer(): Promise<void> {
  await ensureStorage();
}

export async function uploadPhotoBlob(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
): Promise<{ id: string; storedName: string; blobUrl: string }> {
  const result = await uploadFile(buffer, originalName, mimeType);
  return { id: result.id, storedName: result.storedName, blobUrl: result.url };
}

export async function deletePhotoBlob(storedName: string): Promise<void> {
  await deleteFile(storedName);
}

export async function getPhotoBlobBuffer(storedName: string): Promise<Buffer> {
  return downloadFile(storedName);
}

/**
 * Get the active storage provider name (for logging/display).
 */
export function getStorageProviderName(): string {
  return getStorageProvider().name;
}

// ── PostgreSQL Metadata Operations ───────────────

let photosTableEnsured = false;

export async function ensurePhotosTable(): Promise<void> {
  if (photosTableEnsured) return;
  const p = getPool();
  await p.query(`
    CREATE TABLE IF NOT EXISTS cms_photos (
      id UUID PRIMARY KEY,
      site_id VARCHAR(100) NOT NULL,
      filename VARCHAR(500) NOT NULL,
      stored_name VARCHAR(500) NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      size_bytes BIGINT NOT NULL,
      selected BOOLEAN NOT NULL DEFAULT FALSE,
      blob_url TEXT,
      ai_score INTEGER,
      ai_reason TEXT,
      tags TEXT[],
      uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await p.query(`
    CREATE INDEX IF NOT EXISTS idx_cms_photos_site_id ON cms_photos (site_id)
  `);
  photosTableEnsured = true;
}

export async function savePhotoMeta(photo: MediaPhoto): Promise<void> {
  await ensurePhotosTable();
  const p = getPool();
  await p.query(
    `INSERT INTO cms_photos (id, site_id, filename, stored_name, mime_type, size_bytes, selected, blob_url, uploaded_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (id) DO UPDATE
       SET selected = EXCLUDED.selected, blob_url = EXCLUDED.blob_url`,
    [photo.id, photo.siteId, photo.filename, photo.storedName, photo.mimeType, photo.sizeBytes, photo.selected, photo.blobUrl, photo.uploadedAt],
  );
}

export async function getPhotoMeta(id: string): Promise<MediaPhoto | null> {
  await ensurePhotosTable();
  const p = getPool();
  const result = await p.query(
    `SELECT id, site_id, filename, stored_name, mime_type, size_bytes, selected,
            blob_url, ai_score, ai_reason, tags, uploaded_at
     FROM cms_photos WHERE id = $1`,
    [id],
  );

  if (result.rows.length === 0) return null;
  return rowToPhoto(result.rows[0]);
}

export async function listPhotos(siteId?: string): Promise<MediaPhoto[]> {
  await ensurePhotosTable();
  const p = getPool();
  const query = siteId
    ? `SELECT id, site_id, filename, stored_name, mime_type, size_bytes, selected,
              blob_url, ai_score, ai_reason, tags, uploaded_at
       FROM cms_photos WHERE site_id = $1 ORDER BY uploaded_at DESC`
    : `SELECT id, site_id, filename, stored_name, mime_type, size_bytes, selected,
              blob_url, ai_score, ai_reason, tags, uploaded_at
       FROM cms_photos ORDER BY uploaded_at DESC`;
  const result = siteId
    ? await p.query(query, [siteId])
    : await p.query(query);
  return result.rows.map(rowToPhoto);
}

export async function updatePhotoMeta(
  id: string,
  updates: Partial<Pick<MediaPhoto, 'selected' | 'aiScore' | 'aiReason' | 'tags'>>,
): Promise<MediaPhoto | null> {
  await ensurePhotosTable();
  const p = getPool();

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIdx = 1;

  if (updates.selected !== undefined) {
    setClauses.push(`selected = $${paramIdx++}`);
    values.push(updates.selected);
  }
  if (updates.aiScore !== undefined) {
    setClauses.push(`ai_score = $${paramIdx++}`);
    values.push(updates.aiScore);
  }
  if (updates.aiReason !== undefined) {
    setClauses.push(`ai_reason = $${paramIdx++}`);
    values.push(updates.aiReason);
  }
  if (updates.tags !== undefined) {
    setClauses.push(`tags = $${paramIdx++}`);
    values.push(updates.tags);
  }

  if (setClauses.length === 0) return getPhotoMeta(id);

  values.push(id);
  const result = await p.query(
    `UPDATE cms_photos SET ${setClauses.join(', ')}
     WHERE id = $${paramIdx}
     RETURNING id, site_id, filename, stored_name, mime_type, size_bytes, selected,
               blob_url, ai_score, ai_reason, tags, uploaded_at`,
    values,
  );

  if (result.rows.length === 0) return null;
  return rowToPhoto(result.rows[0]);
}

export async function deletePhotoMeta(id: string): Promise<void> {
  await ensurePhotosTable();
  const p = getPool();
  await p.query('DELETE FROM cms_photos WHERE id = $1', [id]);
}

export async function deleteStalePhotos(siteId?: string): Promise<number> {
  await ensurePhotosTable();
  const p = getPool();
  const query = siteId
    ? 'DELETE FROM cms_photos WHERE blob_url IS NULL AND site_id = $1 RETURNING id'
    : 'DELETE FROM cms_photos WHERE blob_url IS NULL RETURNING id';
  const result = siteId
    ? await p.query(query, [siteId])
    : await p.query(query);
  return result.rowCount ?? 0;
}

function rowToPhoto(row: Record<string, unknown>): MediaPhoto {
  return {
    id: row.id as string,
    siteId: row.site_id as string,
    filename: row.filename as string,
    storedName: row.stored_name as string,
    mimeType: row.mime_type as string,
    sizeBytes: Number(row.size_bytes),
    selected: row.selected as boolean,
    blobUrl: (row.blob_url as string) || undefined,
    aiScore: row.ai_score as number | undefined,
    aiReason: row.ai_reason as string | undefined,
    tags: row.tags as string[] | undefined,
    uploadedAt: (row.uploaded_at as Date).toISOString(),
  };
}
