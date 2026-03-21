// @ts-nocheck — plugin routes use dynamic drizzle queries with `any` db client
/**
 * Migration Routes — WordPress, Shopify, and Square Online site import
 *
 * Admin routes mounted under /api/v1/sites/:siteId/migrate
 */

import { Router, type Request, type Response } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { pages, contentBlocks, media } from '@netrun-cms/db';
import { migrations, migrationItems } from './schema.js';
import { parseWXR, parseGutenbergBlocks } from './lib/wordpress.js';
import {
  fetchShopifyPages,
  fetchShopifyProducts,
  fetchShopifyArticles,
  fetchShopifyTheme,
  fetchShopifyMenus,
  fetchShopifyRedirects,
} from './lib/shopify.js';
import { fetchSquareProducts, scrapeSquareSite, parseHtmlToBlocks } from './lib/square.js';
import { downloadMedia, rewriteMediaUrls } from './lib/media.js';
import type { PluginLogger } from '@netrun-cms/plugin-runtime';
import type { Router as RouterType } from 'express';
import type { MappedBlock } from './lib/wordpress.js';

// ---------------------------------------------------------------------------
// Multer setup for WXR file upload
// ---------------------------------------------------------------------------
let multer: any;
try {
  multer = require('multer');
} catch {
  // multer may not be installed; WXR upload will fall back to API mode
}

const upload = multer
  ? multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })
  : null;

// ---------------------------------------------------------------------------
// Route factory
// ---------------------------------------------------------------------------

interface MigrateRoutes {
  adminRouter: RouterType;
}

