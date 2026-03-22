/**
 * Wiki Engine — Native wiki features built on our content model.
 *
 * - Markdown content with [[wiki link]] syntax
 * - Backlink tracking via docs_wiki_links table
 * - Page tree builder for nested hierarchy
 * - Full-text search via PostgreSQL to_tsvector
 * - Table of contents generation from headings
 */

import { eq, and, sql, desc, asc, ilike, or } from 'drizzle-orm';
import {
  docsWikiPages,
  docsWikiLinks,
  docsWikiPageRevisions,
} from '../schema.js';

// Regex to match [[Page Name]] or [[Page Name|display text]]
const WIKI_LINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

export interface WikiLink {
  target: string; // page title/slug referenced
  displayText: string; // text to show (defaults to target)
}

export interface TocEntry {
  level: number; // 1-6
  text: string;
  slug: string;
}

export interface PageTreeNode {
  id: string;
  title: string;
  slug: string;
  status: string;
  order: number;
  parentId: string | null;
  children: PageTreeNode[];
}

/**
 * Parse [[wiki links]] from markdown content.
 */
export function parseWikiLinks(content: string): WikiLink[] {
  const links: WikiLink[] = [];
  let match: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((match = WIKI_LINK_RE.exec(content)) !== null) {
    const target = match[1].trim();
    const displayText = match[2]?.trim() || target;
    const key = target.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      links.push({ target, displayText });
    }
  }
  return links;
}

/**
 * Render [[wiki links]] in markdown to HTML anchor tags.
 * Links are resolved to /wiki/:wikiSlug/:pageSlug
 */
export function renderWikiLinks(content: string, wikiSlug: string): string {
  return content.replace(WIKI_LINK_RE, (_match, target: string, display?: string) => {
    const slug = slugify(target.trim());
    const text = display?.trim() || target.trim();
    return `[${text}](/wiki/${wikiSlug}/${slug})`;
  });
}

/**
 * Generate table of contents from markdown headings.
 */
export function generateToc(content: string): TocEntry[] {
  const headingRe = /^(#{1,6})\s+(.+)$/gm;
  const toc: TocEntry[] = [];
  let match: RegExpExecArray | null;
  while ((match = headingRe.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    toc.push({ level, text, slug: slugify(text) });
  }
  return toc;
}

/**
 * Convert a string to a URL-safe slug.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Build a nested page tree from a flat list of pages.
 */
export function buildPageTree(pages: Array<{
  id: string;
  title: string;
  slug: string;
  status: string;
  order: number;
  parentId: string | null;
}>): PageTreeNode[] {
  const nodeMap = new Map<string, PageTreeNode>();

  // Create all nodes
  for (const page of pages) {
    nodeMap.set(page.id, {
      id: page.id,
      title: page.title,
      slug: page.slug,
      status: page.status,
      order: page.order,
      parentId: page.parentId,
      children: [],
    });
  }

  // Build hierarchy
  const roots: PageTreeNode[] = [];
  for (const node of nodeMap.values()) {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort children by order
  const sortChildren = (nodes: PageTreeNode[]) => {
    nodes.sort((a, b) => a.order - b.order);
    for (const node of nodes) {
      sortChildren(node.children);
    }
  };
  sortChildren(roots);

  return roots;
}

/**
 * Update backlinks for a page after content change.
 * Parses [[wiki links]] from content and syncs docs_wiki_links.
 */
export async function syncBacklinks(
  db: any,
  pageId: string,
  wikiId: string,
  content: string,
): Promise<void> {
  const links = parseWikiLinks(content);

  // Delete existing outgoing links
  await db.delete(docsWikiLinks)
    .where(eq(docsWikiLinks.sourcePageId, pageId));

  if (links.length === 0) return;

  // Find target pages by title or slug within the same wiki
  for (const link of links) {
    const slug = slugify(link.target);
    const [targetPage] = await db.select({ id: docsWikiPages.id })
      .from(docsWikiPages)
      .where(and(
        eq(docsWikiPages.wikiId, wikiId),
        or(
          ilike(docsWikiPages.title, link.target),
          eq(docsWikiPages.slug, slug),
        ),
      ))
      .limit(1);

    if (targetPage) {
      await db.insert(docsWikiLinks)
        .values({
          sourcePageId: pageId,
          targetPageId: targetPage.id,
          linkText: link.displayText,
        })
        .onConflictDoNothing();
    }
  }
}

/**
 * Create a revision snapshot of a page before update.
 */
export async function createRevision(
  db: any,
  pageId: string,
  title: string,
  content: string,
  authorId: string | null,
): Promise<void> {
  // Get current max revision number
  const [maxRev] = await db.select({
    maxNum: sql<number>`COALESCE(MAX(${docsWikiPageRevisions.revisionNumber}), 0)`,
  }).from(docsWikiPageRevisions)
    .where(eq(docsWikiPageRevisions.pageId, pageId));

  const nextNum = (maxRev?.maxNum ?? 0) + 1;

  await db.insert(docsWikiPageRevisions).values({
    pageId,
    title,
    content,
    authorId,
    revisionNumber: nextNum,
  });
}

/**
 * Full-text search across wiki pages using PostgreSQL to_tsvector.
 */
export function buildSearchQuery(query: string) {
  // Sanitize for tsquery — convert spaces to & for AND matching
  const sanitized = query
    .replace(/[^\w\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join(' & ');

  return sql`
    to_tsvector('english', ${docsWikiPages.title} || ' ' || COALESCE(${docsWikiPages.content}, ''))
    @@ to_tsquery('english', ${sanitized})
  `;
}

export function searchRank(query: string) {
  const sanitized = query
    .replace(/[^\w\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join(' & ');

  return sql<number>`
    ts_rank(
      to_tsvector('english', ${docsWikiPages.title} || ' ' || COALESCE(${docsWikiPages.content}, '')),
      to_tsquery('english', ${sanitized})
    )
  `;
}
