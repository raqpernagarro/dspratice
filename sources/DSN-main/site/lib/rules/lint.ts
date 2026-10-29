import { isRuleCategory, type Rule, type RuleExample } from './types';

/**
 * Checks a rule as it is written, before it reaches agents. Pure — the editor
 * runs it on every keystroke with names it fetched once, and the kit service
 * runs it again on save with the server's own lists.
 */

export interface RuleIssue {
  severity: 'error' | 'warning' | 'info';
  /** Form field the issue belongs to: title, appliesTo, dos, donts, examples, description. */
  field: keyof Rule | 'content';
  message: string;
}

export interface RuleLintContext {
  components: ReadonlySet<string>;
  tokens: ReadonlySet<string>;
  /** Rules already in force (DS-Ngr's and the kit's), to point at overlaps. */
  existing?: readonly Rule[];
}

export const MAX_RULE_TEXT = 4000;

/** "Save Changes Now" — two or more capitalised words. Sentence case is the house style. */
export const isTitleCase = (s: string) => {
  const words = s.trim().split(/\s+/).filter((w) => /^[A-Za-z]/.test(w) && w.length > 1);
  return words.length >= 2 && words.every((w) => /^[A-Z][a-z]/.test(w));
};

const TOKEN_RE = /--[a-z][a-z0-9-]*[a-z0-9]/g;
const HEX_RE = /#[0-9a-fA-F]{3,8}\b/;

const textOf = (r: Rule) => [r.title, r.description, ...r.dos, ...r.donts, ...r.examples.map((e) => e.code)].join('\n');

/** Tokens a rule names in its prose or in examples meant to be copied (not ❌ ones). */
const tokensIn = (r: Rule) => {
  const copyable = [r.description, ...r.dos, ...r.examples.filter((e) => e.kind !== 'bad').map((e) => e.code)].join('\n');
  return new Set(copyable.match(TOKEN_RE) ?? []);
};

/** Component names a rule is about: its appliesTo, or `Name` mentions when it has none (AI.md rules). */
export const ruleComponents = (r: Rule, components: ReadonlySet<string>): string[] => {
  if (r.appliesTo.length) return r.appliesTo;
  const named = [...textOf(r).matchAll(/`<?([A-Z][A-Za-z]+)/g)].map((m) => m[1]).filter((n) => components.has(n));
  return [...new Set(named)];
};

export function lintRule(rule: Rule, ctx: RuleLintContext): RuleIssue[] {
  const issues: RuleIssue[] = [];
  const add = (severity: RuleIssue['severity'], field: RuleIssue['field'], message: string) => issues.push({ severity, field, message });

  const title = rule.title.trim();
  if (!title) add('error', 'title', 'Give the rule a title.');
  else if (title.length > 120) add('error', 'title', 'Keep the title under 120 characters — put detail in the description.');
  else if (isTitleCase(title)) add('warning', 'title', 'Use sentence case: only the first word capitalised.');

  if (!isRuleCategory(rule.category)) add('error', 'category', 'Pick a category.');

  const hasContent = rule.description.trim() || rule.dos.some((d) => d.trim()) || rule.donts.some((d) => d.trim()) || rule.examples.some((e) => e.code.trim());
  if (!hasContent) add('error', 'content', 'Add a description, a do, a don’t or an example — a title alone tells an agent nothing.');
  if (textOf(rule).length > MAX_RULE_TEXT) add('error', 'content', `Keep the rule under ${MAX_RULE_TEXT} characters. Split it in two if it covers several things.`);

  for (const name of rule.appliesTo) {
    if (!ctx.components.has(name)) add('error', 'appliesTo', `${name} is not a DS-Ngr component.`);
  }

  rule.dos.forEach((d) => {
    if (/^(never|don'?t|do not|avoid)\b/i.test(d.trim())) add('warning', 'dos', `“${d.trim().slice(0, 40)}…” reads as a don’t — move it to the don’ts.`);
  });
  rule.donts.forEach((d) => {
    if (/^(always|do)\b(?! not)/i.test(d.trim())) add('warning', 'donts', `“${d.trim().slice(0, 40)}…” reads as a do — move it to the dos.`);
  });

  for (const t of tokensIn(rule)) {
    if (t.startsWith('--primitive-')) add('warning', 'content', `${t} is a primitive token. Apps use semantic tokens only.`);
    else if (!ctx.tokens.has(t) && !t.startsWith('--dsn-')) add('warning', 'content', `${t} is not a DS-Ngr token.`);
  }
  rule.examples.forEach((e: RuleExample) => {
    if (e.kind === 'good' && HEX_RE.test(e.code)) add('warning', 'examples', 'The ✅ example hardcodes a colour. Use a token.');
  });

  if (ctx.existing?.length) {
    const mine = new Set(ruleComponents(rule, ctx.components));
    if (mine.size) {
      for (const other of ctx.existing) {
        if (other.id === rule.id) continue;
        const shared = ruleComponents(other, ctx.components).filter((c) => mine.has(c));
        if (shared.length) add('info', 'content', `${other.id} “${other.title}” also covers ${shared.join(', ')}. Make sure they agree.`);
      }
    }
  }
  return issues;
}

/** Trim, drop empty lines and cap sizes — what the store keeps from untrusted input. */
export function normalizeRule(input: Partial<Rule> & { id: string }): Rule {
  const s = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const list = (v: unknown, max = 40) => (Array.isArray(v) ? [...new Set(v.map((x) => s(x, 500)).filter(Boolean))].slice(0, max) : []);
  const examples = (Array.isArray(input.examples) ? input.examples : [])
    .map((e): RuleExample => ({
      kind: e?.kind === 'good' || e?.kind === 'bad' ? e.kind : 'mixed',
      lang: /^[a-z]{1,10}$/.test(e?.lang ?? '') ? e.lang : 'tsx',
      code: typeof e?.code === 'string' ? e.code.replace(/\s+$/, '').slice(0, MAX_RULE_TEXT) : '',
      ...(s(e?.label, 120) && { label: s(e?.label, 120) }),
    }))
    .filter((e) => e.code)
    .slice(0, 6);
  return {
    id: input.id,
    title: s(input.title, 200).replace(/\s+/g, ' '),
    category: isRuleCategory(input.category) ? input.category : 'other',
    appliesTo: list(input.appliesTo, 20),
    description: s(input.description, MAX_RULE_TEXT),
    dos: list(input.dos),
    donts: list(input.donts),
    examples,
  };
}
