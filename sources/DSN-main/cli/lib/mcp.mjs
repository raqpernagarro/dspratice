import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { siteOrigin, themeQuery, UsageError } from './site.mjs';

export const CLIENTS = ['claude-code', 'cursor', 'vscode', 'claude', 'chatgpt'];

/** Project config file per client, and how the ds-ngr entry sits in it. Mirrors site/components/prototype/ConnectPanel.tsx. */
const FILES = {
  'claude-code': { file: '.mcp.json', key: 'mcpServers', entry: (url) => ({ type: 'http', url }) },
  cursor: { file: '.cursor/mcp.json', key: 'mcpServers', entry: (url) => ({ url }) },
  vscode: { file: '.vscode/mcp.json', key: 'servers', entry: (url) => ({ type: 'http', url }) },
};

export function connectionUrl(origin, flags) {
  const p = new URLSearchParams();
  if (flags.kit) {
    p.set('kit', flags.kit);
    if (flags.key) p.set('key', flags.key);
  } else if (flags.theme) {
    p.set('theme', themeQuery(flags.theme));
  }
  const qs = p.toString();
  return `${origin}/api/mcp${qs ? `?${qs}` : ''}`;
}

/** Adds (or replaces) the ds-ngr server in a client's project config, keeping every other entry. */
export function writeConfig(client, url, cwd = process.cwd()) {
  const { file, key, entry } = FILES[client];
  const target = path.join(cwd, file);
  let config = {};
  if (existsSync(target)) {
    try {
      config = JSON.parse(readFileSync(target, 'utf8'));
    } catch {
      throw new UsageError(`${file} isn't valid JSON; fix it first, then run this again.`);
    }
  }
  config[key] = { ...(config[key] ?? {}), 'ds-ngr': entry(url) };
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(config, null, 2)}\n`);
  return file;
}

/** `ds-ngr mcp` — the setup for connecting an AI client to the DS-Ngr MCP server. */
export function mcp(_positionals, flags) {
  const client = flags.client ?? 'claude-code';
  if (!CLIENTS.includes(client)) throw new UsageError(`Unknown client "${client}". Pick one of: ${CLIENTS.join(', ')}.`);
  const url = connectionUrl(siteOrigin(flags.site), flags);

  if (client === 'claude' || client === 'chatgpt') {
    const where = client === 'claude' ? 'Settings → Connectors → Add custom connector' : 'Settings → Apps & Connectors → Advanced → Developer mode → Create';
    console.log(`${where}, then paste:\n\n  ${url}\n`);
    return;
  }

  if (flags.write) {
    const file = writeConfig(client, url);
    console.log(`Wrote the ds-ngr server to ${file}. Restart ${client === 'claude-code' ? 'Claude Code' : client === 'cursor' ? 'Cursor' : 'VS Code'} (or reload MCP servers) to pick it up.`);
    return;
  }

  if (client === 'claude-code') {
    console.log(`claude mcp add --transport http ds-ngr "${url}"\n`);
    console.log('Or run `ds-ngr mcp --write` to add it to .mcp.json for everyone on this project.');
    return;
  }
  const { file, key, entry } = FILES[client];
  console.log(`Add to ${file}:\n\n${JSON.stringify({ [key]: { 'ds-ngr': entry(url) } }, null, 2)}\n`);
  console.log(`Or run \`ds-ngr mcp --client ${client} --write\`.`);
}
