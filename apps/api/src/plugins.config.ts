/**
 * Plugin Configuration
 *
 * Controls which plugins are enabled for this API instance.
 * Plugins with missing requiredEnv are automatically skipped.
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';

/**
 * Load all enabled plugins.
 * Each import is wrapped so a missing plugin doesn't break startup.
 */
export async function loadEnabledPlugins(): Promise<CmsPlugin[]> {
  const plugins: CmsPlugin[] = [];

  const loaders: Array<() => Promise<{ default: CmsPlugin }>> = [
    () => import('@netrun-cms/plugin-seo'),
    () => import('@netrun-cms/plugin-artist'),
    () => import('@netrun-cms/plugin-mailing-list'),
    () => import('@netrun-cms/plugin-contact'),
    () => import('@netrun-cms/plugin-photos'),
    () => import('@netrun-cms/plugin-advisor'),
    () => import('@netrun-cms/plugin-store'),
    () => import('@netrun-cms/plugin-printful'),
    () => import('@netrun-cms/plugin-paypal'),
    () => import('@netrun-cms/plugin-booking'),
    () => import('@netrun-cms/plugin-docs'),
    () => import('@netrun-cms/plugin-resonance'),
    () => import('@netrun-cms/plugin-migrate'),
    () => import('@netrun-cms/plugin-webhooks'),
    () => import('@netrun-cms/plugin-kamera'),
    () => import('@netrun-cms/plugin-kog'),
    () => import('@netrun-cms/plugin-intirkast'),
    () => import('@netrun-cms/plugin-charlotte'),
    () => import('@netrun-cms/plugin-support'),
  ];

  for (const loader of loaders) {
    try {
      const mod = await loader();
      plugins.push(mod.default);
    } catch (err) {
      // Plugin package not installed or has import errors — skip
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[plugins] Failed to import plugin: ${msg}`);
    }
  }

  return plugins;
}
