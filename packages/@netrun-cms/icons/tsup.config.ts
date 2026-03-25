import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    general: 'src/categories/general.ts',
    navigation: 'src/categories/navigation.ts',
    content: 'src/categories/content.ts',
    commerce: 'src/categories/commerce.ts',
    social: 'src/categories/social.ts',
    restaurant: 'src/categories/restaurant.ts',
    music: 'src/categories/music.ts',
    business: 'src/categories/business.ts',
    saas: 'src/categories/saas.ts',
    community: 'src/categories/community.ts',
    publishing: 'src/categories/publishing.ts',
    scheduling: 'src/categories/scheduling.ts',
    status: 'src/categories/status.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  external: ['react', 'react-dom'],
  treeshake: true,
  sourcemap: false,
  clean: true,
});
