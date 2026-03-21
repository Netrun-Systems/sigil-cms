// @ts-nocheck — plugin routes use dynamic drizzle queries with `any` db client
/**
 * Photos Routes — bulk upload + AI-powered curation.
 *
 * Backported from frost. Site-scoped media management with Azure Blob Storage.
 *
 * POST   /upload    — bulk upload to Azure Blob + PostgreSQL
 * POST   /curate    — Gemini vision AI curation
 * GET    /          — list all photos for site
 * PATCH  /:id       — update selection
 * DELETE /cleanup   — remove stale records
 * DELETE /:id       — delete photo from blob + DB
 */

import { Router, type Request, type Response, type Router as RouterType } from 'express';
import multer from 'multer';
import type { PluginLogger } from '@netrun-cms/plugin-runtime';
import type { DrizzleClient } from '@netrun-cms/plugin-runtime';
import {
  uploadPhotoBlob,
  savePhotoMeta,
  getPhotoMeta,
  getPhotoBlobBuffer,
  listPhotos,
  updatePhotoMeta,
  deletePhotoMeta,
  deletePhotoBlob,
  deleteStalePhotos,
  type MediaPhoto,
  type CurationResponse,
} from './lib/photos.js';
import { getGeminiClient, GEMINI_MODEL } from './lib/gemini.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB per photo
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only images allowed.`));
    }
  },
});

export function createRoutes(_db: DrizzleClient, logger: PluginLogger): RouterType {
  const router: RouterType = Router({ mergeParams: true });

  // ── POST /upload — bulk photo upload ─────────────

  router.post('/upload', upload.array('photos', 100), async (req: Request, res: Response) => {
    const siteId = req.params.siteId as string;
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files?.length) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'No photos provided' } });
      return;
    }

    try {
      const photos: MediaPhoto[] = [];

      for (const file of files) {
        const { id, storedName, blobUrl } = await uploadPhotoBlob(file.buffer, file.originalname, file.mimetype);

        const photo: MediaPhoto = {
          id,
          siteId,
          filename: file.originalname,
          storedName,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          uploadedAt: new Date().toISOString(),
          selected: false,
          blobUrl,
        };

        await savePhotoMeta(photo);
        photos.push(photo);
      }

      logger.info({ count: photos.length, siteId }, 'Photos uploaded');
      res.json({ success: true, data: photos, count: photos.length });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      logger.error({ err, siteId }, 'Photo upload failed');
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: msg } });
    }
  });

  // ── POST /curate — AI photo curation via Gemini vision ──

  router.post('/curate', async (req: Request, res: Response) => {
    const { photoIds } = req.body as { photoIds?: string[] };

    if (!photoIds?.length) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'photoIds array is required' } });
      return;
    }

    try {
      const ai = await getGeminiClient();

      // Load photo metadata and blob data
      const photosWithData: Array<{ photo: MediaPhoto; base64: string }> = [];

      for (const id of photoIds) {
        const photo = await getPhotoMeta(id);
        if (!photo) continue;

        try {
          const buffer = await getPhotoBlobBuffer(photo.storedName);
          const base64 = buffer.toString('base64');
          photosWithData.push({ photo, base64 });
        } catch {
          logger.warn({ photoId: id }, 'Blob missing for photo, skipping');
        }
      }

      if (photosWithData.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No valid photos found' } });
        return;
      }

      // Build Gemini request with all photos as inline images
      const parts: Array<Record<string, unknown>> = [];

      parts.push({
        text: `You are a professional photo curator for a website. You are reviewing ${photosWithData.length} photos.

For each photo, evaluate:
1. **Technical quality** — focus, exposure, composition, lighting
2. **Energy and emotion** — does it capture the intended vibe?
3. **Visual appeal** — would it look great on a website?
4. **Variety** — does it contribute something unique to the selection?

Select the BEST photos to display. Be selective — aim for quality over quantity.
A strong curated set of 30-50% of photos is ideal.

For each photo, provide:
- A score from 0-100
- Whether it should be selected for display
- A brief reasoning (1-2 sentences)
- 2-4 descriptive tags

Photos are numbered 0 through ${photosWithData.length - 1} in the order shown below.

Return ONLY valid JSON matching this schema:
{
  "selections": [
    {
      "photoIndex": 0,
      "selected": true,
      "score": 85,
      "reasoning": "Great composition with dynamic lighting",
      "tags": ["composition", "lighting", "energy"]
    }
  ],
  "summary": "Selected X of Y photos focusing on..."
}`,
      });

      // Add each photo as an inline image
      for (const { photo, base64 } of photosWithData) {
        parts.push({
          inlineData: {
            mimeType: photo.mimeType,
            data: base64,
          },
        });
      }

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: 'user', parts }],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text ?? '';
      let curation: CurationResponse;

      try {
        curation = JSON.parse(responseText);
      } catch {
        logger.error({ responseSnippet: responseText.slice(0, 500) }, 'Failed to parse Gemini response');
        res.status(502).json({ success: false, error: { code: 'AI_PARSE_ERROR', message: 'AI returned invalid response format' } });
        return;
      }

      // Update photo metadata with AI results
      const updatedPhotos: MediaPhoto[] = [];

      for (const selection of curation.selections) {
        const photoEntry = photosWithData[selection.photoIndex];
        if (!photoEntry) continue;

        const updated = await updatePhotoMeta(photoEntry.photo.id, {
          selected: selection.selected,
          aiScore: selection.score,
          aiReason: selection.reasoning,
          tags: selection.tags,
        });

        if (updated) updatedPhotos.push(updated);
      }

      logger.info({
        totalAnalyzed: photosWithData.length,
        totalSelected: updatedPhotos.filter((p) => p.selected).length,
      }, 'Photo curation complete');

      res.json({
        success: true,
        data: {
          photos: updatedPhotos,
          summary: curation.summary,
          totalAnalyzed: photosWithData.length,
          totalSelected: updatedPhotos.filter((p) => p.selected).length,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Curation failed';
      logger.error({ err }, 'Photo curation failed');
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: msg } });
    }
  });

  // ── GET / — list all photos for site ─────────────

  router.get('/', async (req: Request, res: Response) => {
    const siteId = req.params.siteId as string;
    try {
      const photos = await listPhotos(siteId);
      res.json({ success: true, data: photos });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'List failed';
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: msg } });
    }
  });

  // ── DELETE /cleanup — remove stale records ──

  router.delete('/cleanup', async (req: Request, res: Response) => {
    const siteId = req.params.siteId as string;
    try {
      const deleted = await deleteStalePhotos(siteId);
      logger.info({ deleted, siteId }, 'Stale photos cleaned up');
      res.json({ success: true, deleted });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cleanup failed';
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: msg } });
    }
  });

  // ── PATCH /:id — update photo selection ──────────

  router.patch('/:id', async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { selected } = req.body;

    try {
      const updated = await updatePhotoMeta(id, { selected: Boolean(selected) });
      if (!updated) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Photo not found' } });
        return;
      }
      res.json({ success: true, data: updated });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: msg } });
    }
  });

  // ── DELETE /:id — remove photo ───────────────────

  router.delete('/:id', async (req: Request, res: Response) => {
    const id = req.params.id as string;

    try {
      const photo = await getPhotoMeta(id);
      if (!photo) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Photo not found' } });
        return;
      }

      // Remove from blob storage
      await deletePhotoBlob(photo.storedName);
      // Remove from PostgreSQL
      await deletePhotoMeta(id);

      logger.info({ photoId: id, storedName: photo.storedName }, 'Photo deleted');
      res.json({ success: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: msg } });
    }
  });

  return router;
}
