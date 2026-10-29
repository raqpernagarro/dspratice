import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { getIndex, getTokenDeclarations, getTokenNames, isPrimitiveToken, listComponents, REPO_ROOT } from '@/lib/ds-knowledge';
import { sheetSource } from './draft';
import { compilePrototype } from './index';
import type { Expr, Issue, KitOverride, KitSnapshot } from './ir';
import type { KitRecord } from './store';
import { suggest } from './validate';

/**
 * Customizing an existing DS-Ngr component for one person or team: a layer of
 * component-token overrides and default props stored in their kit. The source
 * is never copied, so DS-Ngr fixes keep flowing into the customized component.
 */

/** Token families every component shares; overriding them would restyle everything, not one component. */
const GLOBAL = /^--(color|primitive|font|size|motion|space|shape|z|effect)-/;
/** Props that identify or wire up one instance — never a sensible team default. */
const INSTANCE_PROP = /^(on[A-Z]|aria-|data-)|^(id|key|className|style|children|value|defaultValue|checked|defaultChecked|name|href|src|alt|title|label|ref)$/;
/** Types a default can't be written as (functions, nodes, objects, arrays). */
const COMPLEX_TYPE = /=>|React|Node|Element|\[\]|Record<|\{|Array<|IconSource/;

let tokenMap: Map<string, string[]> | null = null;

/** Component → the component-tier tokens its own CSS reads, from the source tree. */
export function componentTokens(): Map<string, string[]> {
  if (tokenMap) return tokenMap;
  const names = getTokenNames();
  tokenMap = new Map();
  for (const c of listComponents()) {
    const dir = path.join(/*turbopackIgnore: true*/ REPO_ROOT, c.path);
    const found = new Set<string>();
    try {
      for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.css'))) {
        const css = fs.readFileSync(path.join(dir, file), 'utf8');
        for (const m of css.matchAll(/var\(\s*(--[a-z0-9-]+)/g)) if (names.has(m[1]) && !GLOBAL.test(m[1])) found.add(m[1]);
      }
    } catch {
      // No folder (e.g. a re-export) — nothing to customize by token.
    }
    tokenMap.set(c.name, [...found].sort());
  }
  return tokenMap;
}

/** Other components that read `token` too — a change to it reaches them as well. */
export const tokenUsers = (token: string, except?: string) =>
  [...componentTokens()].filter(([name, tokens]) => name !== except && tokens.includes(token)).map(([name]) => name);

/** What can be customized on one component, with current values — for the AI and the UI. */
export function customizable(component: string) {
  const { light, dark } = getTokenDeclarations();
  const props = getIndex().components[component]?.props ?? {};
  return {
    tokens: (componentTokens().get(component) ?? []).map((name) => ({ name, light: light.get(name) ?? null, dark: dark.get(name) ?? null, alsoUsedBy: tokenUsers(name, component) })),
    props: Object.entries(props)
      .filter(([name, p]) => !INSTANCE_PROP.test(name) && !COMPLEX_TYPE.test(p.type))
      .map(([name, p]) => ({ name, type: p.type, ...(p.values && { values: p.values }) })),
  };
}

// ─── Playground ──────────────────────────────────────────────────────────────

/** One control in the customize canvas's props panel. */
export interface PlaygroundProp {
  name: string;
  kind: 'enum' | 'boolean' | 'string' | 'number';
  values?: string[];
  required: boolean;
}

/** What the props panel can drive: plain values only, never handlers, nodes or wiring. */
const PANEL_SKIP = /^(on[A-Z]|aria-|data-)|ClassName$|^(id|key|className|style|children|value|checked|ref|tabIndex|type|name|href|src)$/;

/**
 * The props panel for one component, and whether it sizes to its content
 * (inline: centred as-is) or fills its container (block: given a column).
 */
export function playgroundFor(component: string, initial: Record<string, string | number | boolean>, children: string | null) {
  const entry = getIndex().components[component];
  const props: PlaygroundProp[] = [];
  for (const [name, p] of Object.entries(entry?.props ?? {})) {
    if (PANEL_SKIP.test(name)) continue;
    const kind = p.values?.length ? 'enum' : p.type === 'boolean' ? 'boolean' : p.type === 'string' ? 'string' : p.type === 'number' ? 'number' : null;
    if (kind) props.push({ name, kind, required: p.required, ...(p.values && { values: p.values }) });
  }
  // Variant and size first: they're what people switch between to point at.
  const rank = (n: string) => (n === 'variant' ? 0 : n === 'size' ? 1 : 2);
  props.sort((a, b) => rank(a.name) - rank(b.name));
  return { component, props, initial, children, inline: isInline(component) };
}

const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

function isInline(component: string): boolean {
  const c = listComponents().find((x) => x.name === component);
  if (!c) return false;
  try {
    const css = fs.readFileSync(path.join(/*turbopackIgnore: true*/ REPO_ROOT, c.path, `${component}.css`), 'utf8');
    const root = new RegExp(`\\.dsn-${kebab(component)}\\s*\\{([^}]*)\\}`).exec(css);
    return !!root && /display:\s*inline/.test(root[1]);
  } catch {
    return false;
  }
}

export type Playground = ReturnType<typeof playgroundFor>;

export interface OverrideInput {
  component: string;
  tokens: Record<string, string>;
  defaults: Record<string, string | number | boolean>;
}

export interface OverrideChange {
  kind: 'token' | 'default';
  key: string;
  from: string | null;
  to: string;
}

const REF_RE = /^var\((--[a-z0-9-]+)\)$/;

/** Every rule a team layer must follow. Errors block saving; warnings are advice. */
export function validateOverride(input: OverrideInput): { issues: Issue[]; changes: OverrideChange[]; affects: string[] } {
  const issues: Issue[] = [];
  const changes: OverrideChange[] = [];
  const affects = new Set<string>();
  const add = (severity: Issue['severity'], rule: string, message: string) => issues.push({ severity, rule, message });
  const entry = getIndex().components[input.component];
  if (!entry) {
    const close = suggest(input.component, Object.keys(getIndex().components));
    add('error', 'unknown-component', `No DS-Ngr component named ${input.component}.${close ? ` Did you mean ${close}?` : ''}`);
    return { issues, changes, affects: [] };
  }

  const own = new Set(componentTokens().get(input.component) ?? []);
  const known = getTokenNames();
  const { light } = getTokenDeclarations();
  for (const [token, value] of Object.entries(input.tokens)) {
    if (!own.has(token)) {
      add('error', 'foreign-token', GLOBAL.test(token)
        ? `${token} is a global token — changing it would restyle every component. Change one of ${input.component}'s own tokens instead.`
        : `${input.component} does not read ${token}. Its own tokens: ${[...own].join(', ') || 'none'}.`);
      continue;
    }
    const ref = value.trim().match(REF_RE)?.[1];
    if (!ref) {
      add('error', 'raw-value', `${token}: "${value}" — use a token reference like var(--shape-radius-xl), never a raw value, so themes and dark mode still apply.`);
      continue;
    }
    if (!known.has(ref)) {
      const close = suggest(ref, [...known]);
      add('error', 'unknown-token', `${ref} is not a DS-Ngr token.${close ? ` Did you mean ${close}?` : ''}`);
      continue;
    }
    if (isPrimitiveToken(ref)) add('warning', 'primitive-token', `${token} points at the primitive ${ref}, which ignores the theme and dark mode — prefer a semantic token.`);
    if (/radius/.test(token) && !/radius/.test(ref)) add('warning', 'token-kind', `${token} is a radius but ${ref} is not.`);
    if (/(background|foreground|border)(?!-width)/.test(token) && !/^--(color|button|input|tag|avatar|popover)-/.test(ref)) add('warning', 'token-kind', `${token} is a colour but ${ref} is not.`);
    changes.push({ kind: 'token', key: token, from: light.get(token) ?? null, to: `var(${ref})` });
    tokenUsers(token, input.component).forEach((n) => affects.add(n));
  }

  for (const [prop, value] of Object.entries(input.defaults)) {
    const p = entry.props[prop];
    if (!p) {
      const close = suggest(prop, Object.keys(entry.props));
      add('error', 'unknown-prop', `${input.component} has no prop ${prop}.${close ? ` Did you mean ${close}?` : ''}`);
      continue;
    }
    if (INSTANCE_PROP.test(prop) || COMPLEX_TYPE.test(p.type)) {
      add('error', 'not-a-default', `${prop} belongs to each use of ${input.component}, not to a team default.`);
      continue;
    }
    if (p.values && !p.values.includes(String(value))) {
      add('error', 'bad-value', `${prop} must be one of ${p.values.join(', ')} — got ${JSON.stringify(value)}.`);
      continue;
    }
    if (p.type === 'boolean' && typeof value !== 'boolean') {
      add('error', 'bad-value', `${prop} is true or false — got ${JSON.stringify(value)}.`);
      continue;
    }
    changes.push({ kind: 'default', key: prop, from: null, to: JSON.stringify(value) });
  }

  if (!Object.keys(input.tokens).length && !Object.keys(input.defaults).length) add('error', 'empty', 'Nothing to change — set at least one token or default.');
  return { issues, changes, affects: [...affects].sort() };
}

// ─── Proposals ───────────────────────────────────────────────────────────────

export interface CustomizationOptionInput {
  name: string;
  summary: string;
  tokens: Record<string, string>;
  defaults: Record<string, string | number | boolean>;
}

type Sheet = { root: Expr; kit?: KitSnapshot } | null;

export interface CustomizationOption extends CustomizationOptionInput {
  issues: Issue[];
  changes: OverrideChange[];
  affects: string[];
  after: Sheet;
  errors: number;
  warnings: number;
}

/** `kit` with this component's layer replaced (or removed when `layer` is null). */
const withLayer = (kit: KitRecord | null, component: string, layer: Pick<KitOverride, 'tokens' | 'defaults'> | null): KitRecord => {
  const base: KitRecord = kit ?? { id: 'draft', name: 'Draft', themeQuery: '', components: [], patterns: [], version: 0, editKeyHash: '', createdAt: '', updatedAt: '' };
  const { [component]: _, ...rest } = base.overrides ?? {};
  return { ...base, overrides: layer ? { ...rest, [component]: { ...layer, note: '' } } : rest };
};

const sheet = (samples: { label: string; usage: string }[], kit: KitRecord): Sheet => {
  const r = compilePrototype(sheetSource(samples), kit);
  return r.root ? { root: r.root, ...(r.kit && { kit: r.kit }) } : null;
};

/** Before (DS-Ngr plus the kit's other layers) and one after per option, rendered from the same samples. */
export function proposeCustomization(
  component: string,
  samples: { label: string; usage: string }[],
  options: CustomizationOptionInput[],
  kit: KitRecord | null = null,
) {
  const without = withLayer(kit, component, null);
  const sampleIssues = samples.flatMap((s) => {
    const r = compilePrototype(s.usage, without);
    return r.issues.filter((i) => i.severity !== 'info').map((i) => ({ ...i, message: `Sample "${s.label}": ${i.message}` }));
  });
  return {
    component,
    sampleIssues,
    before: sheet(samples, without),
    options: options.map((o): CustomizationOption => {
      const v = validateOverride({ component, tokens: o.tokens, defaults: o.defaults });
      const after = sheet(samples, withLayer(kit, component, { tokens: o.tokens, defaults: o.defaults }));
      return {
        ...o,
        ...v,
        after,
        errors: v.issues.filter((i) => i.severity === 'error').length,
        warnings: v.issues.filter((i) => i.severity === 'warning').length,
      };
    }),
  };
}

/** What the model reads back: issues and the effective change list, not render trees. */
export const customizationForModel = (out: ReturnType<typeof proposeCustomization>) => ({
  sampleIssues: out.sampleIssues,
  options: out.options.map((o) => ({ name: o.name, errors: o.errors, warnings: o.warnings, issues: o.issues, changes: o.changes, alsoAffects: o.affects })),
  next:
    out.sampleIssues.length || out.options.some((o) => o.errors || o.warnings)
      ? 'Fix every issue (samples and options), then call propose_component_customization again with all options.'
      : 'All options are clean and shown side by side with the original. Summarise each in one line; mention any other components they also affect.',
});
