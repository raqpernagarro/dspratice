import type { Rule, RuleExample } from '@/lib/rules/types';
import { emptySection, KNOWN_ORDER, SECTION_HEADINGS, type KnownKind, type SpecSection } from '@/lib/spec/types';

/**
 * AI assist for the rule, AI.md and spec editors — mocked. Every answer is
 * built from the input with plain string rules, so the editors can be designed
 * and tested before a model is wired in. /api/assist is the only caller; swap
 * `runAssist` there for a model call that returns the same shapes.
 */

export type AssistRequest =
  | { target: 'rule'; action: string; instruction: string; rule: Rule; components: string[] }
  | { target: 'section'; action: string; instruction: string; section: SpecSection; name: string; props: Record<string, string>; components: string[] }
  | { target: 'spec'; action: string; instruction: string; sections: SpecSection[]; name: string; props: Record<string, string>; components: string[] }
  | { target: 'markdown'; action: string; instruction: string; text: string };

export interface AssistResult<T = unknown> {
  value: T;
  /** One sentence on what changed and why. */
  note: string;
  /** What the suggestion touches, e.g. “Title”, “Don’t (+1)”. Empty = nothing to apply. */
  changes: string[];
}

/** Quick actions each editor offers. Free text goes through `pickAction`. */
export const ASSIST_ACTIONS = {
  rule: [
    { id: 'draft', label: 'Draft from my description' },
    { id: 'tighten', label: 'Tighten wording' },
    { id: 'donts', label: 'Suggest don’ts' },
    { id: 'examples', label: 'Add examples' },
  ],
  markdown: [
    { id: 'tighten', label: 'Tighten wording' },
    { id: 'format', label: 'Fix formatting' },
  ],
  spec: [
    { id: 'draft-empty', label: 'Draft empty sections' },
    { id: 'tighten', label: 'Tighten every section' },
  ],
} as const;

export const sectionActions = (kind: SpecSection['kind']): { id: string; label: string }[] => {
  const draft = { id: 'draft', label: 'Draft this section' };
  const tighten = { id: 'tighten', label: 'Tighten wording' };
  switch (kind) {
    case 'whenNotToUse': return [{ id: 'draft', label: 'Suggest alternatives' }, { id: 'arrows', label: 'Name the alternative on each line' }, tighten];
    case 'props': return [{ id: 'draft', label: 'Add undocumented props' }, tighten];
    case 'mistakes': return [{ id: 'draft', label: 'Derive from “When NOT to use”' }, tighten];
    case 'custom': return [tighten];
    default: return [draft, tighten];
  }
};

/** Maps a typed request onto a quick action, so “make it shorter” behaves like Tighten. */
export function pickAction(action: string, instruction: string, fallback = 'draft'): string {
  if (action && action !== 'custom') return action;
  const s = instruction.toLowerCase();
  if (/example|snippet|code/.test(s)) return 'examples';
  if (/don'?t|avoid|never|anti/.test(s)) return 'donts';
  if (/format|markdown|bullet|heading/.test(s)) return 'format';
  if (/short|tight|concise|clear|simplif|rewrite|wording|typo/.test(s)) return 'tighten';
  if (/alternative|instead|→|arrow/.test(s)) return 'arrows';
  if (/empty|fill|missing|all sections/.test(s)) return 'draft-empty';
  return fallback;
}

export function runAssist(req: AssistRequest): AssistResult {
  switch (req.target) {
    case 'rule': return assistRule(req);
    case 'section': return assistSection(req);
    case 'spec': return assistSpec(req);
    case 'markdown': return assistMarkdown(req);
  }
}

// ── Text helpers ────────────────────────────────────────────────────────────

const FILLER = /\b(please|really|very|just|basically|actually|simply|quite|in order)\s+/gi;

/** Drops filler words and doubled spaces; leaves code spans alone. */
export const tighten = (s: string) =>
  s
    .split(/(`[^`]*`)/)
    .map((part, i) => (i % 2 ? part : part.replace(FILLER, '').replace(/[ \t]{2,}/g, ' ')))
    .join('')
    .replace(/\s+([,.;:])/g, '$1')
    .trim();

/** “Amounts Always Show The Currency” → “Amounts always show the currency”. Keeps component names and acronyms. */
export const sentenceCase = (s: string, keep: ReadonlySet<string> = new Set()) =>
  s
    .trim()
    .split(/\s+/)
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : keep.has(w.replace(/\W/g, '')) || /[A-Z].*[A-Z]|`/.test(w) ? w : w.toLowerCase()))
    .join(' ');

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const stripEnd = (s: string) => s.trim().replace(/[.!]+$/, '');
const humanize = (name: string) => name.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
const article = (s: string) => (/^[aeiou]/i.test(s) ? 'An' : 'A');

