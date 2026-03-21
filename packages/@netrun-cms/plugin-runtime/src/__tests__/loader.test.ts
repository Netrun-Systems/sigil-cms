import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadPlugins } from '../loader';
import { resetRegistry } from '../registry';
import type { CmsPlugin, PluginContext } from '../types';

beforeEach(() => {
  resetRegistry();
});

function createMockOptions() {
  return {
    app: { use: vi.fn() },
    db: { execute: vi.fn(), select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() },
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  };
}

describe('Plugin Loader', () => {
  it('loads a simple plugin', async () => {
    const options = createMockOptions();

    const plugin: CmsPlugin = {
      id: 'test',
      name: 'Test Plugin',
      version: '1.0.0',
      register: vi.fn(),
    };

    const registry = await loadPlugins([plugin], options);

    expect(plugin.register).toHaveBeenCalledOnce();
    expect(options.logger.info).toHaveBeenCalled();

    const manifest = registry.getManifest();
    expect(manifest.plugins).toHaveLength(1);
    expect(manifest.plugins[0].id).toBe('test');
  });

  it('skips plugin when required env is missing', async () => {
    const options = createMockOptions();

    const plugin: CmsPlugin = {
      id: 'needs-env',
      name: 'Needs Env',
      version: '1.0.0',
      requiredEnv: ['TOTALLY_MISSING_ENV_VAR_12345'],
      register: vi.fn(),
    };

    await loadPlugins([plugin], options);

    expect(plugin.register).not.toHaveBeenCalled();
    expect(options.logger.warn).toHaveBeenCalled();
  });

  it('catches and logs plugin errors without crashing', async () => {
    const options = createMockOptions();

    const failingPlugin: CmsPlugin = {
      id: 'crashy',
      name: 'Crashy',
      version: '1.0.0',
      register: () => { throw new Error('Boom'); },
    };

    const goodPlugin: CmsPlugin = {
      id: 'good',
      name: 'Good',
      version: '1.0.0',
      register: vi.fn(),
    };

    const registry = await loadPlugins([failingPlugin, goodPlugin], options);

    expect(options.logger.error).toHaveBeenCalled();
    expect(goodPlugin.register).toHaveBeenCalledOnce();
    // Good plugin should still be in manifest
    const manifest = registry.getManifest();
    expect(manifest.plugins.some(p => p.id === 'good')).toBe(true);
  });

  it('provides working PluginContext to register()', async () => {
    const options = createMockOptions();
    let capturedCtx: PluginContext | null = null;

    const plugin: CmsPlugin = {
      id: 'ctx-test',
      name: 'Context Test',
      version: '1.0.0',
      register(ctx) {
        capturedCtx = ctx;
        ctx.addBlockTypes([{ type: 'test_block', label: 'Test Block' }]);
        ctx.addAdminNav({
          title: 'Test',
          siteScoped: true,
          items: [{ label: 'Item', icon: 'Puzzle', href: 'test' }],
        });
        ctx.addAdminRoutes([{ path: 'test', component: 'TestPage' }]);
      },
    };

    const registry = await loadPlugins([plugin], options);

    expect(capturedCtx).not.toBeNull();
    expect(capturedCtx!.db).toBe(options.db);
    expect(capturedCtx!.logger).toBe(options.logger);
    expect(typeof capturedCtx!.addRoutes).toBe('function');
    expect(typeof capturedCtx!.addPublicRoutes).toBe('function');
    expect(typeof capturedCtx!.addGlobalRoutes).toBe('function');
    expect(typeof capturedCtx!.getConfig).toBe('function');
    expect(typeof capturedCtx!.runMigration).toBe('function');

    expect(registry.isBlockTypeRegistered('test_block')).toBe(true);
    const manifest = registry.getManifest();
    expect(manifest.plugins[0].nav).toHaveLength(1);
    expect(manifest.plugins[0].routes).toHaveLength(1);
  });

  it('loads multiple plugins in order', async () => {
    const options = createMockOptions();
    const order: string[] = [];

    const plugins: CmsPlugin[] = [
      { id: 'a', name: 'A', version: '1.0.0', register: () => { order.push('a'); } },
      { id: 'b', name: 'B', version: '1.0.0', register: () => { order.push('b'); } },
      { id: 'c', name: 'C', version: '1.0.0', register: () => { order.push('c'); } },
    ];

    await loadPlugins(plugins, options);

    expect(order).toEqual(['a', 'b', 'c']);
  });

  it('getConfig reads process.env', async () => {
    const options = createMockOptions();
    process.env.TEST_CONFIG_VAR = 'hello';

    let configValue: string | undefined;
    const plugin: CmsPlugin = {
      id: 'config-test',
      name: 'Config',
      version: '1.0.0',
      register(ctx) {
        configValue = ctx.getConfig('TEST_CONFIG_VAR');
      },
    };

    await loadPlugins([plugin], options);
    expect(configValue).toBe('hello');

    delete process.env.TEST_CONFIG_VAR;
  });
});
