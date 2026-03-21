/**
 * Documentation content loader
 *
 * Reads markdown files from content/ with gray-matter frontmatter.
 * Used for static generation at build time.
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import gfm from 'remark-gfm';

const contentDir = path.join(process.cwd(), 'content');

export interface DocPage {
  slug: string;
  category: string;
  title: string;
  description: string;
  order: number;
  contentHtml: string;
}

export interface DocMeta {
  slug: string;
  category: string;
  title: string;
  description: string;
  order: number;
}

export interface NavCategory {
  slug: string;
  label: string;
  order: number;
  items: DocMeta[];
}

const CATEGORY_LABELS: Record<string, { label: string; order: number }> = {
  'getting-started': { label: 'Getting Started', order: 1 },
  'core-concepts': { label: 'Core Concepts', order: 2 },
  'developer-guide': { label: 'Developer Guide', order: 3 },
  plugins: { label: 'Plugins', order: 4 },
};

export function getAllDocSlugs(): { category: string; slug: string }[] {
  const slugs: { category: string; slug: string }[] = [];

  for (const category of fs.readdirSync(contentDir)) {
    const categoryPath = path.join(contentDir, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    for (const file of fs.readdirSync(categoryPath)) {
      if (!file.endsWith('.md')) continue;
      slugs.push({ category, slug: file.replace(/\.md$/, '') });
    }
  }

  return slugs;
}

export async function getDocBySlug(category: string, slug: string): Promise<DocPage> {
  const filePath = path.join(contentDir, category, `${slug}.md`);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  const processed = await remark().use(gfm).use(html, { sanitize: false }).process(content);

  return {
    slug,
    category,
    title: data.title || slug,
    description: data.description || '',
    order: data.order ?? 99,
    contentHtml: processed.toString(),
  };
}

export function getNavigation(): NavCategory[] {
  const nav: NavCategory[] = [];

  for (const category of fs.readdirSync(contentDir)) {
    const categoryPath = path.join(contentDir, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const catMeta = CATEGORY_LABELS[category] || { label: category, order: 99 };
    const items: DocMeta[] = [];

    for (const file of fs.readdirSync(categoryPath)) {
      if (!file.endsWith('.md')) continue;
      const fileContents = fs.readFileSync(path.join(categoryPath, file), 'utf8');
      const { data } = matter(fileContents);
      items.push({
        slug: file.replace(/\.md$/, ''),
        category,
        title: data.title || file.replace(/\.md$/, ''),
        description: data.description || '',
        order: data.order ?? 99,
      });
    }

    items.sort((a, b) => a.order - b.order);

    nav.push({
      slug: category,
      label: catMeta.label,
      order: catMeta.order,
      items,
    });
  }

  nav.sort((a, b) => a.order - b.order);
  return nav;
}
