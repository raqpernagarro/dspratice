import { publicRecord } from '@/lib/prototype';
import { getKit, removeKitItem, saveKitComponent, saveKitOverride, saveKitPattern, saveKitRule, updateKitTheme } from '@/lib/prototype/service';
import { handle, readJson, str } from '../../prototypes/shared';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  return handle(async () => publicRecord(await getKit(id)));
}

/**
 * Edit a kit (needs `x-edit-token`). Body is one of:
 * `{ component: { name?, description, source } }`, `{ pattern: { name, description, source } }`,
 * `{ override: { component, tokens?, defaults?, note? } }`,
 * `{ rule: { id?, title, category, appliesTo, description, dos, donts, examples } }` (no id = new rule),
 * `{ remove: { kind: 'component' | 'pattern' | 'override' | 'rule', name } }` (a rule's name is its id), `{ theme, brand? }`.
 */
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await readJson(req);
  if (body instanceof Response) return body;
  const token = req.headers.get('x-edit-token');
  const obj = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : null);
  return handle(async () => {
    const c = obj(body.component);
    if (c) return saveKitComponent(id, token, { name: str(c.name), description: str(c.description) ?? '', source: str(c.source) ?? '' });
    const p = obj(body.pattern);
    if (p) return saveKitPattern(id, token, { name: str(p.name) ?? '', description: str(p.description) ?? '', source: str(p.source) ?? '' });
    const o = obj(body.override);
    if (o) {
      return saveKitOverride(id, token, {
        component: str(o.component) ?? '',
        tokens: (obj(o.tokens) ?? {}) as Record<string, string>,
        defaults: (obj(o.defaults) ?? {}) as Record<string, string | number | boolean>,
        note: str(o.note),
      });
    }
    const rule = obj(body.rule);
    if (rule) return saveKitRule(id, token, { ...rule, id: str(rule.id) });
    const r = obj(body.remove);
    if (r && (r.kind === 'component' || r.kind === 'pattern' || r.kind === 'override' || r.kind === 'rule')) return removeKitItem(id, token, r.kind, str(r.name) ?? '');
    const theme = str(body.theme);
    if (theme !== undefined) return updateKitTheme(id, token, theme, str(body.brand));
    return { error: 'Nothing to do' };
  });
}
