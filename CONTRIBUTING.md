# Contributing to Sigil CMS

Thank you for your interest in contributing to Sigil. This guide covers the workflow, code style, and plugin development patterns you need to get started.

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm 9.15+
- PostgreSQL 15+
- Git

### Setup

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/sigil-cms.git
cd sigil-cms
pnpm install
pnpm build

# Set up the database
cp apps/api/.env.example apps/api/.env
# Edit .env with your PostgreSQL connection string
cd packages/@netrun-cms/db
pnpm db:push    # Push schema to dev database
cd ../../..

# Start development
pnpm dev
```

The API runs on port 3001, the admin panel on port 3001 (Vite). Both hot-reload on file changes.

## Contribution Workflow

### 1. Find or Create an Issue

- Check [existing issues](https://github.com/Netrun-Systems/sigil-cms/issues) before starting work
- For bugs, use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md)
- For features, use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md)
- Comment on the issue to signal you're working on it

### 2. Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming convention:
- `feature/` -- new functionality
- `fix/` -- bug fixes
- `docs/` -- documentation changes
- `refactor/` -- code restructuring without behavior changes
- `plugin/` -- new or updated plugins

### 3. Develop

```bash
# Run the full dev environment
pnpm dev

# Or run specific packages
pnpm --filter @netrun-cms/api dev
pnpm --filter @netrun-cms/admin dev
```

### 4. Test

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @netrun-cms/api test
pnpm --filter @netrun-cms/api test:watch

# Type check everything
pnpm typecheck

# Lint
pnpm lint
```

### 5. Commit

Write clear commit messages:

```
feat: add webhook retry with exponential backoff
fix: resolve theme token merge order in Design Playground
docs: add Astro integration example to SDK README
plugin: add Printful catalog sync endpoint
```

We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` -- new feature
- `fix:` -- bug fix
- `docs:` -- documentation
- `refactor:` -- code restructuring
- `test:` -- adding or updating tests
- `chore:` -- tooling, dependencies, CI
- `plugin:` -- plugin-specific changes

### 6. Pull Request

```bash
git push origin feature/your-feature-name
```

Open a PR against `main`. Fill out the [PR template](.github/PULL_REQUEST_TEMPLATE.md). A maintainer will review within a few days.

## Code Style

### TypeScript

- **Strict mode** throughout -- no `any` unless absolutely necessary
- **`const` over `let`** -- prefer immutable bindings
- **async/await** over raw promises
- **Explicit error handling** -- no swallowed exceptions
- **Zod** for all input validation (API routes, config, plugin data)

### React (Admin Panel)

- **Functional components** with hooks
- **Shadcn/Radix UI** components from `@netrun-cms/ui` -- do not introduce alternative component libraries
- **React Query** (`@tanstack/react-query`) for server state
- **React Hook Form** with Zod resolvers for forms

### API Routes

- All routes go through Express Router
- Authenticated routes use `authenticate` and `requireRole()` middleware
- Input validation with Zod schemas from `@netrun-cms/core`
- Structured error responses via `@netrun/error-handling`
- Structured logging via `@netrun/logger` (Pino)

### Database

- **Drizzle ORM** -- all schema in `packages/@netrun-cms/db/src/schema.ts`
- Database-enforced constraints (check constraints, unique indexes)
- New tables must include `createdAt` and `updatedAt` timestamps
- Plugin tables created via `ctx.runMigration()` with idempotent DDL

## Plugin Development

Plugins are the primary extension mechanism. Each plugin implements the `CmsPlugin` interface from `@netrun-cms/plugin-runtime`.

### Minimal Plugin

```typescript
import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { Router } from 'express';

const myPlugin: CmsPlugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  requiredEnv: ['MY_API_KEY'],  // optional -- skip gracefully if missing

  async register(ctx) {
    // Create tables (idempotent)
    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_my_data (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL,
        data JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // Register block types
    ctx.addBlockTypes([
      { type: 'my_widget', label: 'My Widget', category: 'interactive' }
    ]);

    // Add authenticated routes
    const router = Router();
    router.get('/', async (req, res) => {
      const items = await ctx.db.query.myData.findMany();
      res.json({ data: items });
    });
    ctx.addRoutes('my-plugin', router);

    // Add admin navigation
    ctx.addAdminNav({
      id: 'my-plugin',
      label: 'My Plugin',
      icon: 'puzzle',
      path: '/my-plugin',
    });
  },
};

export default myPlugin;
```

### Plugin Guidelines

- **Environment gating**: Set `requiredEnv` for any external API dependencies. Never crash on missing env vars.
- **Idempotent migrations**: Use `CREATE TABLE IF NOT EXISTS`. Plugins run migrations on every startup.
- **Tenant scoping**: All data must be scoped to a site or tenant. Never create global data without justification.
- **Error isolation**: Plugin failures must not crash the core CMS. Wrap initialization in try/catch.
- **Admin UI**: Use `ctx.addAdminNav()` and `ctx.addAdminRoutes()` for admin panel integration. Components are lazy-loaded.

### Plugin File Structure

```
plugins/my-plugin/
├── index.ts          -- CmsPlugin export
├── routes.ts         -- Express routers
├── admin/            -- React components for admin panel
│   ├── index.tsx     -- Main plugin page
│   └── components/   -- Plugin-specific components
└── README.md         -- Plugin documentation
```

## Monorepo Structure

Understanding the build dependency order helps when working across packages:

```
@netrun-cms/core        (no deps -- build first)
  ├── @netrun-cms/db    (depends on core)
  ├── @netrun-cms/theme (depends on core)
  ├── @netrun-cms/ui    (no workspace deps)
  ├── @netrun-cms/embeds
  └── @netrun-cms/blocks (depends on core, ui, theme)
       ├── apps/api     (depends on core, db, theme)
       └── apps/admin   (depends on core, ui, theme, blocks)
```

Turborepo handles the build order automatically. If you change a package, run `pnpm build` from the root and Turbo will rebuild only what's affected.

## Reporting Security Issues

Do **not** open a public issue for security vulnerabilities. Email [security@netrunsystems.com](mailto:security@netrunsystems.com) with details. We will respond within 48 hours.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
