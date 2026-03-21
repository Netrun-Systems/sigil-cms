import { getSigilClient } from '../client.js';
import { SigilBlockList } from './sigil-block.js';
import type { SigilPageProps } from '../types.js';

/**
 * Async server component that fetches and renders a Sigil CMS page.
 *
 * Fetches the page by slug, then renders all its content blocks
 * using the block component registry.
 *
 * @example
 * ```tsx
 * // app/[...slug]/page.tsx
 * import { SigilPage } from '@sigil-cms/next';
 *
 * export default async function Page({ params }: { params: { slug: string[] } }) {
 *   const slug = params.slug?.join('/') ?? 'home';
 *   return <SigilPage slug={slug} />;
 * }
 * ```
 */
export async function SigilPage({
  slug,
  lang,
  components,
  className,
  notFound,
}: SigilPageProps) {
  const client = getSigilClient();

  let page;
  try {
    page = await client.pages.getBySlug(slug, { lang });
  } catch {
    if (notFound) {
      return <>{notFound}</>;
    }
    return null;
  }

  // Sort blocks by sortOrder
  const blocks = [...page.blocks].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <article
      className={`sigil-page ${className ?? ''}`}
      data-page-id={page.id}
      data-page-slug={page.slug}
      data-page-template={page.template}
    >
      <SigilBlockList blocks={blocks} components={components} />
    </article>
  );
}
