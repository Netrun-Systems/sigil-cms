/**
 * Advisor API Routes
 *
 * Gemini-powered AI advisor with pgvector RAG grounding.
 * Backported from frost — uses persistent collection-level document storage
 * (not session-scoped ChromaDB) for higher quality retrieval.
 *
 * Sessions persisted in PostgreSQL (ncms_advisor_sessions table).
 * Protected by JWT authentication.
 */

import { Router } from 'express';
import type { Response } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../types/index.js';
import {
  getGeminiClient,
  GEMINI_MODEL,
  ADVISOR_SYSTEM_PROMPT,
} from '../lib/gemini.js';
import { getSession, saveSession } from '../lib/sessions.js';
import {
  ingestDocument,
  queryDocuments,
  formatContextForPrompt,
  removeDocument,
  listRagDocuments,
} from '../lib/rag.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// All advisor routes require authentication
router.use(authenticate);

// Text file types that can be ingested into pgvector
const TEXT_TYPES = [
  'text/', 'application/json', 'application/xml',
  'application/csv', 'application/markdown',
  'application/x-yaml',
];

// ── POST /chat — SSE streaming chat ─────────────

router.post('/chat', async (req: AuthenticatedRequest, res: Response) => {
  const { message, sessionId = 'default' } = req.body;

  if (!message || typeof message !== 'string') {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'message is required' },
    });
    return;
  }

  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  try {
    const ai = await getGeminiClient();
    const session = await getSession(sessionId);

    // Query pgvector for relevant knowledge chunks
    const chunks = await queryDocuments(message, 5, 0.3).catch(() => []);
    const context = formatContextForPrompt(chunks, 1500);

    // Build user message with RAG context
    let userContent: string;
    if (context) {
      userContent = `Relevant context from the knowledge base:\n\n${context}\n\n---\n\nUser message: ${message}`;
    } else {
      userContent = message;
    }

    const chat = ai.chats.create({
      model: GEMINI_MODEL,
      config: { systemInstruction: ADVISOR_SYSTEM_PROMPT },
      history: session.history,
    });

    const stream = await chat.sendMessageStream({ message: userContent });

    let fullResponse = '';
    for await (const chunk of stream) {
      const text = chunk.text ?? '';
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    // Send source attribution if RAG was used
    if (chunks.length > 0) {
      const sources = [...new Set(chunks.map((c) => c.source))];
      res.write(`data: ${JSON.stringify({ sources })}\n\n`);
    }

    // Persist updated history to PostgreSQL
    session.history.push(
      { role: 'user', parts: [{ text: message }] },
      { role: 'model', parts: [{ text: fullResponse }] },
    );
    await saveSession(sessionId, session);

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Chat failed';
    console.error('[advisor/chat] Error:', errorMessage);
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// ── POST /documents — upload & ingest into pgvector ──

router.post('/documents', upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  const file = req.file;

  if (!file) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'No file provided' },
    });
    return;
  }

  const isTextFile = TEXT_TYPES.some((t) => file.mimetype.startsWith(t));
  if (!isTextFile) {
    res.status(422).json({
      success: false,
      error: {
        code: 'UNSUPPORTED_TYPE',
        message: `Unsupported file type: ${file.mimetype}. Upload text, markdown, JSON, CSV, or code files.`,
      },
    });
    return;
  }

  try {
    const textContent = file.buffer.toString('utf-8');
    const fileId = `upload:${Date.now()}:${file.originalname}`;
    const chunkCount = await ingestDocument(fileId, file.originalname, textContent, file.mimetype);

    res.json({
      success: true,
      data: {
        fileId,
        fileName: file.originalname,
        mimeType: file.mimetype,
        chunkCount,
        sizeBytes: file.size,
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Upload failed';
    console.error('[advisor/documents] Upload error:', errorMessage);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: errorMessage },
    });
  }
});

// ── GET /documents — list knowledge base documents ──

router.get('/documents', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const docs = await listRagDocuments();
    res.json({ success: true, data: docs });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'List failed';
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: errorMessage },
    });
  }
});

// ── DELETE /documents/:fileId — remove from knowledge base ──

router.delete('/documents/:fileId', async (req: AuthenticatedRequest, res: Response) => {
  const fileId = decodeURIComponent(req.params.fileId as string);

  try {
    await removeDocument(fileId);
    res.json({ success: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Delete failed';
    console.error('[advisor/documents] Delete error:', errorMessage);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: errorMessage },
    });
  }
});

// ── POST /tts — text-to-speech via Gemini ───────

router.post('/tts', async (req: AuthenticatedRequest, res: Response) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'text is required' },
    });
    return;
  }

  try {
    const ai = await getGeminiClient();

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const audioPart = response.candidates?.[0]?.content?.parts?.find(
      (p: Record<string, unknown>) => p.inlineData,
    );

    if (!audioPart?.inlineData?.data) {
      res.status(500).json({
        success: false,
        error: { code: 'TTS_FAILED', message: 'No audio generated' },
      });
      return;
    }

    const audioBuffer = Buffer.from(audioPart.inlineData.data, 'base64');
    const mimeType = audioPart.inlineData.mimeType || 'audio/mp3';

    res.set({
      'Content-Type': mimeType,
      'Content-Length': audioBuffer.length.toString(),
    });
    res.send(audioBuffer);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'TTS failed';
    console.error('[advisor/tts] Error:', errorMessage);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: errorMessage },
    });
  }
});

export default router;
