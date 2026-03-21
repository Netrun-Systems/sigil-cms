/**
 * KOG CRM Admin — Entry point.
 *
 * Uses the platform admin shell to bootstrap the KOG admin SPA
 * with KOG-specific pages and branding.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createPlatformApp } from '@netrun/platform-admin-shell';
import { pageRegistry } from './pageRegistry';
import './index.css';

const KogApp = createPlatformApp({
  productName: 'KOG CRM',
  productId: 'kog',
  pageRegistry,
  defaultRoute: '/',
  apiBaseUrl: '',
  theme: {
    accentColor: '#90b9ab',
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <KogApp />
  </StrictMode>,
);
