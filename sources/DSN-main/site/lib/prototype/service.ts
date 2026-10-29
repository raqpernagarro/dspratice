import 'server-only';
import { getComponentNames, getCoreRules, getIndex, getTokenNames } from '@/lib/ds-knowledge';
import { lintRule, normalizeRule } from '@/lib/rules/lint';
import { nextRuleId, type Rule } from '@/lib/rules/types';
import { compileComponent, isLucideIcon } from './compile';
import { validateOverride } from './customize';
import { compilePrototype, kitNamesUsed, kitSnapshot, sortIssues } from './index';
import { getKitStore, getStore, hashToken, newEditToken, newId, publicRecord, tokenMatches, type KitRecord, type PrototypeRecord } from './store';
import type { Issue, KitComponent, KitOverride } from './ir';
import { resolveThemeRef, type ResolvedTheme } from './theme';
import { validate } from './validate';

/**
 * Prototype and team-kit operations, shared by the REST routes, the MCP
 * server and (later) the in-site chat. Throws ServiceError with an HTTP status.
 */

export class ServiceError extends Error {
  constructor(public status: number, message: string, public issues?: Issue[]) {
    super(message);
  }
}

export const MAX_SOURCE_CHARS = 200_000;
const MAX_KIT_ITEMS = 100;
export const KIT_RULE_PREFIX = 'KIT';
const now = () => new Date().toISOString();

// ─── Themes ──────────────────────────────────────────────────────────────────

/** Theme for a write: explicit ref wins, then the kit's theme, then Nagarro. */
export function themeFor(ref: string | null | undefined, brand: string | null | undefined, kit: KitRecord | null): ResolvedTheme {
  const source = ref ?? (kit ? (kit.brandsParam ? `brands=${kit.brandsParam}` : kit.themeQuery) : '');
  const theme = resolveThemeRef(source, brand ?? null);
  if (!theme) throw new ServiceError(400, 'Theme not recognised. Pass a configurator settings query (brand=…&font=…), a /brands share URL, or the "Edit:" URL from a theme.css.');
  return theme;
}

// ─── Prototypes ──────────────────────────────────────────────────────────────

export interface PrototypeInput {
  source: string;
  title?: string;
  theme?: string | null;
  brand?: string | null;
  kitId?: string | null;
}

export const prototypeLinks = (origin: string, id: string) => ({
  url: `${origin}/p/${id}`,
  liveUrl: `${origin}/p/${id}?live`,
});

async function loadKit(kitId: string | null | undefined): Promise<KitRecord | null> {
  if (!kitId) return null;
  const kit = await getKitStore().get(kitId);
  if (!kit) throw new ServiceError(404, `Team kit ${kitId} not found.`);
  return kit;
}

function compileOrThrow(source: string, kit: KitRecord | null) {
  if (source.length > MAX_SOURCE_CHARS) throw new ServiceError(413, 'Source too large.');
  const result = compilePrototype(source, kit);
  if (!result.ok || !result.root) throw new ServiceError(422, 'Source could not be compiled.', result.issues);
  return result as typeof result & { root: NonNullable<typeof result.root> };
}

export async function createPrototype(input: PrototypeInput, origin: string) {
  const kit = await loadKit(input.kitId);
  const theme = themeFor(input.theme, input.brand, kit);
  const result = compileOrThrow(input.source, kit);
  const editToken = newEditToken();
  const record: PrototypeRecord = {
    id: newId(),
    title: input.title?.slice(0, 120) || 'Untitled prototype',
    source: input.source,
    root: result.root,
    issues: result.issues,
    version: 1,
    themeQuery: theme.query,
    ...(theme.brandsParam && { brandsParam: theme.brandsParam }),
    ...(result.kit && { kit: result.kit }),
    editKeyHash: hashToken(editToken),
    createdAt: now(),
    updatedAt: now(),
  };
  await getStore().put(record);
  return { id: record.id, ...prototypeLinks(origin, record.id), version: 1, editToken, theme: theme.label, issues: record.issues };
}

