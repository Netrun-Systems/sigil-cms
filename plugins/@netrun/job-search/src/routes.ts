// @ts-nocheck — plugin routes use dynamic drizzle queries with `any` db client
/**
 * @netrun/job-search — API Routes
 *
 * All routes are tenant-scoped. Tenant ID comes from the authenticated user's
 * JWT claims (set by platform auth middleware).
 *
 * Route groups:
 * - Profile: candidate profile CRUD
 * - Tracker: pipeline management (kanban)
 * - Applications: generated materials
 * - Discoveries: evening run results
 * - Followups: automated follow-up emails
 * - Interviews: interview tracking and prep
 * - Automation: morning/evening/followup runs
 * - Analytics: funnel, velocity, sources
 * - AI Actions: research, analyze, cover-letter, outreach, interview-prep
 */

import { Router, type Request, type Response } from 'express';
import { eq, and, desc, asc, sql, count, isNull, gte, lte } from 'drizzle-orm';
import type { PluginLogger } from '@netrun-cms/plugin-runtime';
import type { Router as RouterType } from 'express';
import {
  jobSearchProfiles,
  jobSearchTracker,
  jobSearchApplications,
  jobSearchDiscoveries,
  jobSearchFollowups,
  jobSearchRuns,
  jobSearchInterviews,
  TRACKER_STATUSES,
} from './schema.js';
import * as ai from './ai-service.js';

interface JobSearchRoutes {
  router: RouterType;
}

/**
 * Extract tenant ID from request. Platform auth middleware sets this
 * on req.user or req.tenantId.
 */
function getTenantId(req: Request): string {
  return (req as any).tenantId || (req as any).user?.tenantId || req.headers['x-tenant-id'] as string;
}

function getUserId(req: Request): string {
  return (req as any).user?.id || (req as any).userId || req.headers['x-user-id'] as string;
}

