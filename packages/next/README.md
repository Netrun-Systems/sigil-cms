# @sigil-cms/next

Next.js App Router integration for [Sigil CMS](https://github.com/Netrun-Systems/netrun-cms). Server components, metadata generation, static params, and a pluggable block rendering system.

## Quick Start

### 1. Install

```bash
npm install @sigil-cms/next @sigil-cms/client
# or
pnpm add @sigil-cms/next @sigil-cms/client
```

### 2. Configure environment variables

```env
SIGIL_URL=https://cms.example.com
SIGIL_SITE_SLUG=my-site
```

### 3. Create a catch-all route

```tsx
// app/[[...slug]]/page.tsx
import { SigilPage, generateSigilMetadata, generateSigilStaticParams } from '@sigil-cms/next';

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  return generateSigilMetadata(slug?.join('/') ?? 'home');
}

export async function generateStaticParams() {
  return generateSigilStaticParams();
}

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  return <SigilPage slug={slug?.join('/') ?? 'home'} />;
}
```

That's it. Every page published in Sigil is now rendered at its slug.

## Block Customization

Default block components render clean, unstyled HTML with `sigil-block--*` CSS classes. Override any block type with your own component:

```tsx
import { SigilPage } from '@sigil-cms/next';
import type { BlockComponentProps } from '@sigil-cms/next';

function MyHero({ block, content }: BlockComponentProps) {
  return (
    <div className="my-hero bg-gradient-to-r from-blue-600 to-purple-600 text-white p-16">
      <h1 className="text-5xl font-bold">{content.heading as string}</h1>
      <p className="text-xl mt-4">{content.subheading as string}</p>
    </div>
  );
}

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  return (
    <SigilPage
      slug={slug?.join('/') ?? 'home'}
      components={{ hero: MyHero }}
    />
  );
}
```

### Available default block types

| Block Type      | Component         | Description                       |
|-----------------|-------------------|-----------------------------------|
| `hero`          | `HeroBlock`       | Heading, subheading, CTA, bg image |
| `text`          | `TextBlock`       | Plain or rich text content        |
| `rich_text`     | `TextBlock`       | Same renderer as text             |
| `image`         | `ImageBlock`      | Image with caption                |
| `gallery`       | `GalleryBlock`    | Image grid (client component)     |
| `cta`           | `CTABlock`        | Call-to-action with buttons       |
| `video`         | `VideoBlock`      | Video/embed player (client component) |
| `code_block`    | `CodeBlock`       | Code snippet with language hint   |
| `feature_grid`  | `FeatureGridBlock`| Feature cards in a grid           |

Import individual blocks from `@sigil-cms/next/blocks` if you want to compose them:

```tsx
import { HeroBlock, defaultBlockComponents } from '@sigil-cms/next/blocks';
```

## SigilImage

Optimized image rendering using `next/image` with Sigil media items:

```tsx
import { SigilImage, createSigilClient } from '@sigil-cms/next';
import type { MediaItem } from '@sigil-cms/next';

const sigil = createSigilClient();
const page = await sigil.pages.getBySlug('about');
const heroImage = page.blocks[0].content.image as MediaItem;

<SigilImage media={heroImage} width={1200} height={630} priority />
```

## Static Generation & ISR

### Full static generation

```tsx
// app/[[...slug]]/page.tsx
export async function generateStaticParams() {
  return generateSigilStaticParams();
}
```

### Filter by template

```tsx
export async function generateStaticParams() {
  return generateSigilStaticParams({ templates: ['blog', 'landing'] });
}
```

### ISR (Incremental Static Regeneration)

Add `revalidate` to your route segment config:

```tsx
// app/[[...slug]]/page.tsx
export const revalidate = 60; // Revalidate every 60 seconds
```

### On-demand revalidation

Set up a webhook from Sigil CMS to trigger revalidation:

```tsx
// app/api/revalidate/route.ts
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { slug, secret } = await request.json();

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  revalidatePath(`/${slug}`);
  return NextResponse.json({ revalidated: true });
}
```

## Client Factory

The `createSigilClient()` function reads from environment variables automatically. For advanced use cases:

```tsx
import { createSigilClient } from '@sigil-cms/next';

// Auto-configured from env
const sigil = createSigilClient();

// Explicit configuration
const sigil = createSigilClient({
  url: 'https://cms.example.com',
  siteSlug: 'my-site',
  apiKey: process.env.SIGIL_API_KEY,
});

// Use the shared singleton
import { getSigilClient } from '@sigil-cms/next';
const page = await getSigilClient().pages.getBySlug('about');
```

### Environment variables

| Variable          | Required | Description                                |
|-------------------|----------|--------------------------------------------|
| `SIGIL_URL`       | Yes      | Base URL of your Sigil CMS instance        |
| `SIGIL_SITE_SLUG` | Yes*     | Site slug for public content fetching      |
| `SIGIL_SITE_ID`   | No*      | Site UUID for authenticated admin operations |
| `SIGIL_API_KEY`   | No       | API key/JWT for admin operations           |

*At least one of `SIGIL_SITE_SLUG` or `SIGIL_SITE_ID` is required.

## CSS Classes Reference

All components use BEM-style classes prefixed with `sigil-`:

```
sigil-page                    — Page wrapper
sigil-block                   — Every block
sigil-block--hero             — Block type modifier
sigil-hero__heading           — Block element
sigil-hero__subheading
sigil-hero__cta
sigil-text__heading
sigil-text__body
sigil-prose                   — Rich text container
sigil-image__img
sigil-image__caption
sigil-gallery__grid
sigil-gallery__item
sigil-cta__heading
sigil-cta__actions
sigil-cta__button--primary
sigil-cta__button--secondary
sigil-video__embed
sigil-video__iframe
sigil-video__player
sigil-code__filename
sigil-code__pre
sigil-code__code
sigil-feature-grid__grid
sigil-feature-grid__item
sigil-feature-grid__icon
sigil-feature-grid__title
sigil-feature-grid__description
```

Data attributes on every block: `data-block-id`, `data-block-type`.

## Requirements

- Next.js 14+ (App Router)
- React 18+
- `@sigil-cms/client` (peer dependency)

## License

MIT
