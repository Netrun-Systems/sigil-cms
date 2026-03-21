/**
 * HTML Document Layout
 *
 * Wraps rendered page content in a complete HTML document
 * with navigation, meta tags, theme styles, and footer.
 */

import { componentStyles } from './theme.js';

function esc(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface LayoutOptions {
  title: string;
  description: string;
  ogImage?: string;
  cssVariables: string;
  fontLinks: string;
  body: string;
  siteSlug: string;
  siteName?: string;
  navigation?: { label: string; href: string }[];
  currentPath?: string;
  customCss?: string;
  favicon?: string;
}

export function renderLayout(options: LayoutOptions): string {
  const {
    title,
    description,
    ogImage,
    cssVariables,
    fontLinks,
    body,
    siteSlug,
    siteName,
    navigation = [],
    currentPath = '/',
    customCss = '',
    favicon,
  } = options;

  const navLinks = navigation.map(link => {
    const active = link.href === currentPath ? ' class="active"' : '';
    return `<li><a href="${esc(link.href)}"${active}>${esc(link.label)}</a></li>`;
  }).join('\n          ');

  const displayName = siteName || siteSlug;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="website">
  ${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : ''}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  ${ogImage ? `<meta name="twitter:image" content="${esc(ogImage)}">` : ''}
  ${favicon ? `<link rel="icon" href="${esc(favicon)}">` : ''}
  <meta name="generator" content="Sigil CMS">
  ${fontLinks}
  <style>
${cssVariables}
${componentStyles}
${customCss}
  </style>
</head>
<body>
  <nav class="sigil-nav">
    <div class="sigil-nav-inner">
      <a href="/" class="sigil-nav-brand">${esc(displayName)}</a>
      ${navigation.length > 0 ? `<ul class="sigil-nav-links">
          ${navLinks}
        </ul>` : ''}
    </div>
  </nav>

  <main>
    ${body}
  </main>

  <footer class="sigil-footer">
    <div class="sigil-container">
      <p>&copy; ${new Date().getFullYear()} ${esc(displayName)}. Powered by <a href="https://netrun.net" target="_blank" rel="noopener">Sigil CMS</a></p>
    </div>
  </footer>

  <script src="/api/v1/public/resonance/${encodeURIComponent(siteSlug)}/snippet.js" async defer></script>
</body>
</html>`;
}

/**
 * Render a 404 page with consistent styling.
 */
export function render404(options: {
  cssVariables: string;
  fontLinks: string;
  siteSlug: string;
  siteName?: string;
  navigation?: { label: string; href: string }[];
  customCss?: string;
}): string {
  const body = `<section class="sigil-hero" style="min-height:60vh">
  <div class="sigil-hero-content">
    <h1>404</h1>
    <p class="sigil-hero-subtitle">Page not found. The page you're looking for doesn't exist or has been moved.</p>
    <div class="sigil-hero-actions">
      <a href="/" class="sigil-btn sigil-btn-primary">Go Home</a>
    </div>
  </div>
</section>`;

  return renderLayout({
    title: '404 — Page Not Found',
    description: 'The requested page could not be found.',
    cssVariables: options.cssVariables,
    fontLinks: options.fontLinks,
    body,
    siteSlug: options.siteSlug,
    siteName: options.siteName,
    navigation: options.navigation,
    currentPath: '/404',
    customCss: options.customCss,
  });
}
