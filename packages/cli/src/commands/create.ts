import { Command } from "commander";
import * as fs from "node:fs";
import * as path from "node:path";
import { banner, info, success, warn, error, log, GREEN, DIM, RESET, BOLD, YELLOW, SIGIL_BLUE } from "../utils";

// ---------------------------------------------------------------------------
// Template registry
// ---------------------------------------------------------------------------

interface TemplateInfo {
  name: string;
  description: string;
  plugins: string[];
}

const TEMPLATES: Record<string, TemplateInfo> = {
  blank: {
    name: "blank",
    description: "Minimal site with one empty page",
    plugins: [],
  },
  website: {
    name: "website",
    description: "Business website with 5 pre-built pages (Home, About, Services, Blog, Contact)",
    plugins: ["seo", "media"],
  },
  portfolio: {
    name: "portfolio",
    description: "Artist/creative portfolio with gallery, filterable work, and bio",
    plugins: ["media", "artist"],
  },
  docs: {
    name: "docs",
    description: "Documentation site with sidebar navigation and full-text search",
    plugins: ["docs"],
  },
  ecommerce: {
    name: "ecommerce",
    description: "Online store with product catalog, cart, and Stripe checkout",
    plugins: ["media", "seo", "store"],
  },
};

const DEPLOY_TEMPLATES = [
  { file: "docker-compose.yml", description: "PostgreSQL + Sigil in Docker Compose" },
  { file: "Dockerfile",         description: "Multi-stage Docker build" },
  { file: "gcp/cloudbuild.yaml", description: "Google Cloud Run deployment" },
  { file: "fly.toml",           description: "Fly.io deployment" },
  { file: "railway.json",       description: "Railway deployment" },
];

// ---------------------------------------------------------------------------
// Template directory resolution
// ---------------------------------------------------------------------------

