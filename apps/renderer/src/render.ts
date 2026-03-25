/**
 * Block-to-HTML Renderer
 *
 * Converts Sigil CMS content blocks into semantic HTML strings.
 * Each block type maps to a rendering function that produces
 * a self-contained <section> element.
 */

import { marked } from 'marked';
import type { BlockData } from './api-client.js';

// Configure marked for safe output
marked.setOptions({
  gfm: true,
  breaks: true,
});

function esc(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function blockClasses(block: BlockData, base: string): string {
  const classes = [base];
  const s = block.settings || {};
  if (s.padding) classes.push(`sigil-pad-${s.padding}`);
  if (s.background && s.background !== 'transparent') classes.push(`sigil-bg-${s.background}`);
  if (s.customClass) classes.push(String(s.customClass));
  return classes.join(' ');
}

function renderHero(block: BlockData): string {
  const c = block.content as Record<string, unknown>;
  const alignment = (c.alignment as string) || 'center';
  const alignClass = alignment !== 'center' ? ` align-${alignment}` : '';

  let bgHtml = '';
  if (c.backgroundImage) {
    bgHtml = `<div class="sigil-hero-bg" style="background-image: url('${esc(c.backgroundImage as string)}')"></div>`;
  }

  let actions = '';
  if (c.ctaText && c.ctaLink) {
    actions += `<a href="${esc(c.ctaLink as string)}" class="sigil-btn sigil-btn-primary">${esc(c.ctaText as string)}</a>`;
  }
  if (c.ctaSecondaryText && c.ctaSecondaryLink) {
    actions += `<a href="${esc(c.ctaSecondaryLink as string)}" class="sigil-btn sigil-btn-secondary">${esc(c.ctaSecondaryText as string)}</a>`;
  }

  return `<section class="${blockClasses(block, 'sigil-hero')}${alignClass}">
  ${bgHtml}
  <div class="sigil-hero-content">
    <h1>${esc(c.headline as string)}</h1>
    ${c.subheadline ? `<p class="sigil-hero-subtitle">${esc(c.subheadline as string)}</p>` : ''}
    ${actions ? `<div class="sigil-hero-actions">${actions}</div>` : ''}
  </div>
</section>`;
}

function renderText(block: BlockData): string {
  const c = block.content as Record<string, unknown>;
  const body = (c.body as string) || '';
  const format = (c.format as string) || 'markdown';

  let html: string;
  if (format === 'html') {
    html = body;
  } else if (format === 'plain') {
    html = `<p>${esc(body).replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
  } else {
    html = marked.parse(body) as string;
  }

  return `<section class="${blockClasses(block, 'sigil-text')}">
  <div class="sigil-text-inner">${html}</div>
</section>`;
}

function renderImage(block: BlockData): string {
  const c = block.content as Record<string, unknown>;
  const widthAttr = c.width ? ` width="${c.width}"` : '';
  const heightAttr = c.height ? ` height="${c.height}"` : '';

  return `<section class="${blockClasses(block, 'sigil-text')}">
  <div class="sigil-text-inner">
    <figure>
      <img src="${esc(c.src as string)}" alt="${esc(c.alt as string)}"${widthAttr}${heightAttr}>
      ${c.caption ? `<figcaption>${esc(c.caption as string)}</figcaption>` : ''}
    </figure>
  </div>
</section>`;
}

function renderFeatureGrid(block: BlockData): string {
  const c = block.content as Record<string, unknown>;
  const features = (c.features as Array<Record<string, unknown>>) || [];
  const cols = (c.columns as number) || 3;

  const cards = features.map(f => {
    const link = f.link ? ` onclick="window.location='${esc(f.link as string)}'"` : '';
    const imageHtml = f.image ? `<div class="sigil-feature-image"><img src="${esc(f.image as string)}" alt="${esc(f.title as string)}" loading="lazy"></div>` : '';
    return `<div class="sigil-feature-card"${link}>
      ${imageHtml}
      ${f.icon && !f.image ? `<div class="sigil-feature-icon">${esc(f.icon as string)}</div>` : ''}
      <h3>${esc(f.title as string)}</h3>
      <p>${esc(f.description as string)}</p>
    </div>`;
  }).join('\n    ');

  return `<section class="${blockClasses(block, 'sigil-features')}">
  ${c.headline ? `<div class="sigil-features-header"><h2>${esc(c.headline as string)}</h2></div>` : ''}
  <div class="sigil-grid" style="grid-template-columns: repeat(${cols}, 1fr)">
    ${cards}
  </div>
</section>`;
}

function renderGallery(block: BlockData): string {
  const c = block.content as Record<string, unknown>;
  const images = (c.images as Array<Record<string, unknown>>) || [];
  const columns = (c.columns as number) || 3;

  const items = images.map(img =>
    `<div class="sigil-gallery-item">
      <img src="${esc(img.src as string)}" alt="${esc(img.alt as string)}" loading="lazy">
      ${img.caption ? `<div class="sigil-gallery-caption">${esc(img.caption as string)}</div>` : ''}
    </div>`
  ).join('\n    ');

  return `<section class="${blockClasses(block, 'sigil-gallery')}">
  <div class="sigil-gallery-grid" style="grid-template-columns: repeat(${columns}, 1fr)">
    ${items}
  </div>
</section>`;
}

function renderCta(block: BlockData): string {
  const c = block.content as Record<string, unknown>;
  const variant = (c.buttonVariant as string) || 'primary';

  return `<section class="${blockClasses(block, 'sigil-cta')}">
  <div class="sigil-cta-inner">
    <h2>${esc(c.headline as string)}</h2>
    ${c.description ? `<p>${esc(c.description as string)}</p>` : ''}
    <a href="${esc(c.buttonLink as string)}" class="sigil-btn sigil-btn-${variant}">${esc(c.buttonText as string)}</a>
  </div>
</section>`;
}

function renderPricingTable(block: BlockData): string {
  const c = block.content as Record<string, unknown>;
  const tiers = (c.tiers as Array<Record<string, unknown>>) || [];

  const cards = tiers.map(tier => {
    const features = (tier.features as string[]) || [];
    const popular = tier.isPopular ? ' popular' : '';

    return `<div class="sigil-pricing-card${popular}">
      ${tier.isPopular ? '<div class="sigil-pricing-popular-badge">Most Popular</div>' : ''}
      <h3>${esc(tier.name as string)}</h3>
      <div class="sigil-pricing-price">${esc(tier.price as string)}</div>
      ${tier.period ? `<div class="sigil-pricing-period">${esc(tier.period as string)}</div>` : ''}
      ${tier.description ? `<p>${esc(tier.description as string)}</p>` : ''}
      <ul class="sigil-pricing-features">
        ${features.map(f => `<li>${esc(f)}</li>`).join('\n        ')}
      </ul>
      <a href="${esc(tier.ctaLink as string)}" class="sigil-btn sigil-btn-primary" style="width:100%;justify-content:center">${esc(tier.ctaText as string)}</a>
    </div>`;
  }).join('\n    ');

  return `<section class="${blockClasses(block, 'sigil-pricing')}">
  ${c.headline ? `<div class="sigil-pricing-header">
    <h2>${esc(c.headline as string)}</h2>
    ${c.description ? `<p>${esc(c.description as string)}</p>` : ''}
  </div>` : ''}
  <div class="sigil-pricing-grid">
    ${cards}
  </div>
</section>`;
}

function renderTestimonial(block: BlockData): string {
  const c = block.content as Record<string, unknown>;
  const testimonials = (c.testimonials as Array<Record<string, unknown>>) || [];

  const cards = testimonials.map(t => {
    const avatarHtml = t.avatar
      ? `<img class="sigil-testimonial-avatar" src="${esc(t.avatar as string)}" alt="${esc(t.author as string)}">`
      : '';

    return `<div class="sigil-testimonial-card">
      <div class="sigil-testimonial-quote">${esc(t.quote as string)}</div>
      <div class="sigil-testimonial-author">
        ${avatarHtml}
        <div>
          <div class="sigil-testimonial-name">${esc(t.author as string)}</div>
          ${t.role || t.company ? `<div class="sigil-testimonial-role">${esc(t.role as string)}${t.role && t.company ? ', ' : ''}${esc(t.company as string)}</div>` : ''}
        </div>
      </div>
    </div>`;
  }).join('\n    ');

  return `<section class="${blockClasses(block, 'sigil-testimonials')}">
  <div class="sigil-testimonial-grid">
    ${cards}
  </div>
</section>`;
}

function renderFaq(block: BlockData): string {
  const c = block.content as Record<string, unknown>;
  const items = (c.items as Array<Record<string, unknown>>) || [];

  const faqItems = items.map(item =>
    `<div class="sigil-faq-item">
      <div class="sigil-faq-question">${esc(item.question as string)}</div>
      <div class="sigil-faq-answer">${esc(item.answer as string)}</div>
    </div>`
  ).join('\n    ');

  return `<section class="${blockClasses(block, 'sigil-faq')}">
  ${c.headline ? `<div class="sigil-faq-header"><h2>${esc(c.headline as string)}</h2></div>` : ''}
  <div class="sigil-faq-list">
    ${faqItems}
  </div>
</section>`;
}

function renderContactForm(block: BlockData, siteSlug: string): string {
  const c = block.content as Record<string, unknown>;
  const fields = (c.fields as Array<Record<string, unknown>>) || [];
  const submitText = (c.submitText as string) || 'Send Message';
  const actionUrl = `/api/v1/public/plugins/contact/${siteSlug}/submit`;

  const fieldHtml = fields.map(field => {
    const name = esc(field.name as string);
    const label = esc(field.label as string);
    const placeholder = field.placeholder ? ` placeholder="${esc(field.placeholder as string)}"` : '';
    const required = field.required ? ' required' : '';
    const type = (field.type as string) || 'text';

    if (type === 'textarea') {
      return `<div class="sigil-form-field">
        <label for="${name}">${label}</label>
        <textarea id="${name}" name="${name}"${placeholder}${required}></textarea>
      </div>`;
    }
    if (type === 'select') {
      const options = (field.options as string[]) || [];
      return `<div class="sigil-form-field">
        <label for="${name}">${label}</label>
        <select id="${name}" name="${name}"${required}>
          <option value="">Select...</option>
          ${options.map(o => `<option value="${esc(o)}">${esc(o)}</option>`).join('\n          ')}
        </select>
      </div>`;
    }
    if (type === 'checkbox') {
      return `<div class="sigil-form-field sigil-form-checkbox">
        <input type="checkbox" id="${name}" name="${name}"${required}>
        <label for="${name}">${label}</label>
      </div>`;
    }
    return `<div class="sigil-form-field">
      <label for="${name}">${label}</label>
      <input type="${type}" id="${name}" name="${name}"${placeholder}${required}>
    </div>`;
  }).join('\n    ');

  return `<section class="${blockClasses(block, 'sigil-contact')}">
  <div class="sigil-contact-inner">
    ${c.headline ? `<h2>${esc(c.headline as string)}</h2>` : ''}
    ${c.description ? `<p class="sigil-contact-desc">${esc(c.description as string)}</p>` : ''}
    <form method="POST" action="${actionUrl}">
      ${fieldHtml}
      <button type="submit" class="sigil-btn sigil-btn-primary" style="width:100%;justify-content:center;margin-top:var(--sigil-space-md,1rem)">${esc(submitText)}</button>
    </form>
  </div>
</section>`;
}

function renderEmbed(block: BlockData): string {
  const c = block.content as Record<string, unknown>;
  const platform = (c.platform as string) || '';
  const url = (c.url as string) || '';
  const compact = c.compact as boolean;
  const title = (c.title as string) || '';

  let embedUrl = url;
  let height = compact ? '152' : '352';

  // Transform URLs to embed format
  if (platform === 'spotify') {
    embedUrl = url.replace('open.spotify.com/', 'open.spotify.com/embed/');
    height = compact ? '152' : '352';
  } else if (platform === 'youtube') {
    const match = url.match(/(?:youtu\.be\/|watch\?v=)([\w-]+)/);
    if (match) {
      embedUrl = `https://www.youtube.com/embed/${match[1]}`;
    }
    height = '400';
  } else if (platform === 'soundcloud') {
    embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=false`;
    height = compact ? '166' : '300';
  }

  return `<section class="${blockClasses(block, 'sigil-embed')}">
  <div class="sigil-embed-inner">
    ${title ? `<h3 style="margin-bottom:var(--sigil-space-md,1rem)">${esc(title)}</h3>` : ''}
    <iframe src="${esc(embedUrl)}" height="${height}" allow="encrypted-media; autoplay; clipboard-write" allowfullscreen loading="lazy" title="${esc(title || platform + ' embed')}"></iframe>
  </div>
</section>`;
}

function renderStatsBar(block: BlockData): string {
  const c = block.content as Record<string, unknown>;
  const stats = (c.stats as Array<Record<string, unknown>>) || [];

  const items = stats.map(s =>
    `<div class="sigil-stat-item">
      ${s.icon ? `<div class="sigil-stat-icon">${esc(s.icon as string)}</div>` : ''}
      <div class="sigil-stat-value">${esc(s.value as string)}</div>
      <div class="sigil-stat-label">${esc(s.label as string)}</div>
    </div>`
  ).join('\n    ');

  return `<section class="${blockClasses(block, 'sigil-stats')}">
  <div class="sigil-stats-grid">
    ${items}
  </div>
</section>`;
}

function renderTimeline(block: BlockData): string {
  const c = block.content as Record<string, unknown>;
  const items = (c.items as Array<Record<string, unknown>>) || [];

  const timelineItems = items.map(item =>
    `<div class="sigil-timeline-item">
      <div class="sigil-timeline-date">${esc(item.date as string)}</div>
      <h3>${esc(item.title as string)}</h3>
      <p>${esc(item.description as string)}</p>
    </div>`
  ).join('\n    ');

  return `<section class="${blockClasses(block, 'sigil-timeline')}">
  ${c.headline ? `<div class="sigil-timeline-header"><h2>${esc(c.headline as string)}</h2></div>` : ''}
  <div class="sigil-timeline-list">
    ${timelineItems}
  </div>
</section>`;
}

function renderProductGrid(block: BlockData): string {
  const c = block.content as Record<string, unknown>;
  const products = (c.products as Array<Record<string, unknown>>) || [];

  const cards = products.map(p =>
    `<div class="sigil-product-card">
      ${p.image ? `<img src="${esc(p.image as string)}" alt="${esc(p.name as string)}" loading="lazy">` : ''}
      <div class="sigil-product-info">
        <h3>${esc(p.name as string)}</h3>
        ${p.description ? `<p>${esc(p.description as string)}</p>` : ''}
        ${p.price ? `<div class="sigil-product-price">${esc(p.price as string)}</div>` : ''}
        ${p.buyLink ? `<a href="${esc(p.buyLink as string)}" class="sigil-btn sigil-btn-primary" style="margin-top:var(--sigil-space-sm,0.5rem);width:100%;justify-content:center">${esc((p.buyText as string) || 'Buy Now')}</a>` : ''}
      </div>
    </div>`
  ).join('\n    ');

  return `<section class="${blockClasses(block, 'sigil-products')}">
  <div class="sigil-product-grid">
    ${cards}
  </div>
</section>`;
}

function renderBookingCalendar(block: BlockData): string {
  const c = block.content as Record<string, unknown>;
  const heading = (c.headline as string) || 'Book a Session';
  const bookingUrl = (c.bookingUrl as string) || (c.url as string) || '#';
  const description = c.description as string;

  return `<section class="${blockClasses(block, 'sigil-booking')}">
  <div class="sigil-booking-inner">
    <h2>${esc(heading)}</h2>
    ${description ? `<p style="color:var(--sigil-text-secondary,#B8B8B8);margin:var(--sigil-space-md,1rem) 0">${esc(description)}</p>` : ''}
    <a href="${esc(bookingUrl)}" class="sigil-btn sigil-btn-primary" target="_blank" rel="noopener">Book Now</a>
  </div>
</section>`;
}

function renderSocialLinks(block: BlockData): string {
  const c = block.content as Record<string, unknown>;
  const links = (c.links as Array<Record<string, unknown>>) || [];
  const showLabels = c.showLabels !== false;

  const items = links.map(link =>
    `<a href="${esc(link.url as string)}" class="sigil-social-link" target="_blank" rel="noopener">
      ${link.icon ? `<span>${esc(link.icon as string)}</span>` : ''}
      ${showLabels ? `<span>${esc((link.label as string) || (link.platform as string) || '')}</span>` : ''}
    </a>`
  ).join('\n    ');

  return `<section class="${blockClasses(block, 'sigil-social-links')}">
  <div class="sigil-social-row">
    ${items}
  </div>
</section>`;
}

function renderLinkTree(block: BlockData): string {
  const c = block.content as Record<string, unknown>;
  const links = (c.links as Array<Record<string, unknown>>) || [];

  const linkItems = links.map(link => {
    const featured = link.featured ? ' featured' : '';
    return `<a href="${esc(link.url as string)}" class="sigil-linktree-link${featured}" target="_blank" rel="noopener">${esc(link.title as string)}</a>`;
  }).join('\n      ');

  return `<section class="${blockClasses(block, 'sigil-linktree')}">
  <div class="sigil-linktree-inner">
    ${c.showAvatar && c.avatarUrl ? `<img class="sigil-linktree-avatar" src="${esc(c.avatarUrl as string)}" alt="">` : ''}
    ${c.heading ? `<h2 class="sigil-linktree-heading">${esc(c.heading as string)}</h2>` : ''}
    ${c.subheading ? `<p class="sigil-linktree-sub">${esc(c.subheading as string)}</p>` : ''}
    <div class="sigil-linktree-links">
      ${linkItems}
    </div>
  </div>
</section>`;
}

function renderCodeBlock(block: BlockData): string {
  const c = block.content as Record<string, unknown>;
  const code = (c.code as string) || (c.body as string) || '';
  const language = (c.language as string) || '';

  return `<section class="${blockClasses(block, 'sigil-text')}">
  <div class="sigil-text-inner">
    <pre><code class="language-${esc(language)}">${esc(code)}</code></pre>
  </div>
</section>`;
}

function renderCustom(block: BlockData): string {
  const c = block.content as Record<string, unknown>;
  const html = (c.html as string) || '';
  const css = (c.css as string) || '';

  return `${css ? `<style>${css}</style>` : ''}
<section class="${blockClasses(block, 'sigil-custom')}">
  <div class="sigil-container">${html}</div>
</section>`;
}

// Block type to renderer mapping
const renderers: Record<string, (block: BlockData, siteSlug: string) => string> = {
  hero: renderHero,
  text: renderText,
  rich_text: renderText,
  image: renderImage,
  feature_grid: renderFeatureGrid,
  gallery: renderGallery,
  cta: renderCta,
  pricing_table: renderPricingTable,
  testimonial: renderTestimonial,
  faq: renderFaq,
  contact_form: renderContactForm,
  embed_player: renderEmbed,
  stats_bar: renderStatsBar,
  timeline: renderTimeline,
  product_grid: renderProductGrid,
  booking_calendar: renderBookingCalendar,
  social_links: renderSocialLinks,
  link_tree: renderLinkTree,
  code_block: renderCodeBlock,
  custom: renderCustom,
};

/**
 * Render a full page by converting all blocks to HTML.
 */
export function renderBlocks(blocks: BlockData[], siteSlug: string): string {
  return blocks
    .filter(b => b.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(block => {
      const renderer = renderers[block.blockType];
      if (!renderer) return ''; // Skip unknown blocks silently
      try {
        return renderer(block, siteSlug);
      } catch (err) {
        console.error(`Error rendering block ${block.blockType}:`, err);
        return '';
      }
    })
    .filter(Boolean)
    .join('\n\n');
}