export async function updatePrototype(id: string, editToken: string | null, input: Partial<PrototypeInput>, origin: string) {
  const store = getStore();
  const record = await store.get(id);
  if (!record) throw new ServiceError(404, 'Prototype not found.');
  if (!tokenMatches(editToken, record.editKeyHash)) throw new ServiceError(403, 'Invalid edit token.');

  const kitId = input.kitId === undefined ? record.kit?.id : input.kitId;
  const kit = await loadKit(kitId);
  const themeChanged = input.theme !== undefined || input.brand !== undefined;
  const theme = themeChanged
    ? themeFor(input.theme ?? (record.brandsParam ? `brands=${record.brandsParam}` : record.themeQuery), input.brand, kit)
    : null;
  const source = input.source ?? record.source;
  const result = compileOrThrow(source, kit);
  const next: PrototypeRecord = {
    ...record,
    title: input.title?.slice(0, 120) || record.title,
    source,
    root: result.root,
    issues: result.issues,
    kit: result.kit,
    ...(theme && { themeQuery: theme.query, brandsParam: theme.brandsParam }),
    version: record.version + 1,
    updatedAt: now(),
  };
  await store.put(next);
  return { id, ...prototypeLinks(origin, id), version: next.version, issues: next.issues };
}

/**
 * For live canvases: changed when the prototype or its team kit moved past the
 * versions the client has. Kit components come from the current kit, so a live
 * canvas follows kit edits; plain links keep the snapshot taken at save.
 */
export async function pollPrototype(id: string, since: number, kitSince: number) {
  const record = publicRecord(await getStoreRecord(id));
  const kit = record.kit ? await getKitStore().get(record.kit.id) : null;
  const kitVersion = kit?.version ?? record.kit?.version ?? 0;
  if (since && since >= record.version && kitSince >= kitVersion) return { changed: false as const, version: record.version, kitVersion };
  const liveKit = kit ? kitSnapshot(kit, kitNamesUsed(record.root, kit)) : record.kit;
  return { changed: true as const, ...record, kit: liveKit, kitVersion };
}

async function getStoreRecord(id: string) {
  const record = await getStore().get(id);
  if (!record) throw new ServiceError(404, 'Prototype not found.');
  return record;
}

/** A prototype's public record. Private ones need the edit token (agents have no viewer cookie). */
export async function getPrototype(id: string, editToken: string | null = null) {
  const record = await getStore().get(id);
  if (!record) throw new ServiceError(404, 'Prototype not found.');
  if (record.access?.visibility === 'private' && !tokenMatches(editToken, record.editKeyHash)) {
    throw new ServiceError(403, 'This prototype is private. Pass its editToken to read it.');
  }
  return publicRecord(record);
}

// ─── Team kits ───────────────────────────────────────────────────────────────

const NAME_RE = /^[A-Z][A-Za-z0-9]{1,48}$/;

/** Why `name` can't be a kit component, or null when it can. */
export function kitNameProblem(name: string | null | undefined): string | null {
  if (!name || !NAME_RE.test(name)) return 'Component names are PascalCase, e.g. ProjectCard.';
  if (getIndex().components[name] || isLucideIcon(name)) {
    return `"${name}" is already a DS-Ngr component or Lucide icon — pick a team-specific name (e.g. Team${name}).`;
  }
  return null;
}

export async function createKit(input: { name: string; theme?: string | null; brand?: string | null }, origin: string) {
  const theme = themeFor(input.theme, input.brand, null);
  const editToken = newEditToken();
  const kit: KitRecord = {
    id: newId(),
    name: input.name.trim().slice(0, 60) || 'Team kit',
    themeQuery: theme.query,
    ...(theme.brandsParam && { brandsParam: theme.brandsParam }),
    components: [],
    patterns: [],
    version: 1,
    editKeyHash: hashToken(editToken),
    createdAt: now(),
    updatedAt: now(),
  };
  await getKitStore().put(kit);
  return { id: kit.id, editToken, ...kitLinks(origin, kit.id, editToken) };
}

export const kitLinks = (origin: string, id: string, editToken?: string) => ({
  pageUrl: `${origin}/prototype/kits/${id}`,
  mcpUrl: `${origin}/api/mcp?kit=${id}`,
  ...(editToken && { mcpEditUrl: `${origin}/api/mcp?kit=${id}&key=${encodeURIComponent(editToken)}` }),
});

export async function getKit(id: string) {
  const kit = await getKitStore().get(id);
  if (!kit) throw new ServiceError(404, 'Team kit not found.');
  return kit;
}

async function editableKit(id: string, editToken: string | null) {
  const kit = await getKit(id);
  if (!tokenMatches(editToken, kit.editKeyHash)) throw new ServiceError(403, 'This connection can read the kit but not edit it — use the kit edit link.');
  return kit;
}

