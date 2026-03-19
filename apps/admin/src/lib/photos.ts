/**
 * Photo API client — upload, curate, list, manage photos.
 *
 * Backported from frost. Site-scoped photo management via Azure Blob Storage.
 */

const API_BASE = '/api/v1';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('netrun_cms_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Types ────────────────────────────────────────

export interface Photo {
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

export interface CurationData {
  photos: Photo[];
  summary: string;
  totalAnalyzed: number;
  totalSelected: number;
}

// ── Upload ───────────────────────────────────────

export async function uploadPhotos(siteId: string, files: File[]): Promise<Photo[]> {
  const form = new FormData();
  for (const file of files) {
    form.append('photos', file);
  }

  const res = await fetch(`${API_BASE}/sites/${siteId}/photos/upload`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
    body: form,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(body.error?.message || 'Upload failed');
  }

  const { data } = await res.json();
  return data;
}

// ── AI Curation ──────────────────────────────────

export async function curatePhotos(siteId: string, photoIds: string[]): Promise<CurationData> {
  const res = await fetch(`${API_BASE}/sites/${siteId}/photos/curate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ photoIds }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(body.error?.message || 'Curation failed');
  }

  const { data } = await res.json();
  return data;
}

// ── List ─────────────────────────────────────────

export async function listPhotos(siteId: string): Promise<Photo[]> {
  const res = await fetch(`${API_BASE}/sites/${siteId}/photos`, {
    headers: { ...getAuthHeaders() },
  });

  if (!res.ok) throw new Error('Failed to list photos');
  const { data } = await res.json();
  return data;
}

// ── Update selection ─────────────────────────────

export async function updatePhotoSelection(siteId: string, id: string, selected: boolean): Promise<Photo> {
  const res = await fetch(`${API_BASE}/sites/${siteId}/photos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ selected }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(body.error?.message || 'Update failed');
  }

  const { data } = await res.json();
  return data;
}

// ── Delete ───────────────────────────────────────

export async function deletePhoto(siteId: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/sites/${siteId}/photos/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(body.error?.message || 'Delete failed');
  }
}