export function createRoutes(db: any, logger: PluginLogger): JobSearchRoutes {
  const router = Router({ mergeParams: true });
  const d = db as any;

  // =========================================================================
  // PROFILE
  // =========================================================================

  /** GET /profile — get candidate profile for current tenant/user */
  router.get('/profile', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const userId = getUserId(req);
      const [profile] = await d.select().from(jobSearchProfiles)
        .where(and(
          eq(jobSearchProfiles.tenantId, tenantId),
          eq(jobSearchProfiles.userId, userId),
        ));
      if (!profile) {
        return res.json({ success: true, data: null });
      }
      res.json({ success: true, data: profile });
    } catch (err) {
      logger.error({ err }, 'Failed to get profile');
      res.status(500).json({ success: false, error: { message: 'Failed to get profile' } });
    }
  });

  /** PUT /profile — create or update profile */
  router.put('/profile', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const userId = getUserId(req);
      const {
        fullName, email, phone, linkedin, github, website,
        currentTitle, currentCompany, yearsExperience,
        targetRoles, targetComp, location, remotePreference,
        resumeUrl, skills, about,
      } = req.body;

      // Upsert: try update first, then insert
      const existing = await d.select({ id: jobSearchProfiles.id })
        .from(jobSearchProfiles)
        .where(and(
          eq(jobSearchProfiles.tenantId, tenantId),
          eq(jobSearchProfiles.userId, userId),
        ));

      let profile;
      if (existing.length > 0) {
        [profile] = await d.update(jobSearchProfiles)
          .set({
            fullName, email, phone, linkedin, github, website,
            currentTitle, currentCompany, yearsExperience,
            targetRoles, targetComp, location, remotePreference,
            resumeUrl, skills, about,
            updatedAt: new Date(),
          })
          .where(eq(jobSearchProfiles.id, existing[0].id))
          .returning();
      } else {
        [profile] = await d.insert(jobSearchProfiles).values({
          tenantId, userId,
          fullName, email, phone, linkedin, github, website,
          currentTitle, currentCompany, yearsExperience,
          targetRoles: targetRoles ?? [], targetComp, location,
          remotePreference: remotePreference ?? 'hybrid',
          resumeUrl, skills: skills ?? [], about,
        }).returning();
      }

      res.json({ success: true, data: profile });
    } catch (err) {
      logger.error({ err }, 'Failed to update profile');
      res.status(500).json({ success: false, error: { message: 'Failed to update profile' } });
    }
  });

  // =========================================================================
  // TRACKER (pipeline)
  // =========================================================================

  /** GET /tracker — list pipeline entries */
  router.get('/tracker', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const { status, priority, search, archived } = req.query;

      let query = d.select().from(jobSearchTracker)
        .where(eq(jobSearchTracker.tenantId, tenantId));

      // Filter out archived by default
      if (archived !== 'true') {
        query = query.where(and(
          eq(jobSearchTracker.tenantId, tenantId),
          eq(jobSearchTracker.isArchived, false),
        ));
      }

      if (status) {
        query = d.select().from(jobSearchTracker)
          .where(and(
            eq(jobSearchTracker.tenantId, tenantId),
            eq(jobSearchTracker.status, status as string),
            eq(jobSearchTracker.isArchived, archived === 'true'),
          ));
      }

      if (priority) {
        query = d.select().from(jobSearchTracker)
          .where(and(
            eq(jobSearchTracker.tenantId, tenantId),
            eq(jobSearchTracker.priority, priority as string),
            eq(jobSearchTracker.isArchived, archived === 'true'),
          ));
      }

      const rows = await query.orderBy(
        desc(jobSearchTracker.priority),
        desc(jobSearchTracker.updatedAt),
      );

      // If search filter, apply client-side (simple text match)
      let filtered = rows;
      if (search) {
        const term = (search as string).toLowerCase();
        filtered = rows.filter((r: any) =>
          r.company.toLowerCase().includes(term) ||
          r.role.toLowerCase().includes(term) ||
          (r.notes || '').toLowerCase().includes(term)
        );
      }

      res.json({ success: true, data: filtered, total: filtered.length });
    } catch (err) {
      logger.error({ err }, 'Failed to list tracker entries');
      res.status(500).json({ success: false, error: { message: 'Failed to list tracker entries' } });
    }
  });

  /** GET /tracker/stats — aggregate pipeline stats */
  router.get('/tracker/stats', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);

      const rows = await d.select({
        status: jobSearchTracker.status,
        priority: jobSearchTracker.priority,
        count: count(),
      })
        .from(jobSearchTracker)
        .where(and(
          eq(jobSearchTracker.tenantId, tenantId),
          eq(jobSearchTracker.isArchived, false),
        ))
        .groupBy(jobSearchTracker.status, jobSearchTracker.priority);

      // Aggregate
      const byStatus: Record<string, number> = {};
      const byPriority: Record<string, number> = {};
      let total = 0;

      for (const row of rows) {
        byStatus[row.status] = (byStatus[row.status] || 0) + Number(row.count);
        byPriority[row.priority] = (byPriority[row.priority] || 0) + Number(row.count);
        total += Number(row.count);
      }

      res.json({ success: true, data: { total, byStatus, byPriority } });
    } catch (err) {
      logger.error({ err }, 'Failed to get tracker stats');
      res.status(500).json({ success: false, error: { message: 'Failed to get tracker stats' } });
    }
  });

  /** POST /tracker — add new prospect */
  router.post('/tracker', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const {
        company, role, jobUrl, careerPageUrl, status, priority,
        atsPlatform, contactName, contactEmail, contactTitle,
        source, notes, nextAction, nextActionDate,
      } = req.body;

      const [entry] = await d.insert(jobSearchTracker).values({
        tenantId, company, role, jobUrl, careerPageUrl,
        status: status ?? 'research',
        priority: priority ?? 'MEDIUM',
        atsPlatform, contactName, contactEmail, contactTitle,
        source: source ?? 'manual',
        notes, nextAction, nextActionDate,
      }).returning();

      res.status(201).json({ success: true, data: entry });
    } catch (err) {
      logger.error({ err }, 'Failed to create tracker entry');
      res.status(500).json({ success: false, error: { message: 'Failed to create tracker entry' } });
    }
  });

  /** GET /tracker/:id — get prospect with applications and interviews */
  router.get('/tracker/:id', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const { id } = req.params;

      const [entry] = await d.select().from(jobSearchTracker)
        .where(and(eq(jobSearchTracker.id, id), eq(jobSearchTracker.tenantId, tenantId)));

      if (!entry) {
        return res.status(404).json({ success: false, error: { message: 'Tracker entry not found' } });
      }

      const [applications, interviews, followups] = await Promise.all([
        d.select().from(jobSearchApplications)
          .where(eq(jobSearchApplications.trackerId, id))
          .orderBy(desc(jobSearchApplications.createdAt)),
        d.select().from(jobSearchInterviews)
          .where(eq(jobSearchInterviews.trackerId, id))
          .orderBy(asc(jobSearchInterviews.scheduledAt)),
        d.select().from(jobSearchFollowups)
          .where(eq(jobSearchFollowups.trackerId, id))
          .orderBy(asc(jobSearchFollowups.followupNumber)),
      ]);

      res.json({
        success: true,
        data: { ...entry, applications, interviews, followups },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to get tracker entry');
      res.status(500).json({ success: false, error: { message: 'Failed to get tracker entry' } });
    }
  });

  /** PUT /tracker/:id — update prospect */
  router.put('/tracker/:id', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const { id } = req.params;

      const [updated] = await d.update(jobSearchTracker)
        .set({ ...req.body, updatedAt: new Date() })
        .where(and(eq(jobSearchTracker.id, id), eq(jobSearchTracker.tenantId, tenantId)))
        .returning();

      if (!updated) {
        return res.status(404).json({ success: false, error: { message: 'Tracker entry not found' } });
      }

      res.json({ success: true, data: updated });
    } catch (err) {
      logger.error({ err }, 'Failed to update tracker entry');
      res.status(500).json({ success: false, error: { message: 'Failed to update tracker entry' } });
    }
  });

  /** DELETE /tracker/:id — soft delete (archive) */
  router.delete('/tracker/:id', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const { id } = req.params;

      const [updated] = await d.update(jobSearchTracker)
        .set({ isArchived: true, updatedAt: new Date() })
        .where(and(eq(jobSearchTracker.id, id), eq(jobSearchTracker.tenantId, tenantId)))
        .returning();

      if (!updated) {
        return res.status(404).json({ success: false, error: { message: 'Tracker entry not found' } });
      }

      res.json({ success: true, data: { archived: true } });
    } catch (err) {
      logger.error({ err }, 'Failed to archive tracker entry');
      res.status(500).json({ success: false, error: { message: 'Failed to archive tracker entry' } });
    }
  });

  // =========================================================================
  // AI-POWERED ACTIONS
  // =========================================================================

  /** Helper: load profile for AI calls */
  async function loadProfile(req: Request): Promise<any> {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const [profile] = await d.select().from(jobSearchProfiles)
      .where(and(
        eq(jobSearchProfiles.tenantId, tenantId),
        eq(jobSearchProfiles.userId, userId),
      ));
    return profile;
  }

  /** Helper: load tracker entry */
  async function loadTracker(req: Request): Promise<any> {
    const tenantId = getTenantId(req);
    const { id } = req.params;
    const [entry] = await d.select().from(jobSearchTracker)
      .where(and(eq(jobSearchTracker.id, id), eq(jobSearchTracker.tenantId, tenantId)));
    return entry;
  }

  /** POST /tracker/:id/research — deep company research */
  router.post('/tracker/:id/research', async (req: Request, res: Response) => {
    try {
      const entry = await loadTracker(req);
      if (!entry) return res.status(404).json({ success: false, error: { message: 'Not found' } });

      const research = await ai.researchCompany(entry.company, entry.careerPageUrl);

      // Store in latest application's companyResearch or create new application
      const existingApps = await d.select().from(jobSearchApplications)
        .where(eq(jobSearchApplications.trackerId, entry.id))
        .orderBy(desc(jobSearchApplications.createdAt))
        .limit(1);

      if (existingApps.length > 0) {
        await d.update(jobSearchApplications)
          .set({ companyResearch: research, updatedAt: new Date() })
          .where(eq(jobSearchApplications.id, existingApps[0].id));
      } else {
        await d.insert(jobSearchApplications).values({
          tenantId: entry.tenantId,
          trackerId: entry.id,
          companyResearch: research,
        });
      }

      res.json({ success: true, data: research });
    } catch (err) {
      logger.error({ err }, 'Failed to research company');
      res.status(500).json({ success: false, error: { message: 'Company research failed' } });
    }
  });

  /** POST /tracker/:id/analyze — analyze role fit */
  router.post('/tracker/:id/analyze', async (req: Request, res: Response) => {
    try {
      const [entry, profile] = await Promise.all([loadTracker(req), loadProfile(req)]);
      if (!entry) return res.status(404).json({ success: false, error: { message: 'Not found' } });
      if (!profile) return res.status(400).json({ success: false, error: { message: 'Profile required' } });

      const jdText = req.body.jdText || entry.notes || `${entry.role} at ${entry.company}`;
      const analysis = await ai.analyzeJobDescription(jdText, profile);

      // Store analysis
      const existingApps = await d.select().from(jobSearchApplications)
        .where(eq(jobSearchApplications.trackerId, entry.id))
        .orderBy(desc(jobSearchApplications.createdAt))
        .limit(1);

      if (existingApps.length > 0) {
        await d.update(jobSearchApplications)
          .set({ jdAnalysis: analysis, updatedAt: new Date() })
          .where(eq(jobSearchApplications.id, existingApps[0].id));
      } else {
        await d.insert(jobSearchApplications).values({
          tenantId: entry.tenantId,
          trackerId: entry.id,
          jdAnalysis: analysis,
        });
      }

      res.json({ success: true, data: analysis });
    } catch (err) {
      logger.error({ err }, 'Failed to analyze role');
      res.status(500).json({ success: false, error: { message: 'Role analysis failed' } });
    }
  });

  /** POST /tracker/:id/cover-letter — generate cover letter */
  router.post('/tracker/:id/cover-letter', async (req: Request, res: Response) => {
    try {
      const [entry, profile] = await Promise.all([loadTracker(req), loadProfile(req)]);
      if (!entry) return res.status(404).json({ success: false, error: { message: 'Not found' } });
      if (!profile) return res.status(400).json({ success: false, error: { message: 'Profile required' } });

      // Load existing JD analysis if available
      const apps = await d.select().from(jobSearchApplications)
        .where(eq(jobSearchApplications.trackerId, entry.id))
        .orderBy(desc(jobSearchApplications.createdAt))
        .limit(1);

      const jdAnalysis = apps[0]?.jdAnalysis || {};
      const result = await ai.generateCoverLetter(entry.company, entry.role, jdAnalysis, profile);

      // Store or update application
      if (apps.length > 0) {
        await d.update(jobSearchApplications)
          .set({ coverLetter: result.coverLetter, updatedAt: new Date() })
          .where(eq(jobSearchApplications.id, apps[0].id));
      } else {
        await d.insert(jobSearchApplications).values({
          tenantId: entry.tenantId,
          trackerId: entry.id,
          coverLetter: result.coverLetter,
        });
      }

      res.json({ success: true, data: result });
    } catch (err) {
      logger.error({ err }, 'Failed to generate cover letter');
      res.status(500).json({ success: false, error: { message: 'Cover letter generation failed' } });
    }
  });

  /** POST /tracker/:id/outreach — generate outreach email */
  router.post('/tracker/:id/outreach', async (req: Request, res: Response) => {
    try {
      const [entry, profile] = await Promise.all([loadTracker(req), loadProfile(req)]);
      if (!entry) return res.status(404).json({ success: false, error: { message: 'Not found' } });
      if (!profile) return res.status(400).json({ success: false, error: { message: 'Profile required' } });

      const apps = await d.select().from(jobSearchApplications)
        .where(eq(jobSearchApplications.trackerId, entry.id))
        .orderBy(desc(jobSearchApplications.createdAt))
        .limit(1);

      const jdAnalysis = apps[0]?.jdAnalysis || {};
      const contact = entry.contactName
        ? { name: entry.contactName, title: entry.contactTitle, email: entry.contactEmail }
        : null;

      const result = await ai.generateOutreach(entry.company, entry.role, contact, jdAnalysis, profile);

      // Store
      if (apps.length > 0) {
        await d.update(jobSearchApplications)
          .set({
            outreachSubject: result.subject,
            outreachBody: result.body,
            updatedAt: new Date(),
          })
          .where(eq(jobSearchApplications.id, apps[0].id));
      } else {
        await d.insert(jobSearchApplications).values({
          tenantId: entry.tenantId,
          trackerId: entry.id,
          outreachSubject: result.subject,
          outreachBody: result.body,
        });
      }

      res.json({ success: true, data: result });
    } catch (err) {
      logger.error({ err }, 'Failed to generate outreach');
      res.status(500).json({ success: false, error: { message: 'Outreach generation failed' } });
    }
  });

  /** POST /tracker/:id/interview-prep — generate interview briefing */
  router.post('/tracker/:id/interview-prep', async (req: Request, res: Response) => {
    try {
      const [entry, profile] = await Promise.all([loadTracker(req), loadProfile(req)]);
      if (!entry) return res.status(404).json({ success: false, error: { message: 'Not found' } });
      if (!profile) return res.status(400).json({ success: false, error: { message: 'Profile required' } });

      const apps = await d.select().from(jobSearchApplications)
        .where(eq(jobSearchApplications.trackerId, entry.id))
        .orderBy(desc(jobSearchApplications.createdAt))
        .limit(1);

      const jdAnalysis = apps[0]?.jdAnalysis || {};
      const interviewType = req.body.interviewType || 'general';
      const result = await ai.generateInterviewPrep(entry.company, entry.role, jdAnalysis, profile, interviewType);

      res.json({ success: true, data: result });
    } catch (err) {
      logger.error({ err }, 'Failed to generate interview prep');
      res.status(500).json({ success: false, error: { message: 'Interview prep generation failed' } });
    }
  });

  /** POST /tracker/:id/followup — generate follow-up email */
  router.post('/tracker/:id/followup', async (req: Request, res: Response) => {
    try {
      const [entry, profile] = await Promise.all([loadTracker(req), loadProfile(req)]);
      if (!entry) return res.status(404).json({ success: false, error: { message: 'Not found' } });
      if (!profile) return res.status(400).json({ success: false, error: { message: 'Profile required' } });

      // Determine follow-up number
      const existingFollowups = await d.select().from(jobSearchFollowups)
        .where(eq(jobSearchFollowups.trackerId, entry.id));
      const followupNumber = existingFollowups.length + 1;

      const contact = entry.contactName
        ? { name: entry.contactName, title: entry.contactTitle }
        : null;

      const result = await ai.generateFollowup(entry.company, entry.role, contact, followupNumber, profile);

      // Store follow-up
      const [followup] = await d.insert(jobSearchFollowups).values({
        tenantId: entry.tenantId,
        trackerId: entry.id,
        followupNumber,
        subject: result.subject,
        body: result.body,
      }).returning();

      res.json({ success: true, data: { ...result, followupNumber, id: followup.id } });
    } catch (err) {
      logger.error({ err }, 'Failed to generate follow-up');
      res.status(500).json({ success: false, error: { message: 'Follow-up generation failed' } });
    }
  });

  // =========================================================================
  // AUTOMATION
  // =========================================================================

  /** POST /automation/morning — run morning preparation routine */
  router.post('/automation/morning', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const profile = await loadProfile(req);
      if (!profile) return res.status(400).json({ success: false, error: { message: 'Profile required' } });

      const today = new Date().toISOString().split('T')[0];

      // Create run log
      const [run] = await d.insert(jobSearchRuns).values({
        tenantId, runType: 'morning', runDate: today, status: 'running',
      }).returning();

      let targetsProcessed = 0;
      let draftsCreated = 0;

      // Get active targets in 'research' or 'drafted' status
      const targets = await d.select().from(jobSearchTracker)
        .where(and(
          eq(jobSearchTracker.tenantId, tenantId),
          eq(jobSearchTracker.isArchived, false),
        ))
        .orderBy(desc(jobSearchTracker.priority));

      // Process each target: analyze JD if not done, generate materials
      for (const target of targets.slice(0, 10)) { // Cap at 10 per run
        try {
          if (target.status === 'research') {
            // Analyze JD and generate materials
            const jdText = target.notes || `${target.role} at ${target.company}`;
            const analysis = await ai.analyzeJobDescription(jdText, profile);
            const coverLetter = await ai.generateCoverLetter(target.company, target.role, analysis, profile);

            await d.insert(jobSearchApplications).values({
              tenantId,
              trackerId: target.id,
              jdAnalysis: analysis,
              coverLetter: coverLetter.coverLetter,
            });

            await d.update(jobSearchTracker)
              .set({ status: 'drafted', updatedAt: new Date() })
              .where(eq(jobSearchTracker.id, target.id));

            draftsCreated++;
          }
          targetsProcessed++;
        } catch (err) {
          logger.error({ err, targetId: target.id }, 'Failed to process target in morning run');
        }
      }

      // Update run
      await d.update(jobSearchRuns)
        .set({
          status: 'completed',
          targetsProcessed,
          draftsCreated,
          completedAt: new Date(),
        })
        .where(eq(jobSearchRuns.id, run.id));

      res.json({
        success: true,
        data: { runId: run.id, targetsProcessed, draftsCreated },
      });
    } catch (err) {
      logger.error({ err }, 'Morning automation run failed');
      res.status(500).json({ success: false, error: { message: 'Morning run failed' } });
    }
  });

  /** POST /automation/evening — run evening discovery routine */
  router.post('/automation/evening', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const profile = await loadProfile(req);
      if (!profile) return res.status(400).json({ success: false, error: { message: 'Profile required' } });

      const today = new Date().toISOString().split('T')[0];

      const [run] = await d.insert(jobSearchRuns).values({
        tenantId, runType: 'evening', runDate: today, status: 'running',
      }).returning();

      // Derive search terms from profile
      const targetRoles = Array.isArray(profile.targetRoles) ? profile.targetRoles : [];
      const searchTerms = targetRoles.length > 0
        ? targetRoles.map((r: string) => `${r} ${profile.location || ''}`.trim())
        : [`${profile.currentTitle || 'software engineer'} ${profile.location || ''}`.trim()];

      const discovered = await ai.discoverJobs(searchTerms, profile);

      // Store discoveries
      let discoveriesCount = 0;
      for (const job of discovered) {
        try {
          await d.insert(jobSearchDiscoveries).values({
            tenantId,
            runDate: today,
            searchTerm: searchTerms.join(', '),
            company: job.company,
            role: job.role,
            url: job.url,
            compensation: job.compensation,
            location: job.location,
            priority: job.priority,
          });
          discoveriesCount++;
        } catch (err) {
          logger.error({ err, job: job.company }, 'Failed to store discovery');
        }
      }

      await d.update(jobSearchRuns)
        .set({
          status: 'completed',
          discoveriesCount,
          completedAt: new Date(),
        })
        .where(eq(jobSearchRuns.id, run.id));

      res.json({
        success: true,
        data: { runId: run.id, discoveriesCount, discoveries: discovered },
      });
    } catch (err) {
      logger.error({ err }, 'Evening automation run failed');
      res.status(500).json({ success: false, error: { message: 'Evening run failed' } });
    }
  });

  /** POST /automation/followups — process all due follow-ups */
  router.post('/automation/followups', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const profile = await loadProfile(req);
      if (!profile) return res.status(400).json({ success: false, error: { message: 'Profile required' } });

      const today = new Date().toISOString().split('T')[0];

      const [run] = await d.insert(jobSearchRuns).values({
        tenantId, runType: 'followup', runDate: today, status: 'running',
      }).returning();

      // Find tracker entries in 'applied' status with applications that have sentAt
      // and no follow-up in the last 7 days
      const applied = await d.select().from(jobSearchTracker)
        .where(and(
          eq(jobSearchTracker.tenantId, tenantId),
          eq(jobSearchTracker.status, 'applied'),
          eq(jobSearchTracker.isArchived, false),
        ));

      let followupsGenerated = 0;

      for (const entry of applied) {
        try {
          const existingFollowups = await d.select().from(jobSearchFollowups)
            .where(eq(jobSearchFollowups.trackerId, entry.id))
            .orderBy(desc(jobSearchFollowups.createdAt));

          // Max 2 follow-ups
          if (existingFollowups.length >= 2) continue;

          const followupNumber = existingFollowups.length + 1;
          const contact = entry.contactName
            ? { name: entry.contactName, title: entry.contactTitle }
            : null;

          const result = await ai.generateFollowup(
            entry.company, entry.role, contact, followupNumber, profile,
          );

          await d.insert(jobSearchFollowups).values({
            tenantId,
            trackerId: entry.id,
            followupNumber,
            subject: result.subject,
            body: result.body,
          });

          followupsGenerated++;
        } catch (err) {
          logger.error({ err, trackerId: entry.id }, 'Failed to generate follow-up');
        }
      }

      await d.update(jobSearchRuns)
        .set({
          status: 'completed',
          targetsProcessed: applied.length,
          draftsCreated: followupsGenerated,
          completedAt: new Date(),
        })
        .where(eq(jobSearchRuns.id, run.id));

      res.json({
        success: true,
        data: { runId: run.id, followupsGenerated },
      });
    } catch (err) {
      logger.error({ err }, 'Follow-up automation run failed');
      res.status(500).json({ success: false, error: { message: 'Follow-up run failed' } });
    }
  });

  /** GET /automation/runs — list past runs */
  router.get('/automation/runs', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const limit = parseInt(req.query.limit as string) || 20;

      const runs = await d.select().from(jobSearchRuns)
        .where(eq(jobSearchRuns.tenantId, tenantId))
        .orderBy(desc(jobSearchRuns.startedAt))
        .limit(limit);

      res.json({ success: true, data: runs });
    } catch (err) {
      logger.error({ err }, 'Failed to list runs');
      res.status(500).json({ success: false, error: { message: 'Failed to list runs' } });
    }
  });

  // =========================================================================
  // DISCOVERIES
  // =========================================================================

  /** GET /discoveries — list discovered jobs */
  router.get('/discoveries', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const limit = parseInt(req.query.limit as string) || 50;

      const rows = await d.select().from(jobSearchDiscoveries)
        .where(eq(jobSearchDiscoveries.tenantId, tenantId))
        .orderBy(desc(jobSearchDiscoveries.createdAt))
        .limit(limit);

      res.json({ success: true, data: rows, total: rows.length });
    } catch (err) {
      logger.error({ err }, 'Failed to list discoveries');
      res.status(500).json({ success: false, error: { message: 'Failed to list discoveries' } });
    }
  });

  /** POST /discoveries/:id/add-to-tracker — promote discovery to tracker */
  router.post('/discoveries/:id/add-to-tracker', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const { id } = req.params;

      const [discovery] = await d.select().from(jobSearchDiscoveries)
        .where(and(eq(jobSearchDiscoveries.id, id), eq(jobSearchDiscoveries.tenantId, tenantId)));

      if (!discovery) {
        return res.status(404).json({ success: false, error: { message: 'Discovery not found' } });
      }

      // Create tracker entry from discovery
      const [entry] = await d.insert(jobSearchTracker).values({
        tenantId,
        company: discovery.company,
        role: discovery.role,
        jobUrl: discovery.url,
        priority: discovery.priority || 'MEDIUM',
        source: 'discovered',
        notes: `Discovered on ${discovery.runDate}. Compensation: ${discovery.compensation || 'Unknown'}. Location: ${discovery.location || 'Unknown'}.`,
      }).returning();

      // Mark discovery as added
      await d.update(jobSearchDiscoveries)
        .set({ addedToTracker: true, trackerId: entry.id })
        .where(eq(jobSearchDiscoveries.id, id));

      res.json({ success: true, data: entry });
    } catch (err) {
      logger.error({ err }, 'Failed to promote discovery');
      res.status(500).json({ success: false, error: { message: 'Failed to add discovery to tracker' } });
    }
  });

  // =========================================================================
  // INTERVIEWS
  // =========================================================================

  /** GET /interviews — list scheduled interviews */
  router.get('/interviews', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);

      const rows = await d.select({
        interview: jobSearchInterviews,
        company: jobSearchTracker.company,
        role: jobSearchTracker.role,
      })
        .from(jobSearchInterviews)
        .innerJoin(jobSearchTracker, eq(jobSearchInterviews.trackerId, jobSearchTracker.id))
        .where(eq(jobSearchInterviews.tenantId, tenantId))
        .orderBy(asc(jobSearchInterviews.scheduledAt));

      const formatted = rows.map((r: any) => ({
        ...r.interview,
        company: r.company,
        role: r.role,
      }));

      res.json({ success: true, data: formatted });
    } catch (err) {
      logger.error({ err }, 'Failed to list interviews');
      res.status(500).json({ success: false, error: { message: 'Failed to list interviews' } });
    }
  });

  /** POST /interviews — add interview */
  router.post('/interviews', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const {
        trackerId, interviewType, scheduledAt,
        interviewerName, interviewerTitle, prepNotes,
      } = req.body;

      const [interview] = await d.insert(jobSearchInterviews).values({
        tenantId, trackerId, interviewType,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        interviewerName, interviewerTitle,
        prepNotes: prepNotes ?? {},
      }).returning();

      // Update tracker status if needed
      const [tracker] = await d.select().from(jobSearchTracker)
        .where(eq(jobSearchTracker.id, trackerId));

      if (tracker && ['research', 'drafted', 'applied'].includes(tracker.status)) {
        const statusMap: Record<string, string> = {
          phone: 'phone_screen',
          technical: 'technical',
          behavioral: 'behavioral',
          system_design: 'technical',
          culture_fit: 'behavioral',
          final: 'final',
        };
        const newStatus = statusMap[interviewType] || tracker.status;
        await d.update(jobSearchTracker)
          .set({ status: newStatus, updatedAt: new Date() })
          .where(eq(jobSearchTracker.id, trackerId));
      }

      res.status(201).json({ success: true, data: interview });
    } catch (err) {
      logger.error({ err }, 'Failed to create interview');
      res.status(500).json({ success: false, error: { message: 'Failed to create interview' } });
    }
  });

  /** PUT /interviews/:id — update interview */
  router.put('/interviews/:id', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const { id } = req.params;

      const updateData = { ...req.body, updatedAt: new Date() };
      if (updateData.scheduledAt) {
        updateData.scheduledAt = new Date(updateData.scheduledAt);
      }

      const [updated] = await d.update(jobSearchInterviews)
        .set(updateData)
        .where(and(eq(jobSearchInterviews.id, id), eq(jobSearchInterviews.tenantId, tenantId)))
        .returning();

      if (!updated) {
        return res.status(404).json({ success: false, error: { message: 'Interview not found' } });
      }

      res.json({ success: true, data: updated });
    } catch (err) {
      logger.error({ err }, 'Failed to update interview');
      res.status(500).json({ success: false, error: { message: 'Failed to update interview' } });
    }
  });

  /** POST /interviews/:id/prep — AI-generate interview preparation */
  router.post('/interviews/:id/prep', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const { id } = req.params;
      const profile = await loadProfile(req);
      if (!profile) return res.status(400).json({ success: false, error: { message: 'Profile required' } });

      const [interview] = await d.select().from(jobSearchInterviews)
        .where(and(eq(jobSearchInterviews.id, id), eq(jobSearchInterviews.tenantId, tenantId)));

      if (!interview) {
        return res.status(404).json({ success: false, error: { message: 'Interview not found' } });
      }

      const [tracker] = await d.select().from(jobSearchTracker)
        .where(eq(jobSearchTracker.id, interview.trackerId));

      const apps = await d.select().from(jobSearchApplications)
        .where(eq(jobSearchApplications.trackerId, interview.trackerId))
        .orderBy(desc(jobSearchApplications.createdAt))
        .limit(1);

      const jdAnalysis = apps[0]?.jdAnalysis || {};
      const prep = await ai.generateInterviewPrep(
        tracker.company, tracker.role, jdAnalysis, profile, interview.interviewType,
      );

      // Store prep notes on the interview
      await d.update(jobSearchInterviews)
        .set({ prepNotes: prep, updatedAt: new Date() })
        .where(eq(jobSearchInterviews.id, id));

      res.json({ success: true, data: prep });
    } catch (err) {
      logger.error({ err }, 'Failed to generate interview prep');
      res.status(500).json({ success: false, error: { message: 'Interview prep failed' } });
    }
  });

  // =========================================================================
  // ANALYTICS
  // =========================================================================

  /** GET /analytics/funnel — conversion funnel */
  router.get('/analytics/funnel', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);

      const rows = await d.select({
        status: jobSearchTracker.status,
        count: count(),
      })
        .from(jobSearchTracker)
        .where(and(
          eq(jobSearchTracker.tenantId, tenantId),
          eq(jobSearchTracker.isArchived, false),
        ))
        .groupBy(jobSearchTracker.status);

      // Build ordered funnel
      const funnel = TRACKER_STATUSES.map(status => {
        const row = rows.find((r: any) => r.status === status);
        return { stage: status, count: row ? Number(row.count) : 0 };
      });

      res.json({ success: true, data: funnel });
    } catch (err) {
      logger.error({ err }, 'Failed to get funnel analytics');
      res.status(500).json({ success: false, error: { message: 'Failed to get funnel' } });
    }
  });

  /** GET /analytics/velocity — average time per stage */
  router.get('/analytics/velocity', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);

      // Simple velocity: count by status with average age
      const rows = await d.select({
        status: jobSearchTracker.status,
        count: count(),
        avgAge: sql`AVG(EXTRACT(EPOCH FROM (NOW() - ${jobSearchTracker.createdAt})) / 86400)`,
      })
        .from(jobSearchTracker)
        .where(and(
          eq(jobSearchTracker.tenantId, tenantId),
          eq(jobSearchTracker.isArchived, false),
        ))
        .groupBy(jobSearchTracker.status);

      const velocity = rows.map((r: any) => ({
        status: r.status,
        count: Number(r.count),
        avgDaysInStage: Math.round(Number(r.avgAge) * 10) / 10,
      }));

      res.json({ success: true, data: velocity });
    } catch (err) {
      logger.error({ err }, 'Failed to get velocity analytics');
      res.status(500).json({ success: false, error: { message: 'Failed to get velocity' } });
    }
  });

  /** GET /analytics/sources — which sources produce best outcomes */
  router.get('/analytics/sources', async (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);

      const rows = await d.select({
        source: jobSearchTracker.source,
        status: jobSearchTracker.status,
        count: count(),
      })
        .from(jobSearchTracker)
        .where(eq(jobSearchTracker.tenantId, tenantId))
        .groupBy(jobSearchTracker.source, jobSearchTracker.status);

      // Group by source
      const bySource: Record<string, { total: number; advanced: number; offers: number }> = {};
      for (const row of rows) {
        const src = row.source || 'unknown';
        if (!bySource[src]) bySource[src] = { total: 0, advanced: 0, offers: 0 };
        const cnt = Number(row.count);
        bySource[src].total += cnt;
        if (['phone_screen', 'technical', 'behavioral', 'final', 'offer', 'accepted'].includes(row.status)) {
          bySource[src].advanced += cnt;
        }
        if (['offer', 'accepted'].includes(row.status)) {
          bySource[src].offers += cnt;
        }
      }

      const sources = Object.entries(bySource).map(([source, data]) => ({
        source,
        ...data,
        advanceRate: data.total > 0 ? Math.round((data.advanced / data.total) * 100) : 0,
      }));

      res.json({ success: true, data: sources });
    } catch (err) {
      logger.error({ err }, 'Failed to get source analytics');
      res.status(500).json({ success: false, error: { message: 'Failed to get sources' } });
    }
  });

  return { router };
}
