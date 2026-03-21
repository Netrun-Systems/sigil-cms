/**
 * Design AI API client — Stitch generation + Charlotte advisor.
 */

import { api } from './api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DeviceType = 'DESKTOP' | 'MOBILE' | 'TABLET';

export interface GenerateResult {
  screenId: string;
  previewUrl: string;
  code: string;
  suggestions: string[];
  mock: boolean;
}

export interface EditResult {
  screenId: string;
  previewUrl: string;
  code: string;
}

export interface VariantResult {
  variants: Array<{ screenId: string; previewUrl: string; code: string }>;
}

export interface ImportResult {
  blocks: Array<{ blockType: string; content: Record<string, unknown>; sortOrder: number }>;
  pageId: string;
  totalBlocks: number;
}

export interface AdvisorContext {
  pageId?: string;
  blockId?: string;
  themeTokens?: Record<string, unknown>;
  pageBlocks?: Array<{ blockType: string; content: Record<string, unknown> }>;
  siteName?: string;
}

export interface AdvisorResult {
  answer: string;
  suggestions?: string[];
  generatedScreenId?: string;
  generatedPreviewUrl?: string;
  generatedCode?: string;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

const basePath = (siteId: string) => `/sites/${siteId}/design`;

export const designAi = {
  /** Generate a new design from a text prompt. */
  generate(siteId: string, prompt: string, deviceType: DeviceType = 'DESKTOP', pageId?: string) {
    return api.post<{ data: GenerateResult }>(
      `${basePath(siteId)}/generate`,
      { prompt, deviceType, pageId }
    );
  },

  /** Edit an existing Stitch screen with a follow-up prompt. */
  edit(siteId: string, screenId: string, prompt: string) {
    return api.post<{ data: EditResult }>(
      `${basePath(siteId)}/edit`,
      { screenId, prompt }
    );
  },

  /** Generate design variants from an existing screen. */
  variants(siteId: string, screenId: string, count = 3) {
    return api.post<{ data: VariantResult }>(
      `${basePath(siteId)}/variants`,
      { screenId, count }
    );
  },

  /** Import a Stitch screen as Sigil content blocks. */
  importToPage(siteId: string, screenId: string, pageId: string) {
    return api.post<{ data: ImportResult }>(
      `${basePath(siteId)}/import`,
      { screenId, pageId }
    );
  },

  /** Ask Charlotte for design advice. */
  advisor(siteId: string, question: string, context?: AdvisorContext) {
    return api.post<{ data: AdvisorResult }>(
      `${basePath(siteId)}/advisor`,
      { question, context }
    );
  },
};