const mentioned = (text: string, components: string[]) => components.filter((c) => new RegExp(`\\b${c}\\b`).test(text));

/** Components whose name shares a word with `name` — the mock’s idea of “similar”. */
const similar = (name: string, components: string[]) => {
  const words = humanize(name).split(' ');
  return components.filter((c) => c !== name && humanize(c).split(' ').some((w) => words.includes(w) && w.length > 3)).slice(0, 3);
};

/** Recursively applies `fn` to every string in a value. */
const mapStrings = <T>(v: T, fn: (s: string) => string): T => {
  if (typeof v === 'string') return fn(v) as T;
  if (Array.isArray(v)) return v.map((x) => mapStrings(x, fn)) as T;
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k === 'kind' || k === 'lang' ? x : mapStrings(x, fn)])) as T;
  return v;
};

/** Labels for the fields that differ between two objects; array fields show the count change. */
function changesBetween(before: object, after: object, labels: Record<string, string> = {}): string[] {
  const b = before as Record<string, unknown>;
  const a = after as Record<string, unknown>;
  return Object.keys(a).flatMap((k) => {
    if (JSON.stringify(a[k]) === JSON.stringify(b[k])) return [];
    const label = labels[k] ?? k.charAt(0).toUpperCase() + k.slice(1);
    if (Array.isArray(a[k]) && Array.isArray(b[k])) {
      const d = (a[k] as unknown[]).length - (b[k] as unknown[]).length;
      return [d > 0 ? `${label} (+${d})` : d < 0 ? `${label} (${d})` : `${label} (reworded)`];
    }
    return [label];
  });
}

// ── Rules ───────────────────────────────────────────────────────────────────

const RULE_LABELS = { title: 'Title', appliesTo: 'Applies to', description: 'Description', dos: 'Do', donts: 'Don’t', examples: 'Examples', category: 'Category' };

