/**
 * Theme-to-CSS converter
 *
 * Converts Sigil theme tokens into CSS custom properties and
 * a complete component stylesheet for rendered pages.
 */

import type { ThemeData } from './api-client.js';

function kebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Convert theme tokens object into CSS custom property declarations.
 */
export function themeToCss(tokens: ThemeData['tokens']): string {
  const vars: string[] = [];

  // Colors
  if (tokens.colors) {
    for (const [key, value] of Object.entries(tokens.colors)) {
      if (value) vars.push(`  --sigil-${kebabCase(key)}: ${value};`);
    }
  }

  // Typography
  if (tokens.typography) {
    for (const [key, value] of Object.entries(tokens.typography)) {
      if (value !== undefined) {
        const cssVal = typeof value === 'number' ? String(value) : value;
        vars.push(`  --sigil-${kebabCase(key)}: ${cssVal};`);
      }
    }
  }

  // Spacing
  if (tokens.spacing) {
    for (const [key, value] of Object.entries(tokens.spacing)) {
      if (value) vars.push(`  --sigil-space-${key}: ${value};`);
    }
  }

  // Effects
  if (tokens.effects) {
    for (const [key, value] of Object.entries(tokens.effects)) {
      if (value) vars.push(`  --sigil-${kebabCase(key)}: ${value};`);
    }
  }

  return `:root {\n${vars.join('\n')}\n}`;
}

/**
 * Extract Google Fonts link tags from typography tokens.
 */
export function themeToFontLinks(tokens: ThemeData['tokens']): string {
  const families = new Set<string>();

  const extractFont = (value: string | undefined) => {
    if (!value) return;
    // Match the first quoted font name
    const match = value.match(/^'([^']+)'/);
    if (match) {
      const font = match[1];
      // Skip system fonts
      if (!['system-ui', 'sans-serif', 'serif', 'monospace', 'cursive'].includes(font)) {
        families.add(font);
      }
    }
  };

  if (tokens.typography) {
    extractFont(tokens.typography.fontFamily as string);
    extractFont(tokens.typography.fontFamilyHeading as string);
    extractFont(tokens.typography.fontFamilyMono as string);
  }

  if (families.size === 0) return '';

  const params = Array.from(families)
    .map(f => `family=${f.replace(/\s+/g, '+')}:wght@400;500;600;700`)
    .join('&');

  return `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?${params}&display=swap" rel="stylesheet">`;
}

/**
 * Base component styles using Sigil CSS custom properties.
 * This provides the visual foundation for all rendered blocks.
 */
