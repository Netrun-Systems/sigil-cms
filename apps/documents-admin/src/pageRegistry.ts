/**
 * Documents & Wiki Admin -- Page registry mapping plugin routes to React page components.
 */

import type { ComponentType } from 'react';
import DocumentHubPage from './pages/DocumentHubPage';
import WikiBrowserPage from './pages/WikiBrowserPage';
import WikiEditorPage from './pages/WikiEditorPage';
import DrivesPage from './pages/DrivesPage';
import DriveBrowserPage from './pages/DriveBrowserPage';
import ActivityPage from './pages/ActivityPage';
import SearchPage from './pages/SearchPage';

/**
 * Maps route paths to page components.
 * Paths match the values in plugin addAdminNav() calls.
 */
export const pageRegistry: Record<string, ComponentType> = {
  '/': DocumentHubPage,
  '/wiki': WikiBrowserPage,
  '/wiki/:wikiId': WikiBrowserPage,
  '/wiki/:wikiId/pages/:pageId': WikiEditorPage,
  '/documents': DocumentHubPage,
  '/documents/drives': DrivesPage,
  '/documents/drives/:driveId': DriveBrowserPage,
  '/documents/activity': ActivityPage,
  '/documents/search': SearchPage,
};
