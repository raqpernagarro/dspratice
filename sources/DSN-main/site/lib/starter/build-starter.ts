import 'server-only';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { strToU8, zipSync, type Zippable } from 'fflate';
import { REPO_ROOT } from '@/lib/ds-knowledge';
import { STARTER_PAGES, type StarterPage } from './options';
import { buildTheme, toCss, toDtcg, toMultiCss, toMultiDtcg, type Brand, type ThemeSettings } from '@/lib/theme/theme';

/**
 * Starter pack: a runnable Vite + React app on DS-Ngr, themed with the
 * configurator's settings. Template lives in starter/template/ (repo root);
 * the ds-ngr tarball is packed into site/.starter/ by
 * scripts/build-starter-assets.mjs, the ds-ngr CLI into site/public/cli/ by
 * scripts/build-cli-assets.mjs. Kept free of request handling: /api/starter
 * serves it as a zip, or as JSON files for `ds-ngr create`.
 */

export type StarterOptions = {
  /** npm package name; also the folder name inside the zip. */
  name: string;
  page: StarterPage;
  /** Link back to the configurator with these settings. */
  shareUrl: string;
  theme: { kind: 'single'; settings: ThemeSettings } | { kind: 'multi'; brands: Brand[]; defaultSlug: string };
};

export class StarterUnavailableError extends Error {}

const TEMPLATE_DIR = path.join(/*turbopackIgnore: true*/ REPO_ROOT, 'starter', 'template');
const ASSETS_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), '.starter');
/** The ds-ngr CLI, packed by scripts/build-cli-assets.mjs; also served for `npx <site>/cli/ds-ngr-cli.tgz`. */
const CLI_TGZ = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'cli', 'ds-ngr-cli.tgz');
const PAGES_DIR = 'src/pages/';

const titleFrom = (name: string) => name.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
const initialsFrom = (title: string) => title.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'DS';

