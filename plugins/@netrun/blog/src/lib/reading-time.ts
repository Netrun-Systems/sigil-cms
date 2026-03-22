/**
 * Estimate reading time from markdown content.
 * Average reading speed: ~200 words per minute.
 */
export function estimateReadingTime(content: string): number {
  const text = content
    .replace(/```[\s\S]*?```/g, '')   // strip code blocks
    .replace(/!\[.*?\]\(.*?\)/g, '')   // strip images
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')  // links -> text
    .replace(/[#*_~`>|]/g, '')         // strip markdown chars
    .trim();

  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  return Math.max(1, Math.ceil(words / 200));
}
