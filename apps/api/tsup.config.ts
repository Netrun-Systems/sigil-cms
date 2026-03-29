import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/scheduler-cli.ts'],
  format: ['cjs'],
  target: 'node18',
  clean: true,
  noExternal: [
    // Core packages
    '@netrun-cms/db', '@netrun-cms/core', '@netrun-cms/theme', '@netrun-cms/plugin-runtime',
    // Shared libraries
    '@netrun/error-handling', '@netrun/health', '@netrun/logger', '@netrun/security-middleware',
    '@netrun/stripe-client',
    // All plugins (bundled so they resolve in the standalone deploy)
    '@netrun-cms/plugin-seo',
    '@netrun-cms/plugin-artist',
    '@netrun-cms/plugin-mailing-list',
    '@netrun-cms/plugin-contact',
    '@netrun-cms/plugin-photos',
    '@netrun-cms/plugin-advisor',
    '@netrun-cms/plugin-store',
    '@netrun-cms/plugin-printful',
    '@netrun-cms/plugin-paypal',
    '@netrun-cms/plugin-booking',
    '@netrun-cms/plugin-docs',
    '@netrun-cms/plugin-resonance',
    '@netrun-cms/plugin-migrate',
    '@netrun-cms/plugin-webhooks',
    '@netrun-cms/plugin-kamera',
    '@netrun-cms/plugin-kog',
    '@netrun-cms/plugin-intirkast',
    '@netrun-cms/plugin-charlotte',
    '@netrun-cms/plugin-support',
    '@netrun-cms/plugin-community',
    '@netrun-cms/plugin-marketplace',
    // Poppies plugins
    '@poppies/pos',
    // Platform packages (must be bundled alongside CMS packages)
    '@netrun/platform-runtime',
    '@netrun/platform-db',
  ],
  external: ['@azure/communication-email', '@azure/storage-blob', '@google-cloud/storage', '@aws-sdk/client-s3', 'compression'],
  treeshake: true,
  splitting: false,
});
