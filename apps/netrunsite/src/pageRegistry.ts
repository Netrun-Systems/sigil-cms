/**
 * NetrunSite Admin — Page registry mapping plugin routes to React page components.
 *
 * Routes correspond to the admin nav items registered by each plugin:
 *   - Sigil plugins: blog, store, kamera, contact, mailing-list, seo, support
 *
 * The corporate website admin provides:
 *   - Dashboard: site health, blog stats, contact submissions, KAMERA jobs
 *   - Pages: Sigil page editor for Home, Products, Services, About, etc.
 *   - Blog: posts, categories, tags (via blog plugin)
 *   - KAMERA: scan jobs pipeline (via kamera plugin)
 *   - Store: KAMERA pricing, Stripe products (via store plugin)
 *   - Contacts: form submissions (via contact plugin)
 *   - Mailing List: newsletter subscribers (via mailing-list plugin)
 *   - Support: announcements, help config (via support plugin)
 */

import type { ComponentType } from 'react';
import DashboardPage from './pages/DashboardPage';
import PagesPage from './pages/PagesPage';
import BlogPage from './pages/BlogPage';
import KameraPage from './pages/KameraPage';
import ProductsPage from './pages/ProductsPage';
import ContactsPage from './pages/ContactsPage';
import MailingListPage from './pages/MailingListPage';
import SupportPage from './pages/SupportPage';

/**
 * Maps route paths (registered by Sigil plugins) to page components.
 */
export const pageRegistry: Record<string, ComponentType> = {
  // Dashboard — corporate website overview
  '/': DashboardPage,

  // Sigil page management (Home, Products, Services, About, etc.)
  '/pages': PagesPage,

  // Blog management (from @netrun/blog plugin)
  '/blog': BlogPage,
  '/blog/categories': BlogPage,
  '/blog/tags': BlogPage,
  '/blog/authors': BlogPage,
  '/blog/comments': BlogPage,

  // KAMERA scan pipeline (from kamera plugin)
  '/kamera': KameraPage,

  // Store / products (from store plugin — KAMERA pricing)
  '/store/products': ProductsPage,
  '/store/orders': ProductsPage,

  // Contact submissions (from contact plugin)
  '/contacts': ContactsPage,

  // Mailing list (from mailing-list plugin)
  '/subscribers': MailingListPage,

  // Support panel config (from support plugin)
  '/support/announcements': SupportPage,
  '/support/config': SupportPage,
};
