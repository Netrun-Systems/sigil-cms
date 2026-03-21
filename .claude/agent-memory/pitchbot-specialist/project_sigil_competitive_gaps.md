---
name: Sigil CMS Competitive Gaps vs Payload
description: Prioritized list of Sigil gaps vs Payload CMS with remediation estimates
type: project
---

P0 gaps (blocking go-public):
- No public GitHub repository (Payload: 40.8k stars)
- No documentation site (Payload: payloadcms.com/docs is comprehensive)

P1 gaps (DX parity, close the evaluation objection):
- No live preview — 2-3 agentic days for preview URL, 4-5 for iframe live preview
- No CLI — 5-7 days for `sigil create` + templates
- No TypeScript SDK — 3-4 days for `@sigil-cms/client`
- No GraphQL — 3-4 days via graphql-js + Drizzle schema
- No scheduling daemon — 1-2 days (schema already has `scheduled` status)
- No official Next.js package — 3-4 days

P2 gaps (quality parity):
- No rich text editor (Lexical/Tiptap) — 5-7 days (Tiptap)
- No jobs queue — 3-4 days (pg-boss, PostgreSQL-native)
- No field-level access control — 4-5 days
- No SSO — 3-5 days
- No audit logs — 2-3 days
- No image transformations (sharp) — 2-3 days
- No autosave — 1-2 days
- No content relation fields — 4-5 days

**Why**: Payload has materially better DX for single-app Next.js developers. Sigil's wins are architectural (multi-tenancy) and vertical (plugins, analytics, Design Playground) — these cannot be copied by Payload.

**How to apply**: Never compete on Payload's terms (developer framework, Next.js embedded, code-first single-app). Compete on Sigil's terms (agency platform, multi-tenant, vertical depth, editor-friendly design control).
