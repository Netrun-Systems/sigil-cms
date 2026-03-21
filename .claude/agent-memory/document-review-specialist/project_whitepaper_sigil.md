---
name: sigil_whitepaper_v1
description: Sigil CMS comprehensive technical whitepaper created March 2026 — sourcing approach, verified claims, and session context
type: project
---

WHITEPAPER.md created at `/data/workspace/github/netrun-cms/WHITEPAPER.md` on 2026-03-21.

12 sections, ~1,179 lines. Every technical claim sourced from actual code files per Anti-Fabrication Protocol.

Source files verified before writing:
- CLAUDE.md (architecture, monorepo structure)
- PRICING.md (pricing tiers, deploy templates, competitor comparison)
- packages/client/README.md (SDK API surface)
- packages/cli/README.md (CLI commands)
- packages/next/README.md (Next.js integration)
- packages/@netrun-cms/db/src/schema.ts (all 13+ tables, columns, constraints)
- apps/api/src/routes/design-ai.ts (5 AI design endpoints)
- apps/api/src/services/stitch.ts (Stitch service, mock fallback)
- apps/api/src/services/design-advisor.ts (Charlotte/Gemini integration)
- apps/api/src/lib/scheduler.ts (content scheduling daemon)
- apps/admin/src/components/LivePreviewPanel.tsx (viewport dimensions, modes)
- packages/@netrun-cms/plugin-runtime/src/types.ts (plugin interface)
- apps/api/src/routes/block-types.ts (23 block types)
- apps/api/src/graphql/schema.ts (14 GraphQL queries)
- All 19 plugin src/index.ts files
- boardroom/reports/2026-03-21-sigil-cms-competitive-analysis.md (Sanity, Strapi)
- boardroom/reports/2026-03-21-payload-cms-competitive-analysis.md (Payload CMS)

Key counts verified from source:
- 23 core block types (from block-types.ts BLOCK_TYPE_CATALOG)
- 19 first-party plugins (from plugins/ directory listing)
- 14 GraphQL queries (from graphql/schema.ts)
- 9 deploy templates (from PRICING.md)
- 7 CLI commands (from cli/README.md)
- 1,400+ CSS variables, 70+ Google Fonts, 7 presets (Design Playground)
- 44+ typed SDK methods (from client/README.md)

**Why:** User requested a developer/investor-grade whitepaper for Sigil v1.0 launch.
**How to apply:** If asked to update or review this whitepaper, use the same 17 source files as ground truth. The competitive analysis reports may have been written before some features shipped — trust the code files over the reports for current feature state.
