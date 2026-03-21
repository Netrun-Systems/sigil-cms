import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

export const SIGIL_BLUE = "\x1b[36m";
export const GREEN = "\x1b[32m";
export const YELLOW = "\x1b[33m";
export const RED = "\x1b[31m";
export const DIM = "\x1b[2m";
export const BOLD = "\x1b[1m";
export const RESET = "\x1b[0m";

export function log(msg: string): void {
  console.log(msg);
}

export function info(msg: string): void {
  console.log(`${SIGIL_BLUE}info${RESET}  ${msg}`);
}

export function success(msg: string): void {
  console.log(`${GREEN}done${RESET}  ${msg}`);
}

export function warn(msg: string): void {
  console.log(`${YELLOW}warn${RESET}  ${msg}`);
}

export function error(msg: string): void {
  console.error(`${RED}error${RESET} ${msg}`);
}

export function banner(): void {
  log("");
  log(`${SIGIL_BLUE}${BOLD}  sigil${RESET} ${DIM}v0.1.0${RESET}`);
  log(`${DIM}  headless CMS, your way${RESET}`);
  log("");
}

export function exec(cmd: string, cwd?: string): string {
  return execSync(cmd, {
    cwd,
    encoding: "utf-8",
    stdio: "pipe",
  }).trim();
}

export function execLive(cmd: string, cwd?: string): void {
  execSync(cmd, {
    cwd,
    stdio: "inherit",
    env: { ...process.env },
  });
}

export function findProjectRoot(): string | null {
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, "sigil.config.ts")) ||
        fs.existsSync(path.join(dir, "sigil.config.js"))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return null;
}

export function requireProject(): string {
  const root = findProjectRoot();
  if (!root) {
    error("No Sigil project found. Run this command from inside a Sigil project directory.");
    error("(Looking for sigil.config.ts or sigil.config.js)");
    process.exit(1);
  }
  return root;
}
