/**
 * @netrun/job-search — Job Search Platform Plugin
 *
 * Unified job search pipeline combining:
 * - Autonomous processor (morning prep + evening discovery)
 * - KOG CRM job tracking module
 * - AI-powered cover letters, outreach, interview prep
 * - Analytics funnel and velocity tracking
 *
 * Tables are tenant-scoped. AI features use Gemini via GOOGLE_API_KEY.
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { createRoutes } from './routes.js';

const JOB_SEARCH_MIGRATION = `
  -- Job Search Profiles
  CREATE TABLE IF NOT EXISTS job_search_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform_tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(320) NOT NULL,
    phone VARCHAR(30),
    linkedin TEXT,
    github TEXT,
    website TEXT,
    current_title VARCHAR(255),
    current_company VARCHAR(255),
    years_experience INTEGER,
    target_roles JSONB DEFAULT '[]',
    target_comp VARCHAR(100),
    location VARCHAR(255),
    remote_preference VARCHAR(20) DEFAULT 'hybrid',
    resume_url TEXT,
    skills JSONB DEFAULT '[]',
    about TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(tenant_id, user_id)
  );

  CREATE INDEX IF NOT EXISTS idx_job_search_profiles_tenant ON job_search_profiles(tenant_id);

  -- Job Search Tracker (pipeline)
  CREATE TABLE IF NOT EXISTS job_search_tracker (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform_tenants(id) ON DELETE CASCADE,
    company VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    job_url TEXT,
    career_page_url TEXT,
    status VARCHAR(30) DEFAULT 'research' NOT NULL,
    priority VARCHAR(10) DEFAULT 'MEDIUM' NOT NULL,
    ats_platform VARCHAR(50),
    contact_name VARCHAR(255),
    contact_email VARCHAR(320),
    contact_title VARCHAR(255),
    source VARCHAR(30) DEFAULT 'manual',
    notes TEXT,
    next_action TEXT,
    next_action_date DATE,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_job_search_tracker_tenant ON job_search_tracker(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_job_search_tracker_status ON job_search_tracker(tenant_id, status);
  CREATE INDEX IF NOT EXISTS idx_job_search_tracker_priority ON job_search_tracker(tenant_id, priority);
  CREATE INDEX IF NOT EXISTS idx_job_search_tracker_next_action ON job_search_tracker(tenant_id, next_action_date);

  -- Job Search Applications (generated materials)
  CREATE TABLE IF NOT EXISTS job_search_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform_tenants(id) ON DELETE CASCADE,
    tracker_id UUID NOT NULL REFERENCES job_search_tracker(id) ON DELETE CASCADE,
    cover_letter TEXT,
    outreach_subject VARCHAR(500),
    outreach_body TEXT,
    jd_analysis JSONB DEFAULT '{}',
    company_research JSONB DEFAULT '{}',
    resume_variant TEXT,
    gmail_draft_id VARCHAR(255),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_job_search_applications_tenant ON job_search_applications(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_job_search_applications_tracker ON job_search_applications(tracker_id);

  -- Job Search Discoveries (evening discovery results)
  CREATE TABLE IF NOT EXISTS job_search_discoveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform_tenants(id) ON DELETE CASCADE,
    run_date DATE NOT NULL,
    search_term VARCHAR(500),
    company VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    url TEXT,
    compensation VARCHAR(200),
    location VARCHAR(255),
    priority VARCHAR(10) DEFAULT 'MEDIUM',
    added_to_tracker BOOLEAN DEFAULT false,
    tracker_id UUID REFERENCES job_search_tracker(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_job_search_discoveries_tenant ON job_search_discoveries(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_job_search_discoveries_run_date ON job_search_discoveries(tenant_id, run_date);

  -- Job Search Follow-ups
  CREATE TABLE IF NOT EXISTS job_search_followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform_tenants(id) ON DELETE CASCADE,
    application_id UUID REFERENCES job_search_applications(id) ON DELETE CASCADE,
    tracker_id UUID NOT NULL REFERENCES job_search_tracker(id) ON DELETE CASCADE,
    followup_number INTEGER NOT NULL DEFAULT 1,
    subject VARCHAR(500),
    body TEXT,
    gmail_draft_id VARCHAR(255),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_job_search_followups_tenant ON job_search_followups(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_job_search_followups_tracker ON job_search_followups(tracker_id);

  -- Job Search Runs (automation log)
  CREATE TABLE IF NOT EXISTS job_search_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform_tenants(id) ON DELETE CASCADE,
    run_type VARCHAR(20) NOT NULL,
    run_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'running' NOT NULL,
    targets_processed INTEGER DEFAULT 0,
    discoveries_count INTEGER DEFAULT 0,
    drafts_created INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ
  );

  CREATE INDEX IF NOT EXISTS idx_job_search_runs_tenant ON job_search_runs(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_job_search_runs_date ON job_search_runs(tenant_id, run_date);

  -- Job Search Interviews
  CREATE TABLE IF NOT EXISTS job_search_interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform_tenants(id) ON DELETE CASCADE,
    tracker_id UUID NOT NULL REFERENCES job_search_tracker(id) ON DELETE CASCADE,
    interview_type VARCHAR(30) NOT NULL,
    scheduled_at TIMESTAMPTZ,
    interviewer_name VARCHAR(255),
    interviewer_title VARCHAR(255),
    prep_notes JSONB DEFAULT '{}',
    outcome VARCHAR(30),
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_job_search_interviews_tenant ON job_search_interviews(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_job_search_interviews_tracker ON job_search_interviews(tracker_id);
  CREATE INDEX IF NOT EXISTS idx_job_search_interviews_scheduled ON job_search_interviews(tenant_id, scheduled_at);
`;

const jobSearchPlugin: CmsPlugin = {
  id: 'netrun-job-search',
  name: 'Job Search Platform',
  version: '1.0.0',

  async register(ctx) {
    // Run migrations
    await ctx.runMigration(JOB_SEARCH_MIGRATION);

    // Create route handlers
    const { router } = createRoutes(ctx.db, ctx.logger);

    // Mount as global routes (not site-scoped — job search is per-tenant)
    ctx.addGlobalRoutes('job-search', router);

    // Register admin navigation
    ctx.addAdminNav({
      title: 'Job Search',
      siteScoped: false,
      items: [
        { label: 'Dashboard', icon: 'Briefcase', href: '/job-search' },
        { label: 'Tracker', icon: 'List', href: '/job-search/tracker' },
        { label: 'Applications', icon: 'Send', href: '/job-search/applications' },
        { label: 'Discoveries', icon: 'Search', href: '/job-search/discoveries' },
        { label: 'Interviews', icon: 'Calendar', href: '/job-search/interviews' },
        { label: 'Profile', icon: 'User', href: '/job-search/profile' },
        { label: 'Analytics', icon: 'BarChart3', href: '/job-search/analytics' },
      ],
    });

    // Register admin routes for lazy loading
    ctx.addAdminRoutes([
      { path: 'job-search', component: '@netrun/job-search/admin/DashboardPage' },
      { path: 'job-search/tracker', component: '@netrun/job-search/admin/TrackerPage' },
      { path: 'job-search/tracker/:id', component: '@netrun/job-search/admin/TrackerDetailPage' },
      { path: 'job-search/applications', component: '@netrun/job-search/admin/ApplicationsPage' },
      { path: 'job-search/discoveries', component: '@netrun/job-search/admin/DiscoveriesPage' },
      { path: 'job-search/interviews', component: '@netrun/job-search/admin/InterviewsPage' },
      { path: 'job-search/profile', component: '@netrun/job-search/admin/ProfilePage' },
      { path: 'job-search/analytics', component: '@netrun/job-search/admin/AnalyticsPage' },
    ]);
  },
};

export default jobSearchPlugin;
export { jobSearchPlugin };
