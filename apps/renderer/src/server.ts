/**
 * Sigil CMS Renderer
 *
 * Lightweight Express server that fetches content from the Sigil API
 * and renders full HTML pages for public visitors.
 *
 * Architecture: Visitor -> renderer (port 4000) -> api (port 3001) -> PostgreSQL
 */

import express from 'express';
import path from 'path';
import { fetchPage, fetchTheme, fetchSitePages } from './api-client.js';
import type { ThemeData, PageData } from './api-client.js';
import { themeToCss, themeToFontLinks } from './theme.js';
import { renderBlocks } from './render.js';
import { renderLayout, render404 } from './layout.js';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);
const SITE_SLUG = process.env.SITE_SLUG || 'default';
const SITE_NAME = process.env.SITE_NAME || '';

// --- Theme Cache ---
// Theme is fetched once and cached until TTL expires or server restarts.

interface ThemeCache {
  data: ThemeData | null;
  cssVariables: string;
  fontLinks: string;
  customCss: string;
  fetchedAt: number;
}

const THEME_TTL = 60_000; // 1 minute
let themeCache: ThemeCache | null = null;

async function getTheme(): Promise<ThemeCache> {
  const now = Date.now();
  if (themeCache && now - themeCache.fetchedAt < THEME_TTL) {
    return themeCache;
  }

  const theme = await fetchTheme(SITE_SLUG);
  const tokens = theme?.tokens || {
    colors: { primary: '#90b9ab', background: '#0A0A0A', text: '#FFFFFF' },
    typography: { fontFamily: "'Inter', system-ui, sans-serif" },
  };

  themeCache = {
    data: theme,
    cssVariables: themeToCss(tokens),
    fontLinks: themeToFontLinks(tokens),
    customCss: theme?.customCss || '',
    fetchedAt: now,
  };

  return themeCache;
}

// --- Navigation Cache ---

interface NavCache {
  items: { label: string; href: string }[];
  fetchedAt: number;
}

const NAV_TTL = 60_000;
let navCache: NavCache | null = null;

async function getNavigation(): Promise<{ label: string; href: string }[]> {
  const now = Date.now();
  if (navCache && now - navCache.fetchedAt < NAV_TTL) {
    return navCache.items;
  }

  const pages = await fetchSitePages(SITE_SLUG);
  const items = pages
    .filter((p: PageData) => p.status === 'published')
    .sort((a: PageData, b: PageData) => a.sortOrder - b.sortOrder)
    .map((p: PageData) => ({
      label: p.title,
      href: p.slug === 'home' ? '/' : `/${p.slug}`,
    }));

  navCache = { items, fetchedAt: now };
  return items;
}

// --- Static Assets ---

app.use('/static', express.static(path.join(process.cwd(), 'static'), {
  maxAge: '1d',
  immutable: true,
}));

// --- Health Check ---

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'sigil-renderer', site: SITE_SLUG });
});

// --- Favicon ---

app.get('/favicon.ico', (_req, res) => {
  res.status(204).end();
});

// --- Page Routes ---

// Homepage
app.get('/', async (_req, res) => {
  try {
    const [theme, navigation] = await Promise.all([getTheme(), getNavigation()]);

    // Try 'home' slug first, then fall back to first published page
    let page = await fetchPage(SITE_SLUG, 'home');

    if (!page && navigation.length > 0) {
      const firstSlug = navigation[0].href === '/' ? 'home' : navigation[0].href.replace('/', '');
      if (firstSlug !== 'home') {
        page = await fetchPage(SITE_SLUG, firstSlug);
      }
    }

    if (!page) {
      res.status(404).send(render404({
        cssVariables: theme.cssVariables,
        fontLinks: theme.fontLinks,
        siteSlug: SITE_SLUG,
        siteName: SITE_NAME,
        navigation,
        customCss: theme.customCss,
      }));
      return;
    }

    const blocksHtml = renderBlocks(page.blocks || [], SITE_SLUG);
    const html = renderLayout({
      title: page.metaTitle || page.title,
      description: page.metaDescription || '',
      ogImage: page.ogImageUrl,
      cssVariables: theme.cssVariables,
      fontLinks: theme.fontLinks,
      body: blocksHtml,
      siteSlug: SITE_SLUG,
      siteName: SITE_NAME,
      navigation,
      currentPath: '/',
      customCss: theme.customCss,
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('Error rendering homepage:', err);
    res.status(500).send('<h1>500 - Internal Server Error</h1>');
  }
});

// Page by slug
app.get('/:pageSlug', async (req, res) => {
  const { pageSlug } = req.params;

  // Skip API-like paths
  if (pageSlug.startsWith('api') || pageSlug.startsWith('_')) {
    res.status(404).send('Not found');
    return;
  }

  try {
    const [theme, navigation] = await Promise.all([getTheme(), getNavigation()]);
    const page = await fetchPage(SITE_SLUG, pageSlug);

    if (!page) {
      res.status(404).send(render404({
        cssVariables: theme.cssVariables,
        fontLinks: theme.fontLinks,
        siteSlug: SITE_SLUG,
        siteName: SITE_NAME,
        navigation,
        customCss: theme.customCss,
      }));
      return;
    }

    const blocksHtml = renderBlocks(page.blocks || [], SITE_SLUG);
    const html = renderLayout({
      title: page.metaTitle || page.title,
      description: page.metaDescription || '',
      ogImage: page.ogImageUrl,
      cssVariables: theme.cssVariables,
      fontLinks: theme.fontLinks,
      body: blocksHtml,
      siteSlug: SITE_SLUG,
      siteName: SITE_NAME,
      navigation,
      currentPath: `/${pageSlug}`,
      customCss: theme.customCss,
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error(`Error rendering page /${pageSlug}:`, err);
    res.status(500).send('<h1>500 - Internal Server Error</h1>');
  }
});

// --- Start ---

app.listen(PORT, () => {
  console.log(`Sigil Renderer listening on http://localhost:${PORT}`);
  console.log(`  Site: ${SITE_SLUG}`);
  console.log(`  API:  ${process.env.API_URL || 'http://localhost:3001/api/v1/public'}`);
});
