/**
 * KOG CRM API Client
 *
 * Authenticates with a service account and provides typed wrappers
 * for contact, activity, and organization endpoints.
 */

const KOG_API = process.env.KOG_API_URL || 'https://kog-api.netrunsystems.com';

// ── Types ────────────────────────────────────────────────────────────────────

export interface KogContact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  status: string;
  created_at: string;
}

export interface KogActivity {
  id: string;
  type: string;
  subject: string;
  notes?: string;
  created_at: string;
}

export interface KogOrg {
  id: string;
  name: string;
  website?: string;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

let _token: string | null = null;
let _tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (_token && Date.now() < _tokenExpiry) return _token;

  const res = await fetch(`${KOG_API}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: process.env.KOG_SERVICE_USER,
      password: process.env.KOG_SERVICE_PASS,
    }),
  });

  if (!res.ok) {
    throw new Error(`KOG auth failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  _token = data.access_token;
  _tokenExpiry = Date.now() + 25 * 60 * 1000; // 25 min (token lasts 30)
  return _token!;
}

async function kogFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getToken();
  const res = await fetch(`${KOG_API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  return res;
}

// ── Contacts ─────────────────────────────────────────────────────────────────

export async function createContact(data: {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  source?: string;
  notes?: string;
}): Promise<KogContact> {
  const res = await kogFetch('/api/v1/contacts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`KOG createContact failed: ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
}

export async function searchContacts(
  query: string,
  limit = 20,
): Promise<KogContact[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  const res = await kogFetch(`/api/v1/contacts/search?${params}`);
  if (!res.ok) throw new Error(`KOG searchContacts failed: ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
}

// ── Activities ───────────────────────────────────────────────────────────────

export async function getContactActivities(
  contactId: string,
  limit = 50,
): Promise<KogActivity[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  const res = await kogFetch(
    `/api/v1/contacts/${contactId}/activities?${params}`,
  );
  if (!res.ok)
    throw new Error(`KOG getContactActivities failed: ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
}

export async function createActivity(
  contactId: string,
  data: { type: string; subject: string; notes?: string },
): Promise<KogActivity> {
  const res = await kogFetch(`/api/v1/contacts/${contactId}/activities`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`KOG createActivity failed: ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
}

// ── Organizations ────────────────────────────────────────────────────────────

export async function createOrganization(data: {
  name: string;
  website?: string;
}): Promise<KogOrg> {
  const res = await kogFetch('/api/v1/organizations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok)
    throw new Error(`KOG createOrganization failed: ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
}

// ── Health ───────────────────────────────────────────────────────────────────

export async function checkConnection(): Promise<{
  reachable: boolean;
  url: string;
  error?: string;
}> {
  try {
    const res = await fetch(`${KOG_API}/health`, { signal: AbortSignal.timeout(5000) });
    return { reachable: res.ok, url: KOG_API };
  } catch (err) {
    return {
      reachable: false,
      url: KOG_API,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