function getTemplatesDir(): string {
  // Templates live alongside the built CLI, or in the source tree
  const candidates = [
    path.resolve(__dirname, "..", "..", "templates"),   // dist/  -> templates/
    path.resolve(__dirname, "..", "templates"),         // src/   -> templates/ (dev)
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  // Fallback: relative to package root
  return path.resolve(__dirname, "..", "..", "templates");
}

// ---------------------------------------------------------------------------
// File copying with placeholder replacement
// ---------------------------------------------------------------------------

function copyTemplateDir(
  srcDir: string,
  destDir: string,
  replacements: Record<string, string>,
): void {
  if (!fs.existsSync(srcDir)) {
    error(`Template directory not found: ${srcDir}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyTemplateDir(srcPath, destPath, replacements);
    } else {
      let content = fs.readFileSync(srcPath, "utf-8");
      for (const [placeholder, value] of Object.entries(replacements)) {
        content = content.replaceAll(placeholder, value);
      }
      fs.writeFileSync(destPath, content, "utf-8");

      // Print relative path from project root
      const relPath = path.relative(destDir, destPath);
      log(`  ${GREEN}+${RESET} ${relPath}`);
    }
  }
}

// ---------------------------------------------------------------------------
// List templates
// ---------------------------------------------------------------------------

function printTemplateList(): void {
  banner();
  log(`${BOLD}  Available templates:${RESET}`);
  log("");

  for (const [key, tmpl] of Object.entries(TEMPLATES)) {
    const plugins = tmpl.plugins.length > 0
      ? `  ${DIM}(plugins: ${tmpl.plugins.join(", ")})${RESET}`
      : "";
    log(`  ${GREEN}${key}${RESET}${key.length < 12 ? " ".repeat(12 - key.length) : " "} ${tmpl.description}${plugins}`);
  }

  log("");
  log(`${BOLD}  Deployment configs:${RESET}`);
  log("");

  for (const dt of DEPLOY_TEMPLATES) {
    log(`  ${GREEN}deploy/${dt.file}${RESET}  ${DIM}${dt.description}${RESET}`);
  }

  log("");
  log(`  Usage: ${DIM}sigil create my-site --template website${RESET}`);
  log(`         ${DIM}sigil create my-site --deploy docker${RESET}`);
  log("");
}

// ---------------------------------------------------------------------------
// Deployment file helpers
// ---------------------------------------------------------------------------

type DeployPreset = "docker" | "gcp" | "fly" | "railway" | "all";

const DEPLOY_PRESETS: Record<DeployPreset, string[]> = {
  docker:  ["docker-compose.yml", "Dockerfile"],
  gcp:     ["Dockerfile", "gcp/cloudbuild.yaml"],
  fly:     ["Dockerfile", "fly.toml"],
  railway: ["Dockerfile", "railway.json"],
  all:     ["docker-compose.yml", "Dockerfile", "gcp/cloudbuild.yaml", "fly.toml", "railway.json"],
};

function copyDeployFiles(
  templatesDir: string,
  targetDir: string,
  preset: DeployPreset,
  replacements: Record<string, string>,
): void {
  const files = DEPLOY_PRESETS[preset];
  if (!files) {
    error(`Unknown deploy preset: ${preset}. Valid: ${Object.keys(DEPLOY_PRESETS).join(", ")}`);
    process.exit(1);
  }

  const deploySource = path.join(templatesDir, "deploy");

  for (const file of files) {
    const srcPath = path.join(deploySource, file);
    if (!fs.existsSync(srcPath)) {
      warn(`Deploy file not found: deploy/${file} — skipping`);
      continue;
    }

    const destPath = path.join(targetDir, file);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });

    let content = fs.readFileSync(srcPath, "utf-8");
    for (const [placeholder, value] of Object.entries(replacements)) {
      content = content.replaceAll(placeholder, value);
    }
    fs.writeFileSync(destPath, content, "utf-8");
    log(`  ${GREEN}+${RESET} ${file}`);
  }
}

// ---------------------------------------------------------------------------
// Derive a human-friendly site name from the project directory name
// ---------------------------------------------------------------------------

function toSiteName(projectName: string): string {
  return projectName
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Command definition
// ---------------------------------------------------------------------------

export const createCommand = new Command("create")
  .description("Scaffold a new Sigil CMS project")
  .argument("[project-name]", "Name for the new project directory")
  .option("-t, --template <template>", "Project template (blank, website, portfolio, docs, ecommerce)", "blank")
  .option("-l, --list-templates", "List available templates and exit")
  .option("--deploy <preset>", "Include deployment config (docker, gcp, fly, railway, all)")
  .option("--no-git", "Skip git initialization")
  .option("--no-install", "Skip npm install after scaffolding")
  .action((projectName: string | undefined, options: {
    template: string;
    listTemplates?: boolean;
    deploy?: string;
    git: boolean;
    install: boolean;
  }) => {
    // -----------------------------------------------------------------------
    // --list-templates: just print and exit
    // -----------------------------------------------------------------------
    if (options.listTemplates) {
      printTemplateList();
      return;
    }

    // -----------------------------------------------------------------------
    // Require project name
    // -----------------------------------------------------------------------
    if (!projectName) {
      banner();
      error("Project name is required.");
      log("");
      log(`  Usage: ${DIM}sigil create <project-name> [--template <name>]${RESET}`);
      log(`         ${DIM}sigil create --list-templates${RESET}`);
      log("");
      process.exit(1);
    }

    // -----------------------------------------------------------------------
    // Validate template name
    // -----------------------------------------------------------------------
    const templateKey = options.template.toLowerCase();
    if (!TEMPLATES[templateKey]) {
      error(`Unknown template: "${options.template}"`);
      log("");
      log(`  Available templates: ${Object.keys(TEMPLATES).join(", ")}`);
      log(`  Run ${DIM}sigil create --list-templates${RESET} for details.`);
      log("");
      process.exit(1);
    }

    banner();

    const targetDir = path.resolve(process.cwd(), projectName);
    const templatesDir = getTemplatesDir();
    const templateDir = path.join(templatesDir, templateKey);

    // -----------------------------------------------------------------------
    // Pre-flight checks
    // -----------------------------------------------------------------------
    if (fs.existsSync(targetDir)) {
      error(`Directory "${projectName}" already exists.`);
      process.exit(1);
    }

    if (!fs.existsSync(templateDir)) {
      error(`Template directory not found at ${templateDir}`);
      error("This is a CLI packaging issue — the templates directory was not included in the build.");
      process.exit(1);
    }

    // -----------------------------------------------------------------------
    // Scaffold
    // -----------------------------------------------------------------------
    const tmpl = TEMPLATES[templateKey];
    const siteName = toSiteName(projectName);
    const replacements: Record<string, string> = {
      "{{PROJECT_NAME}}": projectName,
      "{{SITE_NAME}}": siteName,
    };

    info(`Creating Sigil project: ${BOLD}${projectName}${RESET}`);
    log(`  Template:  ${GREEN}${templateKey}${RESET} — ${tmpl.description}`);
    if (tmpl.plugins.length > 0) {
      log(`  Plugins:   ${tmpl.plugins.map((p) => `${SIGIL_BLUE}${p}${RESET}`).join(", ")}`);
    }
    log("");

    // Create project directory
    fs.mkdirSync(targetDir, { recursive: true });

    // Copy template files with placeholder replacement
    copyTemplateDir(templateDir, targetDir, replacements);

    // Ensure common directories exist even if the template doesn't have them
    for (const dir of ["src", "public"]) {
      const dirPath = path.join(targetDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }

    // -----------------------------------------------------------------------
    // Deploy files (optional)
    // -----------------------------------------------------------------------
    if (options.deploy) {
      log("");
      info("Adding deployment configuration...");
      log("");
      copyDeployFiles(templatesDir, targetDir, options.deploy as DeployPreset, replacements);
    }

    // -----------------------------------------------------------------------
    // Git init (unless --no-git)
    // -----------------------------------------------------------------------
    if (options.git) {
      try {
        const { execSync } = require("node:child_process");
        execSync("git init", { cwd: targetDir, stdio: "ignore" });
        log("");
        info("Initialized git repository.");
      } catch {
        warn("Could not initialize git repository.");
      }
    }

    // -----------------------------------------------------------------------
    // Done
    // -----------------------------------------------------------------------
    log("");
    success("Project scaffolded.");
    log("");
    log(`${BOLD}  Next steps:${RESET}`);
    log("");
    log(`  ${DIM}$${RESET} cd ${projectName}`);
    log(`  ${DIM}$${RESET} cp .env.example .env   ${DIM}# configure your database${RESET}`);

    if (options.install) {
      log(`  ${DIM}$${RESET} npm install`);
    }

    log(`  ${DIM}$${RESET} sigil migrate           ${DIM}# set up database schema${RESET}`);
    log(`  ${DIM}$${RESET} sigil seed              ${DIM}# optional: load demo content${RESET}`);
    log(`  ${DIM}$${RESET} sigil dev               ${DIM}# start development server${RESET}`);

    if (templateKey === "ecommerce") {
      log("");
      log(`  ${YELLOW}Stripe:${RESET} Set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY in .env`);
    }

    if (options.deploy) {
      log("");
      log(`  ${SIGIL_BLUE}Deploy:${RESET} Deployment files added. See the relevant config for next steps.`);
    }

    log("");
  });
