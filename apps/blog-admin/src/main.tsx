/**
 * Blog Admin — Entry point.
 *
 * Uses the platform admin shell to bootstrap the blog editorial admin SPA
 * with a warm editorial theme (cream/warm white, serif headings).
 *
 * Plugins consumed:
 *   - blog — posts, categories, tags, authors, comments, revisions
 *   - seo  — sitemap, RSS (existing Sigil plugin)
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createPlatformApp } from '@netrun/platform-admin-shell';
import { pageRegistry } from './pageRegistry';
import './index.css';

const BlogApp = createPlatformApp({
  productName: 'Blog',
  productId: 'blog',
  pageRegistry,
  defaultRoute: '/',
  apiBaseUrl: '',
  theme: {
    accentColor: '#c85a2e',
    panelBg: '#ffffff',
    baseBg: '#faf8f5',
    cssVars: {
      '--blog-cream': '#faf8f5',
      '--blog-warm': '#f5f0ea',
      '--blog-ink': '#1a1a2e',
      '--blog-accent': '#c85a2e',
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BlogApp />
  </StrictMode>,
);
