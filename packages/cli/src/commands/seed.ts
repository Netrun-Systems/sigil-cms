import { Command } from "commander";
import * as fs from "node:fs";
import * as path from "node:path";
import { banner, info, success, warn, log, requireProject, execLive, DIM, RESET } from "../utils";

export const seedCommand = new Command("seed")
  .description("Seed the database with demo content")
  .option("--reset", "Drop existing data before seeding")
  .action((options: { reset?: boolean }) => {
    const root = requireProject();
    banner();

    if (options.reset) {
      warn("Resetting database before seeding...");
      log(`  ${DIM}This will delete all existing content.${RESET}`);
      log("");
    }

    info("Seeding Sigil database with demo content...");
    log("");

    // Look for a seed script in the project
    const seedScript = path.join(root, "seed.ts");
    const seedScriptJs = path.join(root, "seed.js");
    const seedDir = path.join(root, "seeds");

    if (fs.existsSync(seedScript)) {
      try {
        execLive(`npx tsx ${seedScript}`, root);
        success("Seed complete.");
      } catch {
        process.exit(1);
      }
    } else if (fs.existsSync(seedScriptJs)) {
      try {
        execLive(`node ${seedScriptJs}`, root);
        success("Seed complete.");
      } catch {
        process.exit(1);
      }
    } else if (fs.existsSync(seedDir)) {
      try {
        execLive(`npx tsx seeds/index.ts`, root);
        success("Seed complete.");
      } catch {
        process.exit(1);
      }
    } else {
      warn("No seed file found.");
      log("");
      log(`  Create one of the following to define seed data:`);
      log(`    ${DIM}seed.ts${RESET}       - Single seed script`);
      log(`    ${DIM}seeds/index.ts${RESET} - Seed directory with multiple files`);
      log("");
      log(`  Example seed.ts:`);
      log("");
      log(`    ${DIM}import { createSigilClient } from "@sigil-cms/client";${RESET}`);
      log(`    ${DIM}const sigil = createSigilClient({ baseUrl: "http://localhost:3000" });${RESET}`);
      log(`    ${DIM}await sigil.pages.create({ title: "Home", slug: "/", ... });${RESET}`);
      log("");
    }
  });
