/**
 * Design Advisor Service — Charlotte AI for design guidance.
 *
 * Reuses the existing Gemini integration. Provides design-specific advice
 * that is context-aware (current page blocks, theme tokens, site branding).
 * Can optionally generate a Stitch screen to illustrate suggestions.
 */

import { StitchService, type StitchScreen } from './stitch.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DesignContext {
  pageId?: string;
  blockId?: string;
  themeTokens?: Record<string, unknown>;
  pageBlocks?: Array<{ blockType: string; content: Record<string, unknown> }>;
  siteName?: string;
}

export interface AdvisorResponse {
  answer: string;
  suggestions?: string[];
  generatedScreenId?: string;
  generatedPreviewUrl?: string;
  generatedCode?: string;
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const DESIGN_SYSTEM_PROMPT = `You are Charlotte, an expert web design advisor embedded in the Sigil CMS.
Your role is to help users improve the visual design, layout, and user experience of their websites.

You have access to the user's current theme tokens (colors, typography, spacing, effects)
and their page's content blocks. Use this context to give specific, actionable advice.

Guidelines:
- Be specific: reference exact color values, font sizes, or block types
- Suggest concrete improvements: "Change your primary color from #3b82f6 to #2563eb for better contrast"
- Consider accessibility: mention WCAG contrast ratios when relevant
- Suggest layout changes by referencing Sigil block types (hero, feature_grid, cta, etc.)
- When a visual example would help, indicate you can generate a preview
- Keep responses concise and scannable — use bullet points for multiple suggestions
- If asked about brand identity, suggest cohesive color palettes and typography pairings

Available Sigil block types: hero, text, rich_text, image, gallery, video, cta, feature_grid,
pricing_table, testimonial, faq, contact_form, stats_bar, timeline, newsletter, bento_grid, custom.

When a user asks you to generate or show something visual, set generatePreview to true
in your response so the system creates a Stitch preview automatically.`;

// ---------------------------------------------------------------------------
// DesignAdvisorService
// ---------------------------------------------------------------------------

export class DesignAdvisorService {
  private stitch: StitchService;
  private geminiApiKey: string | undefined;
  private geminiModel: string;

  constructor(opts?: { stitch?: StitchService; geminiApiKey?: string; geminiModel?: string }) {
    this.stitch = opts?.stitch ?? new StitchService();
    this.geminiApiKey = opts?.geminiApiKey ?? process.env.GEMINI_API_KEY;
    this.geminiModel = opts?.geminiModel ?? process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
  }

  async advise(question: string, context?: DesignContext): Promise<AdvisorResponse> {
    const contextDescription = this.buildContextDescription(context);
    const userMessage = contextDescription
      ? `Context:\n${contextDescription}\n\nQuestion: ${question}`
      : question;

    // Call Gemini
    const geminiResponse = await this.callGemini(userMessage);

    // Detect if we should generate a preview
    const shouldGenerate =
      geminiResponse.generatePreview ||
      /\b(generate|show|create|design|build|make)\b.*\b(preview|screen|page|layout|example|mockup)\b/i.test(question);

    let screen: StitchScreen | undefined;
    if (shouldGenerate) {
      try {
        const prompt = this.buildStitchPrompt(question, context);
        screen = await this.stitch.generateScreen(prompt);
      } catch {
        // Stitch generation is optional — don't fail the whole response
      }
    }

    return {
      answer: geminiResponse.text,
      suggestions: geminiResponse.suggestions,
      generatedScreenId: screen?.screenId,
      generatedPreviewUrl: screen?.previewUrl,
      generatedCode: screen?.code,
    };
  }

  // ── Internals ──────────────────────────────────────────────────────────

  private buildContextDescription(context?: DesignContext): string {
    if (!context) return '';

    const parts: string[] = [];

    if (context.siteName) {
      parts.push(`Site: ${context.siteName}`);
    }

    if (context.themeTokens) {
      const colors = context.themeTokens.colors as Record<string, string> | undefined;
      const typo = context.themeTokens.typography as Record<string, string> | undefined;
      if (colors) {
        const colorSummary = Object.entries(colors)
          .slice(0, 10)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        parts.push(`Theme colors: ${colorSummary}`);
      }
      if (typo) {
        const typoSummary = Object.entries(typo)
          .slice(0, 6)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        parts.push(`Typography: ${typoSummary}`);
      }
    }

    if (context.pageBlocks && context.pageBlocks.length > 0) {
      const blockSummary = context.pageBlocks
        .map((b, i) => `${i + 1}. ${b.blockType}`)
        .join(', ');
      parts.push(`Page blocks: ${blockSummary}`);
    }

    return parts.join('\n');
  }

  private buildStitchPrompt(question: string, context?: DesignContext): string {
    const parts = [question];
    if (context?.themeTokens) {
      const colors = context.themeTokens.colors as Record<string, string> | undefined;
      if (colors?.primary) parts.push(`Use primary color ${colors.primary}`);
      if (colors?.background) parts.push(`Background color ${colors.background}`);
    }
    if (context?.siteName) {
      parts.push(`For a site called "${context.siteName}"`);
    }
    return parts.join('. ');
  }

  private async callGemini(
    message: string
  ): Promise<{ text: string; suggestions?: string[]; generatePreview?: boolean }> {
    if (!this.geminiApiKey) {
      // Fallback when Gemini is not configured
      return {
        text: 'Design advisor is not configured. Set GEMINI_API_KEY to enable AI-powered design advice. In the meantime, you can use the "Generate" button to create designs from text prompts via Stitch.',
        suggestions: [
          'Generate a modern landing page',
          'Create a dark-themed portfolio',
          'Design a product showcase section',
        ],
      };
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`;

      const body = {
        system_instruction: { parts: [{ text: DESIGN_SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: message }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              text: { type: 'string', description: 'The design advice response' },
              suggestions: {
                type: 'array',
                items: { type: 'string' },
                description: 'Follow-up suggestions the user can try',
              },
              generatePreview: {
                type: 'boolean',
                description: 'Whether a visual preview should be generated to illustrate the advice',
              },
            },
            required: ['text'],
          },
        },
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        console.error('[design-advisor] Gemini error:', res.status, errorBody);
        return { text: 'I had trouble processing your request. Please try again.' };
      }

      const data = await res.json();
      const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!candidate) {
        return { text: 'No response from the design advisor. Please try a more specific question.' };
      }

      try {
        const parsed = JSON.parse(candidate);
        return {
          text: parsed.text || candidate,
          suggestions: parsed.suggestions,
          generatePreview: parsed.generatePreview,
        };
      } catch {
        // Gemini returned plain text instead of JSON
        return { text: candidate };
      }
    } catch (err) {
      console.error('[design-advisor] Error calling Gemini:', err);
      return { text: 'Design advisor encountered an error. Please try again.' };
    }
  }
}
