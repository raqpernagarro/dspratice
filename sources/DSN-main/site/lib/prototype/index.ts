import 'server-only';
import { compile } from './compile';
import type { CompileResult, Expr, Issue, KitSnapshot } from './ir';
import type { KitRecord } from './store';
import { validate } from './validate';

export * from './ir';
export { getStore, getKitStore, newId, newEditToken, hashToken, tokenMatches, publicRecord, type PrototypeRecord, type KitRecord } from './store';

const order = { error: 0, warning: 1, info: 2 };
export const sortIssues = (issues: Issue[]) => issues.sort((a, b) => order[a.severity] - order[b.severity] || (a.line ?? 0) - (b.line ?? 0));

/** Kit component names an expression uses, directly or through other kit components. */
export function kitNamesUsed(root: Expr, kit: KitRecord | null): Set<string> {
  const used = new Set<string>();
  if (!kit) return used;
  const byName = new Map(kit.components.map((c) => [c.name, c]));
  const visit = (e: unknown): void => {
    if (!e || typeof e !== 'object') return;
    if (Array.isArray(e)) return e.forEach(visit);
    const node = e as { k?: string; type?: { ns: string; name: string } };
    if ((node.k === 'el' || node.k === 'comp') && node.type?.ns === 'kit' && !used.has(node.type.name)) {
      used.add(node.type.name);
      visit(byName.get(node.type.name)?.fn);
    }
    Object.values(e).forEach(visit);
  };
  visit(root);
  return used;
}

const hasOverrides = (kit: KitRecord) => Object.keys(kit.overrides ?? {}).length > 0;

export const kitSnapshot = (kit: KitRecord, names: Set<string>): KitSnapshot => ({
  id: kit.id,
  version: kit.version,
  components: Object.fromEntries(kit.components.filter((c) => names.has(c.name)).map((c) => [c.name, { params: c.params, fn: c.fn }])),
  ...(hasOverrides(kit) && {
    overrides: Object.fromEntries(Object.entries(kit.overrides!).map(([name, o]) => [name, { tokens: o.tokens, defaults: o.defaults }])),
  }),
});

/** Parse + validate. `ok` is false only when nothing can be rendered. */
export function compilePrototype(source: string, kit: KitRecord | null = null): CompileResult & { kit?: KitSnapshot } {
  const { root, issues } = compile(source, { kitNames: kit?.components.map((c) => c.name) });
  if (!root) return { ok: false, root: null, issues };
  const checks = validate(root, { kit: kit ? Object.fromEntries(kit.components.map((c) => [c.name, { params: c.params }])) : undefined });
  const used = kitNamesUsed(root, kit);
  return { ok: true, root, issues: sortIssues([...issues, ...checks]), ...(kit && (used.size || hasOverrides(kit)) && { kit: kitSnapshot(kit, used) }) };
}
