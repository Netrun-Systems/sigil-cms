/**
 * Documents & Wiki API client -- thin wrapper around fetch.
 *
 * Vite proxy forwards /api to the CMS API backend.
 * JWT token from localStorage (managed by @netrun/platform-admin-shell useAuth).
 */

const API_BASE = '/api/v1/documents';

function getToken(): string | null {
  return localStorage.getItem('documents_access_token') || localStorage.getItem('kog_access_token');
}

async function request<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('documents_access_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message || body.detail || `Request failed (${res.status})`);
  }

  return res.json();
}

// -- Wikis --

export function getWikis() {
  return request<{ success: boolean; data: any[] }>('/wikis');
}

export function getWiki(id: string) {
  return request<{ success: boolean; data: any }>(`/wikis/${id}`);
}

export function createWiki(data: { name: string; description?: string; icon?: string }) {
  return request('/wikis', { method: 'POST', body: JSON.stringify(data) });
}

export function updateWiki(id: string, data: Record<string, unknown>) {
  return request(`/wikis/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteWiki(id: string) {
  return request(`/wikis/${id}`, { method: 'DELETE' });
}

// -- Wiki Pages --

export function getPages(wikiId: string) {
  return request<{ success: boolean; data: any[]; tree: any[] }>(`/wikis/${wikiId}/pages`);
}

export function getPage(wikiId: string, pageId: string) {
  return request<{ success: boolean; data: any }>(`/wikis/${wikiId}/pages/${pageId}`);
}

export function createPage(wikiId: string, data: { title: string; content?: string; parentId?: string; status?: string }) {
  return request(`/wikis/${wikiId}/pages`, { method: 'POST', body: JSON.stringify(data) });
}

export function updatePage(wikiId: string, pageId: string, data: Record<string, unknown>) {
  return request(`/wikis/${wikiId}/pages/${pageId}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deletePage(wikiId: string, pageId: string) {
  return request(`/wikis/${wikiId}/pages/${pageId}`, { method: 'DELETE' });
}

export function getPageHistory(wikiId: string, pageId: string) {
  return request<{ success: boolean; data: any[] }>(`/wikis/${wikiId}/pages/${pageId}/history`);
}

export function revertPage(wikiId: string, pageId: string, revisionId: string) {
  return request(`/wikis/${wikiId}/pages/${pageId}/revert`, { method: 'POST', body: JSON.stringify({ revisionId }) });
}

export function searchWiki(wikiId: string, query: string) {
  return request<{ success: boolean; data: any[] }>(`/wikis/${wikiId}/search?q=${encodeURIComponent(query)}`);
}

export function getBacklinks(wikiId: string, pageId: string) {
  return request<{ success: boolean; data: any[] }>(`/wikis/${wikiId}/pages/${pageId}/backlinks`);
}

// -- Connected Drives --

export function getDrives() {
  return request<{ success: boolean; data: any[]; providers: { microsoft: boolean; google: boolean } }>('/drives');
}

export function connectMicrosoft(redirectUri: string) {
  return request<{ success: boolean; data: { authUrl: string; state: string } }>('/drives/connect/microsoft', {
    method: 'POST',
    body: JSON.stringify({ redirectUri }),
  });
}

export function connectGoogle(redirectUri: string) {
  return request<{ success: boolean; data: { authUrl: string; state: string } }>('/drives/connect/google', {
    method: 'POST',
    body: JSON.stringify({ redirectUri }),
  });
}

export function disconnectDrive(driveId: string) {
  return request(`/drives/${driveId}`, { method: 'DELETE' });
}

export function syncDrive(driveId: string) {
  return request<{ success: boolean; data: { synced: number } }>(`/drives/${driveId}/sync`, { method: 'POST' });
}

export function getDriveFiles(driveId: string, folderId?: string) {
  const qs = folderId ? `?folderId=${folderId}` : '';
  return request<{ success: boolean; data: any[] }>(`/drives/${driveId}/files${qs}`);
}

export function getDriveFile(driveId: string, fileId: string) {
  return request<{ success: boolean; data: any }>(`/drives/${driveId}/files/${fileId}`);
}

export function searchDriveFiles(driveId: string, query: string) {
  return request<{ success: boolean; data: any[] }>(`/drives/${driveId}/search?q=${encodeURIComponent(query)}`);
}

// -- Unified --

export function searchDocuments(query: string) {
  return request<{ success: boolean; data: { wiki: any[]; external: any[] } }>(`/documents/search?q=${encodeURIComponent(query)}`);
}

export function getRecentDocuments(limit = 20) {
  return request<{ success: boolean; data: any[] }>(`/documents/recent?limit=${limit}`);
}

export function getActivity(limit = 50, offset = 0) {
  return request<{ success: boolean; data: any[]; total: number }>(`/documents/activity?limit=${limit}&offset=${offset}`);
}

// -- Tags --

export function getDocumentTags(documentId: string) {
  return request<{ success: boolean; data: string[] }>(`/documents/${documentId}/tags`);
}

export function setDocumentTags(documentId: string, tags: string[], documentType = 'wiki_page') {
  return request(`/documents/${documentId}/tags`, { method: 'PUT', body: JSON.stringify({ tags, documentType }) });
}
