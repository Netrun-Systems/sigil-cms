import { describe, it, expect, beforeEach } from 'vitest';
import {
  beginPlugin,
  addBlockTypes,
  addAdminNav,
  addAdminRoutes,
  getManifest,
  getRegisteredBlockTypes,
  isBlockTypeRegistered,
  resetRegistry,
} from '../registry';

beforeEach(() => {
  resetRegistry();
});

describe('Plugin Registry', () => {
  it('starts with empty manifest', () => {
    const manifest = getManifest();
    expect(manifest.plugins).toHaveLength(0);
  });

  it('registers a plugin', () => {
    beginPlugin('test', 'Test Plugin', '1.0.0');
    const manifest = getManifest();
    expect(manifest.plugins).toHaveLength(1);
    expect(manifest.plugins[0]).toMatchObject({
      id: 'test',
      name: 'Test Plugin',
      version: '1.0.0',
      enabled: true,
    });
  });

  it('registers block types', () => {
    const reg = beginPlugin('artist', 'Artist', '1.0.0');
    addBlockTypes(reg, [
      { type: 'embed_player', label: 'Embed Player', category: 'Artist' },
      { type: 'release_list', label: 'Release List' },
    ]);

    expect(getRegisteredBlockTypes()).toContain('embed_player');
    expect(getRegisteredBlockTypes()).toContain('release_list');
    expect(isBlockTypeRegistered('embed_player')).toBe(true);
    expect(isBlockTypeRegistered('nonexistent')).toBe(false);
  });

  it('registers admin nav sections', () => {
    const reg = beginPlugin('booking', 'Booking', '1.0.0');
    addAdminNav(reg, {
      title: 'Booking',
      siteScoped: true,
      items: [
        { label: 'Services', icon: 'CalendarDays', href: 'booking/services' },
        { label: 'Appointments', icon: 'CalendarCheck', href: 'booking/appointments' },
      ],
    });

    const manifest = getManifest();
    expect(manifest.plugins[0].nav).toHaveLength(1);
    expect(manifest.plugins[0].nav[0].items).toHaveLength(2);
    expect(manifest.plugins[0].nav[0].siteScoped).toBe(true);
  });

  it('registers admin routes', () => {
    const reg = beginPlugin('store', 'Store', '1.0.0');
    addAdminRoutes(reg, [
      { path: 'sites/:siteId/store/products', component: 'ProductsList' },
      { path: 'sites/:siteId/store/orders', component: 'OrdersList' },
    ]);

    const manifest = getManifest();
    expect(manifest.plugins[0].routes).toHaveLength(2);
  });

  it('aggregates block types across plugins', () => {
    const reg1 = beginPlugin('artist', 'Artist', '1.0.0');
    addBlockTypes(reg1, [{ type: 'embed_player', label: 'Embed Player' }]);

    const reg2 = beginPlugin('store', 'Store', '1.0.0');
    addBlockTypes(reg2, [{ type: 'product_grid', label: 'Product Grid' }]);

    const types = getRegisteredBlockTypes();
    expect(types).toContain('embed_player');
    expect(types).toContain('product_grid');
    expect(types).toHaveLength(2);
  });

  it('resets cleanly', () => {
    const reg = beginPlugin('test', 'Test', '1.0.0');
    addBlockTypes(reg, [{ type: 'test_block', label: 'Test' }]);

    resetRegistry();

    expect(getManifest().plugins).toHaveLength(0);
    expect(getRegisteredBlockTypes()).toHaveLength(0);
    expect(isBlockTypeRegistered('test_block')).toBe(false);
  });

  it('handles multiple nav sections per plugin', () => {
    const reg = beginPlugin('multi', 'Multi', '1.0.0');
    addAdminNav(reg, { title: 'Section A', siteScoped: true, items: [{ label: 'A', icon: 'X', href: 'a' }] });
    addAdminNav(reg, { title: 'Section B', siteScoped: false, items: [{ label: 'B', icon: 'Y', href: '/b' }] });

    const manifest = getManifest();
    expect(manifest.plugins[0].nav).toHaveLength(2);
    expect(manifest.plugins[0].nav[0].siteScoped).toBe(true);
    expect(manifest.plugins[0].nav[1].siteScoped).toBe(false);
  });
});
