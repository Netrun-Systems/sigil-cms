/**
 * Advisor API Routes
 *
 * Gemini-powered AI advisor with dual document grounding:
 *   1. Gemini Files API — full-file reference for structured docs
 *   2. ChromaDB RAG — semantic chunk retrieval for contextual grounding
 *
 * Sessions persisted in Redis (DB 4) on Charlotte VM.
 * Protected by JWT authentication.
 */

import { Router } from 'express';
import type { Response } from 'express';
import multer from 'multer';
import { createPartFromUri } from '@google/genai';
import { authenticate } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../types/index.js';
import {
  getGeminiClient,
  GEMINI_MODEL,
  ADVISOR_SYSTEM_PROMPT,
  type DocumentInfo,
} from '../lib/gemini.js';
import { getSession, saveSession } from '../lib/redis.js';
import {
  ingestDocument,
  queryDocuments,
  removeDocumentChunks,
} from '../lib/chroma.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// All advisor routes require authentication
router.use(authenticate);

// ── POST /chat — SSE streaming chat ─────────────

router.post('/chat', async (req: AuthenticatedRequest, res: Response) => {
  const { message, sessionId = 'default', documentIds } = req.body;

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
    const ai = getGeminiClient();
    const session = await getSession(sessionId);

    // Build content parts: text message + Gemini file references
    const contentParts: Array<{ text: string } | ReturnType<typeof createPartFromUri>> = [];

    // Query ChromaDB for relevant document chunks (RAG grounding)
    if (session.documents.length > 0) {
      const chunks = await queryDocuments(sessionId, message, 5);
      if (chunks.length > 0) {
        const context = chunks
          .map((c) => `[From "${c.fileName}"]:\n${c.text}`)
          .join('\n\n---\n\n');
        contentParts.push({
          text: `Relevant context from uploaded documents:\n\n${context}\n\n---\n\nUser message: ${message}`,
        });
      } else {
        contentParts.push({ text: message });
      }
    } else {
      contentParts.push({ text: message });
    }

    // Also attach Gemini file references for full-document access
    const docsToAttach = documentIds?.length
      ? session.documents.filter((d: DocumentInfo) => documentIds.includes(d.name))
      : session.documents;

    for (const doc of docsToAttach) {
      if (doc.uri && doc.mimeType) {
        contentParts.push(createPartFromUri(doc.uri, doc.mimeType));
      }
    }

    const chat = ai.chats.create({
      model: GEMINI_MODEL,
      config: { systemInstruction: ADVISOR_SYSTEM_PROMPT },
      history: session.history,
    });

    const stream = await chat.sendMessageStream({ message: contentParts });

    let fullResponse = '';
    for await (const chunk of stream) {
      const text = chunk.text ?? '';
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    // Persist updated history to Redis
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

// ── POST /documents — upload file to Gemini + ingest into ChromaDB ──

router.post('/documents', upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  const file = req.file;
  const sessionId = (req.body?.sessionId as string) || 'default';

  if (!file) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'No file provided' },
    });
    return;
  }

  try {
    const ai = getGeminiClient();

    const blob = new Blob([file.buffer], { type: file.mimetype });
    const uploaded = await ai.files.upload({
      file: blob,
      config: { displayName: file.originalname, mimeType: file.mimetype },
    });

    let fileInfo = uploaded;
    let attempts = 0;
    while (fileInfo.state === 'PROCESSING' && attempts < 30) {
      await new Promise((r) => setTimeout(r, 1000));
      fileInfo = await ai.files.get({ name: fileInfo.name as string });
      attempts++;
    }

    if (fileInfo.state === 'FAILED') {
      res.status(422).json({
        success: false,
        error: { code: 'PROCESSING_FAILED', message: 'File processing failed' },
      });
      return;
    }

    const doc: DocumentInfo = {
      name: fileInfo.name as string,
      displayName: file.originalname,
      mimeType: fileInfo.mimeType as string,
      uri: fileInfo.uri as string,
      state: fileInfo.state as string,
      sizeBytes: fileInfo.sizeBytes?.toString(),
    };

    // Ingest text content into ChromaDB for RAG
    const textTypes = [
      'text/', 'application/json', 'application/xml',
      'application/csv', 'application/markdown',
    ];
    const isTextFile = textTypes.some((t) => file.mimetype.startsWith(t));

    if (isTextFile) {
      const textContent = file.buffer.toString('utf-8');
      await ingestDocument(sessionId, doc.name, file.originalname, textContent);
    }

    // Persist document reference in Redis session
    const session = await getSession(sessionId);
    session.documents.push(doc);
    await saveSession(sessionId, session);

    res.json({ success: true, data: doc });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Upload failed';
    console.error('[advisor/documents] Upload error:', errorMessage);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: errorMessage },
    });
  }
});

// ── GET /documents — list uploaded docs ─────────

router.get('/documents', async (req: AuthenticatedRequest, res: Response) => {
  const sessionId = (req.query.sessionId as string) || 'default';
  const session = await getSession(sessionId);
  res.json({ success: true, data: session.documents });
});

// ── DELETE /documents/:fileId — remove a doc ────

router.delete('/documents/:fileId', async (req: AuthenticatedRequest, res: Response) => {
  const { fileId } = req.params;
  const sessionId = (req.query.sessionId as string) || 'default';

  try {
    const ai = getGeminiClient();

    await ai.files.delete({ name: fileId }).catch(() => {});
    await removeDocumentChunks(fileId).catch((err) => {
      console.warn('[advisor/documents] ChromaDB cleanup warning:', err.message);
    });

    const session = await getSession(sessionId);
    session.documents = session.documents.filter((d: DocumentInfo) => d.name !== fileId);
    await saveSession(sessionId, session);

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
    const ai = getGeminiClient();

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
