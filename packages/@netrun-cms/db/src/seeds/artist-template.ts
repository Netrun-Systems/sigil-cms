/**
 * Artist Template Seed
 *
 * Creates standard pages with pre-configured blocks for artist/band sites.
 * Called when a new site is created with template: 'artist'.
 */

import type { DbClient } from '../client.js';
import { pages, contentBlocks } from '../schema.js';

interface ArtistPageDef {
  title: string;
  slug: string;
  sortOrder: number;
  blocks: Array<{
    blockType: string;
    content: Record<string, unknown>;
    settings?: Record<string, unknown>;
    sortOrder: number;
  }>;
}

const artistPages: ArtistPageDef[] = [
  {
    title: 'Home',
    slug: 'home',
    sortOrder: 0,
    blocks: [
      {
        blockType: 'hero',
        content: {
          headline: '',
          subheadline: 'Welcome to the official site',
          alignment: 'center',
          ctaText: 'Listen Now',
          ctaLink: '/music',
          ctaSecondaryText: 'Upcoming Shows',
          ctaSecondaryLink: '/shows',
        },
        settings: { padding: 'xl', width: 'full' },
        sortOrder: 0,
      },
      {
        blockType: 'release_list',
        content: { maxItems: 1, layout: 'list', showStreamLinks: true },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 1,
      },
      {
        blockType: 'event_list',
        content: { maxItems: 3, showPastEvents: false },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 2,
      },
    ],
  },
  {
    title: 'Music',
    slug: 'music',
    sortOrder: 1,
    blocks: [
      {
        blockType: 'text',
        content: { body: '# Music\n\nStream, download, and explore the full catalog.', format: 'markdown' },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
      {
        blockType: 'release_list',
        content: { maxItems: 20, layout: 'list', showStreamLinks: true },
        settings: { padding: 'md', width: 'container' },
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'Shows',
    slug: 'shows',
    sortOrder: 2,
    blocks: [
      {
        blockType: 'text',
        content: { body: '# Shows\n\nUpcoming live performances and tour dates.', format: 'markdown' },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
      {
        blockType: 'event_list',
        content: { maxItems: 50, showPastEvents: false, layout: 'list' },
        settings: { padding: 'md', width: 'container' },
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'Videos',
    slug: 'videos',
    sortOrder: 3,
    blocks: [
      {
        blockType: 'text',
        content: { body: '# Videos\n\nMusic videos, performances, and behind-the-scenes content.', format: 'markdown' },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
      {
        blockType: 'gallery',
        content: { images: [], layout: 'grid', columns: 2 },
        settings: { padding: 'md', width: 'container' },
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'Live',
    slug: 'live',
    sortOrder: 4,
    blocks: [
      {
        blockType: 'text',
        content: { body: '# Live\n\nWatch live performances, Q&As, and studio sessions.', format: 'markdown' },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
      {
        blockType: 'embed_player',
        content: { platform: 'twitch', url: '', title: 'Live Stream' },
        settings: { padding: 'md', width: 'container' },
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'About',
    slug: 'about',
    sortOrder: 5,
    blocks: [
      {
        blockType: 'artist_bio',
        content: { showPhoto: true, showGenres: true, showSocialLinks: true, photoPosition: 'top' },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
    ],
  },
  {
    title: 'Links',
    slug: 'links',
    sortOrder: 6,
    blocks: [
      {
        blockType: 'link_tree',
        content: { links: [], showAvatar: true, avatarUrl: '', heading: '', subheading: '' },
        settings: { padding: 'xl', width: 'narrow' },
        sortOrder: 0,
      },
    ],
  },
  {
    title: 'Contact',
    slug: 'contact',
    sortOrder: 7,
    blocks: [
      {
        blockType: 'text',
        content: { body: '# Contact\n\nGet in touch for booking, press, or general inquiries.', format: 'markdown' },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
      {
        blockType: 'contact_form',
        content: {
          headline: 'Send a Message',
          fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'subject', label: 'Subject', type: 'text', required: true },
            { name: 'message', label: 'Message', type: 'textarea', required: true },
          ],
          submitText: 'Send Message',
          successMessage: 'Thanks for reaching out! We\'ll get back to you soon.',
        },
        settings: { padding: 'md', width: 'narrow' },
        sortOrder: 1,
      },
    ],
  },
];

export async function seedArtistTemplate(db: DbClient, siteId: string): Promise<void> {
  for (const pageDef of artistPages) {
    const [page] = await db
      .insert(pages)
      .values({
        siteId,
        title: pageDef.title,
        slug: pageDef.slug,
        fullPath: `/${pageDef.slug}`,
        status: 'draft',
        template: 'artist',
        sortOrder: pageDef.sortOrder,
      })
      .returning();

    if (pageDef.blocks.length > 0) {
      await db.insert(contentBlocks).values(
        pageDef.blocks.map((block) => ({
          pageId: page.id,
          blockType: block.blockType,
          content: block.content,
          settings: block.settings || {},
          sortOrder: block.sortOrder,
          isVisible: true,
        }))
      );
    }
  }
}
