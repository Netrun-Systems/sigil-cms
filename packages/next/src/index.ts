/**
 * @sigil-cms/next
 *
 * Next.js App Router integration for Sigil CMS.
 * Server components, metadata generation, static params, and block rendering.
 *
 * @example
 * ```tsx
 * // app/[...slug]/page.tsx
 * import { SigilPage, generateSigilMetadata, generateSigilStaticParams } from '@sigil-cms/next';
 *
 * export async function generateMetadata({ params }) {
 *   return generateSigilMetadata(params.slug?.join('/') ?? 'home');
 * }
 *
 * export async function generateStaticParams() {
 *   return generateSigilStaticParams();
 * }
 *
 * export default async function Page({ params }) {
 *   return <SigilPage slug={params.slug?.join('/') ?? 'home'} />;
 * }
 * ```
 *
 * @packageDocumentation
 */

// Client factory
export { createSigilClient, getSigilClient } from './client.js';
export type { SigilNextConfig } from './client.js';

// Components
export { SigilPage } from './components/sigil-page.js';
export { SigilBlock, SigilBlockList } from './components/sigil-block.js';
export { SigilImage } from './components/sigil-image.js';

// Metadata / static generation
export { generateSigilMetadata, generateSigilStaticParams } from './metadata.js';

// Block registry
export { defaultBlockComponents } from './blocks/index.js';

// Types
export type {
  BlockComponentProps,
  BlockComponentMap,
  SigilPageProps,
  SigilBlockProps,
  SigilImageProps,
  SigilMetadataOptions,
  SigilStaticParamsOptions,
} from './types.js';

// Re-export commonly needed client types for convenience
export type {
  ContentBlock,
  BlockType,
  PageWithBlocks,
  Page,
  MediaItem,
  BlockSettings,
} from '@sigil-cms/client';
