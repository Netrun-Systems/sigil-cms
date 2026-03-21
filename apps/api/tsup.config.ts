import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  target: 'node18',
  clean: true,
  noExternal: ['@netrun-cms/db', '@netrun-cms/core', '@netrun-cms/theme', '@netrun-cms/plugin-runtime'],
  external: ['@azure/communication-email', '@azure/storage-blob'],
  treeshake: true,
  splitting: false,
});
