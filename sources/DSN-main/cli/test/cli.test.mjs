import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { main } from '../bin/ds-ngr.mjs';
import { dsBlock, updateAgents } from '../lib/agents.mjs';
import { toPackageName } from '../lib/create.mjs';
import { connectionUrl, writeConfig } from '../lib/mcp.mjs';
import { themeQuery } from '../lib/site.mjs';

// The DS repo root is a valid ds-ngr package folder: ds-index.json, templates/, agents/.
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Runs the CLI in `cwd`, returning what it printed. */
async function run(args, cwd) {
  const prev = process.cwd();
  const log = console.log;
  let out = '';
  console.log = (...a) => (out += `${a.join(' ')}\n`);
  process.chdir(cwd);
  try {
    await main(args);
  } finally {
    process.chdir(prev);
    console.log = log;
  }
  return out;
}

describe('ds-ngr', () => {
  let dir;
  before(() => {
    process.env.DS_NGR_PKG = repo;
    dir = mkdtempSync(path.join(tmpdir(), 'ds-ngr-cli-'));
  });
  after(() => delete process.env.DS_NGR_PKG);

  it('rejects unknown commands and flags', async () => {
    await assert.rejects(main(['nope']), /Unknown command/);
    await assert.rejects(main(['docs', '--nope']), /Usage: ds-ngr docs/);
  });

  it('docs prints props and the spec, matching names case-insensitively', async () => {
    const out = await run(['docs', 'button'], dir);
    assert.match(out, /^Button — atom/);
    assert.match(out, /variant\?\s+"primary"/);
    await assert.rejects(run(['docs', 'NotAComponent'], dir), /No component/);
  });

  it('add copies a template as a named .tsx page and refuses to overwrite', async () => {
    const out = await run(['add', 'dashboard'], dir);
    const page = readFileSync(path.join(dir, 'src/pages/Dashboard.tsx'), 'utf8');
    assert.match(page, /export default function Dashboard\(/);
    assert.match(page, /from 'ds-ngr'/);
    assert.match(out, /import Dashboard from '\.\/pages\/Dashboard'/);
    await assert.rejects(run(['add', 'dashboard'], dir), /already exists/);
  });

  it('agents replaces the managed block and keeps project rules', () => {
    const block = dsBlock('rule A', '1.0.0');
    const withBlock = updateAgents('# App\n\n<!-- ds-ngr:start v0.9 -->\nold\n<!-- ds-ngr:end -->\n\n## Project rules\n- mine\n', block);
    assert.match(withBlock, /rule A/);
    assert.doesNotMatch(withBlock, /old/);
    assert.match(withBlock, /- mine/);
    assert.equal(updateAgents('# App\n', block), `# App\n\n${block}\n`);
    assert.equal(updateAgents('', block), `${block}\n`);
  });

  it('mcp builds the connection URL and merges client config', () => {
    assert.equal(connectionUrl('https://ds.example', {}), 'https://ds.example/api/mcp');
    assert.equal(connectionUrl('https://ds.example', { theme: 'https://ds.example/customize?accent=teal' }), 'https://ds.example/api/mcp?theme=accent%3Dteal');
    assert.equal(connectionUrl('https://ds.example', { kit: 'k1', key: 's' }), 'https://ds.example/api/mcp?kit=k1&key=s');

    writeFileSync(path.join(dir, '.mcp.json'), JSON.stringify({ mcpServers: { other: { url: 'x' } } }));
    writeConfig('claude-code', 'https://ds.example/api/mcp', dir);
    const config = JSON.parse(readFileSync(path.join(dir, '.mcp.json'), 'utf8'));
    assert.deepEqual(config.mcpServers, { other: { url: 'x' }, 'ds-ngr': { type: 'http', url: 'https://ds.example/api/mcp' } });
  });

  it('normalises names and theme links', () => {
    assert.equal(toPackageName('My App!'), 'my-app');
    assert.equal(themeQuery('https://ds.example/customize?a=1&b=2'), 'a=1&b=2');
    assert.equal(themeQuery('?a=1'), 'a=1');
  });
});
