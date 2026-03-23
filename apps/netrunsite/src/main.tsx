/**
 * Netrun Systems Corporate Website Admin — Entry point.
 *
 * Uses the platform admin shell to bootstrap the NetrunSite admin SPA
 * with Netrun-specific pages and dark navy branding.
 *
 * Plugins consumed (all existing Sigil plugins):
 *   - blog         — company blog, research articles, case studies
 *   - store        — KAMERA pricing / Stripe checkout
 *   - kamera       — 3D scan pipeline integration
 *   - contact      — contact form submissions
 *   - mailing-list — newsletter subscribers
 *   - seo          — sitemap, RSS
 *   - support      — interactive help panel
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createPlatformApp } from '@netrun/platform-admin-shell';
import { pageRegistry } from './pageRegistry';
import './index.css';

const NetrunSiteApp = createPlatformApp({
  productName: 'Netrun Systems Website',
  productId: 'netrunsite',
  pageRegistry,
  defaultRoute: '/',
  apiBaseUrl: '',
  theme: {
    accentColor: '#90b9ab',
    panelBg: '#1a2332',
    baseBg: '#0f1720',
    cssVars: {
      '--netrun-navy': '#1a2332',
      '--netrun-sage': '#90b9ab',
      '--netrun-accent': '#4ca1e0',
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NetrunSiteApp />
  </StrictMode>,
);
