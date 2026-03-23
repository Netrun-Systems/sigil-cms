/**
 * NetrunSite — Sigil CMS site configuration.
 *
 * Defines the site structure, pages, navigation, and content blocks
 * for the Netrun Systems corporate website as a Sigil tenant.
 *
 * Site slug: "netrun"
 * Tenant: Netrun Systems
 */

// ── Site Definition ─────────────────────────────────────────────────

export const SITE_SLUG = 'netrun';

export const siteConfig = {
  slug: SITE_SLUG,
  name: 'Netrun Systems',
  domain: 'netrunsystems.com',
  description: 'Cloud infrastructure, DevSecOps, and AI-powered products for modern enterprises.',
  logo_url: '/assets/netrun-logo.svg',
  favicon_url: '/assets/favicon.ico',

  /** Plugins enabled for this site */
  plugins: [
    'blog',
    'contact',
    'mailing-list',
    'seo',
    'store',
    'kamera',
    'support',
  ] as const,

  /** Theme configuration */
  theme: {
    preset: 'netrun-dark',
    colors: {
      primary: '#90b9ab',      // Netrun sage
      secondary: '#4ca1e0',    // Accent blue
      background: '#0f1720',   // Deep navy
      surface: '#1a2332',      // Panel navy
      text: '#e8f0ed',         // Ice white
      textSecondary: '#b8d4ca', // Mist
      accent: '#90b9ab',       // Sage green
      error: '#f87171',
      success: '#4ade80',
      warning: '#fbbf24',
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      monoFont: 'JetBrains Mono',
    },
  },
};

// ── Navigation ──────────────────────────────────────────────────────

