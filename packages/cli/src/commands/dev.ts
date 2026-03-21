import { Command } from "commander";
import { banner, info, log, requireProject, execLive, DIM, RESET, BOLD, SIGIL_BLUE } from "../utils";

export const devCommand = new Command("dev")
  .description("Start Sigil development server with hot reload")
  .option("-p, --port <port>", "Port to listen on", "3000")
  .option("-H, --host <host>", "Host to bind to", "0.0.0.0")
  .action((options: { port: string; host: string }) => {
    const root = requireProject();
    banner();

    const port = options.port;
    const host = options.host;

    info("Starting Sigil development server...");
    log("");
    log(`  ${SIGIL_BLUE}>${RESET} ${BOLD}Local${RESET}:   http://localhost:${port}`);
    log(`  ${SIGIL_BLUE}>${RESET} ${BOLD}Admin${RESET}:   http://localhost:${port}/admin`);
    log(`  ${SIGIL_BLUE}>${RESET} ${BOLD}API${RESET}:     http://localhost:${port}/api`);
    log("");
    log(`  ${DIM}Watching for changes...${RESET}`);
    log("");

    try {
      execLive(
        `npx tsx watch --clear-screen=false src/index.ts`,
        root
      );
    } catch {
      // User killed the process (Ctrl+C) — exit cleanly
      process.exit(0);
    }
  });
