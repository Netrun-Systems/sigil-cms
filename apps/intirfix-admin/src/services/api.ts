/**
 * Intirfix API client — thin wrapper around fetch.
 *
 * In the platform admin shell, the Vite proxy forwards /api to the Intirfix backend.
 * JWT token is pulled from localStorage (managed by @netrun/platform-admin-shell useAuth).
 */

const API_BASE = '/api/v1';

function getToken(): string | null {
  return localStorage.getItem('intirfix_access_token');
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
    localStorage.removeItem('intirfix_access_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => 'Unknown error');
    throw new Error(`API ${res.status}: ${errBody}`);
  }

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text() as unknown as T;
}

// Dashboard
export const getDashboard = () => request('/dashboard');

// Connections
export const getConnections = () => request('/connections');
export const connectPlatform = (platform: string, config: Record<string, unknown>) =>
  request(`/connectors/${platform}/connect`, { method: 'POST', body: JSON.stringify(config) });
export const disconnectPlatform = (platform: string) =>
  request(`/connectors/${platform}/disconnect`, { method: 'POST' });
export const testConnection = (platform: string) =>
  request(`/connectors/${platform}/test`, { method: 'POST' });
export const getConnectionStatus = (platform: string) =>
  request(`/connectors/${platform}/status`);

// Sync
export const getSyncStatus = () => request('/sync/status');
export const triggerSync = (platform: string) =>
  request(`/sync/${platform}/trigger`, { method: 'POST' });

// Transactions
export const getTransactions = (params?: Record<string, string>) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return request(`/transactions${qs}`);
};

// Reconciliation
export const getReconciliation = () => request('/reconciliation');
export const runReconciliation = () =>
  request('/reconciliation/run', { method: 'POST' });

// Webhooks
export const getWebhooks = () => request('/webhooks');
export const deleteWebhook = (id: string) =>
  request(`/webhooks/${id}`, { method: 'DELETE' });