/** Every cycle through kit components (A uses B uses A) is an error: it could never finish rendering. */
function findCycle(components: KitComponent[]): string[] | null {
  const byName = new Map(components.map((c) => [c.name, c]));
  const direct = new Map(components.map((c) => [c.name, directKitRefs(c.fn)]));
  const state = new Map<string, 'open' | 'done'>();
  const stack: string[] = [];
  const dfs = (name: string): string[] | null => {
    if (state.get(name) === 'done') return null;
    if (state.get(name) === 'open') return [...stack.slice(stack.indexOf(name)), name];
    state.set(name, 'open');
    stack.push(name);
    for (const next of direct.get(name) ?? []) {
      if (!byName.has(next)) continue;
      const cycle = dfs(next);
      if (cycle) return cycle;
    }
    stack.pop();
    state.set(name, 'done');
    return null;
  };
  for (const c of components) {
    const cycle = dfs(c.name);
    if (cycle) return cycle;
  }
  return null;
}

function directKitRefs(e: unknown, out = new Set<string>()): Set<string> {
  if (!e || typeof e !== 'object') return out;
  if (Array.isArray(e)) {
    e.forEach((x) => directKitRefs(x, out));
    return out;
  }
  const node = e as { k?: string; type?: { ns: string; name: string } };
  if ((node.k === 'el' || node.k === 'comp') && node.type?.ns === 'kit') out.add(node.type.name);
  Object.values(e).forEach((x) => directKitRefs(x, out));
  return out;
}

export async function saveKitComponent(kitId: string, editToken: string | null, input: { name?: string; description: string; source: string }) {
  const kit = await editableKit(kitId, editToken);
  if (input.source.length > MAX_SOURCE_CHARS) throw new ServiceError(413, 'Source too large.');
  const others = kit.components.filter((c) => c.name !== input.name);
  // Its own name must be in scope, so self-reference compiles and is caught as a cycle below.
  const scope = others.map((c) => c.name);
  let compiled = compileComponent(input.source, { kitNames: [...scope, ...(input.name ? [input.name] : [])] });
  const name = input.name ?? compiled.name;
  if (!input.name && name) {
    const named = others.filter((c) => c.name !== name);
    compiled = compileComponent(input.source, { kitNames: [...named.map((c) => c.name), name] });
  }
  const nameProblem = kitNameProblem(name);
  if (!name || nameProblem) throw new ServiceError(name && NAME_RE.test(name) ? 409 : 400, nameProblem!, compiled.issues);
  if (!compiled.fn) throw new ServiceError(422, 'Component could not be compiled.', compiled.issues);

  const rest = others.filter((c) => c.name !== name);
  const kitScope = Object.fromEntries([...rest.map((c) => [c.name, { params: c.params }] as const), [name, { params: compiled.params }]]);
  const issues = sortIssues([...compiled.issues, ...validate(compiled.fn.body!, { kit: kitScope, component: true })]);
  if (issues.some((i) => i.severity === 'error')) throw new ServiceError(422, `${name} has errors — fix them before saving it to the kit.`, issues);
  const component: KitComponent = { name, description: input.description.slice(0, 500), source: input.source, params: compiled.params, fn: compiled.fn, issues };
  const components = [...rest, component].sort((a, b) => a.name.localeCompare(b.name));
  const cycle = findCycle(components);
  if (cycle) throw new ServiceError(422, `Kit components can't render each other in a loop: ${cycle.join(' → ')}.`);
  if (components.length > MAX_KIT_ITEMS) throw new ServiceError(400, `A kit holds at most ${MAX_KIT_ITEMS} components.`);

  const next = { ...kit, components, version: kit.version + 1, updatedAt: now() };
  await getKitStore().put(next);
  return { kitId, name, params: compiled.params, version: next.version, issues };
}

export async function saveKitPattern(kitId: string, editToken: string | null, input: { name: string; description: string; source: string }) {
  const kit = await editableKit(kitId, editToken);
  const name = input.name.trim().slice(0, 60);
  if (!name) throw new ServiceError(400, 'Pattern name is required.');
  const result = compilePrototype(input.source, kit);
  if (!result.ok) throw new ServiceError(422, 'Pattern example could not be compiled.', result.issues);
  const patterns = [...kit.patterns.filter((p) => p.name !== name), { name, description: input.description.slice(0, 2000), source: input.source }];
  if (patterns.length > MAX_KIT_ITEMS) throw new ServiceError(400, `A kit holds at most ${MAX_KIT_ITEMS} patterns.`);
  const next = { ...kit, patterns, version: kit.version + 1, updatedAt: now() };
  await getKitStore().put(next);
  return { kitId, name, version: next.version, issues: result.issues };
}

