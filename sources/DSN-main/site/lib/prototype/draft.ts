import 'server-only';
import { listComponents, readSpec, specLead } from '@/lib/ds-knowledge';
import { compileComponent } from './compile';
import { compilePrototype, sortIssues } from './index';
import type { Expr, Issue, KitComponent, KitSnapshot } from './ir';
import { kitNameProblem } from './service';
import type { KitRecord } from './store';
import { validate } from './validate';

/**
 * Drafting new components: find what already covers a request, and compile
 * candidate kit components (plus a few usage states each) without saving.
 * Backs the "New component" page and the find_similar / propose tools.
 */

// ─── Similar components ──────────────────────────────────────────────────────

export type Verdict = 'use' | 'compose' | 'new';

export interface SimilarComponent {
  name: string;
  source: 'ds-ngr' | 'team-kit';
  summary: string;
  score: number;
  matched: string[];
}

const STOP = new Set('a an and are as at be by for from has in is it of on or that the this to with without component show shows showing list user users item items'.split(' '));

/** Words people use for a thing → words the library uses for it. */
const SYNONYMS: Record<string, string[]> = {
  dropdown: ['select', 'popover', 'menu'],
  picture: ['avatar', 'thumbnail'],
  photo: ['avatar', 'thumbnail'],
  toast: ['callout', 'notification'],
  alert: ['callout', 'dialog'],
  banner: ['callout'],
  dialog: ['modal'],
  popup: ['modal', 'popover'],
  sidebar: ['drawer', 'navbar', 'shell'],
  steps: ['stepper'],
  wizard: ['stepper'],
  pill: ['tag', 'chip', 'badge'],
  label: ['tag', 'badge'],
  status: ['tag', 'badge'],
  toggle: ['switch'],
  tabs: ['tab'],
  grid: ['table'],
  kpi: ['stat'],
  metric: ['stat'],
  upload: ['attachment'],
  file: ['attachment', 'file'],
  search: ['searchbar', 'command'],
  date: ['datetimepicker', 'calendar'],
  progress: ['progressbar', 'progressring', 'loadingbar'],
  empty: ['emptystate'],
};

const words = (text: string) =>
  text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((w) => (w.length > 3 && /[^su]s$/.test(w) ? w.slice(0, -1) : w))
    .filter((w) => w.length > 1 && !STOP.has(w));

export function findSimilarComponents(description: string, kit: KitRecord | null = null, limit = 6): { verdict: Verdict; candidates: SimilarComponent[] } {
  // Each word the user wrote counts once, through itself or any of its synonyms.
  const query = [...new Set(words(description))].map((w) => [w, ...(SYNONYMS[w] ?? [])]);
  const pool = [
    ...(kit?.components ?? []).map((c) => ({ name: c.name, source: 'team-kit' as const, summary: c.description })),
    ...listComponents().map((c) => ({
      name: c.name,
      source: 'ds-ngr' as const,
      summary: specLead(readSpec(c.spec)).slice(0, 240),
      extra: [...c.variants, ...Object.keys(c.props ?? {}), ...c.parts].join(' '),
    })),
  ];
  const scored = pool.map((c) => {
    const nameWords = new Set([...words(c.name), c.name.toLowerCase()]);
    const body = new Set(words(`${c.summary} ${'extra' in c ? c.extra : ''}`));
    const matched: string[] = [];
    let score = 0;
    for (const forms of query) {
      const inName = forms.find((f) => nameWords.has(f));
      const inBody = inName ? undefined : forms.find((f) => body.has(f));
      if (inName) score += 5;
      else if (inBody) score += 1;
      if (inName ?? inBody) matched.push((inName ?? inBody)!);
    }
    return { name: c.name, source: c.source, summary: c.summary, score, matched };
  });
  const candidates = scored.filter((c) => c.score > 0).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).slice(0, limit);
  const [top = 0, second = 0] = candidates.map((c) => c.score);
  // A name match that beats the rest → use it; ties or partial matches → compose; nothing close → new.
  const verdict: Verdict = top >= 5 && top > second ? 'use' : top >= 3 ? 'compose' : 'new';
  return { verdict, candidates };
}

// ─── Draft options ───────────────────────────────────────────────────────────

export interface DraftOptionInput {
  name: string;
  summary: string;
  rationale: string;
  source: string;
  states: { label: string; usage: string }[];
}

