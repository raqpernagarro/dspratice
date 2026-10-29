import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { parseRuleSections } from '@/lib/rules/markdown';
import type { Rule } from '@/lib/rules/types';

/**
 * Knowledge layer — the single read path into DS-Ngr's own sources.
 *
 * Docs pages, the MCP server and the in-site chat all read through here, so
 * every surface describes the design system from the same files the library
 * is built from. Nothing in this module is hand-maintained content.
 */

export const REPO_ROOT = path.resolve(process.cwd(), '..');

const readRepoFile = (rel: string): string | null => {
  // Traced explicitly via outputFileTracingIncludes in next.config.ts.
  const abs = path.join(/*turbopackIgnore: true*/ REPO_ROOT, rel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
};

// ─── ds-index.json ───────────────────────────────────────────────────────────

export type Tier = 'atom' | 'molecule' | 'organism';

/** One prop, as declared in the component's TypeScript props type. */
export interface IndexProp {
  /** The declared type as written in source, e.g. "TagVariant" or "(value: string) => void". */
  type: string;
  required: boolean;
  /** Allowed values when the type is a union of string literals. */
  values?: string[];
}

export interface IndexComponent {
  tier: Tier;
  path: string;
  export: string;
  /** Values of the `variant` prop (empty when there is none). */
  variants: string[];
  /** Values of the `size` prop (empty when there is none). */
  sizes: string[];
  booleanProps: string[];
  /** Name of the exported props type, or null when props come from the call signature. */
  propsType: string | null;
  /** Whether the props type declares `children`. */
  acceptsChildren: boolean;
  /** Set when some props come from external types (React DOM attributes) and are not listed in `props`. */
  inheritsExternalProps?: true;
  tokens: string[];
  spec: string | null;
  notes: string;
  /** Set on sub-parts of a compound component (e.g. CommandItem → Command). */
  parent?: string;
  /** Every prop declared in the design system's own source, keyed by name. */
  props: Record<string, IndexProp>;
}

export interface IndexPattern {
  spec: string;
  usedFor: string;
  assembly: string[];
  antiPatterns: string[];
}

interface DsIndex {
  meta: {
    version: string;
    generated: string;
    gitCommit: string;
    storybook: string;
    figma: string;
    publicComponentCount: number;
  };
  rules: Record<string, string>;
  components: Record<string, IndexComponent>;
  patterns: Record<string, IndexPattern>;
  relationships: { exclusionRules?: string[] };
}

let indexCache: DsIndex | null = null;

export const getIndex = (): DsIndex => {
  if (!indexCache) {
    const raw = readRepoFile('ds-index.json');
    if (!raw) throw new Error('ds-index.json missing — run `npm run index:generate`.');
    indexCache = JSON.parse(raw) as DsIndex;
  }
  return indexCache;
};

/** Published library version from the root package.json. */
export const getLibraryVersion = (): string =>
  JSON.parse(readRepoFile('package.json') ?? '{}').version ?? '0.0.0';

export const toSlug = (name: string): string =>
  name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/** React export name → human label (`AspectRatio` → `Aspect Ratio`). Matches Storybook title segments. */
export const componentLabel = (exportName: string): string =>
  exportName
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');

/** The `title` of a story file's `meta` object — not a `title:` field in its sample data. */
const metaTitle = (source: string): string | undefined =>
  source.match(/^const meta\b[^=]*=\s*\{[\s\S]*?^ {2}title:\s*['"]([^'"]+)['"]/m)?.[1];

/** Last segment of the co-located story meta title — never the built Storybook index (it can lag source). */
const storyTitleLabel = (componentPath: string, exportName: string): string | null => {
  const dir = path.join(/*turbopackIgnore: true*/ REPO_ROOT, componentPath);
  if (!fs.existsSync(dir)) return null;
  const stories = fs.readdirSync(dir).filter((f) => f.endsWith('.stories.tsx'));
  const primary = `${exportName}.stories.tsx`;
  const files = stories.includes(primary) ? [primary, ...stories.filter((f) => f !== primary)] : stories;
  for (const file of files) {
    const source = fs.readFileSync(path.join(dir, file), 'utf8');
    // A folder can hold sibling exports (Avatar + AvatarGroup); only a story about this export names it.
    if (source.match(/^ {2}component:\s*(\w+)/m)?.[1] !== exportName) continue;
    const title = metaTitle(source);
    const segment = title?.split('/').pop();
    if (!segment) continue;
    // Stale or shorthand titles still joined — normalize to spaced Title Case.
    if (!segment.includes(' ') && /[a-z][A-Z]/.test(segment)) return componentLabel(exportName);
    return segment;
  }
  return null;
};

export interface ComponentEntry extends IndexComponent {
  name: string;
  /** Spaced Title Case for UI; `name` stays the library export. */
  label: string;
  slug: string;
  /** Sub-part exports documented on this component's page. */
  parts: string[];
}

/** One entry per component; compound sub-parts fold into their parent's `parts`. */
export const listComponents = (): ComponentEntry[] => {
  const all = Object.entries(getIndex().components);
  return all
    .filter(([, c]) => !c.parent)
    .map(([name, c]) => ({
      ...c,
      name,
      label: storyTitleLabel(c.path, name) ?? componentLabel(name),
      slug: toSlug(name),
      parts: all.filter(([, p]) => p.parent === name).map(([n]) => n),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const getComponent = (slug: string): ComponentEntry | undefined => {
  const entry = listComponents().find((c) => c.slug === slug);
  if (entry) return entry;
  // Per-chart doc URLs (e.g. /components/area-chart) → family hub; stories switch the type.
  const chartChild = Object.entries(getIndex().components).some(
    ([name, c]) => c.parent === 'Charts' && toSlug(name) === slug,
  );
  return chartChild ? listComponents().find((c) => c.name === 'Charts') : undefined;
};

export const TIERS: { tier: Tier; label: string }[] = [
  { tier: 'atom', label: 'Atoms' },
  { tier: 'molecule', label: 'Molecules' },
  { tier: 'organism', label: 'Organisms' },
];

export const getRules = () => getIndex().rules;
export const getExclusionRules = () => getIndex().relationships.exclusionRules ?? [];

export const listPatterns = () =>
  Object.entries(getIndex().patterns).map(([slug, p]) => ({ ...p, slug, title: patternTitle(slug) }));

/** 'data-page' → 'Data page'. */
const patternTitle = (slug: string) => {
  const words = slug.replace(/-/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
};

// ─── Page templates ──────────────────────────────────────────────────────────

export interface TemplateEntry {
  slug: string;
  title: string;
  category: string;
  description: string;
  /** Pattern spec slug this template implements, when there is one. */
  pattern?: string;
}

/** templates/index.json — the manifest of runnable page templates. */
export const listTemplates = (): TemplateEntry[] => JSON.parse(readRepoFile('templates/index.json') ?? '[]');

/** JSX source of a template, in the prototype dialect (see templates/README.md). */
export const readTemplate = (slug: string): string | null =>
  /^[a-z0-9-]+$/.test(slug) ? readRepoFile(`templates/${slug}.jsx`) : null;

// ─── Markdown sources ────────────────────────────────────────────────────────

export const readSpec = (rel: string | null): string | null => (rel ? readRepoFile(rel) : null);

/** Lead paragraph of a spec — mirrors src/docs/stripSpecTitle.ts#extractSpecLead. */
export const specLead = (raw: string | null): string => {
  if (!raw) return '';
  const body = raw.replace(/^#\s.+\n+/, '');
  const whatItIs = body.match(/## What it is\s*\n+([\s\S]*?)(?=\n## |\n---\s*\n## |$)/);
  if (whatItIs) return whatItIs[1].trim();
  for (const block of body.trimStart().split(/\n\n+/)) {
    const text = block.trim();
    if (text && !text.startsWith('#') && !text.startsWith('**') && text !== '---' && !text.startsWith('>')) {
      return text;
    }
  }
  return '';
};

/** Drops Jekyll `{% raw %}` guards, HTML comments and the leading `# Title` (the page renders its own h1). */
export const stripTitle = (raw: string): string =>
  raw
    .replace(/\{%-?\s*(?:end)?raw\s*-?%\}\n?/g, '')
    .replace(/<!--[\s\S]*?-->\n?/g, '')
    .trimStart()
    .replace(/^#\s.+\n+/, '');

export interface Guide {
  slug: string;
  title: string;
  source: string;
  description: string;
}

/** Long-form docs exposed under /guides. Order is display order. */
export const GUIDES: Guide[] = [
  { slug: 'ai-rules', title: 'AI usage rules', source: 'AI.md', description: 'Full component usage specs, layout rules and navigation patterns for agents.' },
  { slug: 'ai-short', title: 'AI quick reference', source: 'AI-short.md', description: 'The condensed rule set to paste into any AI tool.' },
  { slug: 'foundations', title: 'Foundations', source: 'specs/foundations/foundations.md', description: 'Principles behind the system.' },
  { slug: 'colors', title: 'Colour', source: 'specs/foundations/colors.md', description: 'Colour roles and usage.' },
  { slug: 'typography', title: 'Typography', source: 'specs/foundations/typography.md', description: 'Type scale and usage.' },
  { slug: 'spacing', title: 'Spacing', source: 'specs/foundations/spacing.md', description: 'Spacing scale and layout rhythm.' },
  { slug: 'figma-sync', title: 'Design ↔ code sync', source: 'specs/foundations/figma-sync.md', description: 'Pull tokens from Figma, push themes back with Send to Figma.' },
];

export const getGuide = (slug: string) => {
  const guide = GUIDES.find((g) => g.slug === slug);
  if (!guide) return null;
  const raw = readRepoFile(guide.source);
  return raw ? { ...guide, body: stripTitle(raw) } : null;
};

// ─── Agent skills (skills/<command>/SKILL.md) ─────────────────────────────

export interface Skill {
  /** Directory name — also the slash command (`/ds-patrol`). */
  slug: string;
  /** Frontmatter `name`, the runtime skill id (may differ from the slug). */
  name: string;
  /** First sentence of the description: what the skill does. */
  summary: string;
  /** The description up to its trigger phrases ("Use when…", "Triggers on…"). */
  about: string;
  /** Full frontmatter description, including its triggers. */
  description: string;
  source: string;
}

const SKILLS_DIR = 'skills';

const parseSkill = (slug: string, raw: string) => {
  const fm = /^---\n([\s\S]*?)\n---\n?/.exec(raw);
  const meta: Record<string, string> = {};
  for (const line of fm?.[1].split('\n') ?? []) {
    const m = /^(\w+):\s*(.*)$/.exec(line);
    if (m) meta[m[1]] = m[2].replace(/^(["'])(.*)\1$/, '$2');
  }
  const description = meta.description ?? '';
  const skill: Skill = {
    slug,
    name: meta.name ?? slug,
    summary: /^(.+?\.)\s+[A-Z]/.exec(description)?.[1] ?? description,
    about: description.split(/\s+(?=(?:Use (?:when|this)|Triggers? (?:on|when)|Also trigger)\b)/)[0],
    description,
    source: `${SKILLS_DIR}/${slug}/SKILL.md`,
  };
  return { skill, body: stripTitle(fm ? raw.slice(fm[0].length) : raw) };
};

/** Every agent skill shipped in the repo, alphabetical by command. */
export const listSkills = (): Skill[] => {
  const dir = path.join(/*turbopackIgnore: true*/ REPO_ROOT, SKILLS_DIR);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
    .flatMap((slug) => {
      const raw = readRepoFile(`${SKILLS_DIR}/${slug}/SKILL.md`);
      return raw ? [parseSkill(slug, raw).skill] : [];
    });
};

export const getSkill = (slug: string) => {
  if (!/^[\w-]+$/.test(slug)) return null;
  const raw = readRepoFile(`${SKILLS_DIR}/${slug}/SKILL.md`);
  if (!raw) return null;
  const { skill, body } = parseSkill(slug, raw);
  return { ...skill, body };
};

// ─── Tokens ──────────────────────────────────────────────────────────────────

export type TokenLayer = 'semantic' | 'component';

export interface TokenGroup {
  layer: TokenLayer;
  /** Semantic: the tier (`font`, `z-index`) or `color-<aspect>`. Component: the component name. */
  family: string;
  tokens: { name: string; value: string }[];
}

/**
 * Semantic and component tokens parsed from tokens.css, grouped by layer as
 * `Design Tokens/vocabulary.json` defines them: semantic families in tier order
 * (colour split by aspect), then one family per component. Swatches render with
 * var(--name) so they follow the active theme; `value` is the light-mode declaration.
 */
export const getSemanticTokens = (): TokenGroup[] => {
  const css = readRepoFile('tokens.css') ?? '';
  const vocab = JSON.parse(readRepoFile('Design Tokens/vocabulary.json') ?? '{}');
  const tiers: string[] = Object.keys(vocab.tiers ?? {});
  const colorAspects: string[] = vocab.tiers?.color?.aspects ?? [];
  // Longest first, so `section-header` wins over a shorter prefix.
  const components: string[] = [...(vocab.layers?.component?.components ?? [])].sort((a, b) => b.length - a.length);

  const seen = new Map<string, string>();
  for (const m of css.matchAll(/^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);/gim)) {
    const [, name, value] = m;
    if (name.startsWith('--primitive-')) continue;
    if (!seen.has(name)) seen.set(name, value.trim());
  }

  const has = (bare: string, prefix: string) => bare === prefix || bare.startsWith(`${prefix}-`);
  const groups = new Map<string, TokenGroup>();
  for (const [name, value] of seen) {
    const bare = name.slice(2);
    const tier = tiers.find((t) => has(bare, t));
    let layer: TokenLayer = 'semantic';
    let family: string;
    if (tier === 'color') family = `color-${bare.split('-')[1]}`;
    else if (tier) family = tier;
    else {
      layer = 'component';
      family = components.find((c) => has(bare, c)) ?? bare.split('-')[0];
    }
    if (!groups.has(family)) groups.set(family, { layer, family, tokens: [] });
    groups.get(family)!.tokens.push({ name, value });
  }

  const rank = (g: TokenGroup) => {
    if (g.layer === 'component') return [1, 0, 0] as const;
    const [tier, aspect] = g.family.startsWith('color-') ? ['color', g.family.slice(6)] : [g.family, ''];
    const a = colorAspects.indexOf(aspect);
    return [0, tiers.indexOf(tier), a < 0 ? 99 : a] as const;
  };
  return [...groups.values()].sort((x, y) => {
    const [a, b] = [rank(x), rank(y)];
    return a[0] - b[0] || a[1] - b[1] || a[2] - b[2] || x.family.localeCompare(y.family);
  });
};

let tokenNameCache: Set<string> | null = null;

/** Every custom property declared in tokens.css, primitives included. */
export const getTokenNames = (): Set<string> => {
  if (tokenNameCache) return tokenNameCache;
  const css = readRepoFile('tokens.css') ?? '';
  tokenNameCache = new Set([...css.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gim)].map((m) => m[1]));
  return tokenNameCache;
};

export interface TokenDeclarations {
  light: Map<string, string>;
  dark: Map<string, string>;
}

let declCache: TokenDeclarations | null = null;

/**
 * Raw declarations per mode, as tokens.css cascades them: `:root` and
 * `[data-theme="light"]` make light; dark is light overlaid with every
 * `[data-theme="dark"]` block. @media blocks (reduced motion) are skipped.
 */
export const getTokenDeclarations = (): TokenDeclarations => {
  if (declCache) return declCache;
  const css = (readRepoFile('tokens.css') ?? '').replace(/\/\*[\s\S]*?\*\//g, '');
  const light = new Map<string, string>();
  const darkOnly = new Map<string, string>();
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i);
    if (open === -1) break;
    const selector = css.slice(i, open).trim().split(/[;}]/).pop()!.trim();
    let depth = 1;
    let j = open + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') depth--;
      j++;
    }
    const body = css.slice(open + 1, j - 1);
    if (!selector.startsWith('@')) {
      const target = /\[data-theme="dark"\]/.test(selector) ? darkOnly : /:root|\[data-theme="light"\]/.test(selector) ? light : null;
      for (const m of body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) target?.set(m[1], m[2].trim());
    }
    i = j;
  }
  declCache = { light, dark: new Map([...light, ...darkOnly]) };
  return declCache;
};

export const isPrimitiveToken =(name: string) => name.startsWith('--primitive-');

// ─── Storybook ───────────────────────────────────────────────────────────────

interface StoryEntry {
  id: string;
  title: string;
  name: string;
  importPath: string;
  type: 'story' | 'docs';
}

let storyCache: StoryEntry[] | null = null;

const loadStories = (): StoryEntry[] => {
  if (storyCache) return storyCache;
  // Prefer the repo Storybook build (`npm run build-storybook`) over the older copy under site/public.
  const raw = readRepoFile('storybook-static/index.json') ?? readRepoFile('site/public/storybook/index.json');
  storyCache = raw ? (Object.values(JSON.parse(raw).entries) as StoryEntry[]) : [];
  return storyCache;
};

const dedicatedStoriesFile = (componentPath: string, exportName: string) =>
  fs.existsSync(path.join(/*turbopackIgnore: true*/ REPO_ROOT, componentPath, `${exportName}.stories.tsx`));

/** Default `storybook dev` port — used when NEXT_PUBLIC_STORYBOOK_URL points at a stale/wrong local port. */
const STORYBOOK_DEV_PORT = 6006;

const storiesIn = (entries: StoryEntry[], componentPath: string) =>
  entries.filter((s) => s.type === 'story' && s.importPath.replace(/^\.\//, '').startsWith(`${componentPath}/`));

/** Basename of the `.stories.tsx` file (e.g. `AvatarGroup` from `…/AvatarGroup.stories.tsx`). */
const storyExportFromPath = (importPath: string) => importPath.match(/\/([^/]+)\.stories\.tsx$/)?.[1];

/**
 * One folder can export several components (Avatar + AvatarGroup). Each export's doc page
 * should embed only stories from `<ExportName>.stories.tsx` when that file exists.
 */
const storiesForExport = (entries: StoryEntry[], componentPath: string, exportName: string) => {
  const inFolder = storiesIn(entries, componentPath);
  const dedicated = inFolder.filter((s) => storyExportFromPath(s.importPath) === exportName);
  if (dedicated.length) return dedicated;
  // Avatar + AvatarGroup share a folder — never show sibling stories on a dedicated export page.
  if (dedicatedStoriesFile(componentPath, exportName)) return dedicated;
  return inFolder;
};

/** Stories whose source file lives in the component's folder (from the built Storybook index). */
export const getStoriesFor = (componentPath: string, exportName?: string) =>
  exportName ? storiesForExport(loadStories(), componentPath, exportName) : storiesIn(loadStories(), componentPath);

const storyEntriesFromIndexJson = (raw: string): StoryEntry[] => {
  if (!raw.trimStart().startsWith('{')) {
    throw new Error('Storybook index is not JSON');
  }
  return Object.values((JSON.parse(raw) as { entries: Record<string, StoryEntry> }).entries);
};

const filterStoriesForComponent = (entries: StoryEntry[], componentPath: string, exportName?: string) =>
  exportName ? storiesForExport(entries, componentPath, exportName) : storiesIn(entries, componentPath);

/** Absolute base URL used to fetch `/index.json` for the Storybook we embed (server-side). */
const storybookIndexBaseUrl = (storybookUrl: string): string => {
  if (storybookUrl.startsWith('http://') || storybookUrl.startsWith('https://')) return storybookUrl.replace(/\/$/, '');
  const origin = process.env.NEXT_PUBLIC_SITE_ORIGIN?.replace(/\/$/, '') ?? 'http://127.0.0.1:3100';
  return `${origin}${storybookUrl.startsWith('/') ? storybookUrl : `/${storybookUrl}`}`.replace(/\/$/, '');
};

const bundledStorybookReady = () =>
  fs.existsSync(path.join(/*turbopackIgnore: true*/ REPO_ROOT, 'site/public/storybook/index.html'));

/** Local Storybook URLs to probe — configured port first, then the default dev port. */
const localStorybookCandidates = (configured: string): string[] => {
  const urls = [configured.replace(/\/$/, '')];
  try {
    const u = new URL(configured);
    if ((u.hostname === 'localhost' || u.hostname === '127.0.0.1') && u.port !== String(STORYBOOK_DEV_PORT)) {
      const alt = new URL(configured);
      alt.port = String(STORYBOOK_DEV_PORT);
      urls.push(alt.origin);
    }
  } catch {
    /* relative or invalid — keep configured only */
  }
  return [...new Set(urls)];
};

const fetchStorybookEntries = async (storybookUrl: string): Promise<StoryEntry[]> => {
  const base = storybookIndexBaseUrl(storybookUrl);
  const res = await fetch(`${base}/index.json`, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return storyEntriesFromIndexJson(await res.text());
};

export interface StorybookPreview {
  /** Base URL for the iframe — must match the Storybook that owns `stories` ids. */
  storybookUrl: string;
  stories: StoryEntry[];
}

/**
 * Story list and embed base URL for the docs playground. The iframe always loads from
 * `storybookUrl`; story ids come from the same Storybook when it is reachable, otherwise
 * from the repo snapshot (`storybook-static` / `site/public/storybook`).
 */
export const resolveStorybookPreview = async (
  componentPath: string,
  exportName?: string,
): Promise<StorybookPreview> => {
  const configured = getStorybookUrl();

  if (configured === '/storybook') {
    return { storybookUrl: configured, stories: getStoriesFor(componentPath, exportName) };
  }

  const candidates = /localhost|127\.0\.0\.1/.test(configured)
    ? localStorybookCandidates(configured)
    : [configured.replace(/\/$/, '')];

  for (const url of candidates) {
    try {
      const entries = await fetchStorybookEntries(url);
      return {
        storybookUrl: url,
        stories: filterStoriesForComponent(entries, componentPath, exportName),
      };
    } catch {
      /* try next candidate */
    }
  }

  if (/localhost|127\.0\.0\.1/.test(configured) && bundledStorybookReady()) {
    return { storybookUrl: '/storybook', stories: getStoriesFor(componentPath, exportName) };
  }

  if (/localhost|127\.0\.0\.1/.test(configured)) {
    return { storybookUrl: configured.replace(/\/$/, ''), stories: getStoriesFor(componentPath, exportName) };
  }

  return { storybookUrl: configured.replace(/\/$/, ''), stories: [] };
};

/** @deprecated Prefer `resolveStorybookPreview` so the iframe URL matches the story index. */
export const getLiveStoriesFor = async (componentPath: string, exportName?: string): Promise<StoryEntry[]> =>
  (await resolveStorybookPreview(componentPath, exportName)).stories;

/** Prefer `Playground`; fall back to legacy `Default` on older published Storybook builds. */
export const pickPrimaryStory = (stories: StoryEntry[]): StoryEntry | undefined =>
  stories.find((s) => s.id.endsWith('--playground'))
  ?? stories.find((s) => s.id.endsWith('--default'))
  ?? stories[0];

/** Order stories for the docs playground: primary first, then the rest in index order. */
export const orderStoriesForPlayground = (stories: StoryEntry[]): StoryEntry[] => {
  const primary = pickPrimaryStory(stories);
  if (!primary) return stories;
  return [primary, ...stories.filter((s) => s !== primary)];
};

export interface ComponentGroup {
  group: string;
  items: (ComponentEntry & { storyOrder: number })[];
}

const UNGROUPED = 'Other';

/** Sidebar group from the story file itself — covers components newer than the built Storybook. */
const groupFromStorySource = (componentPath: string): string | null => {
  const dir = path.join(/*turbopackIgnore: true*/ REPO_ROOT, componentPath);
  if (!fs.existsSync(dir)) return null;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.stories.tsx'))) {
    const title = metaTitle(fs.readFileSync(path.join(dir, file), 'utf8'));
    if (title) return title.split('/')[0];
  }
  return null;
};

/**
 * Components grouped and ordered exactly as the Storybook sidebar shows them:
 * the group is the first segment of the component's story title, and both
 * groups and items follow index.json order (already sorted by storySort).
 * Components missing from the built Storybook take the group from their story
 * file's title; those without stories fall into a trailing "Other" group.
 */
export const listComponentGroups = (): ComponentGroup[] => {
  const entries = loadStories();
  const stories = entries.filter((s) => s.type === 'story');
  // Group rank = first appearance of any entry (docs included), as the sidebar does.
  const groupRank = new Map<string, number>();
  entries.forEach((e, i) => {
    const g = e.title.split('/')[0];
    if (!groupRank.has(g)) groupRank.set(g, i);
  });

  const groups = new Map<string, ComponentGroup['items']>();
  for (const c of listComponents()) {
    const idx = stories.findIndex((s) => s.importPath.replace(/^\.\//, '').startsWith(`${c.path}/`));
    // Source title first: the built index lags renames (e.g. `Forms/…` → `Inputs & Controls/…`).
    const group = groupFromStorySource(c.path) ?? (idx === -1 ? UNGROUPED : stories[idx].title.split('/')[0]);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push({ ...c, storyOrder: idx === -1 ? Number.MAX_SAFE_INTEGER : idx });
  }

  const rank = (g: string) => groupRank.get(g) ?? Number.MAX_SAFE_INTEGER;
  return [...groups.entries()]
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([group, items]) => ({
      group,
      items: items.sort((a, b) => a.storyOrder - b.storyOrder || a.name.localeCompare(b.name)),
    }));
};

export const groupAnchor = (group: string) => group.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const getComponentGroup = (slug: string): string =>
  listComponentGroups().find((g) => g.items.some((c) => c.slug === slug))?.group ?? UNGROUPED;

/**
 * Base URL of the Storybook to link to and embed. Prefers an explicit override,
 * then the copy built into this deployment (`build:full`), then the published
 * Storybook in ds-index meta, which redeploys on every push to main. In dev the
 * built-in copy is skipped: it is a snapshot that goes stale as components change.
 */
export const getStorybookUrl = (): string => {
  if (process.env.NEXT_PUBLIC_STORYBOOK_URL) return process.env.NEXT_PUBLIC_STORYBOOK_URL.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.join(/*turbopackIgnore: true*/ REPO_ROOT, 'site/public/storybook/index.html'))) return '/storybook';
  return getIndex().meta.storybook.replace(/\/$/, '');
};

// ─── Props (for agents) ──────────────────────────────────────────────────────

/** `export interface X {…}` / `export type X = …;` blocks by name, brace-matched. */
const extractDecl = (src: string, name: string): string | null => {
  const start = src.search(new RegExp(`(?:export\\s+)?(?:interface\\s+${name}\\b|type\\s+${name}\\s*=)`));
  if (start === -1) return null;
  const isInterface = /^(?:export\s+)?interface/.test(src.slice(start));
  let i = src.indexOf(isInterface ? '{' : '=', start);
  if (src[i] === '=') {
    // type alias: runs to the first semicolon at brace depth 0
    let depth = 0;
    for (let j = i; j < src.length; j++) {
      const ch = src[j];
      if (ch === '{' || ch === '(' || ch === '<') depth++;
      else if (ch === '}' || ch === ')' || ch === '>') depth--;
      else if (ch === ';' && depth <= 0) return src.slice(start, j + 1);
    }
    return null;
  }
  let depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return src.slice(start, i + 1);
  }
  return null;
};

let commonTypes: string | null = null;

/**
 * The component's TypeScript props declaration, plus the shared types it names
 * (one level, from its own folder or src/types/common.ts). This is the ground
 * truth for prop names and docs; ds-index.json `props` carries the parsed shape.
 */
export const getPropsSource = (entry: { path: string }, name: string): string | null => {
  const dir = path.join(/*turbopackIgnore: true*/ REPO_ROOT, entry.path);
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => /\.tsx?$/.test(f) && !/\.(stories|test|spec)\./.test(f));
  const sources = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8'));
  commonTypes ??= readRepoFile('src/types/common.ts') ?? '';
  const find = (n: string) => sources.map((s) => extractDecl(s, n)).find(Boolean) ?? extractDecl(commonTypes!, n);
  const props = find(`${name}Props`);
  if (!props) return null;
  const referenced = [...new Set(props.match(/\b[A-Z][A-Za-z0-9]+\b/g) ?? [])].filter((n) => n !== `${name}Props` && !/^(React|ReactNode|HTMLAttributes|CSSProperties|Record|Partial|Omit|Pick|Array|Promise)$/.test(n));
  const extras = referenced.map(find).filter((d): d is string => !!d && d.length < 2500);
  return [props, ...extras].join('\n\n');
};

/** The condensed rule set (AI-short.md) agents should follow. */
export const getUsageGuide = (): string => stripTitle(readRepoFile('AI-short.md') ?? '');

// ─── Usage rules (AI.md) ─────────────────────────────────────────────────────

/** Every DS-Ngr component export name, for rule pickers and checks. */
export const getComponentNames = (): Set<string> => new Set(Object.keys(getIndex().components));

let coreRulesCache: Rule[] | null = null;

/** The numbered rules in AI.md (NAV-01, LCB-11, …) as structured data, read-only. */
export const getCoreRules = (): Rule[] => {
  if (!coreRulesCache) coreRulesCache = parseRuleSections(readRepoFile('AI.md') ?? '');
  return coreRulesCache;
};

/** After AI.md changes on disk (dev-only rule apply). */
export const invalidateCoreRules = () => {
  coreRulesCache = null;
};
