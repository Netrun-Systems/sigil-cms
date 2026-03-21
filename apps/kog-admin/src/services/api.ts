/**
 * KOG API client — thin wrapper around fetch.
 *
 * In the platform admin shell, the Vite proxy forwards /api to the KOG backend.
 * JWT token is pulled from localStorage (managed by @netrun/platform-admin-shell useAuth).
 */

const API_BASE = '/api/v1';

function getToken(): string | null {
  return localStorage.getItem('kog_access_token');
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
    localStorage.removeItem('kog_access_token');
    localStorage.removeItem('kog_refresh_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || body.message || `Request failed (${res.status})`);
  }

  return res.json();
}

// ── Contacts ──────────────────────────────────────────────────────────

export function getContacts(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return request(`/contacts${qs}`);
}

export function createContact(data: Record<string, unknown>) {
  return request('/contacts', { method: 'POST', body: JSON.stringify(data) });
}

// ── Organizations ─────────────────────────────────────────────────────

export function getOrganizations(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return request(`/organizations${qs}`);
}

// ── Deals / Opportunities ─────────────────────────────────────────────

export function getDeals(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return request(`/opportunities${qs}`);
}

// ── Activities ────────────────────────────────────────────────────────

export function getActivities(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return request(`/activities${qs}`);
}

export function createActivity(data: Record<string, unknown>) {
  return request('/activities', { method: 'POST', body: JSON.stringify(data) });
}

// ── Analytics ─────────────────────────────────────────────────────────

export function getDashboardMetrics() {
  return request<{ metrics: Array<{ label: string; value: number; trend?: string }> }>('/analytics/dashboard');
}
