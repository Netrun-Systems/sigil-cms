#!/usr/bin/env node

import { Command } from "commander";
import { createCommand } from "./commands/create";
import { devCommand } from "./commands/dev";
import { buildCommand } from "./commands/build";
import { startCommand } from "./commands/start";
import { migrateCommand } from "./commands/migrate";
import { seedCommand } from "./commands/seed";
import { infoCommand } from "./commands/info";

const VERSION = "0.1.0";

const program = new Command();

program
  .name("sigil")
  .description("Sigil CMS — headless content management, your way")
  .version(VERSION, "-v, --version", "Display the current version");

program.addCommand(createCommand);
program.addCommand(devCommand);
program.addCommand(buildCommand);
program.addCommand(startCommand);
program.addCommand(migrateCommand);
program.addCommand(seedCommand);
program.addCommand(infoCommand);

program.parse();
