// @ts-nocheck — plugin routes use dynamic drizzle queries with `any` db client
/**
 * Community Forum Plugin Routes
 *
 * Public routes (mounted under /api/v1/public/community/:siteSlug):
 *   POST   /register           — register new member
 *   POST   /login              — request magic login link
 *   POST   /login/verify       — verify magic link token, return JWT
 *   GET    /categories         — list forum categories with post counts
 *   GET    /posts              — list recent posts (body truncated for non-members)
 *   GET    /posts/:slug        — view a single thread
 *   GET    /search             — search posts (fulltext)
 *   GET    /tags               — list popular tags
 *   GET    /tags/:slug         — posts with this tag
 *   GET    /leaderboard        — top contributors
 *
 * Member routes (mounted under /api/v1/public/community/:siteSlug/m):
 *   GET    /me                 — current member profile
 *   PUT    /me                 — update profile
 *   POST   /posts              — create new thread
 *   POST   /posts/:id/reply    — reply to a thread
 *   PUT    /posts/:id          — edit own post
 *   DELETE /posts/:id          — soft-delete own post
 *   POST   /posts/:id/vote     — upvote/downvote
 *   POST   /posts/:id/solve    — mark accepted answer
 *   POST   /posts/:id/bookmark — toggle bookmark
 *   GET    /bookmarks          — list bookmarked posts
 *
 * Admin routes (mounted under /api/v1/sites/:siteId/community):
 *   GET    /members            — list members
 *   PATCH  /members/:id        — update role, ban/unban
 *   POST   /categories         — create category
 *   PUT    /categories/:id     — update category
 *   DELETE /categories/:id     — delete category
 *   PATCH  /posts/:id          — moderate: pin, lock, close, delete
 *   GET    /stats              — forum statistics
 */

import { Router, type Request, type Response } from 'express';
import { eq, and, desc, asc, sql, ilike, or, inArray, isNull } from 'drizzle-orm';
import { sites } from '@netrun-cms/db';
import type { DrizzleClient, PluginLogger } from '@netrun-cms/plugin-runtime';
import {
  communityMembers,
  communityCategories,
  communityPosts,
  communityVotes,
  communityTags,
  communityPostTags,
  communityBookmarks,
} from './schema.js';
import {
  registerMember,
  verifyEmail,
  requestLoginLink,
  verifyLoginToken,
  generateMemberToken,
  authenticateMember,
  optionalMember,
} from './lib/membership.js';
import { addReputation, getLeaderboard, getReputationTitle } from './lib/reputation.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Slugify a string for URLs */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 490);
}

/** Very basic markdown to HTML (bold, italic, code, links, paragraphs) */
function markdownToHtml(md: string): string {
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" rel="nofollow">$1</a>');
  // Paragraphs
  html = html
    .split(/\n\n+/)
    .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('\n');

  return html;
}

/** Truncate text to a max length */
function truncate(text: string, maxLen: number): string {
  if (!text || text.length <= maxLen) return text || '';
  return text.slice(0, maxLen) + '...';
}

/** Resolve siteId from siteSlug */
async function resolveSiteId(d: any, siteSlug: string): Promise<string | null> {
  const [site] = await d
    .select({ id: sites.id })
    .from(sites)
    .where(eq(sites.slug, siteSlug))
    .limit(1);
  return site?.id ?? null;
}

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

