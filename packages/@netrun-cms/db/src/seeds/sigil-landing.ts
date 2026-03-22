/**
 * Sigil CMS Landing Site Seed
 *
 * Creates the marketing website for Sigil CMS, hosted by Sigil itself.
 * 5 pages: Home, Features, Pricing, Plugins, Case Study (Frost).
 */

import type { DbClient } from '../client.js';
import { pages, contentBlocks } from '../schema.js';

interface SigilPageDef {
  title: string;
  slug: string;
  template: string;
  sortOrder: number;
  meta: { title: string; description: string };
  blocks: Array<{
    blockType: string;
    content: Record<string, unknown>;
    settings?: Record<string, unknown>;
    sortOrder: number;
  }>;
}

const sigilPages: SigilPageDef[] = [
  // =========================================================================
  // Page 1: Home
  // =========================================================================
  {
    title: 'Home',
    slug: 'home',
    template: 'landing',
    sortOrder: 0,
    meta: {
      title: 'Sigil CMS — Build Anything. Own Everything.',
      description:
        'Open-source headless CMS with 21 plugins. Multi-tenant, self-hostable, ~$5/month.',
    },
    blocks: [
      {
        blockType: 'hero',
        content: {
          headline: 'Build Anything. Own Everything.',
          subheadline:
            'The open-source headless CMS with 21 plugins, multi-tenant architecture, and a Design Playground. Self-host for free or use Sigil Cloud.',
          ctaText: 'Get Started Free',
          ctaLink: '/pricing',
          ctaSecondaryText: 'See Features',
          ctaSecondaryLink: '/features',
        },
        settings: { padding: 'xl', width: 'full' },
        sortOrder: 0,
      },
      {
        blockType: 'stats_bar',
        content: {
          stats: [
            { value: '21', label: 'Plugins' },
            { value: '70+', label: 'Google Fonts' },
            { value: '~$5', label: '/mo Deploy' },
            { value: '0%', label: 'Platform Fee' },
          ],
        },
        settings: { padding: 'md', width: 'container' },
        sortOrder: 1,
      },
      {
        blockType: 'feature_grid',
        content: {
          headline: 'Why Teams Choose Sigil',
          columns: 3,
          features: [
            {
              icon: 'layers',
              title: 'Multi-Tenant',
              description:
                'One deployment serves unlimited sites with full tenant isolation',
            },
            {
              icon: 'puzzle',
              title: 'Plugin Architecture',
              description:
                '21 plugins — commerce, booking, docs, analytics. Enable only what you need.',
            },
            {
              icon: 'palette',
              title: 'Design Playground',
              description:
                '70+ Google Fonts, button shapes, shadows, spacing — all with live preview',
            },
            {
              icon: 'blocks',
              title: 'Composable Blocks',
              description:
                'Hero, pricing, FAQ, gallery, embeds — 20+ block types out of the box',
            },
            {
              icon: 'code',
              title: 'API-First',
              description:
                'Full REST + GraphQL API. TypeScript SDK. Next.js integration.',
            },
            {
              icon: 'server',
              title: 'Self-Host or Cloud',
              description:
                'Deploy to Cloud Run for ~$5/month or use Sigil Cloud. Your data, your rules.',
            },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 2,
      },
      {
        blockType: 'cta',
        content: {
          headline: 'Ready to build?',
          description:
            'Deploy your first Sigil site in under 5 minutes.',
          buttonText: 'Start for Free',
          buttonLink: '/pricing',
        },
        settings: { padding: 'xl', width: 'container' },
        sortOrder: 3,
      },
    ],
  },

  // =========================================================================
  // Page 2: Features
  // =========================================================================
  {
    title: 'Features',
    slug: 'features',
    template: 'landing',
    sortOrder: 1,
    meta: {
      title: 'Features — Sigil CMS',
      description:
        'Composable content blocks, plugin ecosystem, design playground, and developer tools.',
    },
    blocks: [
      {
        blockType: 'hero',
        content: {
          headline: 'Everything You Need',
          subheadline:
            'A complete CMS framework with composable blocks, a plugin ecosystem, and full design control.',
        },
        settings: { padding: 'xl', width: 'full' },
        sortOrder: 0,
      },
      {
        blockType: 'feature_grid',
        content: {
          headline: 'Content Blocks',
          columns: 3,
          features: [
            { icon: 'star', title: 'Hero', description: 'Full-width hero sections with background images, CTAs, and alignment options' },
            { icon: 'type', title: 'Text', description: 'Rich text with Markdown, HTML, or plain text formatting' },
            { icon: 'edit', title: 'Rich Text', description: 'WYSIWYG editor for non-technical content creators' },
            { icon: 'grid', title: 'Feature Grid', description: 'Responsive card grids with icons, titles, and descriptions' },
            { icon: 'dollar-sign', title: 'Pricing Table', description: 'Tiered pricing cards with feature lists and CTA buttons' },
            { icon: 'image', title: 'Gallery', description: 'Image galleries with grid and masonry layouts' },
            { icon: 'mouse-pointer', title: 'CTA', description: 'Call-to-action sections with headlines, descriptions, and buttons' },
            { icon: 'help-circle', title: 'FAQ', description: 'Accordion-style frequently asked questions' },
            { icon: 'clock', title: 'Timeline', description: 'Chronological event timelines for milestones and history' },
            { icon: 'bar-chart', title: 'Stats Bar', description: 'Horizontal stat counters for key metrics' },
            { icon: 'message-circle', title: 'Testimonial', description: 'Customer quotes with avatars, names, and roles' },
            { icon: 'mail', title: 'Contact Form', description: 'Configurable forms with validation, custom fields, and submissions API' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 1,
      },
      {
        blockType: 'feature_grid',
        content: {
          headline: 'Platform Features',
          columns: 3,
          features: [
            { icon: 'users', title: 'Multi-Tenancy', description: 'Full tenant isolation with row-level security. One deployment, unlimited sites.' },
            { icon: 'globe', title: 'i18n', description: 'Internationalization support for multilingual content management' },
            { icon: 'link', title: 'Custom Domains', description: 'Map any domain to any site with automatic SSL provisioning' },
            { icon: 'git-branch', title: 'Page Revisions', description: 'Version history for every page with one-click rollback' },
            { icon: 'shield', title: 'Role-Based Access', description: 'Admin, editor, and viewer roles with granular permissions' },
            { icon: 'zap', title: 'Webhooks', description: 'Push events to external services on content changes' },
            { icon: 'upload-cloud', title: 'File Upload', description: 'GCS, Azure Blob, and S3 storage backends with automatic optimization' },
            { icon: 'search', title: 'SEO', description: 'Meta tags, Open Graph, structured data, and sitemap generation' },
            { icon: 'download', title: 'Migration', description: 'Import content from WordPress, Shopify, and other CMS platforms' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 2,
      },
      {
        blockType: 'cta',
        content: {
          headline: 'See it in action',
          description:
            'Read how Frost runs a professional artist site on Sigil for ~$5/month.',
          buttonText: 'Read Case Study',
          buttonLink: '/case-study-frost',
        },
        settings: { padding: 'xl', width: 'container' },
        sortOrder: 3,
      },
    ],
  },

  // =========================================================================
  // Page 3: Pricing
  // =========================================================================
  {
    title: 'Pricing',
    slug: 'pricing',
    template: 'landing',
    sortOrder: 2,
    meta: {
      title: 'Pricing — Sigil CMS',
      description: 'Free self-hosted. Cloud plans from $12/month.',
    },
    blocks: [
      {
        blockType: 'hero',
        content: {
          headline: 'Simple, Transparent Pricing',
          subheadline:
            'Self-host for free forever. Scale with Sigil Cloud.',
        },
        settings: { padding: 'xl', width: 'full' },
        sortOrder: 0,
      },
      {
        blockType: 'pricing_table',
        content: {
          tiers: [
            {
              name: 'Free',
              price: '$0',
              period: 'forever',
              features: [
                '1 site',
                '5 pages',
                '100MB storage',
                '3 plugins (SEO, Contact, Mailing List)',
                'sigil.netrunsystems.com subdomain',
              ],
              ctaText: 'Get Started',
              ctaLink: '/signup?plan=free',
              isPopular: false,
            },
            {
              name: 'Starter',
              price: '$12',
              period: '/month',
              features: [
                '1 site',
                '50 pages',
                '1GB storage',
                '5 plugins',
                'Custom domain + SSL',
                'Remove Sigil branding',
              ],
              ctaText: 'Start Free Trial',
              ctaLink: '/signup?plan=starter',
              isPopular: false,
            },
            {
              name: 'Pro',
              price: '$29',
              period: '/month',
              features: [
                '3 sites',
                'Unlimited pages',
                '10GB storage',
                'All 21 plugins',
                'API access',
                'Webhooks',
              ],
              ctaText: 'Start Free Trial',
              ctaLink: '/signup?plan=pro',
              isPopular: true,
            },
            {
              name: 'Business',
              price: '$79',
              period: '/month',
              features: [
                '10 sites',
                'Unlimited pages',
                '50GB storage',
                'All 21 plugins',
                'White-label',
                'Priority support',
              ],
              ctaText: 'Contact Sales',
              ctaLink: '/contact?plan=business',
              isPopular: false,
            },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 1,
      },
      {
        blockType: 'faq',
        content: {
          headline: 'Pricing FAQ',
          items: [
            {
              question: 'Can I self-host Sigil?',
              answer:
                'Yes. Sigil is open source. Clone the repo, run pnpm install && pnpm build, and deploy to any server with PostgreSQL. Self-hosted is free and unlimited — no feature gating, no watermarking.',
            },
            {
              question: 'What happens if I exceed my plan limits?',
              answer:
                "You'll see a clear upgrade prompt. Existing content is never deleted or hidden. You just can't create new sites/pages beyond your limit until you upgrade.",
            },
            {
              question: 'Do you offer annual billing?',
              answer:
                'Yes. All paid plans offer a 20% discount for annual billing. Starter drops to $9.60/mo, Pro to $23.20/mo, Business to $63.20/mo.',
            },
            {
              question: 'Is there a free trial?',
              answer:
                'All paid plans include a 14-day free trial. No credit card required to start.',
            },
            {
              question: 'What payment methods do you accept?',
              answer:
                'Stripe handles all payments. Visa, Mastercard, American Express, and 20+ other methods depending on your region.',
            },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 2,
      },
      {
        blockType: 'cta',
        content: {
          headline: 'Self-Host for Free Forever',
          description:
            'Download the open-source repo and run on your infrastructure. Zero cost, zero limits.',
          buttonText: 'View on GitHub',
          buttonLink: 'https://github.com/Netrun-Systems/netrun-cms',
        },
        settings: { padding: 'xl', width: 'container' },
        sortOrder: 3,
      },
    ],
  },

  // =========================================================================
  // Page 4: Plugins
  // =========================================================================
  {
    title: 'Plugins',
    slug: 'plugins',
    template: 'landing',
    sortOrder: 3,
    meta: {
      title: 'Plugins — Sigil CMS',
      description:
        '21 plugins for commerce, booking, analytics, community, AI, and more.',
    },
    blocks: [
      {
        blockType: 'hero',
        content: {
          headline: '21 Plugins. Zero Bloat.',
          subheadline:
            'Enable only what you need. Every plugin is isolated, environment-gated, and tree-shakeable.',
        },
        settings: { padding: 'xl', width: 'full' },
        sortOrder: 0,
      },
      {
        blockType: 'feature_grid',
        content: {
          headline: 'Universal Plugins',
          columns: 3,
          features: [
            { icon: 'search', title: 'SEO', description: 'Meta tags, Open Graph, sitemaps, and structured data for every page' },
            { icon: 'music', title: 'Artist Content', description: 'Releases, events, streaming links, and bio management for musicians' },
            { icon: 'mail', title: 'Mailing List', description: 'Email capture forms with double opt-in and CSV export' },
            { icon: 'phone', title: 'Contact & Booking', description: 'Configurable contact forms with field validation and email notifications' },
            { icon: 'camera', title: 'Photos', description: 'Photo galleries with Azure Blob, GCS, or S3 storage backends' },
            { icon: 'cpu', title: 'AI Advisor', description: 'AI-powered design suggestions and content recommendations via Gemini' },
            { icon: 'shopping-cart', title: 'Store (Stripe)', description: 'Product catalog, checkout, and order management powered by Stripe' },
            { icon: 'package', title: 'Merch (Printful)', description: 'Print-on-demand merchandise with automatic fulfillment via Printful' },
            { icon: 'credit-card', title: 'PayPal', description: 'PayPal payment buttons and checkout integration' },
            { icon: 'calendar', title: 'Booking', description: 'Appointment scheduling with calendar sync and availability management' },
            { icon: 'book-open', title: 'Docs / KB', description: 'Documentation portal with categories, search, and versioning' },
            { icon: 'activity', title: 'Resonance Analytics', description: 'Privacy-friendly analytics with page views, referrers, and event tracking' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 1,
      },
      {
        blockType: 'feature_grid',
        content: {
          headline: 'Netrun Platform Plugins',
          columns: 3,
          features: [
            { icon: 'message-square', title: 'Community Forum', description: 'Discussion boards with threads, reactions, and moderation tools' },
            { icon: 'shopping-bag', title: 'Plugin Marketplace', description: 'Browse and install community plugins from the marketplace' },
            { icon: 'box', title: 'KAMERA 3D Scanning', description: '3D site scanning and spatial data integration via KAMERA pipeline' },
            { icon: 'briefcase', title: 'KOG CRM', description: 'Customer relationship management with pipeline tracking and contacts' },
            { icon: 'radio', title: 'Intirkast Broadcasting', description: 'Live streaming and broadcasting integration for events and shows' },
            { icon: 'bot', title: 'Charlotte AI', description: 'AI assistant integration for visitor chat and content generation' },
            { icon: 'headphones', title: 'Support Panel', description: 'Customer support ticketing with SLA tracking and knowledge base' },
            { icon: 'download', title: 'Site Migration', description: 'Import content from WordPress, Shopify, Squarespace, and Wix' },
            { icon: 'zap', title: 'Webhooks', description: 'Push content events to external services with retry and delivery logs' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 2,
      },
      {
        blockType: 'cta',
        content: {
          headline: 'Build Your Own Plugin',
          description:
            'The plugin API is fully documented. Register routes, block types, admin nav, and migrations — in under 50 lines of code.',
          buttonText: 'Read Plugin Docs',
          buttonLink: '/docs',
        },
        settings: { padding: 'xl', width: 'container' },
        sortOrder: 3,
      },
    ],
  },

  // =========================================================================
  // Page 5: Case Study — Frost
  // =========================================================================
  {
    title: 'Case Study: Frost',
    slug: 'case-study-frost',
    template: 'landing',
    sortOrder: 4,
    meta: {
      title: 'Case Study: Frost — Sigil CMS',
      description:
        'How an artist runs a professional site on Sigil for ~$5/month.',
    },
    blocks: [
      {
        blockType: 'hero',
        content: {
          headline: 'Case Study: Frost',
          subheadline:
            'How an independent artist runs a professional website on Sigil for approximately five dollars per month.',
        },
        settings: { padding: 'xl', width: 'full' },
        sortOrder: 0,
      },
      {
        blockType: 'stats_bar',
        content: {
          stats: [
            { value: '~$5', label: '/mo Hosting' },
            { value: '7', label: 'Pages' },
            { value: '4', label: 'Active Plugins' },
            { value: '<200ms', label: 'Avg Response' },
          ],
        },
        settings: { padding: 'md', width: 'container' },
        sortOrder: 1,
      },
      {
        blockType: 'text',
        content: {
          body: [
            '## The Problem',
            '',
            'Independent artists need professional websites but face a painful trade-off: pay $16-30/month for Squarespace or Wix with limited design control, or build a custom site that requires ongoing developer maintenance.',
            '',
            '## The Solution',
            '',
            'Frost runs on Sigil CMS deployed to Google Cloud Run. The entire stack — CMS API, renderer, and PostgreSQL — costs approximately $5/month thanks to Cloud Run\'s scale-to-zero pricing and a shared Cloud SQL instance.',
            '',
            '**Cost breakdown:**',
            '- Cloud Run (API + Renderer): ~$3/month (scale to zero when idle)',
            '- Cloud SQL (shared PostgreSQL): ~$7/month (split across multiple sites)',
            '- GCS media storage: ~$0.02/GB',
            '',
            '## What Frost Uses',
            '',
            '- **Artist Plugin** — Manages releases, events, and streaming links with a dedicated admin panel',
            '- **Streaming Embeds** — Spotify and YouTube players embedded directly into pages',
            '- **Custom Theme** — A purple-branded theme using Space Grotesk typography, built in the Design Playground',
            '- **Contact Form** — Booking and press inquiries routed to email',
            '- **Mailing List** — Fan email capture with double opt-in',
            '- **Social Links** — Instagram, Spotify, YouTube, and SoundCloud in the footer',
          ].join('\n'),
          format: 'markdown',
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 2,
      },
      {
        blockType: 'feature_grid',
        content: {
          headline: 'What Frost Uses',
          columns: 3,
          features: [
            { icon: 'music', title: 'Artist Plugin', description: 'Releases, events, and streaming link management' },
            { icon: 'play-circle', title: 'Streaming Embeds', description: 'Spotify and YouTube players embedded in pages' },
            { icon: 'palette', title: 'Custom Theme', description: 'Purple brand with Space Grotesk, built in Design Playground' },
            { icon: 'mail', title: 'Contact Form', description: 'Booking and press inquiry form with email routing' },
            { icon: 'users', title: 'Mailing List', description: 'Fan email capture with double opt-in and CSV export' },
            { icon: 'share-2', title: 'Social Links', description: 'Instagram, Spotify, YouTube, SoundCloud in the footer' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 3,
      },
      {
        blockType: 'cta',
        content: {
          headline: 'Build Your Artist Site',
          description:
            'Start with the artist template and customize from there.',
          buttonText: 'Get Started',
          buttonLink: '/pricing',
        },
        settings: { padding: 'xl', width: 'container' },
        sortOrder: 4,
      },
    ],
  },
];

export async function seedSigilLanding(db: DbClient, siteId: string): Promise<void> {
  for (const pageDef of sigilPages) {
    const [page] = await db
      .insert(pages)
      .values({
        siteId,
        title: pageDef.title,
        slug: pageDef.slug,
        fullPath: `/${pageDef.slug}`,
        status: 'draft',
        template: pageDef.template,
        sortOrder: pageDef.sortOrder,
        metaTitle: pageDef.meta.title,
        metaDescription: pageDef.meta.description,
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
