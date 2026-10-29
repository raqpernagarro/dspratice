#!/usr/bin/env node
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { add } from '../lib/add.mjs';
import { agents } from '../lib/agents.mjs';
import { create } from '../lib/create.mjs';
import { docs } from '../lib/docs.mjs';
import { mcp } from '../lib/mcp.mjs';
import { UsageError } from '../lib/site.mjs';

const site = { site: { type: 'string' } };
const theme = { theme: { type: 'string' } };

/** Each command: its flags (parseArgs options) and a one-line usage. */
export const COMMANDS = {
  create: {
    run: create,
    options: { ...site, ...theme, page: { type: 'string' }, brands: { type: 'string' } },
    usage: 'create [name] [--page blank|dashboard|data-page|form-page] [--theme <configurator link>] [--brands all]',
    summary: 'Scaffold a themed React + Vite app on DS-Ngr',
  },
  add: {
    run: add,
    options: { out: { type: 'string' }, name: { type: 'string' }, force: { type: 'boolean' } },
    usage: 'add [template] [--out src/pages] [--name PageName] [--force]',
    summary: 'Copy a page template into your project (no argument lists them)',
  },
  docs: {
    run: docs,
    options: { ...site, ...theme, json: { type: 'boolean' }, remote: { type: 'boolean' } },
    usage: 'docs [Component] [--json] [--remote]',
    summary: "A component's props and usage rules (no argument lists them)",
  },
  mcp: {
    run: mcp,
    options: { ...site, ...theme, client: { type: 'string' }, kit: { type: 'string' }, key: { type: 'string' }, write: { type: 'boolean' } },
    usage: 'mcp [--client claude-code|cursor|vscode|claude|chatgpt] [--theme <link>] [--kit <id>] [--write]',
    summary: 'Connect your AI client to the DS-Ngr MCP server',
  },
  agents: {
    run: agents,
    options: {},
    usage: 'agents',
    summary: 'Write the installed DS-Ngr rules into AGENTS.md',
  },
};

function help() {
  const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const width = Math.max(...Object.keys(COMMANDS).map((c) => c.length));
  console.log(`ds-ngr ${version} — DS-Ngr from the terminal\n\nUsage: ds-ngr <command> [options]\n`);
  for (const [name, c] of Object.entries(COMMANDS)) console.log(`  ${name.padEnd(width)}  ${c.summary}`);
  console.log('\nRun `ds-ngr <command> --help` for its options. --site <url> (or DS_NGR_SITE) picks the docs site.');
}

export async function main(argv) {
  const [name, ...rest] = argv;
  if (!name || name === '--help' || name === '-h' || name === 'help') return help();
  if (name === '--version' || name === '-v') {
    console.log(JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version);
    return;
  }
  const command = COMMANDS[name];
  if (!command) throw new UsageError(`Unknown command "${name}". Run \`ds-ngr --help\`.`);

  const { values, positionals } = (() => {
    try {
      return parseArgs({ args: rest, options: { ...command.options, help: { type: 'boolean', short: 'h' } }, allowPositionals: true });
    } catch (err) {
      throw new UsageError(`${err.message}\nUsage: ds-ngr ${command.usage}`);
    }
  })();
  if (values.help) {
    console.log(`Usage: ds-ngr ${command.usage}\n\n${command.summary}.`);
    return;
  }
  await command.run(positionals, values);
}

// Run only when executed (directly or through the node_modules/.bin symlink), not when imported by the tests.
const invoked = (() => {
  try {
    return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
})();
if (invoked) {
  main(process.argv.slice(2)).catch((err) => {
    console.error(err instanceof UsageError ? `ds-ngr: ${err.message}` : err);
    process.exit(1);
  });
}
