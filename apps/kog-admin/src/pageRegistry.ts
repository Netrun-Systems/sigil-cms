/**
 * KOG Admin — Page registry mapping plugin routes to React page components.
 *
 * This is the bridge between the platform admin shell's PluginRoutes
 * and the actual KOG page implementations.
 */

import type { ComponentType } from 'react';
import DashboardPage from './pages/DashboardPage';
import ContactsPage from './pages/ContactsPage';
import OrganizationsPage from './pages/OrganizationsPage';
import PipelinePage from './pages/PipelinePage';
import ActivitiesPage from './pages/ActivitiesPage';
import AnalyticsPage from './pages/AnalyticsPage';

/**
 * Maps route paths (registered by @kog/* plugins) to page components.
 * Paths must match the `path` values in plugin addAdminNav() calls.
 */
export const pageRegistry: Record<string, ComponentType> = {
  '/': DashboardPage,
  '/contacts': ContactsPage,
  '/organizations': OrganizationsPage,
  '/pipeline': PipelinePage,
  '/activities': ActivitiesPage,
  '/analytics': AnalyticsPage,
};