function assistRule({ action, instruction, rule, components }: Extract<AssistRequest, { target: 'rule' }>): AssistResult<Rule> {
  const keep = new Set(components);
  const blank = !rule.title.trim() && !rule.description.trim();
  // On a blank rule, typed text is the rule itself — “… never guess” is not a request for don’ts.
  const act = blank && action === 'custom' ? 'draft' : pickAction(action, instruction, blank ? 'draft' : 'tighten');
  let next: Rule = rule;
  let note: string;

  if (act === 'draft') {
    const source = stripEnd(instruction || rule.title || rule.description);
    if (!source) return { value: rule, note: 'Describe the rule in the prompt first — one sentence is enough.', changes: [] };
    const [head, ...rest] = source.split(/[.;]\s+|\s+(?:because|so that|so)\s+/i);
    const title = sentenceCase(tighten(head), keep).slice(0, 100);
    const appliesTo = [...new Set([...rule.appliesTo, ...mentioned(source, components)])];
    const why = rest.join(' ').trim();
    next = {
      ...rule,
      title,
      appliesTo,
      description: rule.description || `${title}.${why ? ` ${sentenceCase(why)}.` : ''} Agents apply this on every screen${appliesTo.length ? ` that uses ${appliesTo.map((c) => `\`${c}\``).join(', ')}` : ''}, not only where it looks necessary.`,
      dos: rule.dos.length ? rule.dos : [`${title}.`],
      donts: rule.donts.length ? rule.donts : [`Don’t make an exception for prototypes or “quick” screens — agents copy what they see.`],
    };
    note = 'Drafted from your description. Check the wording — agents read it word for word.';
  } else if (act === 'donts') {
    const added = rule.dos
      .filter((d) => d.trim())
      .map((d) => stripEnd(d).replace(/^always\s+/i, ''))
      .map((d) => (/^use\s/i.test(d) ? `Don’t ${lowerFirst(d).replace(/^use\s/, 'use anything other than ')}.` : `Don’t skip this: ${lowerFirst(d)}.`))
      .filter((d) => !rule.donts.includes(d));
    next = { ...rule, donts: [...rule.donts, ...(added.length ? added : ['Don’t hardcode colours, spacing or fonts — use tokens.'])] };
    note = 'One don’t per do, phrased as its opposite. Delete the ones that state the obvious.';
  } else if (act === 'examples') {
    const c = rule.appliesTo[0] ?? mentioned(`${rule.title} ${rule.description}`, components)[0] ?? 'Card';
    const hint = stripEnd(rule.dos[0] ?? rule.title ?? '') || 'follows the rule';
    const add: RuleExample[] = [];
    if (!rule.examples.some((e) => e.kind === 'good')) add.push({ kind: 'good', lang: 'tsx', label: hint.slice(0, 60), code: `<${c}\n  // ${hint}\n/>` });
    if (!rule.examples.some((e) => e.kind === 'bad')) add.push({ kind: 'bad', lang: 'tsx', label: 'breaks the rule', code: `<${c}\n  // ${rule.donts[0] ? stripEnd(rule.donts[0]) : 'what agents get wrong'}\n/>` });
    next = { ...rule, examples: [...rule.examples, ...add] };
    note = add.length ? `Added ${add.length === 2 ? 'a do and a don’t' : 'the missing'} example as a skeleton for \`${c}\` — replace the comments with real props.` : 'It already has a do and a don’t example.';
  } else {
    // Tighten: shorter wording, sentence case, and dos/don’ts on the right side (the same checks lint runs).
    const t = mapStrings({ title: rule.title, description: rule.description, dos: rule.dos, donts: rule.donts }, tighten);
    const readsAsDont = (d: string) => /^(never|don'?t|don’t|do not|avoid)\b/i.test(d);
    const readsAsDo = (d: string) => /^(always|do)\b(?! not)/i.test(d);
    const dos = t.dos.filter((d) => d && !readsAsDont(d));
    const donts = t.donts.filter((d) => d && !readsAsDo(d));
    next = {
      ...rule,
      title: sentenceCase(stripEnd(t.title), keep),
      description: t.description,
      dos: [...dos, ...t.donts.filter(readsAsDo)],
      donts: [...donts, ...t.dos.filter(readsAsDont)],
    };
    const moved = dos.length !== t.dos.length || donts.length !== t.donts.length;
    note = `Shorter wording and sentence case${moved ? ', and moved lines that read as the opposite to the right list' : ''}.`;
  }

  const changes = changesBetween(rule, next, RULE_LABELS);
  return { value: next, note: changes.length ? note : 'Nothing to change — it already reads well.', changes };
}

// ── Spec sections ───────────────────────────────────────────────────────────

const unionValues = (type: string) => (type.includes('|') ? type.split('|').map((v) => v.trim().replace(/^['"]|['"]$/g, '')).filter((v) => v && !/^(undefined|null)$/.test(v)) : []);

/** A first draft of one section, built from the component's name, props and the other components. */
function draftSection(kind: KnownKind, current: SpecSection, name: string, props: Record<string, string>, components: string[], all: SpecSection[] = []): SpecSection {
  const human = humanize(name);
  const variantProps = Object.entries(props).filter(([, t]) => unionValues(t).length > 1);
  const alts = similar(name, components);
  switch (kind) {
    case 'whatItIs':
      return { kind, text: `${article(human)} ${human} that renders ${variantProps.length ? `in ${variantProps.map(([p]) => `\`${p}\``).join(' and ')} variants` : 'its content in one fixed layout'}.` };
    case 'whenToUse': {
      const items = (current.kind === kind ? current.items : []).slice();
      items.push(`Use when a screen needs ${article(human).toLowerCase()} ${human} and no more specific component fits.`);
      for (const [p, t] of variantProps.slice(0, 2)) items.push(`Use \`${p}="${unionValues(t)[0]}"\` for the default case; pick another \`${p}\` only for the reason in Variant selection.`);
      return { kind, lead: current.kind === kind ? current.lead : '', items };
    }
    case 'whenNotToUse': {
      const items = (current.kind === kind ? current.items : []).slice();
      for (const a of alts.length ? alts : ['Card']) items.push(`Do not use when you need ${article(humanize(a)).toLowerCase()} ${humanize(a)} → use \`${a}\` instead.`);
      return { kind, lead: current.kind === kind ? current.lead : '', items };
    }
    case 'variants':
      return {
        kind,
        lead: current.kind === kind ? current.lead : '',
        tables: variantProps.slice(0, 3).map(([p, t]) => ({ heading: `\`${p}\` prop`, rows: [['Value', 'Use when'], ...unionValues(t).map((v) => [`\`${v}\``, ''])] })),
      };
    case 'spatial':
      return { kind, lead: '', ownsPadding: 'yes — inner padding comes from its tokens', ownsMargin: 'no — spacing comes from the parent layout', fillsContainer: 'yes — width: 100%', notes: '' };
    case 'composition':
      return { kind, lead: '', allowed: [`Can be used inside: page sections, \`Card\` bodies, \`Drawer\` content.`], never: [`Never place inside another ${name}.`] };
    case 'props': {
      const rows = current.kind === kind ? current.rows.slice() : [];
      for (const [p, t] of Object.entries(props)) {
        if (!rows.some((r) => r.prop.includes(`\`${p}\``)) && !/^(className|style|children|id)$/.test(p)) rows.push({ prop: `\`${p}\``, type: `\`${t}\``, when: unionValues(t).length > 1 ? 'See Variant selection' : 'When …' });
      }
      return { kind, lead: current.kind === kind ? current.lead : '', rows };
    }
    case 'mistakes': {
      const nots = all.find((s) => s.kind === 'whenNotToUse');
      const from = nots?.kind === 'whenNotToUse' ? nots.items : [];
      const items = (current.kind === kind ? current.items : []).slice();
      for (const line of from.slice(0, 3)) {
        const [mistake, fix] = line.replace(/^do not use\s*/i, '').split(/\s*→\s*/);
        items.push({ mistake: `Using ${name} ${stripEnd(mistake)}`, fix: fix ? `${sentenceCase(stripEnd(fix))} — see When NOT to use.` : 'See When NOT to use.' });
      }
      if (!from.length) items.push({ mistake: `Wrapping ${name} in an extra container to add spacing`, fix: 'Spacing comes from the parent layout — see Spatial contract.' });
      return { kind, lead: current.kind === kind ? current.lead : '', items };
    }
    case 'examples': {
      const attrs = variantProps.slice(0, 2).map(([p, t]) => ` ${p}="${unionValues(t)[0]}"`).join('');
      return { kind, lead: '', blocks: [{ lang: 'tsx', code: `// Most common usage\n<${name}${attrs} />` }, ...(current.kind === kind ? current.blocks : [])] };
    }
  }
}

const isEmptySection = (s: SpecSection) => JSON.stringify(s) === JSON.stringify(s.kind === 'custom' ? s : emptySection(s.kind)) || JSON.stringify(mapStrings(s, () => '')) === JSON.stringify(s);

const SECTION_LABELS = { text: 'Text', lead: 'Intro', items: 'Lines', tables: 'Tables', rows: 'Rows', allowed: 'Can be used', never: 'Never', blocks: 'Examples', ownsPadding: 'Padding', ownsMargin: 'Margin', fillsContainer: 'Fills container', notes: 'Notes', heading: 'Heading', body: 'Content' };

function assistSection({ action, instruction, section, name, props, components }: Extract<AssistRequest, { target: 'section' }>): AssistResult<SpecSection> {
  const act = pickAction(action, instruction, section.kind === 'custom' || !isEmptySection(section) ? 'tighten' : 'draft');
  let next: SpecSection;
  let note: string;
  if (act === 'draft' && section.kind !== 'custom') {
    next = { ...draftSection(section.kind, section, name, props, components), hr: section.hr };
    note = `A first draft from ${name}’s props and the components around it. Replace every “…” and keep only what an agent can act on.`;
  } else if (act === 'arrows' && section.kind === 'whenNotToUse') {
    const alt = similar(name, components)[0] ?? 'X';
    next = { ...section, items: section.items.map((i) => (i.includes('→') ? i : `${stripEnd(i)} → use \`${alt}\` instead.`)) };
    note = `Lines without an alternative now end with “→ use \`${alt}\` instead”. Check each one names the right component.`;
  } else {
    next = mapStrings(section, tighten);
    note = 'Shorter wording; meaning and code spans unchanged.';
  }
  const changes = changesBetween(section, next, SECTION_LABELS);
  return { value: next, note: changes.length ? note : 'Nothing to change here.', changes };
}

function assistSpec({ action, instruction, sections, name, props, components }: Extract<AssistRequest, { target: 'spec' }>): AssistResult<SpecSection[]> {
  const act = pickAction(action, instruction, 'draft-empty');
  if (act === 'tighten') {
    const next = mapStrings(sections, tighten);
    const changes = sections.flatMap((s, i) => (JSON.stringify(s) === JSON.stringify(next[i]) ? [] : [s.kind === 'custom' ? s.heading : SECTION_HEADINGS[s.kind]]));
    return { value: next, note: changes.length ? 'Shorter wording in every section; meaning and code spans unchanged.' : 'Nothing to change.', changes };
  }
  // Draft empty sections, and add the template sections the spec doesn’t have yet.
  const next = sections.map((s) => (s.kind !== 'custom' && isEmptySection(s) ? draftSection(s.kind, s, name, props, components, sections) : s));
  for (const kind of KNOWN_ORDER) {
    if (!next.some((s) => s.kind === kind)) next.splice(Math.min(KNOWN_ORDER.indexOf(kind), next.length), 0, draftSection(kind, emptySection(kind), name, props, components, next));
  }
  const changes = KNOWN_ORDER.filter((k) => JSON.stringify(next.find((s) => s.kind === k)) !== JSON.stringify(sections.find((s) => s.kind === k))).map((k) => SECTION_HEADINGS[k]);
  return {
    value: next,
    note: changes.length ? `Drafted ${changes.length} empty section${changes.length > 1 ? 's' : ''} from ${name}’s props. Sections you already wrote are untouched.` : 'Every section already has content.',
    changes,
  };
}

// ── Markdown blocks ─────────────────────────────────────────────────────────

function assistMarkdown({ action, instruction, text }: Extract<AssistRequest, { target: 'markdown' }>): AssistResult<string> {
  const act = pickAction(action, instruction, 'tighten');
  let inFence = false;
  const lines = text.split('\n').map((line) => {
    if (/^\s*```/.test(line)) { inFence = !inFence; return line; }
    if (inFence) return line;
    if (act === 'format') return line.replace(/^(\s*)[*+]\s+/, '$1- ').replace(/^(#{1,6})([^#\s])/, '$1 $2').replace(/\s+$/, '');
    return /^\s*(#|\|)/.test(line) ? line : line.replace(/^(\s*(?:[-*+]|\d+\.)?\s*)(.*)$/, (_, lead: string, body: string) => lead + tighten(body));
  });
  if (act === 'format') {
    // A blank line after every heading, and never more than one blank line in a row.
    for (let i = lines.length - 2; i >= 0; i--) if (/^#{1,6}\s/.test(lines[i]) && lines[i + 1].trim()) lines.splice(i + 1, 0, '');
  }
  const value = lines.join('\n').replace(/\n{3,}/g, '\n\n');
  const changed = text.split('\n').filter((l, i) => l !== value.split('\n')[i]).length;
  return {
    value,
    note: value === text ? 'Nothing to change.' : act === 'format' ? 'Consistent bullets, heading spacing and no trailing spaces. Code blocks untouched.' : 'Shorter wording. Headings, tables and code blocks untouched.',
    changes: value === text ? [] : [`${changed} line${changed === 1 ? '' : 's'}`],
  };
}
