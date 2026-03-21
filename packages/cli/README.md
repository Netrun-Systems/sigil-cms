# sigil-cms

CLI for [Sigil CMS](https://github.com/Netrun-Systems/netrun-cms) -- scaffold, develop, build, and manage Sigil sites.

## Installation

```bash
# Global install
npm install -g sigil-cms

# Or use npx
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

Creates a project directory with:
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
- `-p, --port <port>` -- port to listen on (default: `3000`)
- `-H, --host <host>` -- host to bind to (default: `0.0.0.0`)

### `sigil build`

Build the project for production.

```bash
sigil build
```

Compiles TypeScript to `./dist/`.

### `sigil start`

Start the production server.

```bash
sigil start
sigil start --port 8080
```

Requires `sigil build` to have been run first.

Options:
- `-p, --port <port>` -- port to listen on (default: `3000`)

### `sigil migrate`

Run database migrations using Drizzle Kit.

```bash
sigil migrate              # Apply pending migrations
sigil migrate --generate   # Generate migration from schema changes
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

Show environment and project information.

```bash
sigil info
```

Displays Node.js version, installed Sigil packages, config file status, and database connection status.

## Development

```bash
# From the netrun-cms monorepo root
pnpm install
cd packages/cli
pnpm build

# Test locally
node dist/index.js --help
node dist/index.js create test-project
node dist/index.js info
```

## License

MIT -- Netrun Systems
