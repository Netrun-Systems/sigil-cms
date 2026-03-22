/**
 * Job Search API client — thin wrapper around fetch.
 *
 * Vite proxy forwards /api to the CMS API backend.
 * JWT token from localStorage (managed by @netrun/platform-admin-shell useAuth).
 */

const API_BASE = '/api/v1/job-search';

function getToken(): string | null {
  return localStorage.getItem('job_search_access_token') || localStorage.getItem('kog_access_token');
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
    localStorage.removeItem('job_search_access_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message || body.detail || `Request failed (${res.status})`);
  }

  return res.json();
}

// -- Profile --

export function getProfile() {
  return request<{ success: boolean; data: any }>('/profile');
}

export function updateProfile(data: Record<string, unknown>) {
  return request('/profile', { method: 'PUT', body: JSON.stringify(data) });
}

// -- Tracker --

export function getTracker(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return request<{ success: boolean; data: any[]; total: number }>(`/tracker${qs}`);
}

export function getTrackerStats() {
  return request<{ success: boolean; data: any }>('/tracker/stats');
}

export function getTrackerEntry(id: string) {
  return request<{ success: boolean; data: any }>(`/tracker/${id}`);
}

export function createTrackerEntry(data: Record<string, unknown>) {
  return request('/tracker', { method: 'POST', body: JSON.stringify(data) });
}

export function updateTrackerEntry(id: string, data: Record<string, unknown>) {
  return request(`/tracker/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteTrackerEntry(id: string) {
  return request(`/tracker/${id}`, { method: 'DELETE' });
}

// -- AI Actions --

export function researchCompany(trackerId: string) {
  return request(`/tracker/${trackerId}/research`, { method: 'POST' });
}

export function analyzeRole(trackerId: string, jdText?: string) {
  return request(`/tracker/${trackerId}/analyze`, {
    method: 'POST',
    body: JSON.stringify({ jdText }),
  });
}

export function generateCoverLetter(trackerId: string) {
  return request(`/tracker/${trackerId}/cover-letter`, { method: 'POST' });
}

export function generateOutreach(trackerId: string) {
  return request(`/tracker/${trackerId}/outreach`, { method: 'POST' });
}

export function generateInterviewPrep(trackerId: string, interviewType?: string) {
  return request(`/tracker/${trackerId}/interview-prep`, {
    method: 'POST',
    body: JSON.stringify({ interviewType }),
  });
}

export function generateFollowup(trackerId: string) {
  return request(`/tracker/${trackerId}/followup`, { method: 'POST' });
}

// -- Automation --

export function runMorning() {
  return request('/automation/morning', { method: 'POST' });
}

export function runEvening() {
  return request('/automation/evening', { method: 'POST' });
}

export function runFollowups() {
  return request('/automation/followups', { method: 'POST' });
}

export function getAutomationRuns(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return request<{ success: boolean; data: any[] }>(`/automation/runs${qs}`);
}

// -- Discoveries --

export function getDiscoveries(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return request<{ success: boolean; data: any[] }>(`/discoveries${qs}`);
}

export function addDiscoveryToTracker(discoveryId: string) {
  return request(`/discoveries/${discoveryId}/add-to-tracker`, { method: 'POST' });
}

// -- Interviews --

export function getInterviews() {
  return request<{ success: boolean; data: any[] }>('/interviews');
}

export function createInterview(data: Record<string, unknown>) {
  return request('/interviews', { method: 'POST', body: JSON.stringify(data) });
}

export function updateInterview(id: string, data: Record<string, unknown>) {
  return request(`/interviews/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function generateInterviewPrepById(interviewId: string) {
  return request(`/interviews/${interviewId}/prep`, { method: 'POST' });
}

// -- Analytics --

export function getAnalyticsFunnel() {
  return request<{ success: boolean; data: any[] }>('/analytics/funnel');
}

export function getAnalyticsVelocity() {
  return request<{ success: boolean; data: any[] }>('/analytics/velocity');
}

export function getAnalyticsSources() {
  return request<{ success: boolean; data: any[] }>('/analytics/sources');
}
