import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  target: 'node18',
  clean: true,
  noExternal: ['@netrun-cms/db', '@netrun-cms/core', '@netrun-cms/theme'],
  treeshake: true,
  splitting: false,
});
