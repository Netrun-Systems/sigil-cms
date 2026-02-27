/**
 * Gemini AI client — lazy-initialized with API key from env.
 *
 * In production, set GEMINI_API_KEY via Azure Key Vault / env injection.
 * Locally, set it in .env or export it in your shell.
 */

import { GoogleGenAI } from '@google/genai';

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set. Add it to your environment or Azure Key Vault.');
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export const GEMINI_MODEL = 'gemini-2.5-flash';

export const ADVISOR_SYSTEM_PROMPT = `You are a knowledgeable creative and business advisor for content creators and site administrators.
Your role is to provide honest, constructive criticism and actionable advice.
When documents are provided, ground your advice in their specific content — reference sections, quote phrases, and point out strengths and weaknesses.
Be direct but respectful. Prioritize practical, actionable feedback.

Areas of expertise: content strategy, marketing, branding, copywriting, business planning,
SEO, social media, event promotion, press strategy, and industry trends.

Formatting guidelines:
- Use markdown for structure (headers, lists, bold for emphasis)
- Keep responses focused and scannable
- When critiquing documents, use a clear structure: Strengths → Weaknesses → Recommendations`;

export interface DocumentInfo {
  name: string;
  displayName: string;
  mimeType: string;
  uri: string;
  state: string;
  sizeBytes?: string;
}
