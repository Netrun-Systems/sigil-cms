import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  target: 'node18',
  clean: true,
  noExternal: ['@netrun-cms/db', '@netrun-cms/core'],
  treeshake: true,
  splitting: false,
});
