import { Command } from "commander";
import * as fs from "node:fs";
import * as path from "node:path";
import { banner, log, info, warn, exec, findProjectRoot, BOLD, DIM, GREEN, YELLOW, RED, RESET } from "../utils";

function getNodeVersion(): string {
  return process.version;
}

function getSigilVersion(): string {
  return "0.1.0";
}

function getPackageVersion(root: string, pkg: string): string | null {
  try {
    const pkgJsonPath = path.join(root, "node_modules", pkg, "package.json");
    if (fs.existsSync(pkgJsonPath)) {
      const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
      return pkgJson.version ?? null;
    }
  } catch {
    // ignore
  }
  return null;
}

function checkDatabaseUrl(): { configured: boolean; provider: string } {
  const dbUrl = process.env.DATABASE_URL ?? "";
  if (!dbUrl) return { configured: false, provider: "none" };

  if (dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://")) {
    return { configured: true, provider: "PostgreSQL" };
  }
  if (dbUrl.startsWith("mysql://")) {
    return { configured: true, provider: "MySQL" };
  }
  if (dbUrl.includes("sqlite")) {
    return { configured: true, provider: "SQLite" };
  }
  return { configured: true, provider: "unknown" };
}

export const infoCommand = new Command("info")
  .description("Show Sigil environment information")
  .action(() => {
    banner();

    const root = findProjectRoot();

    log(`${BOLD}  Environment${RESET}`);
    log("");
    log(`  Node.js:        ${getNodeVersion()}`);
    log(`  Sigil CLI:      ${getSigilVersion()}`);
    log(`  Platform:       ${process.platform} (${process.arch})`);
    log(`  Working Dir:    ${process.cwd()}`);
    log("");

    if (root) {
      log(`${BOLD}  Project${RESET}`);
      log("");
      log(`  Root:           ${root}`);

      // Read project package.json
      const pkgPath = path.join(root, "package.json");
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
          log(`  Name:           ${pkg.name ?? "unnamed"}`);
          log(`  Version:        ${pkg.version ?? "0.0.0"}`);
        } catch {
          // ignore
        }
      }

      // Check installed Sigil packages
      const sigilPackages = [
        "@sigil-cms/core",
        "@sigil-cms/client",
        "@sigil-cms/db",
        "@sigil-cms/ui",
      ];
      log("");
      log(`${BOLD}  Packages${RESET}`);
      log("");
      for (const pkg of sigilPackages) {
        const version = getPackageVersion(root, pkg);
        if (version) {
          log(`  ${pkg}: ${GREEN}${version}${RESET}`);
        } else {
          log(`  ${pkg}: ${DIM}not installed${RESET}`);
        }
      }

      // Check config
      log("");
      log(`${BOLD}  Configuration${RESET}`);
      log("");
      const hasConfigTs = fs.existsSync(path.join(root, "sigil.config.ts"));
      const hasConfigJs = fs.existsSync(path.join(root, "sigil.config.js"));
      log(`  Config file:    ${hasConfigTs ? "sigil.config.ts" : hasConfigJs ? "sigil.config.js" : `${RED}not found${RESET}`}`);

      const hasEnv = fs.existsSync(path.join(root, ".env"));
      log(`  .env file:      ${hasEnv ? `${GREEN}present${RESET}` : `${YELLOW}missing${RESET} (copy .env.example)`}`);
    } else {
      info("Not inside a Sigil project. Run 'sigil create <name>' to start one.");
    }

    // Database
    log("");
    log(`${BOLD}  Database${RESET}`);
    log("");
    const db = checkDatabaseUrl();
    if (db.configured) {
      log(`  Provider:       ${db.provider}`);
      log(`  DATABASE_URL:   ${GREEN}configured${RESET}`);
    } else {
      log(`  DATABASE_URL:   ${YELLOW}not set${RESET}`);
    }

    log("");
  });
