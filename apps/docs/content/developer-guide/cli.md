---
title: CLI Reference
description: "sigil-cms CLI -- scaffold, develop, build, and manage Sigil sites."
order: 4
---

## Installation

```bash
npm install -g sigil-cms
# or use npx
npx sigil-cms create my-site
```

## Commands

### `sigil create <project-name>`

Scaffold a new Sigil CMS project.

```bash
sigil create my-blog
cd my-blog
npm install
sigil dev
```

Creates:
- `package.json` with Sigil dependencies
- `sigil.config.ts` configuration file
- `.env.example` environment template
- `tsconfig.json` TypeScript configuration
- `content/`, `src/`, `public/` directories

Options:
- `--template <name>` -- project template (default: `default`)
- `--no-git` -- skip git initialization

### `sigil dev`

Start the development server with hot reload.

```bash
sigil dev
sigil dev --port 4000
```

Options:
- `-p, --port <port>` -- port (default: 3000)
- `-H, --host <host>` -- host (default: 0.0.0.0)

### `sigil build`

Build the project for production. Compiles TypeScript to `./dist/`.

```bash
sigil build
```

### `sigil start`

Start the production server. Requires `sigil build` first.

```bash
sigil start
sigil start --port 8080
```

Options:
- `-p, --port <port>` -- port (default: 3000)

### `sigil migrate`

Database migration management via Drizzle Kit.

```bash
sigil migrate              # Apply pending migrations
sigil migrate --generate   # Generate from schema changes
sigil migrate --push       # Push schema directly (dev only)
sigil migrate --status     # Show migration status
```

### `sigil seed`

Seed the database with demo content.

```bash
sigil seed
sigil seed --reset    # Drop existing data first
```

Looks for `seed.ts`, `seed.js`, or `seeds/index.ts` in the project root.

### `sigil info`

Show environment and project information: Node.js version, installed Sigil packages, config file status, database connection status.

```bash
sigil info
```

## Development (from monorepo)

```bash
# Build the CLI
cd packages/cli
pnpm build

# Test locally
node dist/index.js --help
node dist/index.js create test-project
node dist/index.js info
```
