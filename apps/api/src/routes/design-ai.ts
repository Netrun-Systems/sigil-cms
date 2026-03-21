/**
 * Design AI Routes
 *
 * API-first endpoints for AI-powered design generation (Stitch)
 * and design advice (Charlotte). Every UI action has a corresponding
 * REST endpoint so AI agents can use them programmatically.
 */

import { Router } from 'express';
import type { Router as RouterType, Response } from 'express';
import { authenticate, requireRole, tenantContext, validateUuidParam } from '../middleware/index.js';
import { StitchService } from '../services/stitch.js';
import { DesignAdvisorService } from '../services/design-advisor.js';
import { convertStitchToBlocks } from '../services/stitch-converter.js';
import type { AuthenticatedRequest, ApiResponse } from '../types/index.js';

const router: RouterType = Router({ mergeParams: true });

// All routes require authentication and tenant context
router.use(authenticate);
router.use(tenantContext);

// Shared service instances (lazy-initialized per request context if needed)
const stitch = new StitchService();
const advisor = new DesignAdvisorService({ stitch });

// ---------------------------------------------------------------------------
// POST /api/v1/sites/:siteId/design/generate
// Generate a new design from a text prompt via Stitch
// ---------------------------------------------------------------------------

router.post(
  '/generate',
  requireRole('admin', 'editor'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { prompt, deviceType, pageId } = req.body as {
      prompt?: string;
      deviceType?: 'DESKTOP' | 'MOBILE' | 'TABLET';
      pageId?: string;
    };

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'prompt is required' },
      };
      res.status(400).json(response);
      return;
    }

    try {
      const screen = await stitch.generateScreen(prompt.trim(), deviceType ?? 'DESKTOP');

      const response: ApiResponse<{
        screenId: string;
        previewUrl: string;
        code: string;
        suggestions: string[];
        mock: boolean;
      }> = {
        success: true,
        data: {
          screenId: screen.screenId,
          previewUrl: screen.previewUrl,
          code: screen.code,
          suggestions: [
            'Try editing: "Make the hero section more minimal"',
            'Generate variants to explore alternatives',
            'Import to page when you are happy with the design',
          ],
          mock: !stitch.isConfigured,
        },
      };
      res.json(response);
    } catch (err) {
      console.error('[design-ai] generate error:', err);
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'GENERATION_FAILED', message: 'Failed to generate design' },
      };
      res.status(500).json(response);
    }
  }
);

// ---------------------------------------------------------------------------
// POST /api/v1/sites/:siteId/design/edit
// Edit an existing Stitch screen with a follow-up prompt
// ---------------------------------------------------------------------------

router.post(
  '/edit',
  requireRole('admin', 'editor'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { screenId, prompt } = req.body as { screenId?: string; prompt?: string };

    if (!screenId || !prompt) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'screenId and prompt are required' },
      };
      res.status(400).json(response);
      return;
    }

    try {
      const screen = await stitch.editScreen(screenId, prompt.trim());
      const response: ApiResponse<{ screenId: string; previewUrl: string; code: string }> = {
        success: true,
        data: {
          screenId: screen.screenId,
          previewUrl: screen.previewUrl,
          code: screen.code,
        },
      };
      res.json(response);
    } catch (err) {
      console.error('[design-ai] edit error:', err);
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'EDIT_FAILED', message: 'Failed to edit design' },
      };
      res.status(500).json(response);
    }
  }
);

// ---------------------------------------------------------------------------
// POST /api/v1/sites/:siteId/design/variants
// Generate design variants from an existing screen
// ---------------------------------------------------------------------------

router.post(
  '/variants',
  requireRole('admin', 'editor'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { screenId, count } = req.body as { screenId?: string; count?: number };

    if (!screenId) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'screenId is required' },
      };
      res.status(400).json(response);
      return;
    }

    try {
      const variants = await stitch.generateVariants(screenId, count ?? 3);
      const response: ApiResponse<{
        variants: Array<{ screenId: string; previewUrl: string; code: string }>;
      }> = {
        success: true,
        data: {
          variants: variants.map((v) => ({
            screenId: v.screenId,
            previewUrl: v.previewUrl,
            code: v.code,
          })),
        },
      };
      res.json(response);
    } catch (err) {
      console.error('[design-ai] variants error:', err);
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'VARIANTS_FAILED', message: 'Failed to generate variants' },
      };
      res.status(500).json(response);
    }
  }
);

// ---------------------------------------------------------------------------
// POST /api/v1/sites/:siteId/design/import
// Convert a Stitch screen to Sigil blocks and add to a page
// ---------------------------------------------------------------------------

router.post(
  '/import',
  requireRole('admin', 'editor'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { screenId, pageId } = req.body as { screenId?: string; pageId?: string };

    if (!screenId || !pageId) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'screenId and pageId are required' },
      };
      res.status(400).json(response);
      return;
    }

    try {
      // Fetch the screen code
      const code = await stitch.getScreenCode(screenId);
      if (!code) {
        const response: ApiResponse<null> = {
          success: false,
          error: { code: 'EMPTY_SCREEN', message: 'Screen has no code to import' },
        };
        res.status(400).json(response);
        return;
      }

      // Convert to Sigil blocks
      const blocks = convertStitchToBlocks(code);

      const response: ApiResponse<{
        blocks: Array<{ blockType: string; content: Record<string, unknown>; sortOrder: number }>;
        pageId: string;
        totalBlocks: number;
      }> = {
        success: true,
        data: {
          blocks,
          pageId,
          totalBlocks: blocks.length,
        },
      };
      res.json(response);
    } catch (err) {
      console.error('[design-ai] import error:', err);
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'IMPORT_FAILED', message: 'Failed to import design as blocks' },
      };
      res.status(500).json(response);
    }
  }
);

// ---------------------------------------------------------------------------
// POST /api/v1/sites/:siteId/design/advisor
// Charlotte AI design advisor — context-aware advice with optional generation
// ---------------------------------------------------------------------------

router.post(
  '/advisor',
  requireRole('admin', 'editor', 'author'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { question, context } = req.body as {
      question?: string;
      context?: {
        pageId?: string;
        blockId?: string;
        themeTokens?: Record<string, unknown>;
        pageBlocks?: Array<{ blockType: string; content: Record<string, unknown> }>;
        siteName?: string;
      };
    };

    if (!question || typeof question !== 'string' || !question.trim()) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'question is required' },
      };
      res.status(400).json(response);
      return;
    }

    try {
      const result = await advisor.advise(question.trim(), context);

      const response: ApiResponse<{
        answer: string;
        suggestions?: string[];
        generatedScreenId?: string;
        generatedPreviewUrl?: string;
        generatedCode?: string;
      }> = {
        success: true,
        data: {
          answer: result.answer,
          suggestions: result.suggestions,
          generatedScreenId: result.generatedScreenId,
          generatedPreviewUrl: result.generatedPreviewUrl,
          generatedCode: result.generatedCode,
        },
      };
      res.json(response);
    } catch (err) {
      console.error('[design-ai] advisor error:', err);
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'ADVISOR_FAILED', message: 'Design advisor encountered an error' },
      };
      res.status(500).json(response);
    }
  }
);

export default router;
