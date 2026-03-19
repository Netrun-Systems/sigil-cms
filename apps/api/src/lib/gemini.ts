/**
 * Gemini AI client — lazy-initialized with API key from env.
 *
 * Uses dynamic import() to prevent cold start crashes on App Service
 * (same pattern as @azure/storage-blob in photos.ts).
 * Backported from frost pattern.
 */

let client: unknown = null;

export async function getGeminiClient() {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set. Add it to your environment or Azure Key Vault.');
    }
    const { GoogleGenAI } = await import('@google/genai');
    client = new GoogleGenAI({ apiKey });
  }
  return client as import('@google/genai').GoogleGenAI;
}

export const GEMINI_MODEL = 'gemini-2.5-flash';

export const ADVISOR_SYSTEM_PROMPT = `You are a knowledgeable creative and business advisor for content creators and site administrators.
Your role is to provide honest, constructive criticism and actionable advice.
When context from the knowledge base is provided, ground your advice in that specific content — reference sections, quote phrases, and point out strengths and weaknesses. If no context is provided, give general industry advice.
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
