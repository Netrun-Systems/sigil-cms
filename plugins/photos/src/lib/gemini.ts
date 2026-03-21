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