/** Add or replace this kit's layer on one DS-Ngr component (component tokens + default props). */
export async function saveKitOverride(
  kitId: string,
  editToken: string | null,
  input: { component: string; tokens?: Record<string, string>; defaults?: Record<string, string | number | boolean>; note?: string },
) {
  const kit = await editableKit(kitId, editToken);
  const tokens = Object.fromEntries(Object.entries(input.tokens ?? {}).map(([k, v]) => [k, String(v).trim()]));
  const defaults = input.defaults ?? {};
  const { issues, changes, affects } = validateOverride({ component: input.component, tokens, defaults });
  if (issues.some((i) => i.severity === 'error')) throw new ServiceError(422, `The ${input.component} customization has errors — fix them before saving.`, issues);
  const overrides = { ...(kit.overrides ?? {}), [input.component]: { tokens, defaults, note: (input.note ?? '').slice(0, 500) } satisfies KitOverride };
  if (Object.keys(overrides).length > MAX_KIT_ITEMS) throw new ServiceError(400, `A kit customizes at most ${MAX_KIT_ITEMS} components.`);
  const next = { ...kit, overrides, version: kit.version + 1, updatedAt: now() };
  await getKitStore().put(next);
  return { kitId, component: input.component, version: next.version, changes, alsoAffects: affects, issues };
}

/**
 * Add a team rule (no `id`) or replace one (`id` of an existing KIT-NN rule).
 * Errors from lintRule block the save; warnings come back for the editor.
 */
export async function saveKitRule(kitId: string, editToken: string | null, input: Partial<Rule>) {
  const kit = await editableKit(kitId, editToken);
  const rules = kit.rules ?? [];
  if (input.id && !rules.some((r) => r.id === input.id)) throw new ServiceError(404, `This kit has no rule ${input.id}.`);
  const id = input.id ?? nextRuleId(KIT_RULE_PREFIX, rules.map((r) => r.id));
  const rule = normalizeRule({ ...input, id });
  const others = rules.filter((r) => r.id !== id);
  const issues = lintRule(rule, { components: getComponentNames(), tokens: getTokenNames(), existing: [...getCoreRules(), ...others] });
  const blocking = issues.filter((i) => i.severity === 'error');
  if (blocking.length) throw new ServiceError(422, blocking.map((i) => i.message).join(' '));
  if (others.length + 1 > MAX_KIT_ITEMS) throw new ServiceError(400, `A kit holds at most ${MAX_KIT_ITEMS} rules.`);
  const next = { ...kit, rules: [...others, rule].sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true })), version: kit.version + 1, updatedAt: now() };
  await getKitStore().put(next);
  return { kitId, rule, version: next.version, issues };
}

export async function removeKitItem(kitId: string, editToken: string | null, kind: 'component' | 'pattern' | 'override' | 'rule', name: string) {
  const kit = await editableKit(kitId, editToken);
  if (kind === 'rule') {
    if (!kit.rules?.some((r) => r.id === name)) throw new ServiceError(404, `This kit has no rule ${name}.`);
    const next = { ...kit, rules: kit.rules.filter((r) => r.id !== name), version: kit.version + 1, updatedAt: now() };
    await getKitStore().put(next);
    return { kitId, removed: name, version: next.version };
  }
  if (kind === 'override') {
    if (!kit.overrides?.[name]) throw new ServiceError(404, `This kit does not customize ${name}.`);
    const { [name]: _, ...overrides } = kit.overrides;
    const next = { ...kit, overrides, version: kit.version + 1, updatedAt: now() };
    await getKitStore().put(next);
    return { kitId, removed: name, version: next.version };
  }
  const next = {
    ...kit,
    components: kind === 'component' ? kit.components.filter((c) => c.name !== name) : kit.components,
    patterns: kind === 'pattern' ? kit.patterns.filter((p) => p.name !== name) : kit.patterns,
  };
  if (next.components.length === kit.components.length && next.patterns.length === kit.patterns.length) {
    throw new ServiceError(404, `No ${kind} named ${name} in this kit.`);
  }
  const users = kind === 'component' ? next.components.filter((c) => directKitRefs(c.fn).has(name)).map((c) => c.name) : [];
  if (users.length) throw new ServiceError(409, `${name} is used by ${users.join(', ')} — remove or update those first.`);
  next.version = kit.version + 1;
  next.updatedAt = now();
  await getKitStore().put(next);
  return { kitId, removed: name, version: next.version };
}

export async function updateKitTheme(kitId: string, editToken: string | null, theme: string, brand?: string | null) {
  const kit = await editableKit(kitId, editToken);
  const resolved = themeFor(theme, brand, null);
  const next = { ...kit, themeQuery: resolved.query, brandsParam: resolved.brandsParam, version: kit.version + 1, updatedAt: now() };
  await getKitStore().put(next);
  return { kitId, theme: resolved.label, version: next.version };
}
