/**
 * NetrunSite Seed Script — Creates the "netrun" site in Sigil CMS.
 *
 * Seeds:
 *   1. Tenant + site records
 *   2. All pages with content blocks (from siteConfig.ts)
 *   3. Navigation menu
 *   4. Blog posts (from existing NetrunSite posts table)
 *   5. Theme configuration
 *
 * Usage:
 *   npx tsx apps/netrunsite/src/seed.ts
 *
 * Requires:
 *   DATABASE_URL environment variable pointing to the Sigil CMS database.
 */

import { siteConfig, pages, navigation } from './siteConfig.js';

// ── Database Connection ─────────────────────────────────────────────

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/netrun_cms';

async function getDb() {
  const { drizzle } = await import('drizzle-orm/postgres-js');
  const postgres = (await import('postgres')).default;
  const sql = postgres(DATABASE_URL, { max: 1 });
  return { db: drizzle(sql), sql };
}

// ── Seed Functions ──────────────────────────────────────────────────

async function seedTenant(sql: ReturnType<typeof import('postgres').default>) {
  console.log('[seed] Creating tenant: Netrun Systems...');

  const [tenant] = await sql`
    INSERT INTO cms_tenants (name, slug, plan, settings)
    VALUES (
      'Netrun Systems',
      'netrun-systems',
      'enterprise',
      ${{
        company: 'Netrun Systems',
        domain: 'netrunsystems.com',
        contact_email: 'daniel@netrunsystems.com',
      }}::jsonb
    )
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      settings = EXCLUDED.settings
    RETURNING id
  `;

  console.log(`[seed] Tenant ID: ${tenant.id}`);
  return tenant.id;
}

async function seedSite(sql: ReturnType<typeof import('postgres').default>, tenantId: string) {
  console.log(`[seed] Creating site: ${siteConfig.name}...`);

  const [site] = await sql`
    INSERT INTO cms_sites (tenant_id, name, slug, domain, settings)
    VALUES (
      ${tenantId},
      ${siteConfig.name},
      ${siteConfig.slug},
      ${siteConfig.domain},
      ${{
        description: siteConfig.description,
        logo_url: siteConfig.logo_url,
        favicon_url: siteConfig.favicon_url,
        plugins: siteConfig.plugins,
        navigation,
      }}::jsonb
    )
    ON CONFLICT (tenant_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      domain = EXCLUDED.domain,
      settings = EXCLUDED.settings
    RETURNING id
  `;

  console.log(`[seed] Site ID: ${site.id}`);
  return site.id;
}

async function seedTheme(sql: ReturnType<typeof import('postgres').default>, siteId: string, tenantId: string) {
  console.log('[seed] Creating theme: netrun-dark...');

  await sql`
    INSERT INTO cms_themes (site_id, tenant_id, name, preset, tokens)
    VALUES (
      ${siteId},
      ${tenantId},
      'Netrun Dark',
      'netrun-dark',
      ${siteConfig.theme.colors}::jsonb
    )
    ON CONFLICT (site_id) DO UPDATE SET
      name = EXCLUDED.name,
      preset = EXCLUDED.preset,
      tokens = EXCLUDED.tokens
  `;

  console.log('[seed] Theme created.');
}

async function seedPages(sql: ReturnType<typeof import('postgres').default>, siteId: string, tenantId: string) {
  console.log(`[seed] Creating ${pages.length} pages...`);

  for (const page of pages) {
    // Create page
    const [dbPage] = await sql`
      INSERT INTO cms_pages (site_id, tenant_id, title, slug, path, meta_description, is_published, sort_order)
      VALUES (
        ${siteId},
        ${tenantId},
        ${page.title},
        ${page.slug},
        ${page.path},
        ${page.description},
        ${page.is_published},
        ${pages.indexOf(page)}
      )
      ON CONFLICT (site_id, slug) DO UPDATE SET
        title = EXCLUDED.title,
        path = EXCLUDED.path,
        meta_description = EXCLUDED.meta_description,
        is_published = EXCLUDED.is_published
      RETURNING id
    `;

    // Create content blocks for this page
    for (const block of page.blocks) {
      await sql`
        INSERT INTO cms_content_blocks (page_id, tenant_id, block_type, props, sort_order)
        VALUES (
          ${dbPage.id},
          ${tenantId},
          ${block.type},
          ${block.props}::jsonb,
          ${block.order}
        )
        ON CONFLICT DO NOTHING
      `;
    }

    console.log(`[seed]   Page: ${page.title} (${page.path}) — ${page.blocks.length} blocks`);
  }
}

