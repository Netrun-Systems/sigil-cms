/**
 * Poppies Admin — Page registry mapping plugin routes to React page components.
 *
 * Routes correspond to the admin nav items registered by each plugin:
 *   - Sigil plugins: artist, store, photos, booking, contact, mailing-list, seo
 *   - Poppies plugin: @poppies/consignment
 *
 * Custom pages combine data from multiple plugins (e.g., Artist Dashboard
 * shows profile + products + sales from artist + store + consignment).
 */

import type { ComponentType } from 'react';
import DashboardPage from './pages/DashboardPage';
import ArtistsPage from './pages/ArtistsPage';
import ArtistDashboardPage from './pages/ArtistDashboardPage';
import GalleryPage from './pages/GalleryPage';
import EventsPage from './pages/EventsPage';
import ShopPage from './pages/ShopPage';
import BookingsPage from './pages/BookingsPage';
import ConsignmentPage from './pages/ConsignmentPage';
import SettlementsPage from './pages/SettlementsPage';
import MailingListPage from './pages/MailingListPage';
import ContactsPage from './pages/ContactsPage';

/**
 * Maps route paths (registered by Sigil and Poppies plugins) to page components.
 */
export const pageRegistry: Record<string, ComponentType> = {
  // Dashboard — Poppies overview (sales, artists, events at a glance)
  '/': DashboardPage,

  // Artist management (from Sigil artist plugin + consignment data)
  '/artists': ArtistsPage,
  '/artists/:id': ArtistDashboardPage,

  // Gallery (from Sigil photos plugin)
  '/gallery': GalleryPage,

  // Events & workshops (from Sigil artist plugin events)
  '/events': EventsPage,

  // Shop / products (from Sigil store plugin)
  '/shop': ShopPage,

  // Workshop bookings (from Sigil booking plugin)
  '/bookings': BookingsPage,

  // Consignment tracking (from @poppies/consignment plugin)
  '/consignment': ConsignmentPage,
  '/settlements': SettlementsPage,

  // Mailing list (from Sigil mailing-list plugin)
  '/mailing-list': MailingListPage,

  // Contact submissions (from Sigil contact plugin)
  '/contacts': ContactsPage,
};
