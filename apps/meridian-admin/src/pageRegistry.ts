/**
 * Meridian Admin — Page registry mapping plugin routes to React page components.
 *
 * Routes correspond to the admin nav items registered by @meridian/publishing:
 *   - Publications — list, create, edit publications
 *   - Flipbooks — manage flipbook instances and settings
 *   - Reader Analytics — engagement metrics and page heatmaps
 */

import type { ComponentType } from 'react';
import DashboardPage from './pages/DashboardPage';
import PublicationsPage from './pages/PublicationsPage';
import PublicationEditorPage from './pages/PublicationEditorPage';
import FlipbooksPage from './pages/FlipbooksPage';
import FlipbookEditorPage from './pages/FlipbookEditorPage';
import ReaderAnalyticsPage from './pages/ReaderAnalyticsPage';
import FlipbookAnalyticsPage from './pages/FlipbookAnalyticsPage';

/**
 * Maps route paths to page components.
 */
export const pageRegistry: Record<string, ComponentType> = {
  // Dashboard — publishing overview (publications, recent activity, top flipbooks)
  '/': DashboardPage,

  // Publication management
  '/publications': PublicationsPage,
  '/publications/new': PublicationEditorPage,
  '/publications/:id': PublicationEditorPage,

  // Flipbook management
  '/flipbooks': FlipbooksPage,
  '/flipbooks/:id': FlipbookEditorPage,

  // Reader analytics
  '/reader-analytics': ReaderAnalyticsPage,
  '/reader-analytics/:flipbookId': FlipbookAnalyticsPage,
};
