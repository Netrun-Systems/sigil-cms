import { Command } from "commander";
import * as fs from "node:fs";
import * as path from "node:path";
import { banner, info, error, log, requireProject, execLive, BOLD, SIGIL_BLUE, RESET } from "../utils";

export const startCommand = new Command("start")
  .description("Start Sigil production server")
  .option("-p, --port <port>", "Port to listen on", "3000")
  .action((options: { port: string }) => {
    const root = requireProject();
    banner();

    const entrypoint = path.join(root, "dist", "index.js");
    if (!fs.existsSync(entrypoint)) {
      error("No production build found at ./dist/index.js");
      error("Run 'sigil build' first.");
      process.exit(1);
    }

    const port = options.port;

    info("Starting Sigil production server...");
    log("");
    log(`  ${SIGIL_BLUE}>${RESET} ${BOLD}Server${RESET}: http://0.0.0.0:${port}`);
    log(`  ${SIGIL_BLUE}>${RESET} ${BOLD}Mode${RESET}:   production`);
    log("");

    try {
      execLive(`node dist/index.js`, root);
    } catch {
      process.exit(0);
    }
  });
