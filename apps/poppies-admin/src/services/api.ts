/**
 * Poppies API client — thin wrapper around fetch.
 *
 * In the platform admin shell, the Vite proxy forwards /api to the backend.
 * JWT token is pulled from localStorage (managed by @netrun/platform-admin-shell useAuth).
 */

const API_BASE = '/api/v1';

function getToken(): string | null {
  return localStorage.getItem('poppies_access_token');
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
    localStorage.removeItem('poppies_access_token');
    localStorage.removeItem('poppies_refresh_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  return res.json();
}

// ── Consignment Artists ─────────────────────────────────────────────

export function getConsignmentArtists(siteId: string, params?: { status?: string; search?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.search) qs.set('search', params.search);
  return request(`/sites/${siteId}/consignment/artists?${qs}`);
}

export function getConsignmentArtist(siteId: string, id: string) {
  return request(`/sites/${siteId}/consignment/artists/${id}`);
}

export function createConsignmentArtist(siteId: string, data: Record<string, unknown>) {
  return request(`/sites/${siteId}/consignment/artists`, { method: 'POST', body: JSON.stringify(data) });
}

export function updateConsignmentArtist(siteId: string, id: string, data: Record<string, unknown>) {
  return request(`/sites/${siteId}/consignment/artists/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

// ── Consignment Items ───────────────────────────────────────────────

export function getConsignmentItems(siteId: string, params?: { artist_id?: string; status?: string }) {
  const qs = new URLSearchParams();
  if (params?.artist_id) qs.set('artist_id', params.artist_id);
  if (params?.status) qs.set('status', params.status);
  return request(`/sites/${siteId}/consignment/items?${qs}`);
}

export function createConsignmentItem(siteId: string, data: Record<string, unknown>) {
  return request(`/sites/${siteId}/consignment/items`, { method: 'POST', body: JSON.stringify(data) });
}

// ── Consignment Sales ───────────────────────────────────────────────

export function getConsignmentSales(siteId: string, params?: { artist_id?: string; from?: string; to?: string }) {
  const qs = new URLSearchParams();
  if (params?.artist_id) qs.set('artist_id', params.artist_id);
  if (params?.from) qs.set('from', params.from);
  if (params?.to) qs.set('to', params.to);
  return request(`/sites/${siteId}/consignment/sales?${qs}`);
}

export function recordSale(siteId: string, data: Record<string, unknown>) {
  return request(`/sites/${siteId}/consignment/sales`, { method: 'POST', body: JSON.stringify(data) });
}

// ── Settlements ─────────────────────────────────────────────────────

export function getSettlements(siteId: string, params?: { artist_id?: string; status?: string }) {
  const qs = new URLSearchParams();
  if (params?.artist_id) qs.set('artist_id', params.artist_id);
  if (params?.status) qs.set('status', params.status);
  return request(`/sites/${siteId}/consignment/settlements?${qs}`);
}

export function getSettlement(siteId: string, id: string) {
  return request(`/sites/${siteId}/consignment/settlements/${id}`);
}

export function generateSettlements(siteId: string, periodStart: string, periodEnd: string) {
  return request(`/sites/${siteId}/consignment/settlements/generate`, {
    method: 'POST',
    body: JSON.stringify({ period_start: periodStart, period_end: periodEnd }),
  });
}

export function markSettlementPaid(siteId: string, id: string, data: Record<string, unknown>) {
  return request(`/sites/${siteId}/consignment/settlements/${id}/pay`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ── Square Sync ─────────────────────────────────────────────────────

export function getSquareSyncStatus(siteId: string) {
  return request(`/sites/${siteId}/consignment/square/status`);
}

export function syncSquareCatalog(siteId: string) {
  return request(`/sites/${siteId}/consignment/square/catalog`, { method: 'POST' });
}

export function importSquarePayments(siteId: string, beginTime?: string, endTime?: string) {
  return request(`/sites/${siteId}/consignment/square/payments`, {
    method: 'POST',
    body: JSON.stringify({ begin_time: beginTime, end_time: endTime }),
  });
}
