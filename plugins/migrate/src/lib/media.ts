/**
 * Media download and re-upload helper
 *
 * Downloads media from source URLs and prepares them for the CMS media library.
 * Handles URL rewriting in migrated content.
 */

import { basename, extname } from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MediaDownload {
  sourceUrl: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
}

// ---------------------------------------------------------------------------
// Media download
// ---------------------------------------------------------------------------

/**
 * Download a single media file from a URL.
 * Returns null if the download fails (non-blocking for migration).
 */
export async function downloadMedia(url: string): Promise<MediaDownload | null> {
  try {
    // Normalize URL
    let resolvedUrl = url;
    if (resolvedUrl.startsWith('//')) {
      resolvedUrl = `https:${resolvedUrl}`;
    }

    const response = await fetch(resolvedUrl, {
      headers: {
        'User-Agent': 'NetrunCMS-Migrator/1.0 (+https://netrun.net)',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const mimeType = contentType.split(';')[0].trim();

    // Only download actual media files
    if (!isMediaMimeType(mimeType)) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Reject files that are too small (likely error pages) or too large
    if (buffer.length < 100) return null;
    if (buffer.length > 100 * 1024 * 1024) return null; // 100MB max

    // Derive filename from URL
    let filename = deriveFilename(resolvedUrl, mimeType);

    return {
      sourceUrl: url,
      filename,
      mimeType,
      buffer,
    };
  } catch {
    return null;
  }
}

/**
 * Rewrite content HTML to replace old image URLs with new CMS media URLs.
 *
 * Handles:
 * - <img src="..."> attributes
 * - <source src="..."> attributes
 * - <a href="..."> when linking to media files
 * - CSS background-image: url(...) inline styles
 * - srcset attributes
 */
export function rewriteMediaUrls(
  content: string,
  urlMap: Map<string, string>,
): string {
  if (!content || urlMap.size === 0) return content;

  let result = content;

  for (const [oldUrl, newUrl] of urlMap) {
    // Escape special regex characters in the URL
    const escaped = oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Replace in src="..." and href="..." attributes
    result = result.replace(
      new RegExp(`((?:src|href|poster|data-src|data-lazy-src)=["'])${escaped}(["'])`, 'gi'),
      `$1${newUrl}$2`,
    );

    // Replace in srcset="..." (URLs are space-separated with descriptors)
    result = result.replace(
      new RegExp(`(srcset=["'][^"']*?)${escaped}`, 'gi'),
      `$1${newUrl}`,
    );

    // Replace in url(...) CSS
    result = result.replace(
      new RegExp(`(url\\(["']?)${escaped}(["']?\\))`, 'gi'),
      `$1${newUrl}$2`,
    );

    // Replace plain URL references in JSON-like content
    result = result.replace(
      new RegExp(`"${escaped}"`, 'g'),
      `"${newUrl}"`,
    );
  }

  return result;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check if a MIME type is a downloadable media file.
 */
function isMediaMimeType(mimeType: string): boolean {
  return (
    mimeType.startsWith('image/') ||
    mimeType.startsWith('video/') ||
    mimeType.startsWith('audio/') ||
    mimeType === 'application/pdf' ||
    mimeType === 'application/zip' ||
    mimeType.startsWith('font/')
  );
}

/**
 * Derive a clean filename from a URL and MIME type.
 */
function deriveFilename(url: string, mimeType: string): string {
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/');
    let name = pathSegments[pathSegments.length - 1] || 'media';

    // Remove query parameters from filename
    name = name.split('?')[0].split('#')[0];

    // URL decode
    name = decodeURIComponent(name);

    // If no extension, add one based on MIME type
    const ext = extname(name);
    if (!ext) {
      const mimeToExt: Record<string, string> = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'image/svg+xml': '.svg',
        'image/avif': '.avif',
        'video/mp4': '.mp4',
        'video/webm': '.webm',
        'audio/mpeg': '.mp3',
        'audio/wav': '.wav',
        'application/pdf': '.pdf',
      };
      name += mimeToExt[mimeType] || '';
    }

    // Sanitize filename
    name = name.replace(/[^a-zA-Z0-9._-]/g, '_');

    return name;
  } catch {
    return `media_${Date.now()}`;
  }
}