export interface DraftState {
  label: string;
  usage: string;
  rendered: boolean;
  issues: Issue[];
}

export interface DraftOption {
  name: string;
  summary: string;
  rationale: string;
  source: string;
  params: string[];
  /** Issues in the component itself; each state carries its own. */
  issues: Issue[];
  states: DraftState[];
  /** Every renderable state stacked with its label — one tree for one preview frame. */
  sheet: { root: Expr; kit?: KitSnapshot } | null;
  errors: number;
  warnings: number;
}

export const sheetSource = (states: { label: string; usage: string }[]) => `<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)', padding: 'var(--space-lg)' }}>
${states
  .map(
    (s) => `<section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
<span style={{ fontSize: 'var(--font-size-label)', color: 'var(--color-foreground-neutral-secondary)' }}>{${JSON.stringify(s.label)}}</span>
${s.usage.trim()}
</section>`,
  )
  .join('\n')}
</div>`;

/** Page-level advice that doesn't apply to a component shown on its own. */
const PAGE_ONLY_RULES = new Set(['no-appshell']);

const count = (issues: Issue[], severity: Issue['severity']) => issues.filter((i) => i.severity === severity).length;

/**
 * Compile one candidate as if it were saved to `kit`, then render each usage
 * state against that temporary kit. Never writes anything.
 */
export function compileDraftOption(input: DraftOptionInput, kit: KitRecord | null = null): DraftOption {
  const others = (kit?.components ?? []).filter((c) => c.name !== input.name);
  const compiled = compileComponent(input.source, { kitNames: [...others.map((c) => c.name), input.name] });
  const issues: Issue[] = [...compiled.issues];
  const nameProblem = kitNameProblem(input.name);
  if (nameProblem) issues.push({ severity: 'error', rule: 'component-name', message: nameProblem });
  if (compiled.name && compiled.name !== input.name) {
    issues.push({ severity: 'error', rule: 'component-name', message: `The function is called ${compiled.name} but the option is named ${input.name} — use one name.` });
  }

  let states: DraftState[] = input.states.map((s) => ({ label: s.label, usage: s.usage, rendered: false, issues: [] }));
  let sheet: DraftOption['sheet'] = null;
  if (compiled.fn) {
    const scope = Object.fromEntries([...others.map((c) => [c.name, { params: c.params }] as const), [input.name, { params: compiled.params }]]);
    issues.push(...validate(compiled.fn.body!, { kit: scope, component: true }));
    const draft: KitComponent = { name: input.name, description: input.summary, source: input.source, params: compiled.params, fn: compiled.fn, issues: [] };
    const temp: KitRecord = {
      id: kit?.id ?? 'draft',
      name: kit?.name ?? 'Draft',
      themeQuery: kit?.themeQuery ?? '',
      components: [...others, draft],
      patterns: [],
      version: kit?.version ?? 0,
      editKeyHash: '',
      createdAt: '',
      updatedAt: '',
    };
    states = input.states.map((s) => {
      const r = compilePrototype(s.usage, temp);
      return { label: s.label, usage: s.usage, rendered: r.ok, issues: r.issues.filter((i) => !PAGE_ONLY_RULES.has(i.rule)) };
    });
    const ok = states.filter((s) => s.rendered && !/^\s*export\b/.test(s.usage));
    if (ok.length) {
      const r = compilePrototype(sheetSource(ok), temp);
      if (r.root) sheet = { root: r.root, ...(r.kit && { kit: r.kit }) };
    }
  }

  const all = [...issues, ...states.flatMap((s) => s.issues)];
  return {
    name: input.name,
    summary: input.summary,
    rationale: input.rationale,
    source: input.source,
    params: compiled.params,
    issues: sortIssues(issues),
    states,
    sheet,
    errors: count(all, 'error') + (compiled.fn ? 0 : 1),
    warnings: count(all, 'warning'),
  };
}

/** What the model needs back: issues to fix, not render trees. */
export const draftForModel = (options: DraftOption[]) => ({
  options: options.map((o) => ({
    name: o.name,
    errors: o.errors,
    warnings: o.warnings,
    issues: o.issues,
    states: o.states.map((s) => ({ label: s.label, rendered: s.rendered, issues: s.issues })),
  })),
  next: options.some((o) => o.errors || o.warnings)
    ? 'Fix every error and warning, then call propose_component_options again with all options.'
    : 'All options are clean and shown to the user. Summarise them in one line each; do not paste code.',
});
