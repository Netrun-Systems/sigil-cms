import { Command } from "commander";
import { banner, info, success, error, log, requireProject, execLive } from "../utils";

export const buildCommand = new Command("build")
  .description("Build Sigil project for production")
  .action(() => {
    const root = requireProject();
    banner();

    info("Building Sigil project for production...");
    log("");

    try {
      // Build the API server
      info("Compiling TypeScript...");
      execLive("npx tsc --build", root);

      success("Production build complete.");
      log("");
      log("  Output: ./dist/");
      log("  Run with: sigil start");
      log("");
    } catch {
      error("Build failed. Check the errors above.");
      process.exit(1);
    }
  });
