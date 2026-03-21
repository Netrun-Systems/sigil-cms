/**
 * Next.js metadata generation from Sigil CMS pages.
 *
 * These functions return objects compatible with Next.js App Router's
 * generateMetadata() and generateStaticParams() conventions.
 */

import { getSigilClient } from './client.js';
import type { SigilMetadataOptions, SigilStaticParamsOptions } from './types.js';

/**
 * Next.js Metadata type (simplified — we return a plain object
 * that satisfies Next.js's Metadata interface without importing it,
 * keeping next as a peer dependency only).
 */
interface NextMetadata {
  title?: string;
  description?: string;
  openGraph?: {
    title?: string;
    description?: string;
    images?: Array<{ url: string; width?: number; height?: number; alt?: string }>;
    type?: string;
  };
  alternates?: {
    canonical?: string;
  };
  robots?: {
    index?: boolean;
    follow?: boolean;
  };
}

/**
 * Generate Next.js metadata from a Sigil CMS page.
 *
 * @example
 * ```ts
 * // app/[...slug]/page.tsx
 * import { generateSigilMetadata } from '@sigil-cms/next';
 *
 * export async function generateMetadata({ params }) {
 *   const slug = params.slug?.join('/') ?? 'home';
 *   return generateSigilMetadata(slug);
 * }
 * ```
 */
export async function generateSigilMetadata(
  slug: string,
  options?: SigilMetadataOptions,
): Promise<NextMetadata> {
  const client = getSigilClient();

  try {
    const page = await client.pages.getBySlug(slug);

    const title = page.metaTitle ?? page.title;
    const description = page.metaDescription ?? options?.defaultDescription;

    const formattedTitle = options?.titleTemplate
      ? options.titleTemplate.replace('%s', title)
      : title;

    const metadata: NextMetadata = {
      title: formattedTitle,
      description: description ?? undefined,
    };

    // OpenGraph
    const ogImages: Array<{ url: string; width?: number; height?: number; alt?: string }> = [];
    if (page.ogImageUrl) {
      ogImages.push({ url: page.ogImageUrl });
    }

    metadata.openGraph = {
      title: formattedTitle,
      description: description ?? undefined,
      images: ogImages.length > 0 ? ogImages : undefined,
      type: 'website',
    };

    return metadata;
  } catch {
    // Page not found — return fallback metadata
    return {
      title: options?.defaultTitle ?? 'Page Not Found',
      description: options?.defaultDescription,
    };
  }
}

/**
 * Generate static params for all published Sigil pages.
 * Use this in your catch-all route's generateStaticParams() for ISG/SSG.
 *
 * @example
 * ```ts
 * // app/[...slug]/page.tsx
 * import { generateSigilStaticParams } from '@sigil-cms/next';
 *
 * export async function generateStaticParams() {
 *   return generateSigilStaticParams();
 * }
 * ```
 *
 * @returns Array of `{ slug: string[] }` objects for Next.js catch-all routes
 */
export async function generateSigilStaticParams(
  options?: SigilStaticParamsOptions,
): Promise<Array<{ slug: string[] }>> {
  const client = options?.client ?? getSigilClient();

  try {
    const pages = await client.pages.listPublished();

    let filtered = pages;
    if (options?.templates) {
      filtered = pages.filter((p) => options.templates!.includes(p.template));
    }

    return filtered.map((page) => {
      const path = page.fullPath ?? `/${page.slug}`;
      const segments = path.split('/').filter(Boolean);
      return { slug: segments };
    });
  } catch {
    // If the CMS is unreachable during build, return empty params
    // so the build doesn't fail. Pages will be generated on-demand via ISR.
    return [];
  }
}
