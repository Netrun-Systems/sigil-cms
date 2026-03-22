/**
 * Feed generators — RSS 2.0, Atom 1.0, JSON Feed 1.1
 *
 * Produces standards-compliant feed XML/JSON from blog post data.
 */

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface FeedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  authorName: string | null;
  publishedAt: Date;
  categories: string[];
}

export interface FeedSite {
  title: string;
  description: string;
  baseUrl: string;
  language: string;
  siteSlug: string;
}

/**
 * Generate RSS 2.0 feed XML
 */
export function generateRss(site: FeedSite, posts: FeedPost[]): string {
  const selfUrl = `${site.baseUrl}/api/v1/public/blog/${site.siteSlug}/feed/rss`;

  let items = '';
  for (const p of posts) {
    const link = `${site.baseUrl}/blog/${p.slug}`;
    const categories = p.categories.map(c => `      <category>${escapeXml(c)}</category>`).join('\n');
    items += `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${escapeXml(link)}</link>
      <description>${escapeXml(p.excerpt || p.content.substring(0, 300))}</description>
      <pubDate>${p.publishedAt.toUTCString()}</pubDate>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
${categories ? categories + '\n' : ''}${p.authorName ? `      <author>${escapeXml(p.authorName)}</author>\n` : ''}    </item>\n`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(site.title)}</title>
    <link>${site.baseUrl}</link>
    <description>${escapeXml(site.description)}</description>
    <language>${site.language}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml"/>
${items}  </channel>
</rss>`;
}

/**
 * Generate Atom 1.0 feed XML
 */
export function generateAtom(site: FeedSite, posts: FeedPost[]): string {
  const selfUrl = `${site.baseUrl}/api/v1/public/blog/${site.siteSlug}/feed/atom`;

  let entries = '';
  for (const p of posts) {
    const link = `${site.baseUrl}/blog/${p.slug}`;
    const categories = p.categories.map(c => `      <category term="${escapeXml(c)}"/>`).join('\n');
    entries += `    <entry>
      <title>${escapeXml(p.title)}</title>
      <link href="${escapeXml(link)}"/>
      <id>${escapeXml(link)}</id>
      <updated>${p.publishedAt.toISOString()}</updated>
      <summary>${escapeXml(p.excerpt || p.content.substring(0, 300))}</summary>
${p.authorName ? `      <author><name>${escapeXml(p.authorName)}</name></author>\n` : ''}${categories ? categories + '\n' : ''}    </entry>\n`;
  }

  const updated = posts.length > 0 ? posts[0].publishedAt.toISOString() : new Date().toISOString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(site.title)}</title>
  <link href="${site.baseUrl}"/>
  <link href="${escapeXml(selfUrl)}" rel="self" type="application/atom+xml"/>
  <id>${site.baseUrl}/</id>
  <updated>${updated}</updated>
  <subtitle>${escapeXml(site.description)}</subtitle>
${entries}</feed>`;
}

/**
 * Generate JSON Feed 1.1
 */
export function generateJsonFeed(site: FeedSite, posts: FeedPost[]): object {
  return {
    version: 'https://jsonfeed.org/version/1.1',
    title: site.title,
    home_page_url: site.baseUrl,
    feed_url: `${site.baseUrl}/api/v1/public/blog/${site.siteSlug}/feed/json`,
    description: site.description,
    language: site.language,
    items: posts.map(p => ({
      id: `${site.baseUrl}/blog/${p.slug}`,
      url: `${site.baseUrl}/blog/${p.slug}`,
      title: p.title,
      content_text: p.content.substring(0, 2000),
      summary: p.excerpt || p.content.substring(0, 300),
      date_published: p.publishedAt.toISOString(),
      image: p.coverImage || undefined,
      authors: p.authorName ? [{ name: p.authorName }] : undefined,
      tags: p.categories.length > 0 ? p.categories : undefined,
    })),
  };
}

/**
 * Generate blog post sitemap XML
 */
export function generateSitemap(baseUrl: string, posts: { slug: string; updatedAt: Date }[]): string {
  let urls = '';
  for (const p of posts) {
    urls += `  <url>
    <loc>${escapeXml(baseUrl)}/blog/${escapeXml(p.slug)}</loc>
    <lastmod>${p.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
  </url>\n`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}</urlset>`;
}
