/**
 * Job Search Admin — Page registry mapping plugin routes to React page components.
 */

import type { ComponentType } from 'react';
import DashboardPage from './pages/DashboardPage';
import TrackerPage from './pages/TrackerPage';
import ApplicationsPage from './pages/ApplicationsPage';
import DiscoveriesPage from './pages/DiscoveriesPage';
import InterviewsPage from './pages/InterviewsPage';
import ProfilePage from './pages/ProfilePage';
import AnalyticsPage from './pages/AnalyticsPage';

/**
 * Maps route paths to page components.
 * Paths match the values in plugin addAdminNav() calls.
 */
export const pageRegistry: Record<string, ComponentType> = {
  '/': DashboardPage,
  '/job-search': DashboardPage,
  '/job-search/tracker': TrackerPage,
  '/job-search/applications': ApplicationsPage,
  '/job-search/discoveries': DiscoveriesPage,
  '/job-search/interviews': InterviewsPage,
  '/job-search/profile': ProfilePage,
  '/job-search/analytics': AnalyticsPage,
};
