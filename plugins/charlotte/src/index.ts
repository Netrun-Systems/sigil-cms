/**
 * Charlotte AI Assistant Plugin
 *
 * Provides an AI chat widget powered by the Charlotte voice assistant backend.
 * Includes smart FAQ, knowledge search, and embeddable widget snippet.
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';

export * from './lib/charlotte-client.js';
export { generateWidgetSnippet, type WidgetConfig } from './lib/widget-snippet.js';

const charlottePlugin: CmsPlugin = {
  id: 'charlotte',
  name: 'Charlotte AI Assistant',
  version: '1.0.0',

  register(ctx) {
    ctx.addAdminNav({
      title: 'AI Assistant',
      siteScoped: false,
      items: [
        { label: 'Charlotte', icon: 'Bot', href: 'charlotte' },
      ],
    });
  },
};

export default charlottePlugin;
