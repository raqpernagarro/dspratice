import { SECTION_HEADINGS, type ComponentSpec, type KnownKind, type SpecSection } from './types';

/**
 * Checks a spec against the ds-component-doc rules while it is written. Pure:
 * the form runs it on every change with the component list and this
 * component's prop names.
 */

export interface SpecIssue {
  severity: 'error' | 'warning' | 'info';
  /** Section kind the issue belongs to, or 'meta'. */
  section: KnownKind | 'meta';
  message: string;
}

export interface SpecLintContext {
  components: ReadonlySet<string>;
  /** Props this component declares; empty = unknown, skip the check. */
  props: ReadonlySet<string>;
}

const find = <K extends KnownKind>(spec: ComponentSpec, kind: K) =>
  spec.sections.find((s): s is Extract<SpecSection, { kind: K }> => s.kind === kind);

const named = (s: string) => [...s.matchAll(/`<?([A-Z][A-Za-z]+)/g)].map((m) => m[1]);

export function lintSpec(spec: ComponentSpec, ctx: SpecLintContext): SpecIssue[] {
  const issues: SpecIssue[] = [];
  const add = (severity: SpecIssue['severity'], section: SpecIssue['section'], message: string) => issues.push({ severity, section, message });

  if (!spec.name.trim()) add('error', 'meta', 'The spec needs the component name.');
  if (spec.version.trim() && !/^\d+\.\d+\.\d+$/.test(spec.version.trim())) add('warning', 'meta', 'Version is semver: 1.0.0.');

  for (const kind of Object.keys(SECTION_HEADINGS) as KnownKind[]) {
    if (!spec.sections.some((s) => s.kind === kind || (s.kind === 'custom' && s.heading.toLowerCase() === SECTION_HEADINGS[kind].toLowerCase()))) {
      add('warning', kind, `“${SECTION_HEADINGS[kind]}” is missing. Every spec has it, even if it says “not applicable”.`);
    }
  }

  const what = find(spec, 'whatItIs');
  if (what && !what.text.trim()) add('warning', 'whatItIs', 'Say in one sentence what it renders.');
  else if (what && what.text.trim().split(/(?<=[.!?])\s+(?=[A-Z])/).length > 1) add('warning', 'whatItIs', 'Keep it to one sentence. When to use it goes in the next section.');

  const use = find(spec, 'whenToUse');
  if (use && !use.items.length && !use.lead.trim()) add('warning', 'whenToUse', 'Add at least one “Use when …” condition.');

  const not = find(spec, 'whenNotToUse');
  if (not && !not.items.length && !not.lead.trim()) add('warning', 'whenNotToUse', 'Agents rely on this section most. Add at least one case and its alternative.');
  not?.items.forEach((item) => {
    const alts = named(item.split('→')[1] ?? item);
    if (!item.includes('→') && !alts.length) add('warning', 'whenNotToUse', `“${item.slice(0, 50)}…” doesn’t name the alternative. End it with → use \`Component\` instead.`);
    for (const a of alts) if (!ctx.components.has(a) && a !== spec.name) add('warning', 'whenNotToUse', `${a} is not a DS-Ngr component.`);
  });

  const props = find(spec, 'props');
  if (props && ctx.props.size) {
    for (const r of props.rows) {
      for (const p of [...r.prop.matchAll(/`([^`]+)`/g)].map((m) => m[1])) {
        if (!ctx.props.has(p)) add('warning', 'props', `${spec.name} has no prop \`${p}\`.`);
      }
    }
  }

  const mistakes = find(spec, 'mistakes');
  mistakes?.items.forEach((m) => {
    if (!m.fix.trim()) add('warning', 'mistakes', `“${m.mistake.slice(0, 40)}” needs the fix: why it’s wrong and what to do instead.`);
  });
  if (mistakes && !mistakes.items.length && !mistakes.lead.trim()) add('info', 'mistakes', 'Add mistakes as you see agents make them.');

  const ex = find(spec, 'examples');
  if (ex && !ex.blocks.length) add('warning', 'examples', 'Add the most common usage as a code example.');
  ex?.blocks.forEach((b) => {
    if (/#[0-9a-fA-F]{3,8}\b/.test(b.code)) add('warning', 'examples', 'An example hardcodes a colour. Use a token.');
    if (/--primitive-/.test(b.code)) add('warning', 'examples', 'An example uses a primitive token. Apps use semantic tokens only.');
  });

  return issues;
}
