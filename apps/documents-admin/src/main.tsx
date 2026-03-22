/**
 * Documents & Wiki Admin -- Entry point.
 *
 * Uses the platform admin shell to bootstrap the Documents admin SPA
 * with warm gray/paper theme for document-centric context.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createPlatformApp } from '@netrun/platform-admin-shell';
import { pageRegistry } from './pageRegistry';
import './index.css';

const DocumentsApp = createPlatformApp({
  productName: 'Documents & Wiki',
  productId: 'documents',
  pageRegistry,
  defaultRoute: '/',
  apiBaseUrl: '',
  theme: {
    accentColor: '#b45309',
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DocumentsApp />
  </StrictMode>,
);
