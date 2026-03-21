import { Command } from "commander";
import { banner, info, success, warn, error, log, requireProject, execLive, DIM, RESET } from "../utils";

export const migrateCommand = new Command("migrate")
  .description("Run database migrations")
  .option("--generate", "Generate a new migration from schema changes")
  .option("--push", "Push schema directly to database (development only)")
  .option("--status", "Show migration status")
  .action((options: { generate?: boolean; push?: boolean; status?: boolean }) => {
    const root = requireProject();
    banner();

    if (options.generate) {
      info("Generating migration from schema diff...");
      log("");

      try {
        execLive("npx drizzle-kit generate", root);
        success("Migration generated. Check ./drizzle/ for the new migration file.");
      } catch {
        error("Migration generation failed.");
        process.exit(1);
      }
      return;
    }

    if (options.status) {
      info("Checking migration status...");
      log("");

      try {
        execLive("npx drizzle-kit check", root);
      } catch {
        warn("Could not determine migration status.");
      }
      return;
    }

    if (options.push) {
      warn("Using --push to apply schema directly (skips migration files).");
      log(`  ${DIM}This is fine for development but use migrations for production.${RESET}`);
      log("");

      try {
        execLive("npx drizzle-kit push", root);
        success("Schema pushed to database.");
      } catch {
        error("Schema push failed. Check your DATABASE_URL.");
        process.exit(1);
      }
      return;
    }

    // Default: run pending migrations
    info("Running pending database migrations...");
    log("");

    try {
      execLive("npx drizzle-kit migrate", root);
      success("All migrations applied.");
    } catch {
      error("Migration failed. Check the errors above and your DATABASE_URL.");
      process.exit(1);
    }
  });
