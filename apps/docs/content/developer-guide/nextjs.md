---
title: Next.js Integration
description: "@sigil-cms/next -- server components, metadata, static generation, block rendering."
order: 3
---

## Installation

```bash
pnpm add @sigil-cms/next @sigil-cms/client
```

## Environment Variables

```env
SIGIL_URL=https://cms.example.com
SIGIL_SITE_SLUG=my-site
```

| Variable | Required | Description |
|----------|----------|-------------|
| `SIGIL_URL` | Yes | Base URL of your Sigil instance |
| `SIGIL_SITE_SLUG` | Yes* | Site slug for public content |
| `SIGIL_SITE_ID` | No* | Site UUID for admin operations |
| `SIGIL_API_KEY` | No | JWT for admin operations |

*At least one of `SIGIL_SITE_SLUG` or `SIGIL_SITE_ID` is required.

## Quick Start

Create a catch-all route to render every CMS page:

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

That's it. Every published page in Sigil is now rendered at its slug.

## Custom Block Components

Default blocks render clean HTML with `sigil-block--*` CSS classes. Override any type:

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

export default async function Page({ params }) {
  const { slug } = await params;
  return <SigilPage slug={slug?.join('/') ?? 'home'} components={{ hero: MyHero }} />;
}
```

## Default Block Types

| Block Type | Component | Description |
|------------|-----------|-------------|
| `hero` | `HeroBlock` | Heading, subheading, CTA, background image |
| `text` | `TextBlock` | Plain or rich text content |
| `rich_text` | `TextBlock` | Same renderer as text |
| `image` | `ImageBlock` | Image with caption |
| `gallery` | `GalleryBlock` | Image grid (client component) |
| `cta` | `CTABlock` | Call-to-action with buttons |
| `video` | `VideoBlock` | Video/embed player (client component) |
| `code_block` | `CodeBlock` | Code snippet with language hint |
| `feature_grid` | `FeatureGridBlock` | Feature cards in a grid |

Import individual blocks:

```tsx
import { HeroBlock, defaultBlockComponents } from '@sigil-cms/next/blocks';
```

## SigilImage

Optimized image rendering using `next/image`:

```tsx
import { SigilImage, createSigilClient } from '@sigil-cms/next';
import type { MediaItem } from '@sigil-cms/next';

const sigil = createSigilClient();
const page = await sigil.pages.getBySlug('about');
const heroImage = page.blocks[0].content.image as MediaItem;

<SigilImage media={heroImage} width={1200} height={630} priority />
```

## Static Generation

### Full SSG

```tsx
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

```tsx
export const revalidate = 60; // Revalidate every 60 seconds
```

### On-demand revalidation

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

```tsx
import { createSigilClient, getSigilClient } from '@sigil-cms/next';

// Auto-configured from env
const sigil = createSigilClient();

// Explicit configuration
const sigil = createSigilClient({
  url: 'https://cms.example.com',
  siteSlug: 'my-site',
  apiKey: process.env.SIGIL_API_KEY,
});

// Shared singleton
const page = await getSigilClient().pages.getBySlug('about');
```

## CSS Classes

All components use BEM-style classes prefixed with `sigil-`:

```
sigil-page                    -- Page wrapper
sigil-block                   -- Every block
sigil-block--hero             -- Block type modifier
sigil-hero__heading           -- Block element
sigil-text__body
sigil-image__img, __caption
sigil-gallery__grid, __item
sigil-cta__heading, __actions, __button--primary
sigil-video__embed, __iframe
sigil-code__filename, __pre, __code
sigil-feature-grid__grid, __item, __icon, __title
```

Data attributes on every block: `data-block-id`, `data-block-type`.

## Requirements

- Next.js 14+ (App Router)
- React 18+
- `@sigil-cms/client` (peer dependency)
