/**
 * Google Drive API client for Google Workspace integration.
 *
 * Handles OAuth flow, file browsing, preview URLs, search.
 * Uses environment variables for client credentials:
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 *
 * Falls back gracefully when not configured (wiki-only mode).
 */

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const OAUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string | null;
  webUrl: string;
  size: number;
  lastModified: string;
  isFolder: boolean;
  parentFolderId: string | null;
  path: string | null;
}

/**
 * Check if Google Drive integration is configured.
 */
export function isConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function getConfig(): GoogleConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || '';

  if (!clientId || !clientSecret) {
    throw new Error('Google Drive not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET');
  }

  return { clientId, clientSecret, redirectUri };
}

/**
 * Build the OAuth authorization URL for Google login.
 */
export function getAuthUrl(redirectUri: string, state: string): string {
  const config = getConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `${OAUTH_BASE}?${params}`;
}

/**
 * Exchange auth code for tokens.
 */
export async function exchangeCode(
  code: string,
  redirectUri: string,
): Promise<GoogleTokens> {
  const config = getConfig();
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Google token exchange failed: ${err.error_description || res.statusText}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

/**
 * Refresh an expired access token.
 */
export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
  const config = getConfig();
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Google token refresh failed: ${err.error_description || res.statusText}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

/**
 * Make an authenticated request to Google Drive API.
 */
async function driveRequest<T = unknown>(
  accessToken: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = path.startsWith('http') ? path : `${DRIVE_API}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Google Drive API error (${res.status}): ${err.error?.message || res.statusText}`);
  }

  return res.json();
}

/**
 * Get user email from Google.
 */
export async function getUserEmail(accessToken: string): Promise<string> {
  const data = await driveRequest<{ email: string }>(
    accessToken,
    'https://www.googleapis.com/oauth2/v2/userinfo?fields=email',
  );
  return data.email;
}

/**
 * List files in a folder (or root).
 */
export async function listFiles(
  accessToken: string,
  folderId?: string,
): Promise<DriveFile[]> {
  const parentQuery = folderId ? `'${folderId}' in parents` : `'root' in parents`;
  const query = `${parentQuery} and trashed=false`;
  const fields = 'files(id,name,mimeType,webViewLink,size,modifiedTime,parents)';

  const data = await driveRequest<{ files: any[] }>(
    accessToken,
    `/files?q=${encodeURIComponent(query)}&fields=${fields}&pageSize=200&orderBy=folder,name`,
  );

  return (data.files || []).map(mapDriveFile);
}

/**
 * Get file metadata by ID.
 */
export async function getFile(
  accessToken: string,
  fileId: string,
): Promise<DriveFile> {
  const fields = 'id,name,mimeType,webViewLink,size,modifiedTime,parents';
  const item = await driveRequest<any>(
    accessToken,
    `/files/${fileId}?fields=${fields}`,
  );
  return mapDriveFile(item);
}

/**
 * Get embeddable preview URL for a Google file.
 * For Google Docs/Sheets/Slides: uses the embedded viewer URL.
 * For other files: uses the Google viewer.
 */
export function getPreviewUrl(fileId: string, mimeType: string | null): string {
  if (mimeType?.startsWith('application/vnd.google-apps.')) {
    // Native Google file — use published embed
    return `https://docs.google.com/document/d/${fileId}/preview`;
  }
  // Other files — use Google viewer
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Get the edit URL for a Google file (opens in native Google editor).
 */
export function getEditUrl(fileId: string, mimeType: string | null): string {
  if (mimeType === 'application/vnd.google-apps.document') {
    return `https://docs.google.com/document/d/${fileId}/edit`;
  }
  if (mimeType === 'application/vnd.google-apps.spreadsheet') {
    return `https://docs.google.com/spreadsheets/d/${fileId}/edit`;
  }
  if (mimeType === 'application/vnd.google-apps.presentation') {
    return `https://docs.google.com/presentation/d/${fileId}/edit`;
  }
  return `https://drive.google.com/file/d/${fileId}/view`;
}

/**
 * Search files in Google Drive.
 */
export async function searchFiles(
  accessToken: string,
  query: string,
): Promise<DriveFile[]> {
  const driveQuery = `fullText contains '${query.replace(/'/g, "\\'")}' and trashed=false`;
  const fields = 'files(id,name,mimeType,webViewLink,size,modifiedTime,parents)';

  const data = await driveRequest<{ files: any[] }>(
    accessToken,
    `/files?q=${encodeURIComponent(driveQuery)}&fields=${fields}&pageSize=50`,
  );

  return (data.files || []).map(mapDriveFile);
}

function mapDriveFile(item: any): DriveFile {
  return {
    id: item.id,
    name: item.name,
    mimeType: item.mimeType || null,
    webUrl: item.webViewLink || `https://drive.google.com/file/d/${item.id}/view`,
    size: parseInt(item.size || '0', 10),
    lastModified: item.modifiedTime || new Date().toISOString(),
    isFolder: item.mimeType === 'application/vnd.google-apps.folder',
    parentFolderId: item.parents?.[0] || null,
    path: null,
  };
}
