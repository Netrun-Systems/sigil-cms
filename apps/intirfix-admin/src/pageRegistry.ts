/**
 * Intirfix Admin — Page registry mapping plugin routes to React page components.
 *
 * This is the bridge between the platform admin shell's PluginRoutes
 * and the actual Intirfix page implementations.
 */

import type { ComponentType } from 'react';
import DashboardPage from './pages/DashboardPage';
import ConnectionsPage from './pages/ConnectionsPage';
import TransactionsPage from './pages/TransactionsPage';
import ReconciliationPage from './pages/ReconciliationPage';
import WebhooksPage from './pages/WebhooksPage';
import AccountingPage from './pages/AccountingPage';
import CrmSyncPage from './pages/CrmSyncPage';
import MarketingPage from './pages/MarketingPage';
import EcommercePage from './pages/EcommercePage';

/**
 * Maps route paths (registered by @intirfix/* plugins) to page components.
 * Paths must match the `path` values in plugin addAdminNav() calls.
 */
export const pageRegistry: Record<string, ComponentType> = {
  '/': DashboardPage,
  '/integrations': DashboardPage,
  '/connections': ConnectionsPage,
  '/payments': TransactionsPage,
  '/transactions': TransactionsPage,
  '/reconciliation': ReconciliationPage,
  '/webhooks': WebhooksPage,
  '/accounting': AccountingPage,
  '/crm-sync': CrmSyncPage,
  '/marketing': MarketingPage,
  '/ecommerce': EcommercePage,
};
