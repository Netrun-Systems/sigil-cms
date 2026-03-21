/**
 * Artist Plugin — Releases, Events, Artist Profiles, and content blocks
 *
 * The largest plugin extraction. Provides full CRUD for artist content,
 * public read endpoints, 6 block types, and admin navigation.
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { createRoutes } from './routes.js';

const artistPlugin: CmsPlugin = {
  id: 'artist',
  name: 'Artist Content',
  version: '1.0.0',

  register(ctx) {
    const {
      adminReleases,
      adminEvents,
      adminProfile,
      publicReleases,
      publicEvents,
      publicProfile,
    } = createRoutes(ctx.db);

    // Admin routes (mounted behind auth by the API integration layer)
    ctx.addRoutes('releases', adminReleases);
    ctx.addRoutes('events', adminEvents);
    ctx.addRoutes('artist-profile', adminProfile);

    // Public routes (no auth, site resolved by slug)
    ctx.addPublicRoutes('sites/:siteSlug/releases', publicReleases);
    ctx.addPublicRoutes('sites/:siteSlug/events', publicEvents);
    ctx.addPublicRoutes('sites/:siteSlug/artist-profile', publicProfile);

    // Block types for the visual editor
    ctx.addBlockTypes([
      { type: 'embed_player', label: 'Embed Player', category: 'Artist' },
      { type: 'release_list', label: 'Release List', category: 'Artist' },
      { type: 'event_list', label: 'Event List', category: 'Artist' },
      { type: 'social_links', label: 'Social Links', category: 'Artist' },
      { type: 'link_tree', label: 'Link Tree', category: 'Artist' },
      { type: 'artist_bio', label: 'Artist Bio', category: 'Artist' },
    ]);

    // Admin navigation
    ctx.addAdminNav({
      title: 'Artist Content',
      siteScoped: true,
      items: [
        { label: 'Releases', icon: 'Disc3', href: 'releases' },
        { label: 'Events', icon: 'CalendarDays', href: 'events' },
        { label: 'Artist Profile', icon: 'User', href: 'profile' },
      ],
    });

    // Admin routes for React lazy loading
    ctx.addAdminRoutes([
      { path: 'sites/:siteId/releases', component: '@netrun-cms/plugin-artist/admin/ReleasesList' },
      { path: 'sites/:siteId/releases/new', component: '@netrun-cms/plugin-artist/admin/ReleaseEditor' },
      { path: 'sites/:siteId/releases/:id', component: '@netrun-cms/plugin-artist/admin/ReleaseEditor' },
      { path: 'sites/:siteId/events', component: '@netrun-cms/plugin-artist/admin/EventsList' },
      { path: 'sites/:siteId/events/new', component: '@netrun-cms/plugin-artist/admin/EventEditor' },
      { path: 'sites/:siteId/events/:id', component: '@netrun-cms/plugin-artist/admin/EventEditor' },
      { path: 'sites/:siteId/profile', component: '@netrun-cms/plugin-artist/admin/ProfilePage' },
    ]);
  },
};

export default artistPlugin;
