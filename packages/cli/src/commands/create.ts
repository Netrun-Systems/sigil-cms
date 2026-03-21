import { Command } from "commander";
import * as fs from "node:fs";
import * as path from "node:path";
import { banner, info, success, warn, error, log, GREEN, DIM, RESET, BOLD } from "../utils";

const TEMPLATE_PACKAGE_JSON = (name: string) => JSON.stringify(
  {
    name,
    version: "0.1.0",
    private: true,
    scripts: {
      dev: "sigil dev",
      build: "sigil build",
      start: "sigil start",
      migrate: "sigil migrate",
      seed: "sigil seed",
    },
    dependencies: {
      "sigil-cms": "^0.1.0",
      "@sigil-cms/client": "^0.1.0",
      "@sigil-cms/core": "^0.1.0",
      "@sigil-cms/db": "^0.1.0",
    },
    devDependencies: {
      typescript: "^5.7.0",
      tsx: "^4.0.0",
    },
  },
  null,
  2
);

const TEMPLATE_ENV = `# Sigil CMS Environment Configuration
# Copy this to .env and fill in your values

# Database connection (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/sigil_dev"

# Authentication
JWT_SECRET="change-me-to-a-random-secret"

# Server
PORT=3000
HOST="0.0.0.0"
NODE_ENV="development"

# Storage (optional — defaults to local filesystem)
# STORAGE_PROVIDER="azure"
# AZURE_STORAGE_CONNECTION_STRING=""

# Admin (first user created on seed)
# ADMIN_EMAIL="admin@example.com"
`;

const TEMPLATE_CONFIG = (name: string) => `import { defineConfig } from "@sigil-cms/core";

export default defineConfig({
  name: "${name}",

  // Database — reads DATABASE_URL from .env
  database: {
    provider: "postgresql",
  },

  // Content types are defined in ./content/
  content: {
    directory: "./content",
  },

  // Enable built-in plugins
  plugins: [
    // "@sigil-cms/plugin-media",
    // "@sigil-cms/plugin-seo",
    // "@sigil-cms/plugin-i18n",
  ],

  // Admin panel configuration
  admin: {
    path: "/admin",
  },

  // API configuration
  api: {
    prefix: "/api",
    cors: {
      origin: ["http://localhost:3000"],
    },
  },
});
`;

const TEMPLATE_GITIGNORE = `node_modules/
dist/
.env
.env.local
*.log
.DS_Store
.turbo/
`;

const TEMPLATE_TSCONFIG = JSON.stringify(
  {
    compilerOptions: {
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "bundler",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      declaration: true,
      outDir: "./dist",
      rootDir: "./src",
    },
    include: ["src", "content", "sigil.config.ts"],
    exclude: ["node_modules", "dist"],
  },
  null,
  2
);

export const createCommand = new Command("create")
  .description("Scaffold a new Sigil CMS project")
  .argument("<project-name>", "Name for the new project directory")
  .option("--template <template>", "Project template to use", "default")
  .option("--no-git", "Skip git initialization")
  .action((projectName: string, options: { template: string; git: boolean }) => {
    banner();

    const targetDir = path.resolve(process.cwd(), projectName);

    // Check if directory already exists
    if (fs.existsSync(targetDir)) {
      error(`Directory "${projectName}" already exists.`);
      process.exit(1);
    }

    info(`Creating Sigil project: ${BOLD}${projectName}${RESET}`);
    log("");

    // Create directory structure
    fs.mkdirSync(targetDir, { recursive: true });
    fs.mkdirSync(path.join(targetDir, "content"), { recursive: true });
    fs.mkdirSync(path.join(targetDir, "src"), { recursive: true });
    fs.mkdirSync(path.join(targetDir, "public"), { recursive: true });

    // Write files
    const files: Array<[string, string]> = [
      ["package.json", TEMPLATE_PACKAGE_JSON(projectName)],
      [".env.example", TEMPLATE_ENV],
      ["sigil.config.ts", TEMPLATE_CONFIG(projectName)],
      [".gitignore", TEMPLATE_GITIGNORE],
      ["tsconfig.json", TEMPLATE_TSCONFIG],
    ];

    for (const [filename, content] of files) {
      const filepath = path.join(targetDir, filename);
      fs.writeFileSync(filepath, content, "utf-8");
      log(`  ${GREEN}+${RESET} ${filename}`);
    }

    log("");
    success("Project scaffolded.");
    log("");
    log(`${BOLD}  Next steps:${RESET}`);
    log("");
    log(`  ${DIM}$${RESET} cd ${projectName}`);
    log(`  ${DIM}$${RESET} cp .env.example .env   ${DIM}# configure your database${RESET}`);
    log(`  ${DIM}$${RESET} npm install`);
    log(`  ${DIM}$${RESET} sigil migrate           ${DIM}# set up database schema${RESET}`);
    log(`  ${DIM}$${RESET} sigil seed              ${DIM}# optional: load demo content${RESET}`);
    log(`  ${DIM}$${RESET} sigil dev               ${DIM}# start development server${RESET}`);
    log("");
  });
