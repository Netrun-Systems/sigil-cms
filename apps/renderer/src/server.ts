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
import { handleSignup } from './signup.js';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);
const SITE_SLUG = process.env.SITE_SLUG || 'default';
const SITE_NAME = process.env.SITE_NAME || '';
const API_BASE = process.env.API_URL || 'http://localhost:3001/api/v1/public';

// --- Domain → Site Slug Cache ---
// Maps custom domains to site slugs with a 5-minute TTL.

interface DomainCacheEntry {
  siteSlug: string;
  fetchedAt: number;
}

const DOMAIN_CACHE_TTL = 5 * 60_000; // 5 minutes
const domainCache = new Map<string, DomainCacheEntry>();

async function resolveSiteSlug(host: string): Promise<string> {
  // Strip port from host header
  const domain = host.split(':')[0].toLowerCase();

  // Skip lookup for localhost / IP addresses
  if (domain === 'localhost' || domain === '127.0.0.1' || domain.startsWith('192.168.')) {
    return SITE_SLUG;
  }

  // Check cache
  const cached = domainCache.get(domain);
  if (cached && Date.now() - cached.fetchedAt < DOMAIN_CACHE_TTL) {
    return cached.siteSlug;
  }

  // Look up domain via public API
  try {
    const res = await fetch(`${API_BASE}/sites/by-domain/${encodeURIComponent(domain)}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (res.ok) {
      const json = await res.json() as { success: boolean; data: { slug: string } };
      if (json.success && json.data?.slug) {
        domainCache.set(domain, { siteSlug: json.data.slug, fetchedAt: Date.now() });
        return json.data.slug;
      }
    }
  } catch (err) {
    console.error(`Domain lookup failed for ${domain}:`, err);
  }

  // Fall back to env var
  return SITE_SLUG;
}

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

// --- Signup / Payment Redirect ---
// Routes /signup?plan=<plan> to the appropriate Stripe Payment Link.
// Source of truth: boardroom/reports/payment_links_registry.md

app.get('/signup', handleSignup);

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

// Catch-all route for pages
app.get('*', async (req, res) => {
  const fullPath = req.path;
  
  // Skip static assets and API-like paths
  if (fullPath.startsWith('/static') || fullPath.startsWith('/api') || fullPath.startsWith('/favicon')) {
    return;
  }

  // Normalize path to slug (remove leading/trailing slashes)
  // "/" -> "home"
  // "/features" -> "features"
  // "/features/multi-tenant" -> "features/multi-tenant"
  let pageSlug = fullPath.replace(/^\/+|\/+$/g, '');
  if (pageSlug === '') pageSlug = 'home';

  try {
    const siteSlug = await resolveSiteSlug(req.headers.host || '');
    const [theme, navigation] = await Promise.all([getTheme(), getNavigation()]);
    
    // Fetch page by slug — try full path first, then just the leaf slug
    let page = await fetchPage(siteSlug, pageSlug);
    if (!page && pageSlug.includes('/')) {
      // For nested paths like "features/hero-block", try just "hero-block"
      const leafSlug = pageSlug.split('/').pop()!;
      page = await fetchPage(siteSlug, leafSlug);
    }

    if (!page) {
      // Fallback: if we requested "/" and "home" doesn't exist, try the first navigation item
      if (pageSlug === 'home' && navigation.length > 0) {
        const firstSlug = navigation[0].href.replace(/^\/+|\/+$/g, '');
        if (firstSlug && firstSlug !== 'home') {
          const fallbackPage = await fetchPage(siteSlug, firstSlug);
          if (fallbackPage) {
            // ... render fallbackPage
          }
        }
      }

      res.status(404).send(render404({
        cssVariables: theme.cssVariables,
        fontLinks: theme.fontLinks,
        siteSlug,
        siteName: SITE_NAME,
        navigation,
        customCss: theme.customCss,
      }));
      return;
    }

    const blocksHtml = renderBlocks(page.blocks || [], siteSlug);
    const html = renderLayout({
      title: page.metaTitle || page.title,
      description: page.metaDescription || '',
      ogImage: page.ogImageUrl,
      cssVariables: theme.cssVariables,
      fontLinks: theme.fontLinks,
      body: blocksHtml,
      siteSlug,
      siteName: SITE_NAME,
      navigation,
      currentPath: fullPath,
      customCss: theme.customCss,
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error(`Error rendering page ${fullPath}:`, err);
    res.status(500).send('<h1>500 - Internal Server Error</h1>');
  }
});

// --- Start ---

app.listen(PORT, () => {
  console.log(`Sigil Renderer listening on http://localhost:${PORT}`);
  console.log(`  Site: ${SITE_SLUG}`);
  console.log(`  API:  ${process.env.API_URL || 'http://localhost:3001/api/v1/public'}`);
});