export const navigation = {
  primary: [
    { label: 'Home', path: '/' },
    { label: 'Products', path: '/products' },
    { label: 'Services', path: '/services' },
    { label: 'KAMERA', path: '/kamera' },
    { label: 'Research', path: '/blog' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ],
  footer: [
    { label: 'Privacy Policy', path: '/privacy' },
    { label: 'Terms of Service', path: '/terms' },
    { label: 'Cookie Policy', path: '/cookies' },
  ],
};

// ── Page Definitions ────────────────────────────────────────────────

export type BlockType =
  | 'hero'
  | 'text'
  | 'feature_grid'
  | 'cta'
  | 'product_grid'
  | 'buy_button'
  | 'contact_form'
  | 'blog_feed'
  | 'blog_post_embed'
  | 'scan_viewer'
  | 'scan_status'
  | 'support_button'
  | 'newsletter_signup'
  | 'team_grid'
  | 'pricing_table'
  | 'testimonials';

export interface PageBlock {
  type: BlockType;
  props: Record<string, unknown>;
  order: number;
}

export interface PageDefinition {
  title: string;
  slug: string;
  path: string;
  description: string;
  blocks: PageBlock[];
  is_published: boolean;
}

export const pages: PageDefinition[] = [
  // ── Home ────────────────────────────────────────────────────
  {
    title: 'Home',
    slug: 'home',
    path: '/',
    description: 'Netrun Systems — Cloud Infrastructure, DevSecOps, and AI Products',
    is_published: true,
    blocks: [
      {
        type: 'hero',
        order: 1,
        props: {
          headline: 'Infrastructure That Thinks',
          subheadline: 'Cloud platforms, DevSecOps automation, and AI-powered products built on 25 years of enterprise engineering.',
          ctaText: 'Explore Products',
          ctaLink: '/products',
          backgroundStyle: 'gradient',
        },
      },
      {
        type: 'feature_grid',
        order: 2,
        props: {
          heading: 'Our Products',
          columns: 3,
          items: [
            { icon: 'BarChart3', title: 'Intirkon', description: 'Multi-tenant Azure BI platform with row-level security and embedded Power BI.' },
            { icon: 'ScanLine', title: 'KAMERA', description: 'AI-powered 3D scanning pipeline. Upload photos, get engineering-grade 3D models and reports.' },
            { icon: 'Radio', title: 'Intirkast', description: 'Autonomous social media broadcasting. AI-generated content published on schedule.' },
            { icon: 'Code', title: 'K0DE by Wilbur', description: 'AI-powered development service. Full-stack applications built by AI agents, reviewed by engineers.' },
            { icon: 'Layout', title: 'Sigil CMS', description: 'Multi-tenant headless CMS with plugin architecture. The framework powering this site.' },
            { icon: 'Crosshair', title: 'Optikal', description: 'Physics simulation and optical engineering toolkit for beam propagation and lens design.' },
          ],
        },
      },
      {
        type: 'cta',
        order: 3,
        props: {
          headline: 'Ready to modernize your infrastructure?',
          description: 'Talk to us about cloud migration, DevSecOps, or custom platform development.',
          ctaText: 'Get in Touch',
          ctaLink: '/contact',
          style: 'dark',
        },
      },
    ],
  },

  // ── Products ────────────────────────────────────────────────
  {
    title: 'Products',
    slug: 'products',
    path: '/products',
    description: 'Netrun Systems product portfolio — enterprise platforms and AI-powered tools.',
    is_published: true,
    blocks: [
      {
        type: 'hero',
        order: 1,
        props: {
          headline: 'Products',
          subheadline: 'Enterprise platforms and AI-powered tools built for production.',
          backgroundStyle: 'minimal',
        },
      },
      {
        type: 'product_grid',
        order: 2,
        props: {
          columns: 2,
          products: [
            {
              name: 'Intirkon',
              tagline: 'Multi-Tenant Azure BI',
              description: 'Row-level security, embedded Power BI, tenant isolation. Built for MSPs managing multiple client environments.',
              link: '/products/intirkon',
            },
            {
              name: 'KAMERA',
              tagline: 'AI 3D Scanning Pipeline',
              description: 'Upload site photos, receive engineering-grade 3D models and MEP reports. Powered by YOLOv8 and PointNet++.',
              link: '/kamera',
            },
            {
              name: 'Intirkast',
              tagline: 'Autonomous Broadcasting',
              description: 'AI-generated social media content published on schedule across LinkedIn, Facebook, and Twitter.',
              link: '/products/intirkast',
            },
            {
              name: 'K0DE by Wilbur',
              tagline: 'AI Development Service',
              description: 'Full-stack applications built by AI agents with human engineer review. Ship production code in days, not months.',
              link: '/products/kode',
            },
            {
              name: 'Sigil CMS',
              tagline: 'Multi-Tenant Headless CMS',
              description: 'Plugin architecture, composable content blocks, multi-tenant with row-level security. This site runs on Sigil.',
              link: '/products/sigil',
            },
            {
              name: 'Optikal',
              tagline: 'Physics Simulation Toolkit',
              description: 'Beam propagation, lens design, and optical engineering simulations with REST API access.',
              link: '/products/optikal',
            },
          ],
        },
      },
    ],
  },

  // ── Services ────────────────────────────────────────────────
  {
    title: 'Services',
    slug: 'services',
    path: '/services',
    description: 'Consulting and professional services — cloud migration, DevSecOps, platform engineering.',
    is_published: true,
    blocks: [
      {
        type: 'hero',
        order: 1,
        props: {
          headline: 'Services',
          subheadline: '25 years of enterprise infrastructure experience, from Fortune 500 to startup.',
          backgroundStyle: 'minimal',
        },
      },
      {
        type: 'feature_grid',
        order: 2,
        props: {
          heading: 'What We Do',
          columns: 2,
          items: [
            { icon: 'Cloud', title: 'Cloud Migration', description: 'Azure, GCP, AWS. Lift-and-shift or re-architecture. Cost optimization and multi-cloud strategy.' },
            { icon: 'Shield', title: 'DevSecOps', description: 'CI/CD pipelines, security automation, compliance (SOC2, ISO27001, NIST). Infrastructure as code.' },
            { icon: 'Server', title: 'Platform Engineering', description: 'Multi-tenant SaaS platforms, API design, database architecture. PostgreSQL, Redis, message queues.' },
            { icon: 'Bot', title: 'AI Integration', description: 'LLM integration, RAG pipelines, ML model deployment. Production AI, not prototypes.' },
          ],
        },
      },
      {
        type: 'cta',
        order: 3,
        props: {
          headline: 'Need help with a project?',
          ctaText: 'Schedule a Consultation',
          ctaLink: '/contact',
        },
      },
    ],
  },

  // ── About ───────────────────────────────────────────────────
  {
    title: 'About',
    slug: 'about',
    path: '/about',
    description: 'About Netrun Systems — founded by Daniel Garza, built on 25 years of enterprise engineering.',
    is_published: true,
    blocks: [
      {
        type: 'hero',
        order: 1,
        props: {
          headline: 'About Netrun Systems',
          subheadline: 'California C Corp. Building infrastructure that thinks since 2001.',
          backgroundStyle: 'minimal',
        },
      },
      {
        type: 'text',
        order: 2,
        props: {
          content: 'Netrun Systems is a California-based technology company founded by Daniel Garza. With 25 years of professional experience in cloud infrastructure, DevSecOps, and multi-tenant management platforms — spanning Fortune 500 enterprises like Epsilon, Amtrak, and VMware — we bring enterprise-grade engineering to companies of every size.\n\nOur product portfolio spans AI-powered 3D scanning (KAMERA), multi-tenant BI platforms (Intirkon), autonomous broadcasting (Intirkast), and the Sigil CMS framework that powers this very website.',
        },
      },
      {
        type: 'team_grid',
        order: 3,
        props: {
          heading: 'Leadership',
          members: [
            { name: 'Daniel Garza', role: 'Founder & CEO', bio: '25 years in cloud infrastructure, DevSecOps, and platform engineering.' },
          ],
        },
      },
    ],
  },

  // ── Blog / Research ─────────────────────────────────────────
  {
    title: 'Research & Blog',
    slug: 'blog',
    path: '/blog',
    description: 'Technical articles, case studies, and research from Netrun Systems.',
    is_published: true,
    blocks: [
      {
        type: 'hero',
        order: 1,
        props: {
          headline: 'Research & Insights',
          subheadline: 'Technical articles, case studies, and engineering deep-dives.',
          backgroundStyle: 'minimal',
        },
      },
      {
        type: 'blog_feed',
        order: 2,
        props: {
          postsPerPage: 10,
          showExcerpt: true,
          showCoverImage: true,
          showAuthor: true,
          showDate: true,
          showReadingTime: true,
        },
      },
    ],
  },

  // ── Contact ─────────────────────────────────────────────────
  {
    title: 'Contact',
    slug: 'contact',
    path: '/contact',
    description: 'Get in touch with Netrun Systems.',
    is_published: true,
    blocks: [
      {
        type: 'hero',
        order: 1,
        props: {
          headline: 'Contact Us',
          subheadline: 'Tell us about your project. We respond within one business day.',
          backgroundStyle: 'minimal',
        },
      },
      {
        type: 'contact_form',
        order: 2,
        props: {
          fields: ['name', 'email', 'company', 'message'],
          submitLabel: 'Send Message',
          successMessage: 'Thanks for reaching out. We will get back to you within one business day.',
        },
      },
    ],
  },

  // ── KAMERA Product Page ─────────────────────────────────────
  {
    title: 'KAMERA',
    slug: 'kamera',
    path: '/kamera',
    description: 'KAMERA — AI-powered 3D scanning pipeline. Upload photos, get engineering-grade models.',
    is_published: true,
    blocks: [
      {
        type: 'hero',
        order: 1,
        props: {
          headline: 'KAMERA',
          subheadline: 'AI-powered 3D scanning. Upload site photos, receive engineering-grade 3D models and MEP reports.',
          ctaText: 'Start a Scan',
          ctaLink: '#scan-submission',
          backgroundStyle: 'gradient',
        },
      },
      {
        type: 'feature_grid',
        order: 2,
        props: {
          heading: 'How It Works',
          columns: 3,
          items: [
            { icon: 'Camera', title: '1. Upload Photos', description: 'Take photos of your site with any camera. Our AI handles the rest.' },
            { icon: 'Cpu', title: '2. AI Processing', description: 'YOLOv8 object detection, PointNet++ point cloud analysis, and SAM segmentation.' },
            { icon: 'FileText', title: '3. Get Reports', description: 'Engineering-grade 3D models, MEP clash detection, and planning reports.' },
          ],
        },
      },
      {
        type: 'scan_viewer',
        order: 3,
        props: {
          showSubmissionForm: true,
          acceptedFormats: ['jpg', 'jpeg', 'png', 'heic', 'zip'],
          maxFileSize: '500MB',
        },
      },
      {
        type: 'pricing_table',
        order: 4,
        props: {
          heading: 'Scan Packages',
          tiers: [
            { name: 'Basic', price: 99, features: ['Up to 50 photos', 'Standard 3D model', 'PDF report'] },
            { name: 'Professional', price: 499, features: ['Up to 500 photos', 'HD 3D model', 'MEP analysis', 'Clash detection', 'Priority processing'] },
            { name: 'Enterprise', price: 'Custom', features: ['Unlimited photos', 'Full engineering reports', 'API access', 'Dedicated support', 'SLA'] },
          ],
        },
      },
    ],
  },
];
