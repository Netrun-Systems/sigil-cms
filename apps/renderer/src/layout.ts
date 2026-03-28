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
  ga4MeasurementId?: string;
  supportWidgetUrl?: string;
  template?: string;
  pageSlug?: string;
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
    ga4MeasurementId,
    supportWidgetUrl,
    template,
    pageSlug,
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
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "${esc(displayName)}",
    "url": "https://netrunsystems.com",
    "logo": "https://netrunsystems.com/static/N_LOGO_W_small.webp"
  }
  </script>
  ${(template === 'product' || (pageSlug && pageSlug.startsWith('products/'))) ? `<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "${esc(title)}",
    "description": "${esc(description)}"
  }
  </script>` : ''}
  ${fontLinks}
  <style>
${cssVariables}
${componentStyles}
${customCss}
  </style>
</head>
<body>
  <nav class="sigil-nav" id="sigil-nav">
    <div class="sigil-nav-inner">
      <a href="/" class="sigil-nav-brand">
        <img src="/static/N_LOGO_W_small.webp" alt="${esc(displayName)}" class="sigil-nav-logo" width="48" height="48">
      </a>
      ${navigation.length > 0 ? `<ul class="sigil-nav-links sigil-nav-desktop">
          ${navLinks}
        </ul>` : ''}
      <button class="sigil-nav-hamburger" onclick="document.getElementById('sigil-nav').classList.toggle('nav-open')" aria-label="Toggle menu">
        <span></span><span></span><span></span>
      </button>
    </div>
    ${navigation.length > 0 ? `<ul class="sigil-nav-links sigil-nav-mobile">
        ${navLinks}
      </ul>` : ''}
  </nav>

  <main>
    ${body}
  </main>

  <footer class="sigil-footer">
    <div class="sigil-footer-grid">
      <div class="sigil-footer-col">
        <a href="/" class="sigil-footer-brand">
          <img src="/static/N_LOGO_W_small.webp" alt="${esc(displayName)}" width="40" height="40">
        </a>
        <p class="sigil-footer-tagline">Cloud infrastructure, AI platforms, and developer tools.</p>
        <p class="sigil-footer-location">Based in Ojai, California</p>
        <p class="sigil-footer-copy">&copy; ${new Date().getFullYear()} Netrun Systems, Inc.</p>
      </div>
      <div class="sigil-footer-col">
        <h4>Products</h4>
        <ul>
          <li><a href="/products/intirkon">Intirkon</a></li>
          <li><a href="/products/intirkast">Intirkast</a></li>
          <li><a href="/products/kamera">KAMERA</a></li>
          <li><a href="/products/kog-crm">KOG CRM</a></li>
          <li><a href="/products/charlotte">Charlotte</a></li>
          <li><a href="/products/optikal">Optikal</a></li>
        </ul>
      </div>
      <div class="sigil-footer-col">
        <h4>Services</h4>
        <ul>
          <li><a href="/services/cloud-audit">Cloud Audit</a></li>
          <li><a href="/services/ai-assessment">AI Assessment</a></li>
          <li><a href="/services/agentic-coding">Agentic Coding</a></li>
          <li><a href="/services/virtual-tours">Virtual Tours</a></li>
        </ul>
      </div>
      <div class="sigil-footer-col">
        <h4>Company</h4>
        <ul>
          <li><a href="/about">About</a></li>
          <li><a href="/blog">Blog</a></li>
          <li><a href="/contact">Contact</a></li>
          <li><a href="/research">Research</a></li>
          <li><a href="/events">Events</a></li>
        </ul>
        <h4 class="sigil-footer-legal-heading">Legal</h4>
        <ul>
          <li><a href="/privacy">Privacy Policy</a></li>
          <li><a href="/terms">Terms of Service</a></li>
        </ul>
        <div class="sigil-footer-social">
          <a href="https://www.linkedin.com/company/netrunsystems" target="_blank" rel="noopener" aria-label="LinkedIn">LinkedIn</a>
          <a href="https://github.com/netrunsystems" target="_blank" rel="noopener" aria-label="GitHub">GitHub</a>
        </div>
      </div>
    </div>
    <div class="sigil-footer-bottom">
      <p>Powered by <a href="https://netrun.net" target="_blank" rel="noopener">Sigil CMS</a></p>
    </div>
  </footer>

  <!-- Lightbox for screenshot zoom -->
  <div id="sigil-lightbox" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.9);cursor:pointer;align-items:center;justify-content:center" onclick="this.style.display='none'">
    <img id="sigil-lightbox-img" style="max-width:90vw;max-height:90vh;border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.5)">
    <button style="position:absolute;top:1rem;right:1rem;background:none;border:none;color:#fff;font-size:2rem;cursor:pointer">&times;</button>
  </div>
  <script>
  document.querySelectorAll('.sigil-feature-image img').forEach(function(img) {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var lb = document.getElementById('sigil-lightbox');
      document.getElementById('sigil-lightbox-img').src = this.src;
      lb.style.display = 'flex';
    });
  });
  </script>
  <script>
  // Nav scroll effect — green → black on scroll (matches pre-Sigil NetrunSite)
  (function() {
    var nav = document.getElementById('sigil-nav');
    if (!nav) return;
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) { nav.classList.add('scrolled'); }
      else { nav.classList.remove('scrolled'); }
    });
  })();
  </script>
  <script src="/api/v1/public/resonance/${encodeURIComponent(siteSlug)}/snippet.js" async defer></script>
  ${ga4MeasurementId ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(ga4MeasurementId)}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${esc(ga4MeasurementId)}')</script>` : ''}
  ${supportWidgetUrl ? `<script src="${esc(supportWidgetUrl)}" async></script>` : ''}
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
  ga4MeasurementId?: string;
  supportWidgetUrl?: string;
}): string {
  const body = `<section class="sigil-404">
  <div class="sigil-404-inner">
    <img src="/static/N_LOGO_W_small.webp" alt="Netrun Systems" class="sigil-404-logo" width="80" height="80">
    <h1>404 &mdash; Page Not Found</h1>
    <p>The page you're looking for doesn't exist or has been moved.</p>
    <nav class="sigil-404-nav">
      <a href="/" class="sigil-btn sigil-btn-primary">Home</a>
      <a href="/products" class="sigil-btn sigil-btn-secondary">Products</a>
      <a href="/services" class="sigil-btn sigil-btn-secondary">Services</a>
      <a href="/contact" class="sigil-btn sigil-btn-secondary">Contact</a>
    </nav>
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
    ga4MeasurementId: options.ga4MeasurementId,
    supportWidgetUrl: options.supportWidgetUrl,
  });
}
