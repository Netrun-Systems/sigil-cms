/**
 * Plugin Configuration
 *
 * Controls which plugins are enabled for this API instance.
 * Uses static requires so plugins are bundled by tsup.
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';

// Static imports — these get bundled by tsup into the single dist/index.js
import seoPlugin from '@netrun-cms/plugin-seo';
import artistPlugin from '@netrun-cms/plugin-artist';
import mailingListPlugin from '@netrun-cms/plugin-mailing-list';
import contactPlugin from '@netrun-cms/plugin-contact';
import photosPlugin from '@netrun-cms/plugin-photos';
import advisorPlugin from '@netrun-cms/plugin-advisor';
import storePlugin from '@netrun-cms/plugin-store';
import printfulPlugin from '@netrun-cms/plugin-printful';
import paypalPlugin from '@netrun-cms/plugin-paypal';
import bookingPlugin from '@netrun-cms/plugin-booking';
import docsPlugin from '@netrun-cms/plugin-docs';
import resonancePlugin from '@netrun-cms/plugin-resonance';
import migratePlugin from '@netrun-cms/plugin-migrate';
import webhooksPlugin from '@netrun-cms/plugin-webhooks';
import kameraPlugin from '@netrun-cms/plugin-kamera';
import kogPlugin from '@netrun-cms/plugin-kog';
import intirkastPlugin from '@netrun-cms/plugin-intirkast';
import charlottePlugin from '@netrun-cms/plugin-charlotte';
import supportPlugin from '@netrun-cms/plugin-support';
import communityPlugin from '@netrun-cms/plugin-community';
import marketplacePlugin from '@netrun-cms/plugin-marketplace';

/**
 * All enabled plugins. Each is statically imported so tsup bundles them.
 * Plugins with missing requiredEnv are automatically skipped by the loader.
 */
export async function loadEnabledPlugins(): Promise<CmsPlugin[]> {
  return [
    seoPlugin,
    artistPlugin,
    mailingListPlugin,
    contactPlugin,
    photosPlugin,
    advisorPlugin,
    storePlugin,
    printfulPlugin,
    paypalPlugin,
    bookingPlugin,
    docsPlugin,
    resonancePlugin,
    migratePlugin,
    webhooksPlugin,
    kameraPlugin,
    kogPlugin,
    intirkastPlugin,
    charlottePlugin,
    supportPlugin,
    communityPlugin,
    marketplacePlugin,
  ];
}
