/**
 * Advisor API client — streaming chat, document management, TTS.
 */

const ADVISOR_BASE = '/api/v1/advisor';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('netrun_cms_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Streaming chat ─────────────────────────────

export async function* streamChat(
  message: string,
  sessionId: string,
  documentIds?: string[],
): AsyncGenerator<string> {
  const res = await fetch(`${ADVISOR_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ message, sessionId, documentIds }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(body.error?.message || `Chat failed (${res.status})`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') return;

      try {
        const parsed = JSON.parse(data);
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.text) yield parsed.text;
      } catch (e) {
        if (e instanceof Error && e.message !== data) throw e;
      }
    }
  }
}

// ── Document management ────────────────────────

export interface DocumentInfo {
  name: string;
  displayName: string;
  mimeType: string;
  uri: string;
  state: string;
  sizeBytes?: string;
}

export async function uploadDocument(file: File, sessionId: string): Promise<DocumentInfo> {
  const form = new FormData();
  form.append('file', file);
  form.append('sessionId', sessionId);

  const res = await fetch(`${ADVISOR_BASE}/documents`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
    body: form,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(body.error?.message || 'Upload failed');
  }

  const { data } = await res.json();
  return data;
}

export async function listDocuments(sessionId: string): Promise<DocumentInfo[]> {
  const res = await fetch(`${ADVISOR_BASE}/documents?sessionId=${sessionId}`, {
    headers: { ...getAuthHeaders() },
  });

  if (!res.ok) throw new Error('Failed to list documents');
  const { data } = await res.json();
  return data;
}

export async function deleteDocument(fileId: string, sessionId: string): Promise<void> {
  const res = await fetch(`${ADVISOR_BASE}/documents/${encodeURIComponent(fileId)}?sessionId=${sessionId}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(body.error?.message || 'Delete failed');
  }
}

// ── Text-to-speech ─────────────────────────────

export async function generateSpeech(text: string): Promise<Blob> {
  const res = await fetch(`${ADVISOR_BASE}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(body.error?.message || 'TTS failed');
  }

  return res.blob();
}
