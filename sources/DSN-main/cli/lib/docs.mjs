import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { findPackage, readIndex } from './pkg.mjs';
import { siteOrigin, themeQuery, UsageError } from './site.mjs';

const TIERS = ['atom', 'molecule', 'organism', 'template'];

/** Drops HTML comments and the leading `# Title` — the header above already names the component. */
const stripTitle = (md) => md.replace(/<!--[\s\S]*?-->\n?/g, '').trimStart().replace(/^#\s.+\n+/, '');

function list(index) {
  const byTier = new Map();
  for (const [name, c] of Object.entries(index.components)) {
    if (!byTier.has(c.tier)) byTier.set(c.tier, []);
    byTier.get(c.tier).push(name);
  }
  const order = [...TIERS, ...[...byTier.keys()].filter((t) => !TIERS.includes(t))];
  for (const tier of order) {
    const names = byTier.get(tier);
    if (!names) continue;
    console.log(`${tier}s (${names.length})\n  ${names.sort().join(', ')}\n`);
  }
  console.log('ds-ngr docs <Component> for props and usage rules.');
}

function propsTable(props) {
  const rows = Object.entries(props ?? {}).map(([name, p]) => [
    `${name}${p.required ? '' : '?'}`,
    p.values?.length ? p.values.map((v) => JSON.stringify(v)).join(' | ') : p.type,
  ]);
  const width = Math.max(0, ...rows.map(([n]) => n.length));
  return rows.map(([n, t]) => `  ${n.padEnd(width)}  ${t}`).join('\n');
}

function print(name, c, spec) {
  console.log(`${name} — ${c.tier} · import { ${c.export ?? name} } from 'ds-ngr'\n`);
  if (c.variants?.length) console.log(`Variants: ${c.variants.join(', ')}`);
  if (c.sizes?.length) console.log(`Sizes: ${c.sizes.join(', ')}`);
  if (c.variants?.length || c.sizes?.length) console.log('');
  if (c.props && Object.keys(c.props).length) console.log(`Props (? = optional)\n${propsTable(c.props)}\n`);
  if (spec) console.log(stripTitle(spec).trimEnd());
}

/** One tools/call against the site's stateless MCP endpoint. */
async function remote(name, flags) {
  const origin = siteOrigin(flags.site);
  const q = themeQuery(flags.theme);
  const res = await fetch(`${origin}/api/mcp${q ? `?theme=${encodeURIComponent(q)}` : ''}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'get_component', arguments: { name } } }),
  });
  if (!res.ok) throw new UsageError(`${origin} answered ${res.status}.`);
  const { result, error } = await res.json();
  if (error) throw new UsageError(error.message);
  const text = result?.content?.[0]?.text ?? '';
  if (result?.isError) throw new UsageError(JSON.parse(text).error ?? text);
  return JSON.parse(text);
}

/** `ds-ngr docs [Component]` — props and usage rules, offline from the installed package. */
export async function docs(positionals, flags) {
  const query = positionals[0];
  const pkg = flags.remote ? null : findPackage();

  if (!pkg) {
    if (!query) throw new UsageError('ds-ngr is not installed here. Name a component to look it up on the site: ds-ngr docs <Component>.');
    const data = await remote(query, flags);
    if (flags.json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }
    // get_component (site/lib/mcp/tools.ts): props come as TypeScript source.
    console.log(`${data.name} — ${data.tier ?? data.source} · ${data.import ?? ''}\n`);
    if (data.variants?.length) console.log(`Variants: ${data.variants.join(', ')}`);
    if (data.sizes?.length) console.log(`Sizes: ${data.sizes.join(', ')}`);
    if (typeof data.props === 'string') console.log(`\n${data.props}\n`);
    if (data.spec) console.log(data.spec.trimEnd());
    if (data.docsUrl) console.log(`\n${data.docsUrl}`);
    return;
  }

  const index = readIndex(pkg);
  if (!query) return list(index);

  const name = Object.keys(index.components).find((n) => n.toLowerCase() === query.toLowerCase());
  if (!name) {
    const near = Object.keys(index.components).filter((n) => n.toLowerCase().includes(query.toLowerCase()));
    throw new UsageError(`No component "${query}".${near.length ? ` Did you mean ${near.slice(0, 5).join(', ')}?` : ' Run `ds-ngr docs` to list them.'}`);
  }
  const c = index.components[name];
  const specPath = c.spec && path.join(pkg, c.spec);
  const spec = specPath && existsSync(specPath) ? readFileSync(specPath, 'utf8') : null;

  if (flags.json) console.log(JSON.stringify({ name, ...c, spec }, null, 2));
  else print(name, c, spec);
}
