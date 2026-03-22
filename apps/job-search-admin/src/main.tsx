/**
 * Job Search Admin — Entry point.
 *
 * Uses the platform admin shell to bootstrap the Job Search admin SPA
 * with job-search-specific pages and professional navy branding.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createPlatformApp } from '@netrun/platform-admin-shell';
import { pageRegistry } from './pageRegistry';
import './index.css';

const JobSearchApp = createPlatformApp({
  productName: 'Job Search Platform',
  productId: 'job-search',
  pageRegistry,
  defaultRoute: '/',
  apiBaseUrl: '',
  theme: {
    accentColor: '#3b82f6',
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <JobSearchApp />
  </StrictMode>,
);
