/**
 * Intirkast Broadcasting API Client
 *
 * Communicates with the Intirkast broadcasting platform to fetch live stream
 * status, podcast episodes, broadcast schedules, and content variant data.
 */

const INTIRKAST_API = process.env.INTIRKAST_API_URL || 'http://localhost:8000';
const INTIRKAST_KEY = process.env.INTIRKAST_API_KEY;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Episode {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  duration: number;
  publishedAt: string;
  thumbnailUrl?: string;
}

export interface LiveSession {
  id: string;
  title: string;
  status: 'live' | 'scheduled' | 'ended';
  streamUrl?: string;
  viewerCount?: number;
  scheduledAt?: string;
}

export interface ScheduleEntry {
  id: string;
  title: string;
  scheduledAt: string;
  type: 'podcast' | 'livestream' | 'premiere';
  status: string;
}

export interface ContentVariant {
  id: string;
  name: string;
  content: string;
  impressions: number;
  engagementRate: number;
}

// ---------------------------------------------------------------------------
// Base request helper
// ---------------------------------------------------------------------------

export async function intirkastRequest(
  path: string,
  options?: RequestInit,
): Promise<Response> {
  const url = `${INTIRKAST_API}${path.startsWith('/') ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> | undefined),
  };

  if (INTIRKAST_KEY) {
    headers['Authorization'] = `Bearer ${INTIRKAST_KEY}`;
  }

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `Intirkast API error ${res.status} ${res.statusText}: ${body}`,
    );
  }

  return res;
}

// ---------------------------------------------------------------------------
// Domain helpers
// ---------------------------------------------------------------------------

export async function getPodcastEpisodes(
  podcastId: string,
  limit = 20,
): Promise<Episode[]> {
  const res = await intirkastRequest(
    `/api/podcasts/${podcastId}/episodes?limit=${limit}`,
  );
  const data = await res.json();
  return data as Episode[];
}

export async function getLiveStatus(
  sessionId?: string,
): Promise<LiveSession | null> {
  const path = sessionId
    ? `/api/live/sessions/${sessionId}`
    : '/api/live/status';
  const res = await intirkastRequest(path);
  const data = await res.json();
  return (data as LiveSession) ?? null;
}

export async function getBroadcastSchedule(
  limit = 10,
): Promise<ScheduleEntry[]> {
  const res = await intirkastRequest(`/api/schedule?limit=${limit}`);
  const data = await res.json();
  return data as ScheduleEntry[];
}

export async function getContentVariants(
  contentId: string,
): Promise<ContentVariant[]> {
  const res = await intirkastRequest(`/api/content/${contentId}/variants`);
  const data = await res.json();
  return data as ContentVariant[];
}

export async function subscribeNewsletter(
  email: string,
  name?: string,
): Promise<{ success: boolean }> {
  const res = await intirkastRequest('/api/newsletter/subscribe', {
    method: 'POST',
    body: JSON.stringify({ email, name }),
  });
  const data = await res.json();
  return data as { success: boolean };
}
