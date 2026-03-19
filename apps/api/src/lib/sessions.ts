/**
 * Advisor session persistence — PostgreSQL.
 *
 * Backported from frost. Sessions store chat history only.
 * Document knowledge is stored at the collection level in rag_documents/rag_chunks
 * (not per-session).
 *
 * Falls back gracefully if the sessions table doesn't exist yet —
 * the auto-migration creates it on first use.
 */

import { getRagPool } from './rag.js';

export interface AdvisorSession {
  history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
}

let migrationsRun = false;

async function ensureSessionsTable(): Promise<void> {
  if (migrationsRun) return;
  const p = getRagPool();
  await p.query(`
    CREATE TABLE IF NOT EXISTS ncms_advisor_sessions (
      session_id VARCHAR(100) PRIMARY KEY,
      history JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  migrationsRun = true;
}

export async function getSession(sessionId: string): Promise<AdvisorSession> {
  await ensureSessionsTable();
  const p = getRagPool();
  const result = await p.query(
    `UPDATE ncms_advisor_sessions SET updated_at = NOW()
     WHERE session_id = $1
     RETURNING history`,
    [sessionId],
  );

  if (result.rows.length > 0) {
    return { history: result.rows[0].history };
  }
  return { history: [] };
}

export async function saveSession(sessionId: string, session: AdvisorSession): Promise<void> {
  await ensureSessionsTable();
  const p = getRagPool();
  await p.query(
    `INSERT INTO ncms_advisor_sessions (session_id, history)
     VALUES ($1, $2)
     ON CONFLICT (session_id) DO UPDATE
       SET history = EXCLUDED.history,
           updated_at = NOW()`,
    [sessionId, JSON.stringify(session.history)],
  );
}

export async function deleteSession(sessionId: string): Promise<void> {
  await ensureSessionsTable();
  const p = getRagPool();
  await p.query('DELETE FROM ncms_advisor_sessions WHERE session_id = $1', [sessionId]);
}