async function listFiles(dir: string, base = ''): Promise<string[]> {
  const entries = await readdir(path.join(dir, base), { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((e) => (e.isDirectory() ? listFiles(dir, `${base}${e.name}/`) : Promise.resolve([`${base}${e.name}`]))),
  );
  return nested.flat();
}

async function readManifest(): Promise<{ version: string; tgz: string }> {
  try {
    return JSON.parse(await readFile(path.join(ASSETS_DIR, 'manifest.json'), 'utf8'));
  } catch {
    throw new StarterUnavailableError('The ds-ngr package has not been packed. Run `node scripts/build-starter-assets.mjs`.');
  }
}

function themeFiles(opts: StarterOptions) {
  const { theme, shareUrl } = opts;
  if (theme.kind === 'single') {
    const t = buildTheme(theme.settings);
    return { file: 'theme.css', css: toCss(t, shareUrl), tokens: toDtcg(t), htmlAttrs: '', readme: '', agent: '' };
  }
  const { brands, defaultSlug } = theme;
  const slugs = brands.map((b) => `\`${b.slug}\``).join(', ');
  return {
    file: 'themes.css',
    css: toMultiCss(brands, defaultSlug, shareUrl),
    tokens: toMultiDtcg(brands, defaultSlug),
    htmlAttrs: ` data-brand="${defaultSlug}"`,
    readme: `\n### Brands\n\nThis app ships ${brands.length} brands: ${slugs}. The active one is set by \`data-brand\` on \`<html>\` in \`index.html\` (default: \`${defaultSlug}\`). Change it there, or set it from a server or inline head script so the page doesn't flash the default brand.\n`,
    agent: `- This is a multi-brand theme (${slugs}). The brand is chosen by \`data-brand\` on \`<html>\` only — on inner elements it has no effect. Set it before first paint (server or inline head script).\n`,
  };
}

/**
 * The DS-owned part of the starter's AGENTS.md. Same text and markers
 * `ds-ngr agents` writes (cli/lib/agents.mjs dsBlock), so a fresh pack is already up to date.
 */
async function dsAgentsBlock(version: string) {
  const block = (await readFile(path.join(REPO_ROOT, 'agents', 'AGENTS.ds.md'), 'utf8')).trim();
  return `<!-- ds-ngr:start v${version} — managed by DS-Ngr; \`npx ds-ngr agents\` replaces this block. Put your own rules under "Project rules". -->\n${block}\n<!-- ds-ngr:end -->`;
}

/** Starter file contents keyed by path inside the app folder. */
export type StarterFiles = Record<string, Uint8Array>;

/** Builds the starter's files. Throws StarterUnavailableError when a packed tarball is missing. */
export async function buildStarterFiles(opts: StarterOptions): Promise<StarterFiles> {
  const manifest = await readManifest();
  const tarball = await readFile(path.join(ASSETS_DIR, manifest.tgz)).catch(() => {
    throw new StarterUnavailableError(`Missing ${manifest.tgz} in site/.starter/.`);
  });
  const cli = await readFile(CLI_TGZ).catch(() => {
    throw new StarterUnavailableError('The ds-ngr CLI has not been packed. Run `node scripts/build-cli-assets.mjs`.');
  });
  // Dev only: the tarball is packed before site:dev starts, so token edits made
  // while the server runs would ship a theme the bundled tokens.css ignores.
  if (process.env.NODE_ENV !== 'production') {
    const [tgz, tokens] = await Promise.all([stat(path.join(ASSETS_DIR, manifest.tgz)), stat(path.join(REPO_ROOT, 'tokens.css'))]);
    if (tokens.mtimeMs > tgz.mtimeMs) {
      throw new StarterUnavailableError('tokens.css changed after the starter was packed. Run `node scripts/build-starter-assets.mjs`, then download again.');
    }
  }
  const page = STARTER_PAGES.find((p) => p.value === opts.page) ?? STARTER_PAGES[0];
  const theme = themeFiles(opts);
  const title = titleFrom(opts.name);

  const vars: Record<string, string> = {
    name: opts.name,
    title,
    initials: initialsFrom(title),
    dsVersion: manifest.version,
    dsTarball: manifest.tgz,
    themeFile: theme.file,
    htmlAttrs: theme.htmlAttrs,
    shareUrl: opts.shareUrl,
    pageLabel: page.label,
    themeNotes: theme.readme,
    agentThemeNotes: theme.agent,
    dsAgentsBlock: await dsAgentsBlock(manifest.version),
    cliTarball: 'ds-ngr-cli.tgz',
  };
  const fill = (text: string) => text.replace(/\{\{(\w+)\}\}/g, (m, key: string) => vars[key] ?? m);

  const files: StarterFiles = {};
  for (const rel of await listFiles(TEMPLATE_DIR)) {
    let out = rel;
    if (rel.startsWith(PAGES_DIR)) {
      // Only the chosen page ships, as the app's Home page.
      if (rel !== `${PAGES_DIR}${page.file}`) continue;
      out = `${PAGES_DIR}Home.tsx`;
    }
    // npm strips dotfiles named .gitignore from packages; the template stores it without the dot.
    if (rel === 'gitignore') out = '.gitignore';
    files[out] = strToU8(fill(await readFile(path.join(TEMPLATE_DIR, rel), 'utf8')));
  }
  files[`src/styles/${theme.file}`] = strToU8(theme.css);
  files['theme.tokens.json'] = strToU8(`${JSON.stringify(theme.tokens, null, 2)}\n`);
  files[`vendor/${manifest.tgz}`] = new Uint8Array(tarball);
  files[`vendor/${vars.cliTarball}`] = new Uint8Array(cli);
  return files;
}

/** The starter as a zip with one top-level `<name>/` folder. */
export async function buildStarterZip(opts: StarterOptions): Promise<Uint8Array> {
  const files = await buildStarterFiles(opts);
  const zippable: Zippable = {};
  for (const [rel, data] of Object.entries(files)) {
    // Tarballs are already gzip-compressed — store them as is.
    zippable[`${opts.name}/${rel}`] = rel.endsWith('.tgz') ? [data, { level: 0 }] : data;
  }
  return zipSync(zippable, { level: 6 });
}
