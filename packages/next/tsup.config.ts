import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'blocks/index': 'src/blocks/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'next', 'next/image', '@sigil-cms/client'],
  banner: {
    // Ensure 'use client' directives survive bundling for client components
    js: '',
  },
});
