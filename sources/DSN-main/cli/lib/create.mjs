import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { siteOrigin, themeQuery, UsageError } from './site.mjs';

export const PAGES = ['blank', 'dashboard', 'data-page', 'form-page'];

/** Same rule as site/lib/starter/options.ts toPackageName. */
export function toPackageName(input) {
  const name = String(input).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return name || 'my-dsn-app';
}

async function ask(question, fallback) {
  if (!process.stdin.isTTY) return fallback;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(`${question} (${fallback}) `)).trim() || fallback;
  } finally {
    rl.close();
  }
}

/**
 * `ds-ngr create [name]` — the /customize starter pack, written to ./<name>.
 * The site builds it (GET /api/starter?format=files), so the CLI needs no zip code.
 */
export async function create(positionals, flags) {
  const name = toPackageName(positionals[0] ?? (await ask('App name?', 'my-dsn-app')));
  const page = flags.page ?? (await ask(`Starting page? ${PAGES.join(' | ')}`, 'dashboard'));
  if (!PAGES.includes(page)) throw new UsageError(`Unknown page "${page}". Pick one of: ${PAGES.join(', ')}.`);

  const dir = path.resolve(name);
  if (existsSync(dir) && readdirSync(dir).length) throw new UsageError(`${name}/ already exists and isn't empty.`);

  const origin = siteOrigin(flags.site);
  const q = new URLSearchParams(themeQuery(flags.theme));
  q.set('page', page);
  q.set('name', name);
  q.set('format', 'files');
  if (flags.brands === 'all') q.set('scope', 'all');

  console.log(`Building ${name} from ${origin}…`);
  const res = await fetch(`${origin}/api/starter?${q}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new UsageError(`The site couldn't build the starter (${res.status})${body.error ? `: ${body.error}` : '.'}`);
  }
  const { files } = await res.json();

  for (const [rel, b64] of Object.entries(files)) {
    const out = path.join(dir, rel);
    mkdirSync(path.dirname(out), { recursive: true });
    writeFileSync(out, Buffer.from(b64, 'base64'));
  }

  console.log(`\nCreated ${name}/ (${Object.keys(files).length} files). Next:\n`);
  console.log(`  cd ${name}`);
  console.log('  npm install');
  console.log('  npm run dev\n');
  console.log('Then: npx ds-ngr add <template> · npx ds-ngr docs <Component> · npx ds-ngr mcp');
}