export const componentStyles = `
/* === Sigil CMS Reset & Base === */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html {
  font-size: var(--sigil-font-size-base, 1rem);
  line-height: var(--sigil-line-height-base, 1.5);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--sigil-font-family, system-ui, sans-serif);
  background: var(--sigil-background, #0A0A0A);
  color: var(--sigil-text, #FFFFFF);
  min-height: 100vh;
}

img { max-width: 100%; height: auto; display: block; }
a { color: var(--sigil-link, var(--sigil-primary, #90b9ab)); text-decoration: none; }
a:hover { color: var(--sigil-link-hover, var(--sigil-primary-light, #a8cfbd)); }

/* === Container === */
.sigil-container {
  max-width: var(--sigil-container-max-width, 1200px);
  margin: 0 auto;
  padding: 0 var(--sigil-space-lg, 1.5rem);
}

.sigil-narrow { max-width: 720px; }

/* === Navigation === */
.sigil-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--sigil-surface, #1a1a1a);
  border-bottom: 1px solid var(--sigil-border, rgba(255,255,255,0.08));
  backdrop-filter: blur(var(--sigil-glass-blur, 12px));
}
.sigil-nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sigil-space-md, 1rem) var(--sigil-space-lg, 1.5rem);
  max-width: var(--sigil-container-max-width, 1200px);
  margin: 0 auto;
}
.sigil-nav-brand {
  font-family: var(--sigil-font-family-heading, var(--sigil-font-family, system-ui));
  font-size: 1.25rem;
  font-weight: var(--sigil-font-weight-bold, 700);
  color: var(--sigil-text, #fff);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.sigil-nav-logo {
  height: 2rem;
  width: auto;
}
.sigil-nav-links { display: flex; gap: var(--sigil-space-lg, 1.5rem); list-style: none; }
.sigil-nav-links a {
  color: var(--sigil-text-secondary, #B8B8B8);
  font-size: var(--sigil-font-size-sm, 0.875rem);
  transition: color 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.sigil-nav-links a:hover,
.sigil-nav-links a.active { color: var(--sigil-primary, #90b9ab); }

/* === Section base === */
section[class^="sigil-"] {
  padding: var(--sigil-section-padding, 4rem) 0;
}

/* === Hero === */
.sigil-hero {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 60vh;
  padding: var(--sigil-space-3xl, 6rem) 0;
  text-align: center;
  overflow: hidden;
}
.sigil-hero.align-left { text-align: left; }
.sigil-hero.align-right { text-align: right; }
.sigil-hero-bg {
  position: absolute; inset: 0;
  background-size: cover;
  background-position: center;
  z-index: 0;
}
.sigil-hero-bg::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.8) 100%);
}
.sigil-hero-content {
  position: relative;
  z-index: 1;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--sigil-space-lg, 1.5rem);
}
.sigil-hero h1 {
  font-family: var(--sigil-font-family-heading, var(--sigil-font-family));
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: var(--sigil-font-weight-bold, 700);
  line-height: var(--sigil-line-height-heading, 1.1);
  margin-bottom: var(--sigil-space-md, 1rem);
  letter-spacing: var(--sigil-letter-spacing-heading, -0.02em);
}
.sigil-hero-subtitle {
  font-size: var(--sigil-font-size-lg, 1.125rem);
  color: var(--sigil-text-secondary, #B8B8B8);
  margin-bottom: var(--sigil-space-xl, 2rem);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}
.sigil-hero-actions { display: flex; gap: var(--sigil-space-md, 1rem); justify-content: center; flex-wrap: wrap; }
.sigil-hero.align-left .sigil-hero-subtitle { margin-left: 0; }
.sigil-hero.align-left .sigil-hero-actions { justify-content: flex-start; }

/* === Buttons === */
.sigil-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.75rem;
  border-radius: var(--sigil-button-radius, var(--sigil-border-radius, 8px));
  font-family: var(--sigil-font-family, system-ui);
  font-size: var(--sigil-font-size-sm, 0.875rem);
  font-weight: var(--sigil-font-weight-medium, 500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}
.sigil-btn-primary {
  background: var(--sigil-primary, #90b9ab);
  color: var(--sigil-background, #0A0A0A);
}
.sigil-btn-primary:hover {
  background: var(--sigil-primary-light, #a8cfbd);
  color: var(--sigil-background, #0A0A0A);
  transform: translateY(-1px);
}
.sigil-btn-secondary {
  background: transparent;
  color: var(--sigil-text, #fff);
  border-color: var(--sigil-border, rgba(255,255,255,0.2));
}
.sigil-btn-secondary:hover {
  border-color: var(--sigil-primary, #90b9ab);
  color: var(--sigil-primary, #90b9ab);
}
.sigil-btn-outline {
  background: transparent;
  color: var(--sigil-primary, #90b9ab);
  border-color: var(--sigil-primary, #90b9ab);
}
.sigil-btn-outline:hover {
  background: var(--sigil-primary, #90b9ab);
  color: var(--sigil-background, #0A0A0A);
}

/* === Text / Rich Text === */
.sigil-text {
  padding: var(--sigil-space-2xl, 3rem) 0;
}
.sigil-text-inner {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 var(--sigil-space-lg, 1.5rem);
}
.sigil-text-inner h1,
.sigil-text-inner h2,
.sigil-text-inner h3 {
  font-family: var(--sigil-font-family-heading, var(--sigil-font-family));
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}
.sigil-text-inner h2 { font-size: 1.75rem; }
.sigil-text-inner h3 { font-size: 1.375rem; }
.sigil-text-inner p { margin-bottom: 1em; color: var(--sigil-text-secondary, #B8B8B8); }
.sigil-text-inner ul, .sigil-text-inner ol { margin: 1em 0; padding-left: 1.5em; }
.sigil-text-inner li { margin-bottom: 0.5em; color: var(--sigil-text-secondary, #B8B8B8); }
.sigil-text-inner blockquote {
  border-left: 3px solid var(--sigil-primary, #90b9ab);
  padding-left: var(--sigil-space-md, 1rem);
  margin: 1.5em 0;
  color: var(--sigil-text-muted, #888);
  font-style: italic;
}
.sigil-text-inner code {
  font-family: var(--sigil-font-family-mono, 'SF Mono', monospace);
  background: var(--sigil-surface, #1a1a1a);
  padding: 0.15em 0.4em;
  border-radius: 4px;
  font-size: 0.9em;
}
.sigil-text-inner pre {
  background: var(--sigil-surface, #1a1a1a);
  border-radius: var(--sigil-border-radius, 8px);
  padding: var(--sigil-space-md, 1rem);
  overflow-x: auto;
  margin: 1.5em 0;
}
.sigil-text-inner pre code { background: none; padding: 0; }
.sigil-text-inner img { border-radius: var(--sigil-border-radius, 8px); margin: 1.5em 0; }

/* === Feature Grid === */
.sigil-features { padding: var(--sigil-space-3xl, 6rem) 0; }
.sigil-features-header { text-align: center; margin-bottom: var(--sigil-space-2xl, 3rem); }
.sigil-features-header h2 {
  font-family: var(--sigil-font-family-heading, var(--sigil-font-family));
  font-size: 2rem;
}
.sigil-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--sigil-space-lg, 1.5rem);
  max-width: var(--sigil-container-max-width, 1200px);
  margin: 0 auto;
  padding: 0 var(--sigil-space-lg, 1.5rem);
}
.sigil-feature-card {
  background: var(--sigil-surface, #1a1a1a);
  border: 1px solid var(--sigil-border, rgba(255,255,255,0.08));
  border-radius: var(--sigil-card-radius, var(--sigil-border-radius-lg, 12px));
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  height: 100%;
  color: inherit;
  text-decoration: none;
}
.sigil-feature-card-clickable {
  cursor: pointer;
}
.sigil-feature-card-clickable:hover {
  transform: translateY(-4px);
  border-color: var(--sigil-primary, #90b9ab);
  box-shadow: 0 12px 24px -8px rgba(0,0,0,0.5);
}
.sigil-feature-card-clickable:active {
  transform: translateY(-1px);
}
.sigil-feature-image {
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-bottom: 1px solid var(--sigil-border, rgba(255,255,255,0.05));
}
.sigil-feature-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}
.sigil-feature-card:hover .sigil-feature-image img {
  transform: scale(1.05);
}
.sigil-feature-icon-wrapper {
  padding: var(--sigil-space-xl, 2rem) var(--sigil-space-xl, 2rem) 0;
}
.sigil-feature-icon {
  font-size: 2rem;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--sigil-primary-rgb, 144, 185, 171), 0.1);
  color: var(--sigil-primary, #90b9ab);
  border-radius: 10px;
}
.sigil-feature-content {
  padding: var(--sigil-space-xl, 2rem);
  flex: 1;
  display: flex;
  flex-direction: column;
}
.sigil-feature-card h3 {
  font-family: var(--sigil-font-family-heading, var(--sigil-font-family));
  margin-bottom: var(--sigil-space-md, 1rem);
  font-size: 1.25rem;
  line-height: 1.3;
}
.sigil-feature-card p {
  color: var(--sigil-text-secondary, #B8B8B8);
  font-size: var(--sigil-font-size-base, 1rem);
  line-height: 1.6;
  margin-bottom: var(--sigil-space-lg, 1.5rem);
}
.sigil-feature-learn-more {
  margin-top: auto;
  color: var(--sigil-primary, #90b9ab);
  font-size: var(--sigil-font-size-sm, 0.875rem);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: gap 0.2s;
}
.sigil-feature-card:hover .sigil-feature-learn-more {
  gap: 0.75rem;
}
.sigil-arrow {
  transition: transform 0.2s;
}
.sigil-feature-card:hover .sigil-arrow {
  transform: translateX(2px);
}

/* === Gallery === */
.sigil-gallery { padding: var(--sigil-space-2xl, 3rem) 0; }
.sigil-gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--sigil-space-md, 1rem);
  max-width: var(--sigil-container-max-width, 1200px);
  margin: 0 auto;
  padding: 0 var(--sigil-space-lg, 1.5rem);
}
.sigil-gallery-item {
  border-radius: var(--sigil-border-radius, 8px);
  overflow: hidden;
  aspect-ratio: 1;
}
.sigil-gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}
.sigil-gallery-item:hover img { transform: scale(1.05); }
.sigil-gallery-caption {
  padding: var(--sigil-space-sm, 0.5rem);
  font-size: var(--sigil-font-size-xs, 0.75rem);
  color: var(--sigil-text-muted, #888);
}

/* === CTA === */
.sigil-cta {
  padding: var(--sigil-space-3xl, 6rem) 0;
  text-align: center;
}
.sigil-cta-inner {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--sigil-space-2xl, 3rem);
  background: var(--sigil-surface, #1a1a1a);
  border: 1px solid var(--sigil-border, rgba(255,255,255,0.08));
  border-radius: var(--sigil-border-radius-lg, 12px);
}
.sigil-cta h2 {
  font-family: var(--sigil-font-family-heading, var(--sigil-font-family));
  font-size: 1.75rem;
  margin-bottom: var(--sigil-space-md, 1rem);
}
.sigil-cta p {
  color: var(--sigil-text-secondary, #B8B8B8);
  margin-bottom: var(--sigil-space-xl, 2rem);
}

/* === Pricing === */
.sigil-pricing { padding: var(--sigil-space-3xl, 6rem) 0; }
.sigil-pricing-header { text-align: center; margin-bottom: var(--sigil-space-2xl, 3rem); }
.sigil-pricing-header h2 {
  font-family: var(--sigil-font-family-heading, var(--sigil-font-family));
  font-size: 2rem;
}
.sigil-pricing-header p { color: var(--sigil-text-secondary, #B8B8B8); margin-top: var(--sigil-space-sm, 0.5rem); }
.sigil-pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--sigil-space-lg, 1.5rem);
  max-width: var(--sigil-container-max-width, 1200px);
  margin: 0 auto;
  padding: 0 var(--sigil-space-lg, 1.5rem);
}
.sigil-pricing-card {
  background: var(--sigil-surface, #1a1a1a);
  border: 1px solid var(--sigil-border, rgba(255,255,255,0.08));
  border-radius: var(--sigil-border-radius-lg, 12px);
  padding: var(--sigil-space-xl, 2rem);
  display: flex;
  flex-direction: column;
}
.sigil-pricing-card.popular {
  border-color: var(--sigil-primary, #90b9ab);
  position: relative;
}
.sigil-pricing-popular-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--sigil-primary, #90b9ab);
  color: var(--sigil-background, #0A0A0A);
  padding: 0.25rem 1rem;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: var(--sigil-font-weight-bold, 700);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.sigil-pricing-card h3 { font-size: 1.25rem; margin-bottom: var(--sigil-space-sm, 0.5rem); }
.sigil-pricing-price {
  font-size: 2.5rem;
  font-weight: var(--sigil-font-weight-bold, 700);
  margin-bottom: var(--sigil-space-xs, 0.25rem);
}
.sigil-pricing-period {
  color: var(--sigil-text-muted, #888);
  font-size: var(--sigil-font-size-sm, 0.875rem);
  margin-bottom: var(--sigil-space-lg, 1.5rem);
}
.sigil-pricing-features {
  list-style: none;
  padding: 0;
  margin-bottom: var(--sigil-space-xl, 2rem);
  flex: 1;
}
.sigil-pricing-features li {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--sigil-border, rgba(255,255,255,0.05));
  color: var(--sigil-text-secondary, #B8B8B8);
  font-size: var(--sigil-font-size-sm, 0.875rem);
}
.sigil-pricing-features li::before { content: '\u2713 '; color: var(--sigil-primary, #90b9ab); }

/* === Testimonials === */
.sigil-testimonials { padding: var(--sigil-space-3xl, 6rem) 0; }
.sigil-testimonial-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--sigil-space-lg, 1.5rem);
  max-width: var(--sigil-container-max-width, 1200px);
  margin: 0 auto;
  padding: 0 var(--sigil-space-lg, 1.5rem);
}
.sigil-testimonial-card {
  background: var(--sigil-surface, #1a1a1a);
  border: 1px solid var(--sigil-border, rgba(255,255,255,0.08));
  border-radius: var(--sigil-border-radius-lg, 12px);
  padding: var(--sigil-space-xl, 2rem);
}
.sigil-testimonial-quote {
  font-size: var(--sigil-font-size-lg, 1.125rem);
  color: var(--sigil-text-secondary, #B8B8B8);
  line-height: 1.6;
  margin-bottom: var(--sigil-space-lg, 1.5rem);
  font-style: italic;
}
.sigil-testimonial-quote::before { content: '\\201C'; font-size: 2rem; color: var(--sigil-primary, #90b9ab); line-height: 0; vertical-align: -0.3em; margin-right: 0.1em; }
.sigil-testimonial-author { display: flex; align-items: center; gap: var(--sigil-space-sm, 0.5rem); }
.sigil-testimonial-avatar {
  width: 40px; height: 40px;
  border-radius: var(--sigil-border-radius-full, 9999px);
  object-fit: cover;
}
.sigil-testimonial-name { font-weight: var(--sigil-font-weight-medium, 500); }
.sigil-testimonial-role { color: var(--sigil-text-muted, #888); font-size: var(--sigil-font-size-sm, 0.875rem); }

/* === FAQ === */
.sigil-faq { padding: var(--sigil-space-3xl, 6rem) 0; }
.sigil-faq-header { text-align: center; margin-bottom: var(--sigil-space-2xl, 3rem); }
.sigil-faq-header h2 { font-family: var(--sigil-font-family-heading, var(--sigil-font-family)); font-size: 2rem; }
.sigil-faq-list {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 var(--sigil-space-lg, 1.5rem);
}
.sigil-faq-item {
  border-bottom: 1px solid var(--sigil-border, rgba(255,255,255,0.08));
  padding: var(--sigil-space-lg, 1.5rem) 0;
}
.sigil-faq-question {
  font-weight: var(--sigil-font-weight-medium, 500);
  font-size: 1.125rem;
  margin-bottom: var(--sigil-space-sm, 0.5rem);
  cursor: pointer;
}
.sigil-faq-answer { color: var(--sigil-text-secondary, #B8B8B8); line-height: 1.6; }

/* === Contact Form === */
.sigil-contact { padding: var(--sigil-space-3xl, 6rem) 0; }
.sigil-contact-inner {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 var(--sigil-space-lg, 1.5rem);
}
.sigil-contact h2 {
  font-family: var(--sigil-font-family-heading, var(--sigil-font-family));
  font-size: 1.75rem;
  margin-bottom: var(--sigil-space-sm, 0.5rem);
  text-align: center;
}
.sigil-contact-desc { text-align: center; color: var(--sigil-text-secondary, #B8B8B8); margin-bottom: var(--sigil-space-xl, 2rem); }
.sigil-form-field { margin-bottom: var(--sigil-space-md, 1rem); }
.sigil-form-field label {
  display: block;
  font-size: var(--sigil-font-size-sm, 0.875rem);
  font-weight: var(--sigil-font-weight-medium, 500);
  margin-bottom: var(--sigil-space-xs, 0.25rem);
}
.sigil-form-field input,
.sigil-form-field textarea,
.sigil-form-field select {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--sigil-surface, #1a1a1a);
  border: 1px solid var(--sigil-border, rgba(255,255,255,0.15));
  border-radius: var(--sigil-input-radius, var(--sigil-border-radius, 8px));
  color: var(--sigil-text, #fff);
  font-family: var(--sigil-font-family, system-ui);
  font-size: var(--sigil-font-size-base, 1rem);
  transition: border-color 0.2s;
}
.sigil-form-field input:focus,
.sigil-form-field textarea:focus,
.sigil-form-field select:focus {
  outline: none;
  border-color: var(--sigil-primary, #90b9ab);
}
.sigil-form-field textarea { min-height: 120px; resize: vertical; }
.sigil-form-checkbox { display: flex; align-items: center; gap: 0.5rem; }
.sigil-form-checkbox input { width: auto; }

/* === Embed === */
.sigil-embed { padding: var(--sigil-space-2xl, 3rem) 0; }
.sigil-embed-inner {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 var(--sigil-space-lg, 1.5rem);
}
.sigil-embed iframe {
  width: 100%;
  border: none;
  border-radius: var(--sigil-border-radius, 8px);
}

/* === Stats Bar === */
.sigil-stats { padding: var(--sigil-space-2xl, 3rem) 0; }
.sigil-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--sigil-space-lg, 1.5rem);
  max-width: var(--sigil-container-max-width, 1200px);
  margin: 0 auto;
  padding: 0 var(--sigil-space-lg, 1.5rem);
  text-align: center;
}
.sigil-stat-value {
  font-size: 2.5rem;
  font-weight: var(--sigil-font-weight-bold, 700);
  color: var(--sigil-primary, #90b9ab);
}
.sigil-stat-label {
  color: var(--sigil-text-secondary, #B8B8B8);
  font-size: var(--sigil-font-size-sm, 0.875rem);
  margin-top: var(--sigil-space-xs, 0.25rem);
}

/* === Timeline === */
.sigil-timeline { padding: var(--sigil-space-3xl, 6rem) 0; }
.sigil-timeline-header { text-align: center; margin-bottom: var(--sigil-space-2xl, 3rem); }
.sigil-timeline-header h2 { font-family: var(--sigil-font-family-heading, var(--sigil-font-family)); font-size: 2rem; }
.sigil-timeline-list {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 var(--sigil-space-lg, 1.5rem);
  position: relative;
}
.sigil-timeline-list::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 0; bottom: 0;
  width: 2px;
  background: var(--sigil-border, rgba(255,255,255,0.08));
}
.sigil-timeline-item {
  position: relative;
  padding-left: var(--sigil-space-xl, 2rem);
  padding-bottom: var(--sigil-space-xl, 2rem);
}
.sigil-timeline-item::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 6px;
  width: 12px; height: 12px;
  border-radius: 50%;
  background: var(--sigil-primary, #90b9ab);
}
.sigil-timeline-date {
  font-size: var(--sigil-font-size-sm, 0.875rem);
  color: var(--sigil-primary, #90b9ab);
  margin-bottom: var(--sigil-space-xs, 0.25rem);
}
.sigil-timeline-item h3 { font-size: 1.125rem; margin-bottom: var(--sigil-space-xs, 0.25rem); }
.sigil-timeline-item p { color: var(--sigil-text-secondary, #B8B8B8); font-size: var(--sigil-font-size-sm, 0.875rem); }

/* === Products === */
.sigil-products { padding: var(--sigil-space-3xl, 6rem) 0; }
.sigil-product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--sigil-space-lg, 1.5rem);
  max-width: var(--sigil-container-max-width, 1200px);
  margin: 0 auto;
  padding: 0 var(--sigil-space-lg, 1.5rem);
}
.sigil-product-card {
  background: var(--sigil-surface, #1a1a1a);
  border: 1px solid var(--sigil-border, rgba(255,255,255,0.08));
  border-radius: var(--sigil-border-radius-lg, 12px);
  overflow: hidden;
  transition: transform 0.2s, border-color 0.2s;
}
.sigil-product-card:hover { transform: translateY(-2px); border-color: var(--sigil-primary, #90b9ab); }
.sigil-product-card img { width: 100%; aspect-ratio: 1; object-fit: cover; }
.sigil-product-info { padding: var(--sigil-space-md, 1rem); }
.sigil-product-info h3 { font-size: 1rem; margin-bottom: var(--sigil-space-xs, 0.25rem); }
.sigil-product-price { color: var(--sigil-primary, #90b9ab); font-weight: var(--sigil-font-weight-bold, 700); }

/* === Booking === */
.sigil-booking { padding: var(--sigil-space-3xl, 6rem) 0; text-align: center; }
.sigil-booking-inner {
  max-width: 600px;
  margin: 0 auto;
  padding: var(--sigil-space-2xl, 3rem);
  background: var(--sigil-surface, #1a1a1a);
  border: 1px solid var(--sigil-border, rgba(255,255,255,0.08));
  border-radius: var(--sigil-border-radius-lg, 12px);
}

/* === Social Links === */
.sigil-social-links { padding: var(--sigil-space-2xl, 3rem) 0; }
.sigil-social-row {
  display: flex;
  justify-content: center;
  gap: var(--sigil-space-md, 1rem);
  flex-wrap: wrap;
}
.sigil-social-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--sigil-surface, #1a1a1a);
  border: 1px solid var(--sigil-border, rgba(255,255,255,0.08));
  border-radius: var(--sigil-border-radius, 8px);
  color: var(--sigil-text-secondary, #B8B8B8);
  transition: border-color 0.2s, color 0.2s;
}
.sigil-social-link:hover { border-color: var(--sigil-primary, #90b9ab); color: var(--sigil-primary, #90b9ab); }

/* === Link Tree === */
.sigil-linktree { padding: var(--sigil-space-2xl, 3rem) 0; text-align: center; }
.sigil-linktree-inner {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 var(--sigil-space-lg, 1.5rem);
}
.sigil-linktree-avatar {
  width: 80px; height: 80px;
  border-radius: 50%;
  margin: 0 auto var(--sigil-space-md, 1rem);
  object-fit: cover;
}
.sigil-linktree-heading { font-size: 1.5rem; margin-bottom: var(--sigil-space-xs, 0.25rem); }
.sigil-linktree-sub { color: var(--sigil-text-secondary, #B8B8B8); margin-bottom: var(--sigil-space-xl, 2rem); }
.sigil-linktree-links { display: flex; flex-direction: column; gap: var(--sigil-space-sm, 0.5rem); }
.sigil-linktree-link {
  display: block;
  padding: 0.875rem 1.5rem;
  background: var(--sigil-surface, #1a1a1a);
  border: 1px solid var(--sigil-border, rgba(255,255,255,0.08));
  border-radius: var(--sigil-border-radius, 8px);
  color: var(--sigil-text, #fff);
  font-weight: var(--sigil-font-weight-medium, 500);
  transition: border-color 0.2s, transform 0.2s;
}
.sigil-linktree-link:hover { border-color: var(--sigil-primary, #90b9ab); transform: translateY(-1px); }
.sigil-linktree-link.featured {
  background: var(--sigil-primary, #90b9ab);
  color: var(--sigil-background, #0A0A0A);
  border-color: var(--sigil-primary, #90b9ab);
}

/* === Footer === */
.sigil-footer {
  border-top: 1px solid var(--sigil-border, rgba(255,255,255,0.08));
  padding: var(--sigil-space-xl, 2rem) 0;
  text-align: center;
  color: var(--sigil-text-muted, #888);
  font-size: var(--sigil-font-size-sm, 0.875rem);
}

/* === Block settings === */
.sigil-pad-none { padding-top: 0; padding-bottom: 0; }
.sigil-pad-sm { padding-top: 1rem; padding-bottom: 1rem; }
.sigil-pad-md { padding-top: 2rem; padding-bottom: 2rem; }
.sigil-pad-lg { padding-top: 4rem; padding-bottom: 4rem; }
.sigil-pad-xl { padding-top: 6rem; padding-bottom: 6rem; }
.sigil-bg-primary { background: var(--sigil-primary, #90b9ab); color: var(--sigil-background, #0A0A0A); }
.sigil-bg-secondary { background: var(--sigil-background-secondary, #141414); }
.sigil-bg-surface { background: var(--sigil-surface, #1a1a1a); }
.sigil-bg-gradient { background: linear-gradient(135deg, var(--sigil-primary-dark, #739d8e), var(--sigil-primary, #90b9ab)); color: var(--sigil-background, #0A0A0A); }

/* === Responsive === */
@media (max-width: 768px) {
  .sigil-hero { min-height: 50vh; }
  .sigil-hero h1 { font-size: 2rem; }
  .sigil-grid { grid-template-columns: 1fr; }
  .sigil-pricing-grid { grid-template-columns: 1fr; }
  .sigil-nav-links { gap: var(--sigil-space-md, 1rem); }
}
`;
