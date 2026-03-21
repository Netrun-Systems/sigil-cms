/**
 * Poppies Art & Gifts Admin — Entry point.
 *
 * Uses the platform admin shell to bootstrap the Poppies admin SPA
 * with Poppies-specific pages and warm earth-tone branding.
 *
 * Plugins consumed (all existing Sigil plugins):
 *   - artist       — artist profiles, events, releases
 *   - store        — product catalog, orders (Stripe)
 *   - photos       — gallery management, AI curation
 *   - booking      — workshop/event reservations
 *   - contact      — contact form submissions
 *   - mailing-list — newsletter subscribers
 *   - seo          — sitemap, RSS
 *   - @poppies/consignment — consignment tracking, Square POS, settlements
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createPlatformApp } from '@netrun/platform-admin-shell';
import { pageRegistry } from './pageRegistry';
import './index.css';

const PoppiesApp = createPlatformApp({
  productName: 'Poppies Art & Gifts',
  productId: 'poppies',
  pageRegistry,
  defaultRoute: '/',
  apiBaseUrl: '',
  theme: {
    accentColor: '#c67a4b',
    panelBg: '#ffffff',
    baseBg: '#faf7f2',
    cssVars: {
      '--poppies-terracotta': '#c67a4b',
      '--poppies-sage': '#8a9a7b',
      '--poppies-bark': '#5c3d2e',
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PoppiesApp />
  </StrictMode>,
);
