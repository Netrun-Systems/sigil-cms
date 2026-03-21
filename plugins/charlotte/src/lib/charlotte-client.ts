/**
 * Charlotte AI API Client
 *
 * Communicates with the Charlotte voice assistant backend
 * for prompt execution, knowledge search, model listing, and health checks.
 */

const CHARLOTTE_API = process.env.CHARLOTTE_API_URL || 'http://localhost:8000';

export interface KnowledgeResult {
  content: string;
  source: string;
  relevance: number;
  collection: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  available: boolean;
}

export interface ExecuteResponse {
  response: string;
  model_used: string;
  processing_time_ms: number;
}

export interface HealthStatus {
  status: string;
  models: Record<string, boolean>;
}

/**
 * Execute a prompt against Charlotte's LLM endpoint.
 */
export async function executePrompt(
  prompt: string,
  options?: { model?: string; stream?: boolean },
): Promise<ExecuteResponse> {
  const res = await fetch(`${CHARLOTTE_API}/api/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      model: options?.model,
      stream: options?.stream ?? false,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`Charlotte execute failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<ExecuteResponse>;
}

/**
 * Search Charlotte's knowledge base via RAG.
 */
export async function searchKnowledge(
  query: string,
  collection?: string,
  topK?: number,
): Promise<KnowledgeResult[]> {
  const params = new URLSearchParams({ query });
  if (collection) params.set('collection', collection);
  if (topK) params.set('top_k', String(topK));

  const res = await fetch(`${CHARLOTTE_API}/api/knowledge/search?${params}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`Charlotte knowledge search failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { results: KnowledgeResult[] };
  return data.results;
}

/**
 * List available models on the Charlotte instance.
 */
export async function getModels(): Promise<ModelInfo[]> {
  const res = await fetch(`${CHARLOTTE_API}/api/models`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Charlotte models endpoint failed (${res.status})`);
  }

  const data = (await res.json()) as { models: ModelInfo[] };
  return data.models;
}

/**
 * Check Charlotte API health and model availability.
 */
export async function healthCheck(): Promise<HealthStatus> {
  const res = await fetch(`${CHARLOTTE_API}/health`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Charlotte health check failed (${res.status})`);
  }

  return res.json() as Promise<HealthStatus>;
}

/**
 * Get the WebSocket URL for streaming/voice sessions.
 */
export function getStreamUrl(sessionId: string): string {
  const wsBase = CHARLOTTE_API.replace('http', 'ws');
  return `${wsBase}/api/layered/ws/${sessionId}`;
}

/**
 * Ingest content into Charlotte's knowledge base.
 */
export async function ingestContent(
  content: string,
  source: string,
  collection: string,
  metadata?: Record<string, unknown>,
): Promise<{ success: boolean; chunks: number }> {
  const res = await fetch(`${CHARLOTTE_API}/api/knowledge/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, source, collection, metadata }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`Charlotte ingest failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<{ success: boolean; chunks: number }>;
}

/**
 * List knowledge collections on the Charlotte instance.
 */
export async function listCollections(): Promise<
  { name: string; document_count: number }[]
> {
  const res = await fetch(`${CHARLOTTE_API}/api/knowledge/collections`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Charlotte collections endpoint failed (${res.status})`);
  }

  const data = (await res.json()) as {
    collections: { name: string; document_count: number }[];
  };
  return data.collections;
}
