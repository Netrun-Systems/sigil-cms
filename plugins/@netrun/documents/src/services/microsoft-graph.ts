/**
 * Microsoft Graph API client for OneDrive/SharePoint integration.
 *
 * Handles OAuth flow, file browsing, preview URLs, search, and change notifications.
 * Uses environment variables for client credentials:
 *   MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID
 *
 * Falls back gracefully when not configured (wiki-only mode).
 */

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';
const AUTH_BASE = 'https://login.microsoftonline.com';

export interface MicrosoftConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  redirectUri: string;
}

export interface MicrosoftTokens {
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
 * Check if Microsoft Graph integration is configured.
 */
export function isConfigured(): boolean {
  return !!(
    process.env.MICROSOFT_CLIENT_ID &&
    process.env.MICROSOFT_CLIENT_SECRET &&
    process.env.MICROSOFT_TENANT_ID
  );
}

/**
 * Get the config from environment. Throws if not configured.
 */
function getConfig(): MicrosoftConfig {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const tenantId = process.env.MICROSOFT_TENANT_ID;
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI || '';

  if (!clientId || !clientSecret || !tenantId) {
    throw new Error('Microsoft Graph not configured. Set MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID');
  }

  return { clientId, clientSecret, tenantId, redirectUri };
}

/**
 * Build the OAuth authorization URL for Microsoft login.
 */
export function getAuthUrl(redirectUri: string, state: string): string {
  const config = getConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: 'Files.Read Files.ReadWrite Sites.Read.All offline_access',
    state,
    response_mode: 'query',
  });
  return `${AUTH_BASE}/${config.tenantId}/oauth2/v2.0/authorize?${params}`;
}

/**
 * Exchange auth code for access + refresh tokens.
 */
export async function exchangeCode(
  code: string,
  redirectUri: string,
): Promise<MicrosoftTokens> {
  const config = getConfig();
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    scope: 'Files.Read Files.ReadWrite Sites.Read.All offline_access',
  });

  const res = await fetch(`${AUTH_BASE}/${config.tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Microsoft token exchange failed: ${err.error_description || res.statusText}`);
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
export async function refreshAccessToken(refreshToken: string): Promise<MicrosoftTokens> {
  const config = getConfig();
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    scope: 'Files.Read Files.ReadWrite Sites.Read.All offline_access',
  });

  const res = await fetch(`${AUTH_BASE}/${config.tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Microsoft token refresh failed: ${err.error_description || res.statusText}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

/**
 * Make an authenticated request to Microsoft Graph API.
 */
async function graphRequest<T = unknown>(
  accessToken: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Graph API error (${res.status}): ${err.error?.message || res.statusText}`);
  }

  return res.json();
}

/**
 * Get user info from Microsoft Graph (used to get email, drive ID).
 */
export async function getUserInfo(accessToken: string) {
  return graphRequest<{ mail: string; userPrincipalName: string; displayName: string }>(
    accessToken,
    '/me?$select=mail,userPrincipalName,displayName',
  );
}

/**
 * Get the user's default OneDrive drive ID.
 */
export async function getDefaultDrive(accessToken: string) {
  return graphRequest<{ id: string; name: string; driveType: string }>(
    accessToken,
    '/me/drive?$select=id,name,driveType',
  );
}

/**
 * List files in a folder (or root if no folderId).
 */
export async function listFiles(
  accessToken: string,
  driveId: string,
  folderId?: string,
): Promise<DriveFile[]> {
  const path = folderId
    ? `/drives/${driveId}/items/${folderId}/children?$top=200&$select=id,name,file,folder,webUrl,size,lastModifiedDateTime,parentReference`
    : `/drives/${driveId}/root/children?$top=200&$select=id,name,file,folder,webUrl,size,lastModifiedDateTime,parentReference`;

  const data = await graphRequest<{ value: any[] }>(accessToken, path);

  return data.value.map((item) => ({
    id: item.id,
    name: item.name,
    mimeType: item.file?.mimeType || null,
    webUrl: item.webUrl,
    size: item.size || 0,
    lastModified: item.lastModifiedDateTime,
    isFolder: !!item.folder,
    parentFolderId: item.parentReference?.id || null,
    path: item.parentReference?.path || null,
  }));
}

/**
 * Get file metadata by ID.
 */
export async function getFile(
  accessToken: string,
  driveId: string,
  fileId: string,
): Promise<DriveFile> {
  const item = await graphRequest<any>(
    accessToken,
    `/drives/${driveId}/items/${fileId}?$select=id,name,file,folder,webUrl,size,lastModifiedDateTime,parentReference`,
  );

  return {
    id: item.id,
    name: item.name,
    mimeType: item.file?.mimeType || null,
    webUrl: item.webUrl,
    size: item.size || 0,
    lastModified: item.lastModifiedDateTime,
    isFolder: !!item.folder,
    parentFolderId: item.parentReference?.id || null,
    path: item.parentReference?.path || null,
  };
}

/**
 * Get an embeddable preview URL for a file via Graph preview API.
 * Returns a URL suitable for iframe embedding (read-only).
 */
export async function getPreviewUrl(
  accessToken: string,
  driveId: string,
  fileId: string,
): Promise<string> {
  const data = await graphRequest<{ getUrl: string }>(
    accessToken,
    `/drives/${driveId}/items/${fileId}/preview`,
    { method: 'POST', body: JSON.stringify({}) },
  );
  return data.getUrl;
}

/**
 * Get the webUrl that opens in Office Online for editing (opens in new tab).
 */
export async function getEditUrl(
  accessToken: string,
  driveId: string,
  fileId: string,
): Promise<string> {
  const item = await graphRequest<{ webUrl: string }>(
    accessToken,
    `/drives/${driveId}/items/${fileId}?$select=webUrl`,
  );
  return item.webUrl;
}

/**
 * Search files in a drive.
 */
export async function searchFiles(
  accessToken: string,
  driveId: string,
  query: string,
): Promise<DriveFile[]> {
  const data = await graphRequest<{ value: any[] }>(
    accessToken,
    `/drives/${driveId}/root/search(q='${encodeURIComponent(query)}')?$top=50&$select=id,name,file,folder,webUrl,size,lastModifiedDateTime,parentReference`,
  );

  return data.value.map((item) => ({
    id: item.id,
    name: item.name,
    mimeType: item.file?.mimeType || null,
    webUrl: item.webUrl,
    size: item.size || 0,
    lastModified: item.lastModifiedDateTime,
    isFolder: !!item.folder,
    parentFolderId: item.parentReference?.id || null,
    path: item.parentReference?.path || null,
  }));
}

/**
 * Subscribe to change notifications on a drive (webhook).
 */
export async function subscribeToChanges(
  accessToken: string,
  driveId: string,
  notificationUrl: string,
  expirationMinutes = 4230, // ~3 days max
): Promise<{ subscriptionId: string; expirationDateTime: string }> {
  const expiration = new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString();

  const data = await graphRequest<{ id: string; expirationDateTime: string }>(
    accessToken,
    '/subscriptions',
    {
      method: 'POST',
      body: JSON.stringify({
        changeType: 'updated',
        notificationUrl,
        resource: `/drives/${driveId}/root`,
        expirationDateTime: expiration,
        clientState: 'netrun-documents-webhook',
      }),
    },
  );

  return {
    subscriptionId: data.id,
    expirationDateTime: data.expirationDateTime,
  };
}
