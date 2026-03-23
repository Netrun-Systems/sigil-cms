/**
 * NetrunSite API client — thin wrapper around fetch.
 *
 * In the platform admin shell, the Vite proxy forwards /api to the backend.
 * JWT token is pulled from localStorage (managed by @netrun/platform-admin-shell useAuth).
 */

const API_BASE = '/api/v1';

function getToken(): string | null {
  return localStorage.getItem('netrunsite_access_token');
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
    localStorage.removeItem('netrunsite_access_token');
    localStorage.removeItem('netrunsite_refresh_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  return res.json();
}

// ── Blog ────────────────────────────────────────────────────────────

export function getBlogPosts(siteId: string, params?: { status?: string; page?: number }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.page) qs.set('page', String(params.page));
  return request(`/sites/${siteId}/blog/posts?${qs}`);
}

export function getBlogPost(siteId: string, id: string) {
  return request(`/sites/${siteId}/blog/posts/${id}`);
}

export function createBlogPost(siteId: string, data: Record<string, unknown>) {
  return request(`/sites/${siteId}/blog/posts`, { method: 'POST', body: JSON.stringify(data) });
}

export function updateBlogPost(siteId: string, id: string, data: Record<string, unknown>) {
  return request(`/sites/${siteId}/blog/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

// ── KAMERA ──────────────────────────────────────────────────────────

export function getKameraJobs(siteId: string, params?: { status?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  return request(`/sites/${siteId}/kamera/jobs?${qs}`);
}

export function getKameraJob(siteId: string, id: string) {
  return request(`/sites/${siteId}/kamera/jobs/${id}`);
}

// ── Contact ─────────────────────────────────────────────────────────

export function getContacts(siteId: string) {
  return request(`/sites/${siteId}/contacts`);
}

// ── Mailing List ────────────────────────────────────────────────────

export function getSubscribers(siteId: string) {
  return request(`/sites/${siteId}/subscribers`);
}

// ── Store ───────────────────────────────────────────────────────────

export function getProducts(siteId: string) {
  return request(`/sites/${siteId}/store/products`);
}

export function getOrders(siteId: string) {
  return request(`/sites/${siteId}/store/orders`);
}

// ── Pages ───────────────────────────────────────────────────────────

export function getPages(siteId: string) {
  return request(`/sites/${siteId}/pages`);
}

export function getPage(siteId: string, pageId: string) {
  return request(`/sites/${siteId}/pages/${pageId}`);
}

export function updatePage(siteId: string, pageId: string, data: Record<string, unknown>) {
  return request(`/sites/${siteId}/pages/${pageId}`, { method: 'PUT', body: JSON.stringify(data) });
}
