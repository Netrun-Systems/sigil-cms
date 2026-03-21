/**
 * Intirfix Integration Hub Admin — Entry point.
 *
 * Uses the platform admin shell to bootstrap the Intirfix admin SPA
 * with integration-specific pages and teal/green branding.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createPlatformApp } from '@netrun/platform-admin-shell';
import { pageRegistry } from './pageRegistry';
import './index.css';

const IntirfixApp = createPlatformApp({
  productName: 'Intirfix',
  productId: 'intirfix',
  pageRegistry,
  defaultRoute: '/',
  apiBaseUrl: '',
  theme: {
    accentColor: '#2dd4bf',
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IntirfixApp />
  </StrictMode>,
);
