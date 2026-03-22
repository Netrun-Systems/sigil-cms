/**
 * Meridian Publishing Admin — Entry point.
 *
 * Uses the platform admin shell to bootstrap the Meridian admin SPA
 * with deep blue/indigo publishing-focused branding.
 *
 * Plugins consumed:
 *   - @meridian/publishing — publications, flipbooks, reader analytics
 *   - seo                 — sitemap, RSS feeds for publications
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createPlatformApp } from '@netrun/platform-admin-shell';
import { pageRegistry } from './pageRegistry';
import './index.css';

const MeridianApp = createPlatformApp({
  productName: 'Meridian Publishing',
  productId: 'meridian',
  pageRegistry,
  defaultRoute: '/',
  apiBaseUrl: '',
  theme: {
    accentColor: '#3b5998',
    panelBg: '#ffffff',
    baseBg: '#f0f4f8',
    cssVars: {
      '--meridian-navy': '#1e3a5f',
      '--meridian-indigo': '#3b5998',
      '--meridian-sky': '#4f8cdb',
      '--meridian-midnight': '#0f1f33',
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MeridianApp />
  </StrictMode>,
);
