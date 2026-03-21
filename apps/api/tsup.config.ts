import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/scheduler-cli.ts'],
  format: ['cjs'],
  target: 'node18',
  clean: true,
  noExternal: [
    '@netrun-cms/db', '@netrun-cms/core', '@netrun-cms/theme', '@netrun-cms/plugin-runtime',
    '@netrun/error-handling', '@netrun/health', '@netrun/logger', '@netrun/security-middleware',
  ],
  external: ['@azure/communication-email', '@azure/storage-blob', '@google-cloud/storage', '@aws-sdk/client-s3'],
  treeshake: true,
  splitting: false,
});