export function createPublicRoutes(db: DrizzleClient, logger: PluginLogger): Router {
  const router = Router({ mergeParams: true });
  const d = db as any;

  // ── Registration & Auth ──

  /** POST /register — register new community member */
  router.post('/register', async (req: Request, res: Response) => {
    const { siteSlug } = req.params;
    const { email, displayName } = req.body;

    if (!email || !displayName) {
      res.status(400).json({ success: false, error: { message: 'email and displayName are required' } });
      return;
    }

    const siteId = await resolveSiteId(d, siteSlug);
    if (!siteId) {
      res.status(404).json({ success: false, error: { message: 'Site not found' } });
      return;
    }

    try {
      const member = await registerMember(db, siteId, { email, displayName });
      res.status(201).json({
        success: true,
        data: { id: member.id, email: member.email, displayName: member.displayName },
        message: 'Registration successful. Check your email for verification.',
      });
    } catch (err: any) {
      if (err.message?.includes('already exists')) {
        res.status(409).json({ success: false, error: { message: err.message } });
      } else {
        logger.error({ err, siteSlug }, 'Registration failed');
        res.status(500).json({ success: false, error: { message: 'Registration failed' } });
      }
    }
  });

  /** POST /login — request magic login link */
  router.post('/login', async (req: Request, res: Response) => {
    const { siteSlug } = req.params;
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ success: false, error: { message: 'email is required' } });
      return;
    }

    const siteId = await resolveSiteId(d, siteSlug);
    if (!siteId) {
      res.status(404).json({ success: false, error: { message: 'Site not found' } });
      return;
    }

    try {
      await requestLoginLink(db, siteId, email);
      // Always return success to not reveal whether the email exists
      res.json({ success: true, message: 'If an account exists, a login link has been sent.' });
    } catch (err: any) {
      logger.error({ err, siteSlug }, 'Login link request failed');
      res.json({ success: true, message: 'If an account exists, a login link has been sent.' });
    }
  });

  /** POST /login/verify — verify magic link token, return JWT */
  router.post('/login/verify', async (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ success: false, error: { message: 'token is required' } });
      return;
    }

    try {
      const { memberId, siteId } = await verifyLoginToken(db, token);

      // Fetch full member to generate JWT
      const [member] = await d
        .select()
        .from(communityMembers)
        .where(eq(communityMembers.id, memberId))
        .limit(1);

      if (!member || member.isBanned) {
        res.status(401).json({ success: false, error: { message: 'Account not available' } });
        return;
      }

      const jwt = generateMemberToken({
        id: member.id,
        siteId: member.siteId,
        role: member.role,
        displayName: member.displayName,
      });

      res.json({
        success: true,
        data: {
          token: jwt,
          member: {
            id: member.id,
            displayName: member.displayName,
            email: member.email,
            role: member.role,
            reputation: member.reputation,
            avatarUrl: member.avatarUrl,
          },
        },
      });
    } catch (err: any) {
      res.status(401).json({ success: false, error: { message: err.message || 'Invalid token' } });
    }
  });

  // ── Email Verification ──

  /** GET /verify?token=xxx — verify email */
  router.get('/verify', async (req: Request, res: Response) => {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ success: false, error: { message: 'token query parameter is required' } });
      return;
    }

    const verified = await verifyEmail(db, token);
    if (verified) {
      res.json({ success: true, message: 'Email verified successfully' });
    } else {
      res.status(400).json({ success: false, error: { message: 'Invalid or expired verification token' } });
    }
  });

  // ── Categories ──

  /** GET /categories — list forum categories with post counts */
  router.get('/categories', async (req: Request, res: Response) => {
    const { siteSlug } = req.params;
    const siteId = await resolveSiteId(d, siteSlug);
    if (!siteId) {
      res.status(404).json({ success: false, error: { message: 'Site not found' } });
      return;
    }

    const results = await d
      .select()
      .from(communityCategories)
      .where(eq(communityCategories.siteId, siteId))
      .orderBy(asc(communityCategories.sortOrder), asc(communityCategories.name));

    res.json({ success: true, data: results });
  });

  // ── Posts ──

  /** GET /posts — list recent posts */
  router.get('/posts', optionalMember, async (req: Request, res: Response) => {
    const { siteSlug } = req.params;
    const siteId = await resolveSiteId(d, siteSlug);
    if (!siteId) {
      res.status(404).json({ success: false, error: { message: 'Site not found' } });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;
    const categorySlug = req.query.category as string;
    const type = req.query.type as string;
    const sort = req.query.sort as string; // 'recent', 'top', 'unanswered'

    const isMember = !!(req as any).member;

    // Build conditions
    const conditions = [
      eq(communityPosts.siteId, siteId),
      isNull(communityPosts.parentId), // top-level threads only
      eq(communityPosts.status, 'published'),
    ];

    // Filter by category
    if (categorySlug) {
      const [cat] = await d
        .select({ id: communityCategories.id })
        .from(communityCategories)
        .where(and(eq(communityCategories.siteId, siteId), eq(communityCategories.slug, categorySlug)))
        .limit(1);
      if (cat) {
        conditions.push(eq(communityPosts.categoryId, cat.id));
      }
    }

    if (type && ['discussion', 'question', 'article', 'announcement'].includes(type)) {
      conditions.push(eq(communityPosts.type, type));
    }

    // Determine sort order
    let orderBy;
    switch (sort) {
      case 'top':
        orderBy = [desc(communityPosts.voteScore), desc(communityPosts.createdAt)];
        break;
      case 'unanswered':
        conditions.push(eq(communityPosts.type, 'question'));
        conditions.push(eq(communityPosts.isSolved, false));
        orderBy = [desc(communityPosts.createdAt)];
        break;
      default:
        orderBy = [desc(communityPosts.isPinned), desc(communityPosts.createdAt)];
    }

    const results = await d
      .select({
        id: communityPosts.id,
        title: communityPosts.title,
        slug: communityPosts.slug,
        body: communityPosts.body,
        type: communityPosts.type,
        status: communityPosts.status,
        isPinned: communityPosts.isPinned,
        isLocked: communityPosts.isLocked,
        isSolved: communityPosts.isSolved,
        viewCount: communityPosts.viewCount,
        replyCount: communityPosts.replyCount,
        voteScore: communityPosts.voteScore,
        lastReplyAt: communityPosts.lastReplyAt,
        createdAt: communityPosts.createdAt,
        authorId: communityPosts.authorId,
        categoryId: communityPosts.categoryId,
      })
      .from(communityPosts)
      .where(and(...conditions))
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);

    // Fetch author info for all posts
    const authorIds = [...new Set(results.map((r: any) => r.authorId))];
    let authorMap: Record<string, any> = {};
    if (authorIds.length > 0) {
      const authors = await d
        .select({
          id: communityMembers.id,
          displayName: communityMembers.displayName,
          avatarUrl: communityMembers.avatarUrl,
          reputation: communityMembers.reputation,
          role: communityMembers.role,
        })
        .from(communityMembers)
        .where(inArray(communityMembers.id, authorIds));
      for (const a of authors) {
        authorMap[a.id] = { ...a, title: getReputationTitle(a.reputation) };
      }
    }

    const data = results.map((post: any) => ({
      ...post,
      body: isMember ? post.body : truncate(post.body, 200),
      author: authorMap[post.authorId] || null,
    }));

    res.json({ success: true, data, page, limit });
  });

  /** GET /posts/:slug — view a single thread with replies */
  router.get('/posts/:slug', optionalMember, async (req: Request, res: Response) => {
    const { siteSlug, slug } = req.params;
    const siteId = await resolveSiteId(d, siteSlug);
    if (!siteId) {
      res.status(404).json({ success: false, error: { message: 'Site not found' } });
      return;
    }

    const isMember = !!(req as any).member;

    // Find the thread
    const [thread] = await d
      .select()
      .from(communityPosts)
      .where(
        and(
          eq(communityPosts.siteId, siteId),
          eq(communityPosts.slug, slug),
          isNull(communityPosts.parentId),
        ),
      )
      .limit(1);

    if (!thread || thread.status === 'deleted') {
      res.status(404).json({ success: false, error: { message: 'Post not found' } });
      return;
    }

    // Increment view count
    await d
      .update(communityPosts)
      .set({ viewCount: sql`${communityPosts.viewCount} + 1` })
      .where(eq(communityPosts.id, thread.id));

    // Fetch replies
    const replies = await d
      .select()
      .from(communityPosts)
      .where(and(eq(communityPosts.parentId, thread.id), eq(communityPosts.status, 'published')))
      .orderBy(asc(communityPosts.createdAt));

    // Collect all author IDs
    const allAuthorIds = [...new Set([thread.authorId, ...replies.map((r: any) => r.authorId)])];
    const authors = await d
      .select({
        id: communityMembers.id,
        displayName: communityMembers.displayName,
        avatarUrl: communityMembers.avatarUrl,
        reputation: communityMembers.reputation,
        role: communityMembers.role,
      })
      .from(communityMembers)
      .where(inArray(communityMembers.id, allAuthorIds));

    const authorMap: Record<string, any> = {};
    for (const a of authors) {
      authorMap[a.id] = { ...a, title: getReputationTitle(a.reputation) };
    }

    // Fetch tags for this thread
    const postTags = await d
      .select({
        tagId: communityPostTags.tagId,
        name: communityTags.name,
        slug: communityTags.slug,
      })
      .from(communityPostTags)
      .innerJoin(communityTags, eq(communityPostTags.tagId, communityTags.id))
      .where(eq(communityPostTags.postId, thread.id));

    // For non-members, truncate body
    const threadData = {
      ...thread,
      body: isMember ? thread.body : truncate(thread.body, 200),
      bodyHtml: isMember ? thread.bodyHtml : null,
      author: authorMap[thread.authorId] || null,
      tags: postTags,
      viewCount: thread.viewCount + 1,
    };

    const repliesData = replies.map((r: any) => ({
      ...r,
      body: isMember ? r.body : truncate(r.body, 200),
      bodyHtml: isMember ? r.bodyHtml : null,
      author: authorMap[r.authorId] || null,
      isAcceptedAnswer: thread.solvedAnswerId === r.id,
    }));

    res.json({ success: true, data: { thread: threadData, replies: repliesData } });
  });

  // ── Search ──

  /** GET /search?q=term — fulltext search across posts */
  router.get('/search', optionalMember, async (req: Request, res: Response) => {
    const { siteSlug } = req.params;
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      res.json({ success: true, data: [] });
      return;
    }

    const siteId = await resolveSiteId(d, siteSlug);
    if (!siteId) {
      res.status(404).json({ success: false, error: { message: 'Site not found' } });
      return;
    }

    const isMember = !!(req as any).member;
    const searchTerm = `%${q.trim().toLowerCase()}%`;

    try {
      const results = await d.execute(
        sql`SELECT id, title, slug, body, type, vote_score, reply_count, created_at, author_id
            FROM cms_community_posts
            WHERE site_id = ${siteId}
              AND parent_id IS NULL
              AND status = 'published'
              AND (LOWER(title) LIKE ${searchTerm} OR LOWER(body) LIKE ${searchTerm})
            ORDER BY vote_score DESC, created_at DESC
            LIMIT 20`,
      );

      const rows = results?.rows || results || [];
      const data = rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        body: isMember ? truncate(r.body, 500) : truncate(r.body, 200),
        type: r.type,
        voteScore: r.vote_score,
        replyCount: r.reply_count,
        createdAt: r.created_at,
      }));

      res.json({ success: true, data });
    } catch (err: any) {
      logger.error({ err }, 'Community search failed');
      res.json({ success: true, data: [] });
    }
  });

  // ── Tags ──

  /** GET /tags — list popular tags with usage counts */
  router.get('/tags', async (req: Request, res: Response) => {
    const { siteSlug } = req.params;
    const siteId = await resolveSiteId(d, siteSlug);
    if (!siteId) {
      res.status(404).json({ success: false, error: { message: 'Site not found' } });
      return;
    }

    const results = await d
      .select()
      .from(communityTags)
      .where(eq(communityTags.siteId, siteId))
      .orderBy(desc(communityTags.usageCount))
      .limit(100);

    res.json({ success: true, data: results });
  });

  /** GET /tags/:slug — posts tagged with this tag */
  router.get('/tags/:tagSlug', optionalMember, async (req: Request, res: Response) => {
    const { siteSlug, tagSlug } = req.params;
    const siteId = await resolveSiteId(d, siteSlug);
    if (!siteId) {
      res.status(404).json({ success: false, error: { message: 'Site not found' } });
      return;
    }

    const isMember = !!(req as any).member;

    const [tag] = await d
      .select()
      .from(communityTags)
      .where(and(eq(communityTags.siteId, siteId), eq(communityTags.slug, tagSlug)))
      .limit(1);

    if (!tag) {
      res.status(404).json({ success: false, error: { message: 'Tag not found' } });
      return;
    }

    const results = await d
      .select({
        id: communityPosts.id,
        title: communityPosts.title,
        slug: communityPosts.slug,
        body: communityPosts.body,
        type: communityPosts.type,
        voteScore: communityPosts.voteScore,
        replyCount: communityPosts.replyCount,
        createdAt: communityPosts.createdAt,
        authorId: communityPosts.authorId,
      })
      .from(communityPostTags)
      .innerJoin(communityPosts, eq(communityPostTags.postId, communityPosts.id))
      .where(
        and(
          eq(communityPostTags.tagId, tag.id),
          isNull(communityPosts.parentId),
          eq(communityPosts.status, 'published'),
        ),
      )
      .orderBy(desc(communityPosts.createdAt))
      .limit(50);

    const data = results.map((r: any) => ({
      ...r,
      body: isMember ? truncate(r.body, 500) : truncate(r.body, 200),
    }));

    res.json({ success: true, data: { tag, posts: data } });
  });

  // ── Leaderboard ──

  /** GET /leaderboard — top contributors by reputation */
  router.get('/leaderboard', async (req: Request, res: Response) => {
    const { siteSlug } = req.params;
    const siteId = await resolveSiteId(d, siteSlug);
    if (!siteId) {
      res.status(404).json({ success: false, error: { message: 'Site not found' } });
      return;
    }

    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const leaderboard = await getLeaderboard(db, siteId, limit);

    res.json({ success: true, data: leaderboard });
  });

  return router;
}

