/**
 * Block Types Route
 *
 * Returns the catalog of available content block types with metadata.
 * Used by the admin panel and editors to discover supported blocks.
 *
 * GET /api/v1/blocks/types
 */

import { Router, type Request, type Response } from 'express';
import { BLOCK_TYPE } from '@netrun-cms/core';

import type { Router as RouterType } from 'express';

const router: RouterType = Router();

interface BlockTypeDescriptor {
  type: string;
  label: string;
  description: string;
  category: 'layout' | 'content' | 'media' | 'interactive' | 'artist';
  icon: string;
  defaultContent: Record<string, unknown>;
}

const BLOCK_TYPE_CATALOG: BlockTypeDescriptor[] = [
  {
    type: BLOCK_TYPE.HERO,
    label: 'Hero',
    description: 'Full-width hero section with headline, subheadline, and CTA buttons',
    category: 'layout',
    icon: 'layout-template',
    defaultContent: {
      headline: 'Your Compelling Headline',
      subheadline: 'A brief description that supports your headline.',
      ctaText: 'Get Started',
      ctaLink: '#',
      alignment: 'center',
    },
  },
  {
    type: BLOCK_TYPE.TEXT,
    label: 'Text',
    description: 'Plain or Markdown formatted text block',
    category: 'content',
    icon: 'type',
    defaultContent: {
      body: 'Start writing your content here...',
      format: 'markdown',
    },
  },
  {
    type: BLOCK_TYPE.RICH_TEXT,
    label: 'Rich Text',
    description: 'HTML rich text content with formatting',
    category: 'content',
    icon: 'file-text',
    defaultContent: {
      body: '<p>Start writing your content here...</p>',
      format: 'html',
    },
  },
  {
    type: BLOCK_TYPE.IMAGE,
    label: 'Image',
    description: 'Single image with alt text and optional caption',
    category: 'media',
    icon: 'image',
    defaultContent: {
      src: '',
      alt: '',
      caption: '',
    },
  },
  {
    type: BLOCK_TYPE.VIDEO,
    label: 'Video',
    description: 'Embedded YouTube or Vimeo video with optional caption',
    category: 'media',
    icon: 'video',
    defaultContent: {
      url: '',
      title: '',
      caption: '',
      aspectRatio: '16:9',
    },
  },
  {
    type: BLOCK_TYPE.GALLERY,
    label: 'Gallery',
    description: 'Image gallery in grid, masonry, or carousel layout',
    category: 'media',
    icon: 'images',
    defaultContent: {
      images: [],
      layout: 'grid',
      columns: 3,
    },
  },
  {
    type: BLOCK_TYPE.CTA,
    label: 'Call to Action',
    description: 'Prominent call-to-action section with headline and button',
    category: 'layout',
    icon: 'mouse-pointer-click',
    defaultContent: {
      headline: 'Ready to get started?',
      description: '',
      buttonText: 'Get Started',
      buttonLink: '#',
      buttonVariant: 'primary',
      backgroundStyle: 'solid',
    },
  },
  {
    type: BLOCK_TYPE.FEATURE_GRID,
    label: 'Feature Grid',
    description: 'Grid of feature cards with icon, title, and description',
    category: 'content',
    icon: 'layout-grid',
    defaultContent: {
      headline: 'Key Features',
      features: [],
      columns: 3,
    },
  },
  {
    type: BLOCK_TYPE.PRICING_TABLE,
    label: 'Pricing Table',
    description: 'Pricing tiers with features list and CTA buttons',
    category: 'content',
    icon: 'circle-dollar-sign',
    defaultContent: {
      headline: 'Simple Pricing',
      description: '',
      tiers: [],
    },
  },
  {
    type: BLOCK_TYPE.TESTIMONIAL,
    label: 'Testimonials',
    description: 'Customer testimonials in grid or carousel layout',
    category: 'content',
    icon: 'quote',
    defaultContent: {
      testimonials: [],
      layout: 'grid',
    },
  },
  {
    type: BLOCK_TYPE.FAQ,
    label: 'FAQ',
    description: 'Frequently asked questions accordion',
    category: 'content',
    icon: 'help-circle',
    defaultContent: {
      headline: 'Frequently Asked Questions',
      items: [],
    },
  },
  {
    type: BLOCK_TYPE.CONTACT_FORM,
    label: 'Contact Form',
    description: 'Configurable contact form with custom fields',
    category: 'interactive',
    icon: 'mail',
    defaultContent: {
      headline: 'Get in Touch',
      description: '',
      fields: [],
      submitText: 'Send Message',
      successMessage: 'Thank you! We will be in touch soon.',
    },
  },
  {
    type: BLOCK_TYPE.STATS_BAR,
    label: 'Stats Bar',
    description: 'Highlight key statistics or metrics',
    category: 'content',
    icon: 'bar-chart',
    defaultContent: {
      stats: [],
      layout: 'horizontal',
    },
  },
  {
    type: BLOCK_TYPE.TIMELINE,
    label: 'Timeline',
    description: 'Chronological timeline of events or milestones',
    category: 'content',
    icon: 'git-branch',
    defaultContent: {
      headline: '',
      items: [],
    },
  },
  {
    type: BLOCK_TYPE.NEWSLETTER,
    label: 'Newsletter',
    description: 'Email newsletter signup block',
    category: 'interactive',
    icon: 'inbox',
    defaultContent: {
      headline: 'Stay in the loop',
      description: '',
      buttonText: 'Subscribe',
    },
  },
  {
    type: BLOCK_TYPE.CODE_BLOCK,
    label: 'Code Block',
    description: 'Syntax-highlighted code snippet',
    category: 'content',
    icon: 'code',
    defaultContent: {
      html: '',
      css: '',
      js: '',
    },
  },
  {
    type: BLOCK_TYPE.BENTO_GRID,
    label: 'Bento Grid',
    description: 'Asymmetric bento-style grid layout',
    category: 'layout',
    icon: 'layout-dashboard',
    defaultContent: {},
  },
  {
    type: BLOCK_TYPE.CUSTOM,
    label: 'Custom HTML',
    description: 'Raw HTML, CSS, and JavaScript block for advanced customization',
    category: 'content',
    icon: 'code-2',
    defaultContent: {
      html: '',
      css: '',
      js: '',
      data: {},
    },
  },
  {
    type: BLOCK_TYPE.EMBED_PLAYER,
    label: 'Embed Player',
    description: 'Music/video embed from Spotify, YouTube, SoundCloud, etc.',
    category: 'artist',
    icon: 'music',
    defaultContent: {
      platform: 'spotify',
      url: '',
      compact: false,
      title: '',
    },
  },
  {
    type: BLOCK_TYPE.RELEASE_LIST,
    label: 'Release List',
    description: 'Music releases (albums, EPs, singles) list',
    category: 'artist',
    icon: 'disc',
    defaultContent: {
      maxItems: 6,
      layout: 'grid',
      showStreamLinks: true,
    },
  },
  {
    type: BLOCK_TYPE.EVENT_LIST,
    label: 'Event List',
    description: 'Upcoming shows and events list',
    category: 'artist',
    icon: 'calendar',
    defaultContent: {
      maxItems: 10,
      showPastEvents: false,
      layout: 'list',
    },
  },
  {
    type: BLOCK_TYPE.SOCIAL_LINKS,
    label: 'Social Links',
    description: 'Social media links with icons',
    category: 'artist',
    icon: 'share-2',
    defaultContent: {
      links: [],
      layout: 'row',
      showLabels: false,
    },
  },
  {
    type: BLOCK_TYPE.LINK_TREE,
    label: 'Link Tree',
    description: 'Linktree-style page with avatar and multiple links',
    category: 'artist',
    icon: 'link',
    defaultContent: {
      links: [],
      showAvatar: true,
      heading: '',
      subheading: '',
    },
  },
  {
    type: BLOCK_TYPE.ARTIST_BIO,
    label: 'Artist Bio',
    description: 'Artist biography section with optional photo and genres',
    category: 'artist',
    icon: 'user',
    defaultContent: {
      showPhoto: true,
      showGenres: true,
      showSocialLinks: true,
      photoPosition: 'right',
    },
  },
];

/**
 * GET /api/v1/blocks/types
 * Returns the full catalog of available block types
 *
 * Query params:
 * - category: 'layout' | 'content' | 'media' | 'interactive' | 'artist'
 */
router.get('/', (_req: Request, res: Response) => {
  const category = _req.query.category as string | undefined;

  const catalog = category
    ? BLOCK_TYPE_CATALOG.filter((b) => b.category === category)
    : BLOCK_TYPE_CATALOG;

  res.json({
    success: true,
    data: catalog,
    meta: {
      total: catalog.length,
      categories: ['layout', 'content', 'media', 'interactive', 'artist'],
    },
  });
});

export default router;
