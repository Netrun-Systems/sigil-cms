/**
 * Redis client for advisor session persistence.
 *
 * Uses DB 4 on Charlotte's local Redis for netrun-cms advisor
 * (DB 3 is allocated to frost advisor).
 *
 * Key pattern: ncms:advisor:session:{sessionId}
 */

import Redis from 'ioredis';
import type { DocumentInfo } from './gemini.js';

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_DB = parseInt(process.env.NCMS_REDIS_DB || '4', 10);

const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  db: REDIS_DB,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  },
  lazyConnect: true,
});

let connected = false;

async function ensureConnected() {
  if (!connected) {
    await redis.connect();
    connected = true;
  }
}

redis.on('error', (err) => {
  console.error('[ncms/redis] Connection error:', err.message);
});

redis.on('ready', () => {
  console.log(`[ncms/redis] Connected to ${REDIS_HOST}:${REDIS_PORT} DB ${REDIS_DB}`);
});

const SESSION_TTL = 86400; // 24 hours
const keyFor = (sessionId: string) => `ncms:advisor:session:${sessionId}`;

export interface AdvisorSession {
  history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
  documents: DocumentInfo[];
}

export async function getSession(sessionId: string): Promise<AdvisorSession> {
  await ensureConnected();
  const raw = await redis.get(keyFor(sessionId));
  if (raw) {
    await redis.expire(keyFor(sessionId), SESSION_TTL);
    return JSON.parse(raw);
  }
  return { history: [], documents: [] };
}

export async function saveSession(sessionId: string, session: AdvisorSession): Promise<void> {
  await ensureConnected();
  await redis.set(keyFor(sessionId), JSON.stringify(session), 'EX', SESSION_TTL);
}

export async function deleteSession(sessionId: string): Promise<void> {
  await ensureConnected();
  await redis.del(keyFor(sessionId));
}

export async function redisHealthCheck(): Promise<boolean> {
  try {
    await ensureConnected();
    const result = await redis.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}

export { redis };
