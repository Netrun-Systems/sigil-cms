/**
 * Redis session stub — DEPRECATED.
 *
 * This module has been superseded by PostgreSQL sessions (lib/sessions.ts).
 * Redis/ioredis dependency removed — sessions are now persisted in ncms_advisor_sessions
 * table on charlotte_db (Cloud SQL), aligned with frost's session storage pattern.
 *
 * Kept as a stub to preserve git history. Advisor routes now use lib/sessions.ts.
 */

export interface AdvisorSession {
  history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
  documents: unknown[];
}

export async function getSession(_sessionId: string): Promise<AdvisorSession> {
  throw new Error('Redis sessions are deprecated. Use lib/sessions.ts instead.');
}

export async function saveSession(_sessionId: string, _session: AdvisorSession): Promise<void> {
  throw new Error('Redis sessions are deprecated. Use lib/sessions.ts instead.');
}

export async function deleteSession(_sessionId: string): Promise<void> {
  throw new Error('Redis sessions are deprecated. Use lib/sessions.ts instead.');
}

export async function redisHealthCheck(): Promise<boolean> {
  return false;
}

// Stub to prevent import errors in any code that still accesses redis directly
export const redis = {
  ping: async () => { throw new Error('Redis is deprecated.'); },
};
