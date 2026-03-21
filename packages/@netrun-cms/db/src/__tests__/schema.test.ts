/**
 * DB Schema Zod validation tests
 *
 * Tests the Zod insert schemas generated from Drizzle table definitions
 * to ensure validation rules are enforced before data reaches PostgreSQL.
 */

import { describe, it, expect } from 'vitest';
import { randomUUID } from 'crypto';
import {
  insertSiteSchema,
  insertPageSchema,
  insertContentBlockSchema,
  insertMediaSchema,
  insertUserSchema,
  insertThemeSchema,
} from '../schema';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const uuid = () => randomUUID();

// ---------------------------------------------------------------------------
// insertSiteSchema
// ---------------------------------------------------------------------------

describe('insertSiteSchema', () => {
  const validSite = {
    tenantId: uuid(),
    name: 'Test Site',
    slug: 'test-site',
  };

  it('accepts a valid site with required fields', () => {
    const result = insertSiteSchema.safeParse(validSite);
    expect(result.success).toBe(true);
  });

  it('accepts optional fields (domain, template, settings)', () => {
    const result = insertSiteSchema.safeParse({
      ...validSite,
      domain: 'example.com',
      template: 'landing',
      settings: { favicon: '/favicon.ico' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const { name, ...noName } = validSite;
    const result = insertSiteSchema.safeParse(noName);
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = insertSiteSchema.safeParse({ ...validSite, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects slug with uppercase letters', () => {
    const result = insertSiteSchema.safeParse({ ...validSite, slug: 'Test-Site' });
    expect(result.success).toBe(false);
  });

  it('rejects slug with spaces', () => {
    const result = insertSiteSchema.safeParse({ ...validSite, slug: 'test site' });
    expect(result.success).toBe(false);
  });

  it('rejects slug with special characters', () => {
    const result = insertSiteSchema.safeParse({ ...validSite, slug: 'test_site!' });
    expect(result.success).toBe(false);
  });

  it('accepts slug with lowercase and hyphens', () => {
    const result = insertSiteSchema.safeParse({ ...validSite, slug: 'my-test-site-123' });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// insertPageSchema
// ---------------------------------------------------------------------------

describe('insertPageSchema', () => {
  const validPage = {
    siteId: uuid(),
    title: 'Home',
    slug: 'home',
  };

  it('accepts a valid page with required fields', () => {
    const result = insertPageSchema.safeParse(validPage);
    expect(result.success).toBe(true);
  });

  it('rejects missing title', () => {
    const { title, ...noTitle } = validPage;
    const result = insertPageSchema.safeParse(noTitle);
    expect(result.success).toBe(false);
  });

  it('rejects empty title', () => {
    const result = insertPageSchema.safeParse({ ...validPage, title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects slug with uppercase letters', () => {
    const result = insertPageSchema.safeParse({ ...validPage, slug: 'Home' });
    expect(result.success).toBe(false);
  });

  it('rejects slug with spaces', () => {
    const result = insertPageSchema.safeParse({ ...validPage, slug: 'about us' });
    expect(result.success).toBe(false);
  });

  it('validates metaTitle max length (60)', () => {
    const tooLong = insertPageSchema.safeParse({
      ...validPage,
      metaTitle: 'A'.repeat(61),
    });
    expect(tooLong.success).toBe(false);

    const exactlyMax = insertPageSchema.safeParse({
      ...validPage,
      metaTitle: 'A'.repeat(60),
    });
    expect(exactlyMax.success).toBe(true);
  });

  it('validates metaDescription max length (160)', () => {
    const tooLong = insertPageSchema.safeParse({
      ...validPage,
      metaDescription: 'B'.repeat(161),
    });
    expect(tooLong.success).toBe(false);

    const exactlyMax = insertPageSchema.safeParse({
      ...validPage,
      metaDescription: 'B'.repeat(160),
    });
    expect(exactlyMax.success).toBe(true);
  });

  it('allows metaTitle and metaDescription to be omitted', () => {
    const result = insertPageSchema.safeParse(validPage);
    expect(result.success).toBe(true);
  });

  it('accepts optional fields (parentId, fullPath, ogImageUrl)', () => {
    const result = insertPageSchema.safeParse({
      ...validPage,
      parentId: uuid(),
      fullPath: '/home',
      ogImageUrl: 'https://example.com/og.png',
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// insertContentBlockSchema
// ---------------------------------------------------------------------------

describe('insertContentBlockSchema', () => {
  const validBlock = {
    pageId: uuid(),
    blockType: 'hero',
    content: { heading: 'Welcome' },
  };

  it('accepts valid block data', () => {
    const result = insertContentBlockSchema.safeParse(validBlock);
    expect(result.success).toBe(true);
  });

  it('requires pageId', () => {
    const { pageId, ...noPageId } = validBlock;
    const result = insertContentBlockSchema.safeParse(noPageId);
    expect(result.success).toBe(false);
  });

  it('requires blockType', () => {
    const { blockType, ...noBlockType } = validBlock;
    const result = insertContentBlockSchema.safeParse(noBlockType);
    expect(result.success).toBe(false);
  });

  it('accepts optional settings', () => {
    const result = insertContentBlockSchema.safeParse({
      ...validBlock,
      settings: { padding: '2rem', background: '#000' },
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional sortOrder and isVisible', () => {
    const result = insertContentBlockSchema.safeParse({
      ...validBlock,
      sortOrder: 5,
      isVisible: false,
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// insertMediaSchema
// ---------------------------------------------------------------------------

describe('insertMediaSchema', () => {
  const validMedia = {
    siteId: uuid(),
    filename: 'image-abc123.jpg',
    originalFilename: 'photo.jpg',
    mimeType: 'image/jpeg',
    fileSize: 102400,
    url: 'https://storage.example.com/image-abc123.jpg',
  };

  it('accepts valid media with all required fields', () => {
    const result = insertMediaSchema.safeParse(validMedia);
    expect(result.success).toBe(true);
  });

  it('requires filename', () => {
    const { filename, ...rest } = validMedia;
    const result = insertMediaSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('requires originalFilename', () => {
    const { originalFilename, ...rest } = validMedia;
    const result = insertMediaSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('requires mimeType', () => {
    const { mimeType, ...rest } = validMedia;
    const result = insertMediaSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('requires fileSize', () => {
    const { fileSize, ...rest } = validMedia;
    const result = insertMediaSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('requires url', () => {
    const { url, ...rest } = validMedia;
    const result = insertMediaSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('requires siteId', () => {
    const { siteId, ...rest } = validMedia;
    const result = insertMediaSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('accepts optional fields (thumbnailUrl, altText, caption, folder, metadata)', () => {
    const result = insertMediaSchema.safeParse({
      ...validMedia,
      thumbnailUrl: 'https://storage.example.com/thumb.jpg',
      altText: 'A nice photo',
      caption: 'Taken in 2024',
      folder: '/photos',
      metadata: { width: 1920, height: 1080 },
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// insertUserSchema
// ---------------------------------------------------------------------------

describe('insertUserSchema', () => {
  const validUser = {
    tenantId: uuid(),
    email: 'user@example.com',
    username: 'testuser',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuv',
  };

  it('accepts valid user with all required fields', () => {
    const result = insertUserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('requires email', () => {
    const { email, ...rest } = validUser;
    const result = insertUserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('requires username', () => {
    const { username, ...rest } = validUser;
    const result = insertUserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('requires passwordHash', () => {
    const { passwordHash, ...rest } = validUser;
    const result = insertUserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('requires tenantId', () => {
    const { tenantId, ...rest } = validUser;
    const result = insertUserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('accepts optional role and isActive', () => {
    const result = insertUserSchema.safeParse({
      ...validUser,
      role: 'admin',
      isActive: false,
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional sitePermissions', () => {
    const result = insertUserSchema.safeParse({
      ...validUser,
      sitePermissions: { [uuid()]: ['read', 'write'] },
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// insertThemeSchema
// ---------------------------------------------------------------------------

describe('insertThemeSchema', () => {
  const validTheme = {
    siteId: uuid(),
    name: 'Dark Theme',
    tokens: {
      colors: { primary: '#90b9ab', background: '#0a0a0a' },
      typography: { fontFamily: 'Inter', fontSize: 16 },
    },
  };

  it('accepts valid theme with required fields', () => {
    const result = insertThemeSchema.safeParse(validTheme);
    expect(result.success).toBe(true);
  });

  it('requires siteId', () => {
    const { siteId, ...rest } = validTheme;
    const result = insertThemeSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('requires name', () => {
    const { name, ...rest } = validTheme;
    const result = insertThemeSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('requires tokens', () => {
    const { tokens, ...rest } = validTheme;
    const result = insertThemeSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('accepts optional fields (isActive, baseTheme, customCss)', () => {
    const result = insertThemeSchema.safeParse({
      ...validTheme,
      isActive: true,
      baseTheme: 'kog',
      customCss: '.hero { color: red; }',
    });
    expect(result.success).toBe(true);
  });

  it('accepts tokens with optional spacing and effects', () => {
    const result = insertThemeSchema.safeParse({
      ...validTheme,
      tokens: {
        ...validTheme.tokens,
        spacing: { sm: '0.5rem', md: '1rem' },
        effects: { shadow: '0 2px 4px rgba(0,0,0,0.2)' },
      },
    });
    expect(result.success).toBe(true);
  });
});
