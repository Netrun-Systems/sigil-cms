# Sigil CMS (Netrun CMS)

A high-performance, multi-tenant headless CMS built for agencies and developers. It features a visual design system, block-level analytics, and AI-powered design generation.

## Project Overview

- **Architecture**: pnpm monorepo managed by Turborepo.
- **Backend**: Express.js with REST and GraphQL APIs, PostgreSQL + Drizzle ORM.
- **Frontend**: Vite + React 18 SPA (Admin Panel) and Next.js (Docs).
- **Database**: PostgreSQL with Row-Level Security (RLS) for native multi-tenancy.
- **AI Integration**: Gemini (Google Generative AI) for design generation and content assistance.
- **Plugin System**: 21+ built-in plugins covering SEO, e-commerce, booking, and more.

### Key Directories

- `apps/api`: Express.js backend.
- `apps/admin`: Vite + React visual editor.
- `apps/docs`: Next.js documentation site.
- `packages/@netrun-cms/db`: Drizzle ORM schema, migrations, and database client.
- `packages/@netrun-cms/ui`: Shared UI components (Shadcn/Radix-based).
- `packages/cli`: `sigil` CLI for scaffolding and management.
- `plugins/*`: Feature-specific extensions (e.g., SEO, Store, Artist).

## Building and Running

The project uses `pnpm` and `turbo`.

- **Install Dependencies**: `pnpm install`
- **Development**: `pnpm dev` (runs `turbo run dev`)
- **Build**: `pnpm build` (runs `turbo run build`)
- **Testing**: `pnpm test` (runs `vitest` in packages/apps)
- **Linting**: `pnpm lint`
- **Type-checking**: `pnpm typecheck`
- **Database Migrations**:
  - Generate: `pnpm --filter @netrun-cms/db db:generate`
  - Migrate: `pnpm --filter @netrun-cms/db db:migrate`
  - Push: `pnpm --filter @netrun-cms/db db:push`
  - Studio: `pnpm --filter @netrun-cms/db db:studio`

## Development Conventions

- **Typescript**: Strictly typed. Use `tsconfig.json` settings from root and individual packages.
- **Styling**: Tailwind CSS with a comprehensive CSS variable-based design system in `packages/@netrun-cms/ui`.
- **Database**: All tables must respect Row-Level Security (RLS) for multi-tenancy. Check `packages/@netrun-cms/db` for schema patterns.
- **Plugins**: New features should be implemented as plugins using the `@netrun-cms/plugin-runtime`.
- **API**: Use `zod` for request validation and `express-async-errors` for error handling.
- **Shared Code**: Some backend packages depend on a sibling repository `netrun-shared-ts` via relative file paths (e.g., `../../../netrun-shared-ts/packages/logger`). Ensure this sibling repo is present if local builds fail for these packages.

## Core Features

- **Multi-tenancy**: One deployment serving unlimited clients via PostgreSQL RLS.
- **Design Playground**: Visual editor for 1,400+ CSS variables.
- **Resonance Analytics**: Block-level engagement tracking.
- **AI Design**: Prompt-to-page generation via Stitch and Charlotte AI.
- **Environment Gating**: Plugins gracefully skip if required environment variables are missing.
