import { describe, it, expect } from 'vitest';
import {
  slugify,
  generatePagePath,
  tokensToCssVariables,
  defaultDarkThemeTokens,
  BLOCK_TYPE,
  SITE_STATUS,
  PAGE_STATUS,
  EMBED_PLATFORM,
  siteSettingsSchema,
  createSiteSchema,
  createPageSchema,
  themeTokensSchema,
  blockSettingsSchema,
} from '../index';

// ============================================================================
// slugify()
// ============================================================================

describe('slugify', () => {
  it('converts normal text to lowercase kebab-case', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('strips special characters', () => {
    expect(slugify("What's up? #123")).toBe('whats-up-123');
  });

  it('collapses extra spaces and dashes', () => {
    expect(slugify('  hello -- world  ')).toBe('hello-world');
  });

  it('returns already-slugified text unchanged', () => {
    expect(slugify('hello-world')).toBe('hello-world');
  });

  it('returns empty string for empty input', () => {
    expect(slugify('')).toBe('');
  });

  it('strips unicode accents', () => {
    // The regex [^\w\s-] strips non-word chars; accented letters like é are stripped
    expect(slugify('café résumé')).toBe('caf-rsum');
  });

  it('converts underscores to dashes', () => {
    expect(slugify('hello_world_test')).toBe('hello-world-test');
  });
});

// ============================================================================
// generatePagePath()
// ============================================================================

describe('generatePagePath', () => {
  it('generates root path without parent', () => {
    expect(generatePagePath('about')).toBe('/about');
  });

  it('appends slug to parent path', () => {
    expect(generatePagePath('team', '/about')).toBe('/about/team');
  });

  it('handles nested parent paths', () => {
    expect(generatePagePath('bio', '/about/team')).toBe('/about/team/bio');
  });
});

// ============================================================================
// tokensToCssVariables()
// ============================================================================

describe('tokensToCssVariables', () => {
  it('generates color CSS variables with default prefix', () => {
    const css = tokensToCssVariables(defaultDarkThemeTokens);
    expect(css).toContain('--netrun-primary: #90b9ab;');
    expect(css).toContain('--netrun-background: #0A0A0A;');
    expect(css).toContain('--netrun-text: #FFFFFF;');
  });

  it('converts camelCase keys to kebab-case for typography', () => {
    const css = tokensToCssVariables(defaultDarkThemeTokens);
    expect(css).toContain('--netrun-font-family:');
    expect(css).toContain('--netrun-font-family-heading:');
    expect(css).toContain('--netrun-font-size-base: 1rem;');
  });

  it('converts number values to strings for typography', () => {
    const css = tokensToCssVariables(defaultDarkThemeTokens);
    expect(css).toContain('--netrun-line-height-base: 1.5;');
    expect(css).toContain('--netrun-font-weight-normal: 500;');
    expect(css).toContain('--netrun-font-weight-bold: 700;');
  });

  it('generates spacing variables with space- prefix', () => {
    const css = tokensToCssVariables(defaultDarkThemeTokens);
    expect(css).toContain('--netrun-space-xs: 0.25rem;');
    expect(css).toContain('--netrun-space-sm: 0.5rem;');
    expect(css).toContain('--netrun-space-md: 1rem;');
    expect(css).toContain('--netrun-space-lg: 1.5rem;');
    expect(css).toContain('--netrun-space-xl: 2rem;');
    expect(css).toContain('--netrun-space-2xl: 3rem;');
  });

  it('generates effects variables', () => {
    const css = tokensToCssVariables(defaultDarkThemeTokens);
    expect(css).toContain('--netrun-border-radius: 8px;');
    expect(css).toContain('--netrun-border-radius-lg: 12px;');
    expect(css).toContain('--netrun-shadow-sm:');
    expect(css).toContain('--netrun-glass-blur: 12px;');
    expect(css).toContain('--netrun-glass-bg:');
  });

  it('supports custom prefix', () => {
    const css = tokensToCssVariables(defaultDarkThemeTokens, 'custom');
    expect(css).toContain('--custom-primary: #90b9ab;');
    expect(css).toContain('--custom-font-family:');
    expect(css).toContain('--custom-space-md: 1rem;');
    expect(css).not.toContain('--netrun-');
  });

  it('skips undefined/null values', () => {
    const tokens = {
      colors: {
        primary: '#fff',
        primaryDark: undefined,
        background: '#000',
        text: '#ccc',
      },
      typography: {
        fontFamily: 'sans-serif',
        fontFamilyHeading: undefined,
      },
    } as any;

    const css = tokensToCssVariables(tokens);
    expect(css).toContain('--netrun-primary: #fff;');
    expect(css).not.toContain('primary-dark');
    expect(css).not.toContain('undefined');
  });
});

// ============================================================================
// Enum / constant validation
// ============================================================================

describe('BLOCK_TYPE', () => {
  it('has expected keys', () => {
    expect(BLOCK_TYPE.HERO).toBe('hero');
    expect(BLOCK_TYPE.TEXT).toBe('text');
    expect(BLOCK_TYPE.CTA).toBe('cta');
    expect(BLOCK_TYPE.GALLERY).toBe('gallery');
    expect(BLOCK_TYPE.FAQ).toBe('faq');
    expect(BLOCK_TYPE.PRICING_TABLE).toBe('pricing_table');
    expect(BLOCK_TYPE.FEATURE_GRID).toBe('feature_grid');
    expect(BLOCK_TYPE.CUSTOM).toBe('custom');
    expect(BLOCK_TYPE.EMBED_PLAYER).toBe('embed_player');
    expect(BLOCK_TYPE.ARTIST_BIO).toBe('artist_bio');
  });
});

describe('SITE_STATUS', () => {
  it('has draft, published, archived', () => {
    expect(SITE_STATUS.DRAFT).toBe('draft');
    expect(SITE_STATUS.PUBLISHED).toBe('published');
    expect(SITE_STATUS.ARCHIVED).toBe('archived');
  });
});

describe('PAGE_STATUS', () => {
  it('has draft, published, scheduled, archived', () => {
    expect(PAGE_STATUS.DRAFT).toBe('draft');
    expect(PAGE_STATUS.PUBLISHED).toBe('published');
    expect(PAGE_STATUS.SCHEDULED).toBe('scheduled');
    expect(PAGE_STATUS.ARCHIVED).toBe('archived');
  });
});

describe('EMBED_PLATFORM', () => {
  it('has expected platforms', () => {
    expect(EMBED_PLATFORM.SPOTIFY).toBe('spotify');
    expect(EMBED_PLATFORM.YOUTUBE).toBe('youtube');
    expect(EMBED_PLATFORM.APPLE_MUSIC).toBe('apple_music');
    expect(EMBED_PLATFORM.SOUNDCLOUD).toBe('soundcloud');
    expect(EMBED_PLATFORM.BANDCAMP).toBe('bandcamp');
    expect(EMBED_PLATFORM.TWITCH).toBe('twitch');
    expect(EMBED_PLATFORM.TIKTOK).toBe('tiktok');
    expect(EMBED_PLATFORM.INSTAGRAM).toBe('instagram');
    expect(EMBED_PLATFORM.TWITTER).toBe('twitter');
  });
});

// ============================================================================
// Zod schema validation
// ============================================================================

describe('siteSettingsSchema', () => {
  it('accepts valid settings with all optional fields', () => {
    const result = siteSettingsSchema.safeParse({
      favicon: '/favicon.ico',
      logo: '/logo.png',
      logoDark: '/logo-dark.png',
      socialLinks: {
        twitter: 'https://twitter.com/netrun',
        github: 'https://github.com/netrun',
      },
      analytics: {
        googleAnalyticsId: 'G-XXXXXXXX',
      },
      seo: {
        titleTemplate: '%s | Netrun',
        defaultDescription: 'A CMS',
      },
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (all fields optional)', () => {
    const result = siteSettingsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects invalid social link URLs', () => {
    const result = siteSettingsSchema.safeParse({
      socialLinks: {
        twitter: 'not-a-url',
      },
    });
    expect(result.success).toBe(false);
  });
});

describe('createSiteSchema', () => {
  it('accepts valid site data', () => {
    const result = createSiteSchema.safeParse({
      name: 'My Site',
      slug: 'my-site',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.defaultLanguage).toBe('en');
      expect(result.data.status).toBe('draft');
    }
  });

  it('rejects missing name', () => {
    const result = createSiteSchema.safeParse({
      slug: 'my-site',
    });
    expect(result.success).toBe(false);
  });

  it('rejects uppercase slug', () => {
    const result = createSiteSchema.safeParse({
      name: 'My Site',
      slug: 'My-Site',
    });
    expect(result.success).toBe(false);
  });

  it('rejects slug with spaces', () => {
    const result = createSiteSchema.safeParse({
      name: 'My Site',
      slug: 'my site',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = createSiteSchema.safeParse({
      name: '',
      slug: 'my-site',
    });
    expect(result.success).toBe(false);
  });
});

describe('createPageSchema', () => {
  it('accepts valid page data', () => {
    const result = createPageSchema.safeParse({
      title: 'About Us',
      slug: 'about-us',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('draft');
      expect(result.data.language).toBe('en');
      expect(result.data.template).toBe('default');
      expect(result.data.sortOrder).toBe(0);
    }
  });

  it('rejects slug with spaces', () => {
    const result = createPageSchema.safeParse({
      title: 'About Us',
      slug: 'about us',
    });
    expect(result.success).toBe(false);
  });

  it('rejects slug with uppercase', () => {
    const result = createPageSchema.safeParse({
      title: 'About Us',
      slug: 'About-Us',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid parentId UUID', () => {
    const result = createPageSchema.safeParse({
      title: 'Team',
      slug: 'team',
      parentId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid parentId (not a UUID)', () => {
    const result = createPageSchema.safeParse({
      title: 'Team',
      slug: 'team',
      parentId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});

describe('themeTokensSchema', () => {
  it('accepts valid tokens (defaultDarkThemeTokens)', () => {
    const result = themeTokensSchema.safeParse(defaultDarkThemeTokens);
    expect(result.success).toBe(true);
  });

  it('accepts minimal required tokens', () => {
    const result = themeTokensSchema.safeParse({
      colors: {
        primary: '#fff',
        background: '#000',
        text: '#ccc',
      },
      typography: {
        fontFamily: 'sans-serif',
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required color fields', () => {
    const result = themeTokensSchema.safeParse({
      colors: {
        primary: '#fff',
        // missing background and text
      },
      typography: {
        fontFamily: 'sans-serif',
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing typography.fontFamily', () => {
    const result = themeTokensSchema.safeParse({
      colors: {
        primary: '#fff',
        background: '#000',
        text: '#ccc',
      },
      typography: {},
    });
    expect(result.success).toBe(false);
  });
});

describe('blockSettingsSchema', () => {
  it('accepts partial settings', () => {
    const result = blockSettingsSchema.safeParse({
      padding: 'lg',
      animation: 'fade',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (all fields optional)', () => {
    const result = blockSettingsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts full settings', () => {
    const result = blockSettingsSchema.safeParse({
      padding: 'md',
      margin: 'sm',
      background: 'gradient',
      width: 'container',
      animation: 'slide',
      customClass: 'my-block',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid padding value', () => {
    const result = blockSettingsSchema.safeParse({
      padding: 'huge',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid animation value', () => {
    const result = blockSettingsSchema.safeParse({
      animation: 'bounce',
    });
    expect(result.success).toBe(false);
  });
});