export function createRoutes(db: any, logger: PluginLogger): MigrateRoutes {
  const adminRouter = Router({ mergeParams: true });
  const d = db as any;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function logEntry(level: string, message: string): { timestamp: string; level: string; message: string } {
    return { timestamp: new Date().toISOString(), level, message };
  }

  async function appendLog(migrationId: string, level: string, message: string) {
    try {
      const [row] = await d.select({ log: migrations.log }).from(migrations)
        .where(eq(migrations.id, migrationId));
      const currentLog = Array.isArray(row?.log) ? row.log : [];
      currentLog.push(logEntry(level, message));
      await d.update(migrations).set({ log: currentLog, updatedAt: new Date() })
        .where(eq(migrations.id, migrationId));
    } catch (err) {
      logger.error({ err }, `Failed to append migration log: ${message}`);
    }
  }

  async function updateMigrationCounts(migrationId: string) {
    try {
      const items = await d.select({ status: migrationItems.status }).from(migrationItems)
        .where(eq(migrationItems.migrationId, migrationId));
      const total = items.length;
      const imported = items.filter((i: any) => i.status === 'imported').length;
      const failed = items.filter((i: any) => i.status === 'failed').length;
      await d.update(migrations).set({
        totalItems: total,
        importedItems: imported,
        failedItems: failed,
        updatedAt: new Date(),
      }).where(eq(migrations.id, migrationId));
    } catch (err) {
      logger.error({ err }, 'Failed to update migration counts');
    }
  }

  /**
   * Import a single page with its blocks into the CMS.
   * Returns the created page ID, or null on failure.
   */
  async function importPage(
    siteId: string,
    migrationId: string,
    page: {
      title: string;
      slug: string;
      status: string;
      template?: string;
      seo?: { title?: string; description?: string; ogImage?: string };
      blocks: MappedBlock[];
      sourceType: string;
      sourceId?: string;
      sourceUrl?: string;
    },
  ): Promise<string | null> {
    try {
      // Sanitize slug
      let slug = (page.slug || page.title)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        || 'untitled';

      // Map template to allowed values
      const allowedTemplates = ['default', 'landing', 'blog', 'product', 'contact', 'artist'];
      const template = allowedTemplates.includes(page.template || '')
        ? page.template!
        : 'default';

      // Map status
      const status = page.status === 'published' ? 'published' : 'draft';

      // Create CMS page
      const [createdPage] = await d.insert(pages).values({
        siteId,
        title: page.title.slice(0, 255),
        slug: slug.slice(0, 255),
        status,
        template,
        metaTitle: page.seo?.title?.slice(0, 60) || null,
        metaDescription: page.seo?.description?.slice(0, 160) || null,
        ogImageUrl: page.seo?.ogImage || null,
        publishedAt: status === 'published' ? new Date() : null,
      }).returning();

      // Create content blocks
      for (let i = 0; i < page.blocks.length; i++) {
        const block = page.blocks[i];
        try {
          await d.insert(contentBlocks).values({
            pageId: createdPage.id,
            blockType: block.type,
            content: block.content,
            settings: block.settings || {},
            sortOrder: i,
            isVisible: true,
          });
        } catch (blockErr) {
          logger.warn({ err: blockErr }, `Failed to create block ${i} for page ${page.title}`);
        }
      }

      // Record migration item
      await d.insert(migrationItems).values({
        migrationId,
        sourceType: page.sourceType,
        sourceId: page.sourceId || null,
        sourceUrl: page.sourceUrl || null,
        targetType: 'page',
        targetId: createdPage.id,
        status: 'imported',
        title: page.title.slice(0, 500),
        data: { blocksCount: page.blocks.length, template, slug },
      });

      return createdPage.id;
    } catch (err: any) {
      logger.error({ err }, `Failed to import page: ${page.title}`);

      // Record failed item
      await d.insert(migrationItems).values({
        migrationId,
        sourceType: page.sourceType,
        sourceId: page.sourceId || null,
        sourceUrl: page.sourceUrl || null,
        status: 'failed',
        title: page.title.slice(0, 500),
        error: err.message || String(err),
      }).catch(() => {});

      return null;
    }
  }

  /**
   * Record a media reference as a migration item (for download tracking).
   */
  async function recordMediaItem(
    migrationId: string,
    mediaRef: { url: string; title?: string; sourceId?: string },
  ) {
    try {
      await d.insert(migrationItems).values({
        migrationId,
        sourceType: 'media',
        sourceId: mediaRef.sourceId || null,
        sourceUrl: mediaRef.url,
        targetType: 'media',
        status: 'pending',
        title: (mediaRef.title || mediaRef.url).slice(0, 500),
        data: { url: mediaRef.url },
      });
    } catch (err) {
      logger.warn({ err }, `Failed to record media item: ${mediaRef.url}`);
    }
  }

  /**
   * Record a menu structure as site settings metadata.
   */
  async function recordMenuItems(
    migrationId: string,
    menuItems: Array<{ title: string; url: string; parentId?: string; order?: number; menuName?: string }>,
  ) {
    for (const item of menuItems) {
      try {
        await d.insert(migrationItems).values({
          migrationId,
          sourceType: 'menu',
          sourceId: null,
          sourceUrl: item.url,
          targetType: 'nav',
          status: 'imported',
          title: item.title.slice(0, 500),
          data: {
            url: item.url,
            parentId: item.parentId,
            order: item.order,
            menuName: item.menuName,
          },
        });
      } catch (err) {
        logger.warn({ err }, `Failed to record menu item: ${item.title}`);
      }
    }
  }

  /**
   * Record redirects as migration items.
   */
  async function recordRedirects(
    migrationId: string,
    redirects: Array<{ path: string; target: string; sourceId?: string }>,
  ) {
    for (const redirect of redirects) {
      try {
        await d.insert(migrationItems).values({
          migrationId,
          sourceType: 'redirect',
          sourceId: redirect.sourceId || null,
          sourceUrl: redirect.path,
          targetType: 'nav',
          status: 'imported',
          title: `${redirect.path} → ${redirect.target}`.slice(0, 500),
          data: { path: redirect.path, target: redirect.target },
        });
      } catch (err) {
        logger.warn({ err }, `Failed to record redirect: ${redirect.path}`);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // GET / — list migrations for site
  // ---------------------------------------------------------------------------
  adminRouter.get('/', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const rows = await d.select().from(migrations)
        .where(eq(migrations.siteId, siteId))
        .orderBy(desc(migrations.createdAt));
      res.json({ success: true, data: rows });
    } catch (err) {
      logger.error({ err }, 'Failed to list migrations');
      res.status(500).json({ success: false, error: { message: 'Failed to list migrations' } });
    }
  });

  // ---------------------------------------------------------------------------
  // POST /wordpress — start WordPress migration
  // ---------------------------------------------------------------------------
  const wordpressHandler = async (req: Request, res: Response) => {
    const { siteId } = req.params;
    let migrationId: string;

    try {
      // Create migration record
      const [migration] = await d.insert(migrations).values({
        siteId,
        source: 'wordpress',
        status: 'running',
        sourceUrl: req.body?.siteUrl || null,
        config: {
          mode: (req as any).file ? 'wxr_upload' : 'api',
          siteUrl: req.body?.siteUrl,
          apiBase: req.body?.apiBase,
        },
      }).returning();

      migrationId = migration.id;
      res.json({ success: true, data: { migrationId, status: 'running' } });

      // Process async (after response)
      setImmediate(async () => {
        try {
          await appendLog(migrationId, 'info', 'WordPress migration started');

          let wxrContent: string | null = null;

          if ((req as any).file) {
            // WXR file upload
            wxrContent = (req as any).file.buffer.toString('utf-8');
            await appendLog(migrationId, 'info', `WXR file received: ${(req as any).file.originalname} (${(req as any).file.size} bytes)`);
          } else if (req.body?.siteUrl || req.body?.apiBase) {
            // Fetch WXR via WordPress REST API export (if available)
            // Or try to fetch the WXR export URL
            const apiBase = req.body.apiBase || `${req.body.siteUrl}/wp-json/wp/v2`;
            await appendLog(migrationId, 'info', `Fetching from WordPress API: ${apiBase}`);

            // Try fetching pages and posts via REST API
            try {
              const pagesResp = await fetch(`${apiBase}/pages?per_page=100&_embed`);
              const postsResp = await fetch(`${apiBase}/posts?per_page=100&_embed`);

              if (pagesResp.ok && postsResp.ok) {
                const apiPages = await pagesResp.json() as any[];
                const apiPosts = await postsResp.json() as any[];

                await appendLog(migrationId, 'info', `REST API: ${apiPages.length} pages, ${apiPosts.length} posts`);

                // Import pages from REST API
                for (const apiPage of apiPages) {
                  const content = apiPage.content?.rendered || '';
                  const blocks = parseGutenbergBlocks(content);

                  await importPage(siteId, migrationId, {
                    title: apiPage.title?.rendered || 'Untitled',
                    slug: apiPage.slug || '',
                    status: apiPage.status === 'publish' ? 'published' : 'draft',
                    template: apiPage.template || 'default',
                    seo: {
                      title: apiPage.yoast_head_json?.title,
                      description: apiPage.yoast_head_json?.description,
                      ogImage: apiPage.yoast_head_json?.og_image?.[0]?.url,
                    },
                    blocks,
                    sourceType: 'page',
                    sourceId: String(apiPage.id),
                    sourceUrl: apiPage.link,
                  });
                }

                // Import posts from REST API
                for (const apiPost of apiPosts) {
                  const content = apiPost.content?.rendered || '';
                  const blocks = parseGutenbergBlocks(content);

                  await importPage(siteId, migrationId, {
                    title: apiPost.title?.rendered || 'Untitled',
                    slug: apiPost.slug || '',
                    status: apiPost.status === 'publish' ? 'published' : 'draft',
                    template: 'blog',
                    seo: {
                      title: apiPost.yoast_head_json?.title,
                      description: apiPost.yoast_head_json?.description,
                      ogImage: apiPost.yoast_head_json?.og_image?.[0]?.url,
                    },
                    blocks,
                    sourceType: 'post',
                    sourceId: String(apiPost.id),
                    sourceUrl: apiPost.link,
                  });
                }

                // Fetch media library
                try {
                  const mediaResp = await fetch(`${apiBase}/media?per_page=100`);
                  if (mediaResp.ok) {
                    const apiMedia = await mediaResp.json() as any[];
                    for (const m of apiMedia) {
                      await recordMediaItem(migrationId, {
                        url: m.source_url || m.guid?.rendered || '',
                        title: m.title?.rendered || '',
                        sourceId: String(m.id),
                      });
                    }
                  }
                } catch {
                  await appendLog(migrationId, 'warn', 'Failed to fetch media library via REST API');
                }

                await updateMigrationCounts(migrationId);
                await d.update(migrations).set({ status: 'completed', updatedAt: new Date() })
                  .where(eq(migrations.id, migrationId));
                await appendLog(migrationId, 'info', 'WordPress REST API migration completed');
                return;
              }
            } catch (apiErr: any) {
              await appendLog(migrationId, 'warn', `REST API fetch failed: ${apiErr.message}, trying WXR export...`);
            }

            // If REST API fails, no WXR content to parse
            if (!wxrContent) {
              await d.update(migrations).set({ status: 'failed', updatedAt: new Date() })
                .where(eq(migrations.id, migrationId));
              await appendLog(migrationId, 'error', 'No WXR file provided and REST API not accessible');
              return;
            }
          }

          if (!wxrContent) {
            await d.update(migrations).set({ status: 'failed', updatedAt: new Date() })
              .where(eq(migrations.id, migrationId));
            await appendLog(migrationId, 'error', 'No WordPress data source provided');
            return;
          }

          // Parse WXR
          await appendLog(migrationId, 'info', 'Parsing WXR XML...');
          const result = parseWXR(wxrContent);
          await appendLog(migrationId, 'info',
            `Parsed: ${result.pages.length} pages, ${result.posts.length} posts, ` +
            `${result.media.length} media, ${result.categories.length} categories, ` +
            `${result.menus.length} menu items`);

          // Import pages
          for (const page of result.pages) {
            await importPage(siteId, migrationId, {
              title: page.title,
              slug: page.slug,
              status: page.status,
              template: page.template,
              seo: page.seo,
              blocks: page.blocks.length > 0 ? page.blocks : parseGutenbergBlocks(page.content),
              sourceType: 'page',
              sourceUrl: undefined,
            });
          }

          // Import posts as blog pages
          for (const post of result.posts) {
            await importPage(siteId, migrationId, {
              title: post.title,
              slug: post.slug,
              status: post.status,
              template: 'blog',
              seo: post.seo,
              blocks: post.blocks.length > 0 ? post.blocks : parseGutenbergBlocks(post.content),
              sourceType: 'post',
              sourceUrl: undefined,
            });
          }

          // Record media references
          for (const m of result.media) {
            await recordMediaItem(migrationId, {
              url: m.url,
              title: m.title,
              sourceId: m.id,
            });
          }

          // Record categories
          for (const cat of result.categories) {
            await d.insert(migrationItems).values({
              migrationId,
              sourceType: 'category',
              sourceId: cat.id,
              status: 'imported',
              title: cat.name.slice(0, 500),
              data: { slug: cat.slug, parentId: cat.parentId, description: cat.description },
            }).catch(() => {});
          }

          // Record menu items
          await recordMenuItems(migrationId, result.menus.map(m => ({
            title: m.title,
            url: m.url,
            parentId: m.parentId,
            order: m.order,
            menuName: m.menuName,
          })));

          await updateMigrationCounts(migrationId);

          // Determine final status
          const allItems = await d.select({ status: migrationItems.status }).from(migrationItems)
            .where(eq(migrationItems.migrationId, migrationId));
          const hasFailures = allItems.some((i: any) => i.status === 'failed');
          const hasImported = allItems.some((i: any) => i.status === 'imported');
          const finalStatus = hasFailures && hasImported ? 'partial'
            : hasFailures ? 'failed'
            : 'completed';

          await d.update(migrations).set({ status: finalStatus, updatedAt: new Date() })
            .where(eq(migrations.id, migrationId));
          await appendLog(migrationId, 'info', `WordPress migration ${finalStatus}`);

        } catch (err: any) {
          logger.error({ err }, 'WordPress migration failed');
          await d.update(migrations).set({ status: 'failed', updatedAt: new Date() })
            .where(eq(migrations.id, migrationId));
          await appendLog(migrationId, 'error', `Migration failed: ${err.message}`);
        }
      });
    } catch (err) {
      logger.error({ err }, 'Failed to start WordPress migration');
      res.status(500).json({ success: false, error: { message: 'Failed to start migration' } });
    }
  };

  if (upload) {
    adminRouter.post('/wordpress', upload.single('wxr'), wordpressHandler);
  } else {
    adminRouter.post('/wordpress', wordpressHandler);
  }

  // ---------------------------------------------------------------------------
  // POST /shopify — start Shopify migration
  // ---------------------------------------------------------------------------
  adminRouter.post('/shopify', async (req: Request, res: Response) => {
    const { siteId } = req.params;
    const { domain, adminToken, storefrontToken } = req.body;

    if (!domain || !adminToken) {
      return res.status(400).json({
        success: false,
        error: { message: 'domain and adminToken are required' },
      });
    }

    let migrationId: string;

    try {
      const [migration] = await d.insert(migrations).values({
        siteId,
        source: 'shopify',
        status: 'running',
        sourceUrl: `https://${domain}`,
        config: { domain, hasStorefrontToken: !!storefrontToken },
      }).returning();

      migrationId = migration.id;
      res.json({ success: true, data: { migrationId, status: 'running' } });

      // Process async
      setImmediate(async () => {
        try {
          await appendLog(migrationId, 'info', `Shopify migration started for ${domain}`);

          // Fetch pages
          await appendLog(migrationId, 'info', 'Fetching pages...');
          let shopifyPages: any[] = [];
          try {
            shopifyPages = await fetchShopifyPages(domain, adminToken);
            await appendLog(migrationId, 'info', `Fetched ${shopifyPages.length} pages`);
          } catch (err: any) {
            await appendLog(migrationId, 'warn', `Failed to fetch pages: ${err.message}`);
          }

          // Fetch products
          await appendLog(migrationId, 'info', 'Fetching products...');
          let shopifyProducts: any[] = [];
          try {
            shopifyProducts = await fetchShopifyProducts(domain, adminToken);
            await appendLog(migrationId, 'info', `Fetched ${shopifyProducts.length} products`);
          } catch (err: any) {
            await appendLog(migrationId, 'warn', `Failed to fetch products: ${err.message}`);
          }

          // Fetch blog posts
          await appendLog(migrationId, 'info', 'Fetching blog posts...');
          let shopifyArticles: any[] = [];
          try {
            shopifyArticles = await fetchShopifyArticles(domain, adminToken);
            await appendLog(migrationId, 'info', `Fetched ${shopifyArticles.length} blog posts`);
          } catch (err: any) {
            await appendLog(migrationId, 'warn', `Failed to fetch blog posts: ${err.message}`);
          }

          // Fetch theme data
          await appendLog(migrationId, 'info', 'Fetching theme data...');
          let themeData: any = null;
          try {
            themeData = await fetchShopifyTheme(domain, adminToken);
            await appendLog(migrationId, 'info', `Theme: ${themeData.name}, ${themeData.sections.length} sections`);
          } catch (err: any) {
            await appendLog(migrationId, 'warn', `Failed to fetch theme: ${err.message}`);
          }

          // Fetch menus (requires storefront token)
          let menuItems: any[] = [];
          if (storefrontToken) {
            try {
              menuItems = await fetchShopifyMenus(domain, storefrontToken);
              await appendLog(migrationId, 'info', `Fetched ${menuItems.length} menu items`);
            } catch (err: any) {
              await appendLog(migrationId, 'warn', `Failed to fetch menus: ${err.message}`);
            }
          }

          // Fetch redirects
          let redirects: any[] = [];
          try {
            redirects = await fetchShopifyRedirects(domain, adminToken);
            await appendLog(migrationId, 'info', `Fetched ${redirects.length} redirects`);
          } catch (err: any) {
            await appendLog(migrationId, 'warn', `Failed to fetch redirects: ${err.message}`);
          }

          // Import pages
          for (const page of shopifyPages) {
            await importPage(siteId, migrationId, {
              title: page.title,
              slug: page.handle,
              status: page.publishedAt ? 'published' : 'draft',
              blocks: page.blocks,
              seo: {
                title: page.metafields.find((m: any) => m.key === 'title_tag')?.value,
                description: page.metafields.find((m: any) => m.key === 'description_tag')?.value,
              },
              sourceType: 'page',
              sourceId: String(page.id),
              sourceUrl: `https://${domain}/pages/${page.handle}`,
            });
          }

          // Import products as product pages
          for (const product of shopifyProducts) {
            const blocks: MappedBlock[] = [];

            // Product images as gallery
            if (product.images.length > 0) {
              blocks.push({
                type: 'gallery',
                content: {
                  images: product.images.map((img: any) => ({
                    url: img.src,
                    alt: img.alt || product.title,
                  })),
                },
                settings: {},
              });
            }

            // Product description as text
            if (product.bodyHtml) {
              blocks.push({
                type: 'text',
                content: { body: product.bodyHtml },
                settings: {},
              });
            }

            // Variant info
            if (product.variants.length > 0) {
              blocks.push({
                type: 'custom',
                content: {
                  widgetType: 'product_variants',
                  variants: product.variants.map((v: any) => ({
                    title: v.title,
                    price: v.price,
                    sku: v.sku,
                  })),
                },
                settings: {},
              });
            }

            await importPage(siteId, migrationId, {
              title: product.title,
              slug: product.handle,
              status: product.status === 'active' ? 'published' : 'draft',
              template: 'product',
              blocks,
              sourceType: 'product',
              sourceId: String(product.id),
              sourceUrl: `https://${domain}/products/${product.handle}`,
            });

            // Record product images as media
            for (const img of product.images) {
              await recordMediaItem(migrationId, {
                url: img.src,
                title: img.alt || product.title,
                sourceId: String(img.id),
              });
            }
          }

          // Import blog posts
          for (const article of shopifyArticles) {
            await importPage(siteId, migrationId, {
              title: article.title,
              slug: article.handle,
              status: article.publishedAt ? 'published' : 'draft',
              template: 'blog',
              blocks: article.blocks,
              seo: {
                title: article.metafields.find((m: any) => m.key === 'title_tag')?.value,
                description: article.metafields.find((m: any) => m.key === 'description_tag')?.value,
              },
              sourceType: 'post',
              sourceId: String(article.id),
              sourceUrl: `https://${domain}/blogs/${article.blogHandle}/${article.handle}`,
            });

            if (article.imageUrl) {
              await recordMediaItem(migrationId, {
                url: article.imageUrl,
                title: article.title,
              });
            }
          }

          // Record menus
          function flattenMenuItems(items: any[], results: any[] = []) {
            for (const item of items) {
              results.push({
                title: item.title,
                url: item.url,
                menuName: 'main',
              });
              if (item.children?.length) {
                flattenMenuItems(item.children, results);
              }
            }
            return results;
          }
          if (menuItems.length > 0) {
            await recordMenuItems(migrationId, flattenMenuItems(menuItems));
          }

          // Record redirects
          if (redirects.length > 0) {
            await recordRedirects(migrationId, redirects.map(r => ({
              path: r.path,
              target: r.target,
              sourceId: String(r.id),
            })));
          }

          // Store theme tokens as a migration item
          if (themeData?.tokens && Object.keys(themeData.tokens).length > 0) {
            await d.insert(migrationItems).values({
              migrationId,
              sourceType: 'category', // reuse for theme data
              status: 'imported',
              title: `Theme: ${themeData.name}`,
              data: { themeTokens: themeData.tokens, sections: themeData.sections.length },
            }).catch(() => {});
          }

          await updateMigrationCounts(migrationId);

          const allItems = await d.select({ status: migrationItems.status }).from(migrationItems)
            .where(eq(migrationItems.migrationId, migrationId));
          const hasFailures = allItems.some((i: any) => i.status === 'failed');
          const hasImported = allItems.some((i: any) => i.status === 'imported');
          const finalStatus = hasFailures && hasImported ? 'partial'
            : hasFailures ? 'failed'
            : 'completed';

          await d.update(migrations).set({ status: finalStatus, updatedAt: new Date() })
            .where(eq(migrations.id, migrationId));
          await appendLog(migrationId, 'info', `Shopify migration ${finalStatus}`);

        } catch (err: any) {
          logger.error({ err }, 'Shopify migration failed');
          await d.update(migrations).set({ status: 'failed', updatedAt: new Date() })
            .where(eq(migrations.id, migrationId));
          await appendLog(migrationId, 'error', `Migration failed: ${err.message}`);
        }
      });
    } catch (err) {
      logger.error({ err }, 'Failed to start Shopify migration');
      res.status(500).json({ success: false, error: { message: 'Failed to start migration' } });
    }
  });

  // ---------------------------------------------------------------------------
  // POST /square — start Square migration
  // ---------------------------------------------------------------------------
  adminRouter.post('/square', async (req: Request, res: Response) => {
    const { siteId } = req.params;
    const { siteUrl, accessToken } = req.body;

    if (!siteUrl && !accessToken) {
      return res.status(400).json({
        success: false,
        error: { message: 'siteUrl or accessToken is required' },
      });
    }

    let migrationId: string;

    try {
      const [migration] = await d.insert(migrations).values({
        siteId,
        source: 'square',
        status: 'running',
        sourceUrl: siteUrl || null,
        config: { siteUrl, hasAccessToken: !!accessToken },
      }).returning();

      migrationId = migration.id;
      res.json({ success: true, data: { migrationId, status: 'running' } });

      // Process async
      setImmediate(async () => {
        try {
          await appendLog(migrationId, 'info', 'Square migration started');

          // Fetch products via API if token provided
          if (accessToken) {
            await appendLog(migrationId, 'info', 'Fetching products from Square Catalog API...');
            try {
              const products = await fetchSquareProducts(accessToken);
              await appendLog(migrationId, 'info', `Fetched ${products.length} products`);

              for (const product of products) {
                const blocks: MappedBlock[] = [];

                // Product images as gallery
                if (product.imageUrls.length > 0) {
                  blocks.push({
                    type: 'gallery',
                    content: {
                      images: product.imageUrls.map(url => ({ url, alt: product.name })),
                    },
                    settings: {},
                  });
                }

                // Description as text
                if (product.description) {
                  blocks.push({
                    type: 'text',
                    content: { body: product.description },
                    settings: {},
                  });
                }

                // Variants
                if (product.variations.length > 0) {
                  blocks.push({
                    type: 'custom',
                    content: {
                      widgetType: 'product_variants',
                      variants: product.variations.map(v => ({
                        name: v.name,
                        price: v.priceMoney
                          ? `${(v.priceMoney.amount / 100).toFixed(2)} ${v.priceMoney.currency}`
                          : 'N/A',
                        sku: v.sku,
                      })),
                    },
                    settings: {},
                  });
                }

                await importPage(siteId, migrationId, {
                  title: product.name,
                  slug: product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                  status: product.visibility === 'VISIBLE' ? 'published' : 'draft',
                  template: 'product',
                  blocks,
                  sourceType: 'product',
                  sourceId: product.id,
                });

                for (const imgUrl of product.imageUrls) {
                  await recordMediaItem(migrationId, {
                    url: imgUrl,
                    title: product.name,
                    sourceId: product.id,
                  });
                }
              }
            } catch (err: any) {
              await appendLog(migrationId, 'warn', `Failed to fetch products: ${err.message}`);
            }
          }

          // Scrape site content
          if (siteUrl) {
            await appendLog(migrationId, 'info', `Scraping site: ${siteUrl}...`);
            try {
              const siteData = await scrapeSquareSite(siteUrl);
              await appendLog(migrationId, 'info',
                `Scraped ${siteData.pages.length} pages, ${siteData.navigation.length} nav items`);

              // Import scraped pages
              for (const scrapedPage of siteData.pages) {
                await importPage(siteId, migrationId, {
                  title: scrapedPage.title,
                  slug: new URL(scrapedPage.url).pathname.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'home',
                  status: 'draft', // scraped pages go to draft for review
                  blocks: scrapedPage.blocks,
                  seo: scrapedPage.seo,
                  sourceType: 'page',
                  sourceUrl: scrapedPage.url,
                });
              }

              // Record navigation
              function flattenSquareNav(items: any[], results: any[] = []) {
                for (const item of items) {
                  results.push({ title: item.title, url: item.url, menuName: 'main' });
                  if (item.children?.length) {
                    flattenSquareNav(item.children, results);
                  }
                }
                return results;
              }
              await recordMenuItems(migrationId, flattenSquareNav(siteData.navigation));

            } catch (err: any) {
              await appendLog(migrationId, 'warn', `Failed to scrape site: ${err.message}`);
            }
          }

          await updateMigrationCounts(migrationId);

          const allItems = await d.select({ status: migrationItems.status }).from(migrationItems)
            .where(eq(migrationItems.migrationId, migrationId));
          const hasFailures = allItems.some((i: any) => i.status === 'failed');
          const hasImported = allItems.some((i: any) => i.status === 'imported');
          const finalStatus = allItems.length === 0 ? 'failed'
            : hasFailures && hasImported ? 'partial'
            : hasFailures ? 'failed'
            : 'completed';

          await d.update(migrations).set({ status: finalStatus, updatedAt: new Date() })
            .where(eq(migrations.id, migrationId));
          await appendLog(migrationId, 'info', `Square migration ${finalStatus}`);

        } catch (err: any) {
          logger.error({ err }, 'Square migration failed');
          await d.update(migrations).set({ status: 'failed', updatedAt: new Date() })
            .where(eq(migrations.id, migrationId));
          await appendLog(migrationId, 'error', `Migration failed: ${err.message}`);
        }
      });
    } catch (err) {
      logger.error({ err }, 'Failed to start Square migration');
      res.status(500).json({ success: false, error: { message: 'Failed to start migration' } });
    }
  });

  // ---------------------------------------------------------------------------
  // GET /:migrationId — get migration status
  // ---------------------------------------------------------------------------
  adminRouter.get('/:migrationId', async (req: Request, res: Response) => {
    try {
      const { migrationId } = req.params;
      const [migration] = await d.select().from(migrations)
        .where(eq(migrations.id, migrationId));

      if (!migration) {
        return res.status(404).json({ success: false, error: { message: 'Migration not found' } });
      }

      res.json({ success: true, data: migration });
    } catch (err) {
      logger.error({ err }, 'Failed to get migration');
      res.status(500).json({ success: false, error: { message: 'Failed to get migration' } });
    }
  });

  // ---------------------------------------------------------------------------
  // GET /:migrationId/items — list migration items
  // ---------------------------------------------------------------------------
  adminRouter.get('/:migrationId/items', async (req: Request, res: Response) => {
    try {
      const { migrationId } = req.params;
      const { status, sourceType } = req.query;

      let query = d.select().from(migrationItems)
        .where(eq(migrationItems.migrationId, migrationId));

      if (status) {
        query = d.select().from(migrationItems)
          .where(and(
            eq(migrationItems.migrationId, migrationId),
            eq(migrationItems.status, status as string),
          ));
      }

      if (sourceType) {
        query = d.select().from(migrationItems)
          .where(and(
            eq(migrationItems.migrationId, migrationId),
            eq(migrationItems.sourceType, sourceType as string),
          ));
      }

      const rows = await query.orderBy(desc(migrationItems.createdAt));
      res.json({ success: true, data: rows });
    } catch (err) {
      logger.error({ err }, 'Failed to list migration items');
      res.status(500).json({ success: false, error: { message: 'Failed to list migration items' } });
    }
  });

  // ---------------------------------------------------------------------------
  // POST /:migrationId/retry — retry failed items
  // ---------------------------------------------------------------------------
  adminRouter.post('/:migrationId/retry', async (req: Request, res: Response) => {
    try {
      const { siteId, migrationId } = req.params;

      const [migration] = await d.select().from(migrations)
        .where(eq(migrations.id, migrationId));

      if (!migration) {
        return res.status(404).json({ success: false, error: { message: 'Migration not found' } });
      }

      // Get failed items
      const failedItems = await d.select().from(migrationItems)
        .where(and(
          eq(migrationItems.migrationId, migrationId),
          eq(migrationItems.status, 'failed'),
        ));

      if (failedItems.length === 0) {
        return res.json({ success: true, data: { message: 'No failed items to retry', retried: 0 } });
      }

      // Reset failed items to pending
      await d.update(migrationItems).set({ status: 'pending', error: null })
        .where(and(
          eq(migrationItems.migrationId, migrationId),
          eq(migrationItems.status, 'failed'),
        ));

      await d.update(migrations).set({ status: 'running', updatedAt: new Date() })
        .where(eq(migrations.id, migrationId));

      await appendLog(migrationId, 'info', `Retrying ${failedItems.length} failed items`);

      // Retry media downloads for failed media items
      setImmediate(async () => {
        try {
          const pendingMedia = await d.select().from(migrationItems)
            .where(and(
              eq(migrationItems.migrationId, migrationId),
              eq(migrationItems.status, 'pending'),
              eq(migrationItems.sourceType, 'media'),
            ));

          for (const item of pendingMedia) {
            const sourceUrl = item.sourceUrl || (item.data as any)?.url;
            if (!sourceUrl) {
              await d.update(migrationItems).set({ status: 'skipped' })
                .where(eq(migrationItems.id, item.id));
              continue;
            }

            try {
              const downloaded = await downloadMedia(sourceUrl);
              if (downloaded) {
                await d.update(migrationItems).set({
                  status: 'imported',
                  data: {
                    ...(item.data || {}),
                    filename: downloaded.filename,
                    mimeType: downloaded.mimeType,
                    size: downloaded.buffer.length,
                  },
                }).where(eq(migrationItems.id, item.id));
              } else {
                await d.update(migrationItems).set({
                  status: 'failed',
                  error: 'Download returned null',
                }).where(eq(migrationItems.id, item.id));
              }
            } catch (err: any) {
              await d.update(migrationItems).set({
                status: 'failed',
                error: err.message,
              }).where(eq(migrationItems.id, item.id));
            }
          }

          await updateMigrationCounts(migrationId);

          const allItems = await d.select({ status: migrationItems.status }).from(migrationItems)
            .where(eq(migrationItems.migrationId, migrationId));
          const hasFailures = allItems.some((i: any) => i.status === 'failed');
          const hasImported = allItems.some((i: any) => i.status === 'imported');
          const finalStatus = hasFailures && hasImported ? 'partial'
            : hasFailures ? 'failed'
            : 'completed';

          await d.update(migrations).set({ status: finalStatus, updatedAt: new Date() })
            .where(eq(migrations.id, migrationId));
          await appendLog(migrationId, 'info', `Retry completed: ${finalStatus}`);

        } catch (err: any) {
          logger.error({ err }, 'Retry processing failed');
          await appendLog(migrationId, 'error', `Retry failed: ${err.message}`);
        }
      });

      res.json({ success: true, data: { message: 'Retry started', retried: failedItems.length } });
    } catch (err) {
      logger.error({ err }, 'Failed to retry migration');
      res.status(500).json({ success: false, error: { message: 'Failed to retry migration' } });
    }
  });

  // ---------------------------------------------------------------------------
  // DELETE /:migrationId — cancel/delete migration
  // ---------------------------------------------------------------------------
  adminRouter.delete('/:migrationId', async (req: Request, res: Response) => {
    try {
      const { migrationId } = req.params;

      const [migration] = await d.select().from(migrations)
        .where(eq(migrations.id, migrationId));

      if (!migration) {
        return res.status(404).json({ success: false, error: { message: 'Migration not found' } });
      }

      // Delete migration items first (cascade should handle this, but be explicit)
      await d.delete(migrationItems).where(eq(migrationItems.migrationId, migrationId));
      await d.delete(migrations).where(eq(migrations.id, migrationId));

      res.json({ success: true, data: { message: 'Migration deleted' } });
    } catch (err) {
      logger.error({ err }, 'Failed to delete migration');
      res.status(500).json({ success: false, error: { message: 'Failed to delete migration' } });
    }
  });

  return { adminRouter };
}