async function seedBlogPosts(sql: ReturnType<typeof import('postgres').default>, siteId: string, tenantId: string) {
  console.log('[seed] Seeding blog posts...');

  // Create a default blog author
  const [author] = await sql`
    INSERT INTO cms_blog_authors (tenant_id, display_name, bio)
    VALUES (
      ${tenantId},
      'Netrun Systems',
      'Technical articles and research from the Netrun Systems engineering team.'
    )
    ON CONFLICT (tenant_id, user_id) DO NOTHING
    RETURNING id
  `;

  const authorId = author?.id;

  // Seed posts representing the 12 articles from the original NetrunSite blog.
  // Content is placeholder — the actual migration should pull from the NetrunSite
  // posts table or export. These titles match the known published articles.
  const blogPosts = [
    {
      title: 'Introducing KAMERA: AI-Powered 3D Scanning',
      slug: 'introducing-kamera-ai-3d-scanning',
      excerpt: 'How we built an AI pipeline that turns smartphone photos into engineering-grade 3D models.',
      status: 'published',
    },
    {
      title: 'Multi-Tenant Architecture with PostgreSQL RLS',
      slug: 'multi-tenant-postgresql-rls',
      excerpt: 'Row-level security patterns for SaaS platforms that need true tenant isolation.',
      status: 'published',
    },
    {
      title: 'Building Sigil: A Plugin-First CMS Framework',
      slug: 'building-sigil-plugin-first-cms',
      excerpt: 'Why we built our own CMS and how plugin architecture enables rapid product development.',
      status: 'published',
    },
    {
      title: 'DevSecOps for Startups: Pragmatic Security',
      slug: 'devsecops-startups-pragmatic-security',
      excerpt: 'Security practices that protect without slowing you down. SOC2 readiness on a bootstrap budget.',
      status: 'published',
    },
    {
      title: 'Azure to GCP Migration: Lessons Learned',
      slug: 'azure-gcp-migration-lessons',
      excerpt: 'How we migrated 5 production services from Azure VMs to GCP Cloud Run and cut costs 90%.',
      status: 'published',
    },
    {
      title: 'The Agentic Development Methodology',
      slug: 'agentic-development-methodology',
      excerpt: 'AI agents as development team members. How we ship production software 5-10x faster.',
      status: 'published',
    },
    {
      title: 'Intirkon: BI for Managed Service Providers',
      slug: 'intirkon-bi-managed-service-providers',
      excerpt: 'Why MSPs need tenant-isolated analytics and how Intirkon delivers it.',
      status: 'published',
    },
    {
      title: 'Autonomous Social Media with Intirkast',
      slug: 'autonomous-social-media-intirkast',
      excerpt: 'AI-generated content, scheduled publishing, and autonomous social media management.',
      status: 'published',
    },
    {
      title: 'RAG Pipelines in Production: Beyond the Demo',
      slug: 'rag-pipelines-production',
      excerpt: 'Retrieval-augmented generation for real workloads. pgvector, embeddings, and query strategies.',
      status: 'published',
    },
    {
      title: 'Infrastructure Cost Discipline',
      slug: 'infrastructure-cost-discipline',
      excerpt: 'How a $17K cloud bill taught us to treat infrastructure costs as a first-class engineering concern.',
      status: 'published',
    },
    {
      title: 'K0DE: Proof of Capability, Not a Promise',
      slug: 'kode-proof-of-capability',
      excerpt: 'Our portfolio is the pitch. K0DE demonstrates what AI-assisted development can deliver.',
      status: 'published',
    },
    {
      title: 'Building for Revenue: The Deploy-First Philosophy',
      slug: 'building-for-revenue-deploy-first',
      excerpt: 'Why 33 commits in staging creates zero value. Deploy triggers are the bottleneck.',
      status: 'published',
    },
  ];

  for (const post of blogPosts) {
    await sql`
      INSERT INTO cms_blog_posts (
        tenant_id, site_id, title, slug, excerpt, content, status,
        author_id, published_at, reading_time_minutes
      )
      VALUES (
        ${tenantId},
        ${siteId},
        ${post.title},
        ${post.slug},
        ${post.excerpt},
        ${`# ${post.title}\n\n${post.excerpt}\n\n*Full content to be migrated from NetrunSite posts table.*`},
        ${post.status},
        ${authorId},
        NOW(),
        ${Math.floor(Math.random() * 8) + 3}
      )
      ON CONFLICT (site_id, slug) DO UPDATE SET
        title = EXCLUDED.title,
        excerpt = EXCLUDED.excerpt
    `;
  }

  console.log(`[seed] Seeded ${blogPosts.length} blog posts.`);
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log('=== NetrunSite Sigil CMS Seed ===\n');
  console.log(`Database: ${DATABASE_URL.replace(/:[^@]+@/, ':***@')}\n`);

  const { sql } = await getDb();

  try {
    const tenantId = await seedTenant(sql);
    const siteId = await seedSite(sql, tenantId);
    await seedTheme(sql, siteId, tenantId);
    await seedPages(sql, siteId, tenantId);
    await seedBlogPosts(sql, siteId, tenantId);

    console.log('\n=== Seed Complete ===');
    console.log(`Site "${siteConfig.name}" (slug: ${siteConfig.slug}) ready.`);
    console.log(`Admin: http://localhost:3004`);
    console.log(`Public API: /api/v1/public/*/${siteConfig.slug}`);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