// ============================================================================
// MEMBER ROUTES (authenticated community members)
// ============================================================================

export function createMemberRoutes(db: DrizzleClient, logger: PluginLogger): Router {
  const router = Router({ mergeParams: true });
  const d = db as any;

  // All member routes require authentication
  router.use(authenticateMember);

  // ── Profile ──

  /** GET /me — current member profile */
  router.get('/me', async (req: Request, res: Response) => {
    const { memberId } = (req as any).member;

    const [member] = await d
      .select({
        id: communityMembers.id,
        email: communityMembers.email,
        displayName: communityMembers.displayName,
        avatarUrl: communityMembers.avatarUrl,
        bio: communityMembers.bio,
        role: communityMembers.role,
        reputation: communityMembers.reputation,
        postCount: communityMembers.postCount,
        isVerified: communityMembers.isVerified,
        createdAt: communityMembers.createdAt,
      })
      .from(communityMembers)
      .where(eq(communityMembers.id, memberId))
      .limit(1);

    if (!member) {
      res.status(404).json({ success: false, error: { message: 'Member not found' } });
      return;
    }

    res.json({
      success: true,
      data: { ...member, title: getReputationTitle(member.reputation) },
    });
  });

  /** PUT /me — update profile */
  router.put('/me', async (req: Request, res: Response) => {
    const { memberId } = (req as any).member;
    const { displayName, bio, avatarUrl } = req.body;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (displayName && typeof displayName === 'string') updates.displayName = displayName.slice(0, 100);
    if (bio !== undefined) updates.bio = typeof bio === 'string' ? bio.slice(0, 2000) : null;
    if (avatarUrl !== undefined) updates.avatarUrl = typeof avatarUrl === 'string' ? avatarUrl : null;

    const [updated] = await d
      .update(communityMembers)
      .set(updates)
      .where(eq(communityMembers.id, memberId))
      .returning();

    res.json({ success: true, data: updated });
  });

  // ── Create Thread ──

  /** POST /posts — create a new thread */
  router.post('/posts', async (req: Request, res: Response) => {
    const { siteSlug } = req.params;
    const { memberId, siteId: memberSiteId } = (req as any).member;
    const { categoryId, title, body, type, tags } = req.body;

    if (!categoryId || !title || !body) {
      res.status(400).json({ success: false, error: { message: 'categoryId, title, and body are required' } });
      return;
    }

    const siteId = await resolveSiteId(d, siteSlug);
    if (!siteId) {
      res.status(404).json({ success: false, error: { message: 'Site not found' } });
      return;
    }

    // Verify member belongs to this site
    if (memberSiteId !== siteId) {
      res.status(403).json({ success: false, error: { message: 'Access denied' } });
      return;
    }

    // Verify category exists and is not locked
    const [category] = await d
      .select({ id: communityCategories.id, isLocked: communityCategories.isLocked })
      .from(communityCategories)
      .where(and(eq(communityCategories.id, categoryId), eq(communityCategories.siteId, siteId)))
      .limit(1);

    if (!category) {
      res.status(404).json({ success: false, error: { message: 'Category not found' } });
      return;
    }

    if (category.isLocked) {
      res.status(403).json({ success: false, error: { message: 'This category is locked' } });
      return;
    }

    const validTypes = ['discussion', 'question', 'article', 'announcement'];
    const postType = validTypes.includes(type) ? type : 'discussion';

    const slug = slugify(title) + '-' + Date.now().toString(36);
    const bodyHtml = markdownToHtml(body);

    const [post] = await d
      .insert(communityPosts)
      .values({
        siteId,
        categoryId,
        authorId: memberId,
        title,
        slug,
        body,
        bodyHtml,
        type: postType,
      })
      .returning();

    // Update category post count and last post time
    await d
      .update(communityCategories)
      .set({
        postCount: sql`${communityCategories.postCount} + 1`,
        lastPostAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(communityCategories.id, categoryId));

    // Update member post count
    await d
      .update(communityMembers)
      .set({
        postCount: sql`${communityMembers.postCount} + 1`,
        lastActiveAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(communityMembers.id, memberId));

    // Add reputation
    await addReputation(db, memberId, 'POST_CREATED');

    // Handle tags
    if (Array.isArray(tags) && tags.length > 0) {
      for (const tagName of tags.slice(0, 5)) {
        const tagSlug = slugify(String(tagName));
        if (!tagSlug) continue;

        // Upsert tag
        let [existing] = await d
          .select({ id: communityTags.id })
          .from(communityTags)
          .where(and(eq(communityTags.siteId, siteId), eq(communityTags.slug, tagSlug)))
          .limit(1);

        let tagId: string;
        if (existing) {
          tagId = existing.id;
          await d
            .update(communityTags)
            .set({ usageCount: sql`${communityTags.usageCount} + 1` })
            .where(eq(communityTags.id, tagId));
        } else {
          const [newTag] = await d
            .insert(communityTags)
            .values({ siteId, name: String(tagName).slice(0, 50), slug: tagSlug, usageCount: 1 })
            .returning();
          tagId = newTag.id;
        }

        // Link tag to post
        await d.insert(communityPostTags).values({ postId: post.id, tagId }).onConflictDoNothing();
      }
    }

    res.status(201).json({ success: true, data: post });
  });

  // ── Reply ──

  /** POST /posts/:id/reply — reply to a thread */
  router.post('/posts/:id/reply', async (req: Request, res: Response) => {
    const { siteSlug, id: threadId } = req.params;
    const { memberId, siteId: memberSiteId } = (req as any).member;
    const { body } = req.body;

    if (!body) {
      res.status(400).json({ success: false, error: { message: 'body is required' } });
      return;
    }

    const siteId = await resolveSiteId(d, siteSlug);
    if (!siteId || memberSiteId !== siteId) {
      res.status(403).json({ success: false, error: { message: 'Access denied' } });
      return;
    }

    // Verify thread exists and is not locked
    const [thread] = await d
      .select({
        id: communityPosts.id,
        categoryId: communityPosts.categoryId,
        isLocked: communityPosts.isLocked,
        status: communityPosts.status,
      })
      .from(communityPosts)
      .where(and(eq(communityPosts.id, threadId), isNull(communityPosts.parentId)))
      .limit(1);

    if (!thread || thread.status === 'deleted') {
      res.status(404).json({ success: false, error: { message: 'Thread not found' } });
      return;
    }

    if (thread.isLocked) {
      res.status(403).json({ success: false, error: { message: 'This thread is locked' } });
      return;
    }

    const bodyHtml = markdownToHtml(body);

    const [reply] = await d
      .insert(communityPosts)
      .values({
        siteId,
        categoryId: thread.categoryId,
        parentId: threadId,
        authorId: memberId,
        body,
        bodyHtml,
        type: 'discussion',
      })
      .returning();

    // Update thread reply count and last reply time
    await d
      .update(communityPosts)
      .set({
        replyCount: sql`${communityPosts.replyCount} + 1`,
        lastReplyAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(communityPosts.id, threadId));

    // Update member post count and last active
    await d
      .update(communityMembers)
      .set({
        postCount: sql`${communityMembers.postCount} + 1`,
        lastActiveAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(communityMembers.id, memberId));

    // Add reputation
    await addReputation(db, memberId, 'REPLY_CREATED');

    res.status(201).json({ success: true, data: reply });
  });

  // ── Edit Post ──

  /** PUT /posts/:id — edit own post (body only) */
  router.put('/posts/:id', async (req: Request, res: Response) => {
    const { id: postId } = req.params;
    const { memberId } = (req as any).member;
    const { body } = req.body;

    if (!body) {
      res.status(400).json({ success: false, error: { message: 'body is required' } });
      return;
    }

    const [post] = await d
      .select({ id: communityPosts.id, authorId: communityPosts.authorId, status: communityPosts.status })
      .from(communityPosts)
      .where(eq(communityPosts.id, postId))
      .limit(1);

    if (!post || post.status === 'deleted') {
      res.status(404).json({ success: false, error: { message: 'Post not found' } });
      return;
    }

    if (post.authorId !== memberId) {
      res.status(403).json({ success: false, error: { message: 'You can only edit your own posts' } });
      return;
    }

    const bodyHtml = markdownToHtml(body);

    const [updated] = await d
      .update(communityPosts)
      .set({ body, bodyHtml, editedAt: new Date(), editedBy: memberId, updatedAt: new Date() })
      .where(eq(communityPosts.id, postId))
      .returning();

    res.json({ success: true, data: updated });
  });

  // ── Delete Post ──

  /** DELETE /posts/:id — soft-delete own post */
  router.delete('/posts/:id', async (req: Request, res: Response) => {
    const { id: postId } = req.params;
    const { memberId } = (req as any).member;

    const [post] = await d
      .select({ id: communityPosts.id, authorId: communityPosts.authorId })
      .from(communityPosts)
      .where(eq(communityPosts.id, postId))
      .limit(1);

    if (!post) {
      res.status(404).json({ success: false, error: { message: 'Post not found' } });
      return;
    }

    if (post.authorId !== memberId) {
      res.status(403).json({ success: false, error: { message: 'You can only delete your own posts' } });
      return;
    }

    await d
      .update(communityPosts)
      .set({ status: 'deleted', updatedAt: new Date() })
      .where(eq(communityPosts.id, postId));

    res.json({ success: true });
  });

  // ── Voting ──

  /** POST /posts/:id/vote — upvote or downvote */
  router.post('/posts/:id/vote', async (req: Request, res: Response) => {
    const { id: postId } = req.params;
    const { memberId } = (req as any).member;
    const { value } = req.body;

    if (value !== 1 && value !== -1) {
      res.status(400).json({ success: false, error: { message: 'value must be 1 or -1' } });
      return;
    }

    // Verify post exists
    const [post] = await d
      .select({ id: communityPosts.id, authorId: communityPosts.authorId, voteScore: communityPosts.voteScore })
      .from(communityPosts)
      .where(eq(communityPosts.id, postId))
      .limit(1);

    if (!post) {
      res.status(404).json({ success: false, error: { message: 'Post not found' } });
      return;
    }

    // Can't vote on your own post
    if (post.authorId === memberId) {
      res.status(400).json({ success: false, error: { message: 'You cannot vote on your own post' } });
      return;
    }

    // Check for existing vote
    const [existingVote] = await d
      .select({ id: communityVotes.id, value: communityVotes.value })
      .from(communityVotes)
      .where(and(eq(communityVotes.postId, postId), eq(communityVotes.memberId, memberId)))
      .limit(1);

    let scoreDelta = 0;

    if (existingVote) {
      if (existingVote.value === value) {
        // Same vote — remove it (toggle off)
        await d.delete(communityVotes).where(eq(communityVotes.id, existingVote.id));
        scoreDelta = -value;

        // Reverse reputation
        if (value === 1) {
          await addReputation(db, post.authorId, 'DOWNVOTE_RECEIVED'); // subtracts the 5 we gave
        } else {
          await addReputation(db, post.authorId, 'UPVOTE_RECEIVED'); // adds back 5
        }
      } else {
        // Different vote — flip it
        await d
          .update(communityVotes)
          .set({ value, createdAt: new Date() })
          .where(eq(communityVotes.id, existingVote.id));
        scoreDelta = value * 2; // from -1 to +1 = +2, from +1 to -1 = -2

        // Adjust reputation (reverse old + apply new)
        if (value === 1) {
          // Flipped from downvote to upvote
          await addReputation(db, post.authorId, 'UPVOTE_RECEIVED');
          await addReputation(db, post.authorId, 'UPVOTE_RECEIVED'); // reverse the downvote penalty + add upvote
        } else {
          // Flipped from upvote to downvote
          await addReputation(db, post.authorId, 'DOWNVOTE_RECEIVED');
          await addReputation(db, post.authorId, 'DOWNVOTE_RECEIVED');
        }
      }
    } else {
      // New vote
      await d.insert(communityVotes).values({ postId, memberId, value });
      scoreDelta = value;

      // Award/penalize reputation to the post author
      if (value === 1) {
        await addReputation(db, post.authorId, 'UPVOTE_RECEIVED');
      } else {
        await addReputation(db, post.authorId, 'DOWNVOTE_RECEIVED');
      }
    }

    // Update vote score on the post
    await d
      .update(communityPosts)
      .set({
        voteScore: sql`${communityPosts.voteScore} + ${scoreDelta}`,
        updatedAt: new Date(),
      })
      .where(eq(communityPosts.id, postId));

    const newScore = post.voteScore + scoreDelta;
    res.json({ success: true, data: { voteScore: newScore } });
  });

  // ── Solve ──

  /** POST /posts/:id/solve — mark a reply as the accepted answer */
  router.post('/posts/:id/solve', async (req: Request, res: Response) => {
    const { id: replyId } = req.params;
    const { memberId } = (req as any).member;

    // Find the reply
    const [reply] = await d
      .select({ id: communityPosts.id, parentId: communityPosts.parentId, authorId: communityPosts.authorId })
      .from(communityPosts)
      .where(eq(communityPosts.id, replyId))
      .limit(1);

    if (!reply || !reply.parentId) {
      res.status(400).json({ success: false, error: { message: 'Reply not found or is not a reply' } });
      return;
    }

    // Verify the calling member is the thread author
    const [thread] = await d
      .select({ id: communityPosts.id, authorId: communityPosts.authorId, type: communityPosts.type })
      .from(communityPosts)
      .where(eq(communityPosts.id, reply.parentId))
      .limit(1);

    if (!thread) {
      res.status(404).json({ success: false, error: { message: 'Thread not found' } });
      return;
    }

    if (thread.authorId !== memberId) {
      res.status(403).json({ success: false, error: { message: 'Only the thread author can mark an accepted answer' } });
      return;
    }

    // Mark the thread as solved
    await d
      .update(communityPosts)
      .set({ isSolved: true, solvedAnswerId: replyId, updatedAt: new Date() })
      .where(eq(communityPosts.id, thread.id));

    // Award reputation to the answer author
    await addReputation(db, reply.authorId, 'ANSWER_ACCEPTED');

    res.json({ success: true });
  });

  // ── Bookmarks ──

  /** POST /posts/:id/bookmark — toggle bookmark */
  router.post('/posts/:id/bookmark', async (req: Request, res: Response) => {
    const { id: postId } = req.params;
    const { memberId } = (req as any).member;

    // Check if already bookmarked
    const [existing] = await d
      .select({ id: communityBookmarks.id })
      .from(communityBookmarks)
      .where(and(eq(communityBookmarks.memberId, memberId), eq(communityBookmarks.postId, postId)))
      .limit(1);

    if (existing) {
      // Remove bookmark
      await d.delete(communityBookmarks).where(eq(communityBookmarks.id, existing.id));
      res.json({ success: true, data: { bookmarked: false } });
    } else {
      // Add bookmark
      await d.insert(communityBookmarks).values({ memberId, postId });
      res.json({ success: true, data: { bookmarked: true } });
    }
  });

  /** GET /bookmarks — list bookmarked posts */
  router.get('/bookmarks', async (req: Request, res: Response) => {
    const { memberId } = (req as any).member;

    const results = await d
      .select({
        bookmarkId: communityBookmarks.id,
        bookmarkedAt: communityBookmarks.createdAt,
        postId: communityPosts.id,
        title: communityPosts.title,
        slug: communityPosts.slug,
        type: communityPosts.type,
        voteScore: communityPosts.voteScore,
        replyCount: communityPosts.replyCount,
        createdAt: communityPosts.createdAt,
      })
      .from(communityBookmarks)
      .innerJoin(communityPosts, eq(communityBookmarks.postId, communityPosts.id))
      .where(eq(communityBookmarks.memberId, memberId))
      .orderBy(desc(communityBookmarks.createdAt));

    res.json({ success: true, data: results });
  });

  return router;
}

// ============================================================================
// ADMIN ROUTES (CMS admin auth — moderator/admin)
// ============================================================================

export function createAdminRoutes(db: DrizzleClient, logger: PluginLogger): Router {
  const router = Router({ mergeParams: true });
  const d = db as any;

  // ── Members ──

  /** GET /members — list community members */
  router.get('/members', async (req: Request, res: Response) => {
    const { siteId } = req.params;
    const { role, banned, search } = req.query;

    const conditions = [eq(communityMembers.siteId, siteId)];

    if (role && typeof role === 'string') {
      conditions.push(eq(communityMembers.role, role));
    }
    if (banned === 'true') {
      conditions.push(eq(communityMembers.isBanned, true));
    } else if (banned === 'false') {
      conditions.push(eq(communityMembers.isBanned, false));
    }

    let results;
    if (search && typeof search === 'string') {
      const searchTerm = `%${search.toLowerCase()}%`;
      results = await d
        .select()
        .from(communityMembers)
        .where(
          and(
            ...conditions,
            or(
              ilike(communityMembers.displayName, searchTerm),
              ilike(communityMembers.email, searchTerm),
            ),
          ),
        )
        .orderBy(desc(communityMembers.reputation))
        .limit(100);
    } else {
      results = await d
        .select()
        .from(communityMembers)
        .where(and(...conditions))
        .orderBy(desc(communityMembers.reputation))
        .limit(100);
    }

    res.json({ success: true, data: results });
  });

  /** PATCH /members/:id — update role, ban/unban */
  router.patch('/members/:id', async (req: Request, res: Response) => {
    const { siteId, id: memberId } = req.params;
    const { role, isBanned } = req.body;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (role && ['member', 'moderator', 'admin'].includes(role)) {
      updates.role = role;
    }
    if (typeof isBanned === 'boolean') {
      updates.isBanned = isBanned;
    }

    const [updated] = await d
      .update(communityMembers)
      .set(updates)
      .where(and(eq(communityMembers.id, memberId), eq(communityMembers.siteId, siteId)))
      .returning();

    if (!updated) {
      res.status(404).json({ success: false, error: { message: 'Member not found' } });
      return;
    }

    res.json({ success: true, data: updated });
  });

  // ── Categories ──

  /** POST /categories — create category */
  router.post('/categories', async (req: Request, res: Response) => {
    const { siteId } = req.params;
    const { name, description, icon, color, sortOrder } = req.body;

    if (!name) {
      res.status(400).json({ success: false, error: { message: 'name is required' } });
      return;
    }

    const slug = slugify(name);

    const [category] = await d
      .insert(communityCategories)
      .values({
        siteId,
        name,
        slug,
        description: description || null,
        icon: icon || null,
        color: color || null,
        sortOrder: sortOrder || 0,
      })
      .returning();

    res.status(201).json({ success: true, data: category });
  });

  /** PUT /categories/:id — update category */
  router.put('/categories/:id', async (req: Request, res: Response) => {
    const { siteId, id: categoryId } = req.params;
    const { name, description, icon, color, sortOrder, isLocked } = req.body;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name) {
      updates.name = name;
      updates.slug = slugify(name);
    }
    if (description !== undefined) updates.description = description;
    if (icon !== undefined) updates.icon = icon;
    if (color !== undefined) updates.color = color;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;
    if (typeof isLocked === 'boolean') updates.isLocked = isLocked;

    const [updated] = await d
      .update(communityCategories)
      .set(updates)
      .where(and(eq(communityCategories.id, categoryId), eq(communityCategories.siteId, siteId)))
      .returning();

    if (!updated) {
      res.status(404).json({ success: false, error: { message: 'Category not found' } });
      return;
    }

    res.json({ success: true, data: updated });
  });

  /** DELETE /categories/:id — delete category (reassign posts to uncategorized or fail) */
  router.delete('/categories/:id', async (req: Request, res: Response) => {
    const { siteId, id: categoryId } = req.params;
    const { reassignTo } = req.body;

    // Check if category has posts
    const [postCount] = await d
      .select({ count: sql`count(*)::int` })
      .from(communityPosts)
      .where(eq(communityPosts.categoryId, categoryId));

    if (postCount?.count > 0) {
      if (!reassignTo) {
        res.status(400).json({
          success: false,
          error: { message: `Category has ${postCount.count} posts. Provide reassignTo category ID.` },
        });
        return;
      }

      // Verify target category exists
      const [target] = await d
        .select({ id: communityCategories.id })
        .from(communityCategories)
        .where(and(eq(communityCategories.id, reassignTo), eq(communityCategories.siteId, siteId)))
        .limit(1);

      if (!target) {
        res.status(400).json({ success: false, error: { message: 'Target category not found' } });
        return;
      }

      // Move posts
      await d
        .update(communityPosts)
        .set({ categoryId: reassignTo, updatedAt: new Date() })
        .where(eq(communityPosts.categoryId, categoryId));

      // Update target category post count
      await d
        .update(communityCategories)
        .set({
          postCount: sql`${communityCategories.postCount} + ${postCount.count}`,
          updatedAt: new Date(),
        })
        .where(eq(communityCategories.id, reassignTo));
    }

    await d
      .delete(communityCategories)
      .where(and(eq(communityCategories.id, categoryId), eq(communityCategories.siteId, siteId)));

    res.json({ success: true });
  });

  // ── Post Moderation ──

  /** PATCH /posts/:id — moderate: pin, lock, close, delete any post */
  router.patch('/posts/:id', async (req: Request, res: Response) => {
    const { siteId, id: postId } = req.params;
    const { isPinned, isLocked, status } = req.body;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof isPinned === 'boolean') updates.isPinned = isPinned;
    if (typeof isLocked === 'boolean') updates.isLocked = isLocked;
    if (status && ['published', 'closed', 'deleted', 'pinned'].includes(status)) {
      updates.status = status;
    }

    const [updated] = await d
      .update(communityPosts)
      .set(updates)
      .where(and(eq(communityPosts.id, postId), eq(communityPosts.siteId, siteId)))
      .returning();

    if (!updated) {
      res.status(404).json({ success: false, error: { message: 'Post not found' } });
      return;
    }

    logger.info({ siteId, postId, updates }, 'Post moderated');
    res.json({ success: true, data: updated });
  });

  // ── Stats ──

  /** GET /stats — forum statistics */
  router.get('/stats', async (req: Request, res: Response) => {
    const { siteId } = req.params;

    const [memberCount] = await d
      .select({ count: sql`count(*)::int` })
      .from(communityMembers)
      .where(eq(communityMembers.siteId, siteId));

    const [threadCount] = await d
      .select({ count: sql`count(*)::int` })
      .from(communityPosts)
      .where(
        and(
          eq(communityPosts.siteId, siteId),
          isNull(communityPosts.parentId),
          eq(communityPosts.status, 'published'),
        ),
      );

    const [replyCount] = await d
      .select({ count: sql`count(*)::int` })
      .from(communityPosts)
      .where(
        and(
          eq(communityPosts.siteId, siteId),
          sql`${communityPosts.parentId} IS NOT NULL`,
          eq(communityPosts.status, 'published'),
        ),
      );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [activeToday] = await d
      .select({ count: sql`count(*)::int` })
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.siteId, siteId),
          sql`${communityMembers.lastActiveAt} >= ${today}`,
        ),
      );

    res.json({
      success: true,
      data: {
        totalMembers: memberCount?.count ?? 0,
        totalThreads: threadCount?.count ?? 0,
        totalReplies: replyCount?.count ?? 0,
        activeToday: activeToday?.count ?? 0,
      },
    });
  });

  return router;
}
