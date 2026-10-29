import { RULE_CATEGORIES, isRuleCategory, nextRuleId, type Rule, type RuleCategory, type RuleExample } from './types';

/**
 * Rule ↔ markdown, in the house style of AI.md:
 *
 *   ### LCB-02: Dataviz colors
 *   **Category:** layout · **Applies to:** `ChartCard`
 *   Prose…
 *
 *   ✅ do line
 *   ❌ don't line
 *
 *   ```tsx
 *   // ✅ CORRECT — label
 *   code
 *   ```
 *
 * renderRule → parseRule round-trips exactly. parseRule also reads the
 * hand-written rules in AI.md, which carry no meta line and mix ✅/❌ inside
 * code fences and "- Never …" bullets; it keeps everything it can't classify
 * in the description so nothing is dropped.
 */

const HEADING = /^###\s+([A-Z]{2,4}-\d+[a-z]?(?:\s*\/\s*[A-Z]{2,4}-\d+[a-z]?)?):\s*(.+?)\s*$/;
const META = /^\*\*Category:\*\*\s*([a-z]+)(?:\s*·\s*\*\*Applies to:\*\*\s*(.+))?$/;
const META_APPLIES = /^\*\*Applies to:\*\*\s*(.+)$/;
const DO = /^✅\s*(.+)$/;
const DONT = /^❌\s*(.+)$/;
const BULLET_DO = /^-\s+((?:Always|Do)\b.+)$/;
const BULLET_DONT = /^-\s+((?:Never|Do not|Don't|Avoid)\b.+)$/;

const MARK = { good: '✅ CORRECT', bad: '❌ WRONG' } as const;

const comment = (lang: string, text: string) =>
  lang === 'css' || lang === 'scss' ? `/* ${text} */` : lang === 'html' ? `<!-- ${text} -->` : `// ${text}`;

const MARKER_LINE = /^(?:\/\/|\/\*|<!--)\s*(✅ CORRECT|❌ WRONG)(?:\s*—\s*(.*?))?\s*(?:\*\/|-->)?\s*$/;

const categoryFromId = (id: string): RuleCategory => {
  const prefix = id.split('-')[0];
  return RULE_CATEGORIES.find((c) => c.prefix === prefix)?.id ?? 'other';
};

export function renderRule(rule: Rule, opts: { meta?: boolean } = {}): string {
  const out: string[] = [`### ${rule.id}: ${rule.title.trim()}`];
  if (opts.meta ?? true) {
    const applies = rule.appliesTo.length ? ` · **Applies to:** ${rule.appliesTo.map((c) => `\`${c}\``).join(', ')}` : '';
    out.push(`**Category:** ${rule.category}${applies}`);
  }
  const description = rule.description.trim();
  if (description) out.push(description);
  const lines = [...rule.dos.map((d) => `✅ ${d.trim()}`), ...rule.donts.map((d) => `❌ ${d.trim()}`)].filter((l) => l.length > 2);
  if (lines.length) out.push('', lines.join('\n'));
  for (const ex of rule.examples) {
    const code = ex.code.replace(/\s+$/, '');
    if (!code) continue;
    const head = ex.kind === 'mixed' ? [] : [comment(ex.lang, ex.label?.trim() ? `${MARK[ex.kind]} — ${ex.label.trim()}` : MARK[ex.kind])];
    out.push('', '```' + ex.lang, ...head, code, '```');
  }
  return out.join('\n') + '\n';
}

const splitAppliesTo = (s: string) => [...s.matchAll(/`([^`]+)`/g)].map((m) => m[1]);

export function parseRule(md: string): Rule | null {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const head = HEADING.exec(lines[0] ?? '');
  if (!head) return null;
  const id = head[1].replace(/\s+/g, ' ');
  const rule: Rule = { id, title: head[2], category: categoryFromId(id), appliesTo: [], description: '', dos: [], donts: [], examples: [] };

  let i = 1;
  const metaLine = lines[1] ?? '';
  const meta = META.exec(metaLine);
  if (meta && isRuleCategory(meta[1])) {
    rule.category = meta[1];
    if (meta[2]) rule.appliesTo = splitAppliesTo(meta[2]);
    i = 2;
  } else if (META_APPLIES.test(metaLine)) {
    rule.appliesTo = splitAppliesTo(META_APPLIES.exec(metaLine)![1]);
    i = 2;
  }

  const prose: string[] = [];
  for (; i < lines.length; i++) {
    const line = lines[i];
    const fence = /^```(\S*)\s*$/.exec(line);
    if (fence) {
      const body: string[] = [];
      for (i++; i < lines.length && !/^```\s*$/.test(lines[i]); i++) body.push(lines[i]);
      // A single leading marker is ours: lift it into kind + label. Anything
      // else (several markers, markers mid-block) stays in the code as mixed.
      const first = MARKER_LINE.exec(body[0] ?? '');
      const markers = body.filter((l) => /✅|❌/.test(l)).length;
      const ex: RuleExample = { kind: 'mixed', code: '', lang: fence[1] || 'tsx' };
      if (first && markers === 1) {
        ex.kind = first[1].startsWith('✅') ? 'good' : 'bad';
        if (first[2]) ex.label = first[2];
        body.shift();
      }
      ex.code = body.join('\n');
      rule.examples.push(ex);
      continue;
    }
    const t = line.trim();
    let m: RegExpExecArray | null;
    if ((m = DO.exec(t) ?? BULLET_DO.exec(t))) rule.dos.push(m[1].trim());
    else if ((m = DONT.exec(t) ?? BULLET_DONT.exec(t))) rule.donts.push(m[1].trim());
    else prose.push(line);
  }
  rule.description = prose.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return rule;
}

/** Every `### XXX-NN: Title` section in a markdown file, up to the next heading or rule. */
export function parseRuleSections(md: string): Rule[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const rules: Rule[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (!HEADING.test(lines[i])) continue;
    let end = i + 1;
    let inFence = false;
    for (; end < lines.length; end++) {
      if (/^```/.test(lines[end])) inFence = !inFence;
      if (!inFence && (/^#{1,3}\s/.test(lines[end]) || /^---\s*$/.test(lines[end]))) break;
    }
    const rule = parseRule(lines.slice(i, end).join('\n'));
    if (rule) rules.push(rule);
    i = end - 1;
  }
  return rules;
}

// ─── Proposing a rule to AI.md ───────────────────────────────────────────────

/** Where a rule of each category lands in AI.md, and the id prefix it takes there. */
const AI_MD_SECTIONS = {
  navigation: { heading: '## Navigation & page structure rules', prefix: 'NAV' },
  default: { heading: '## Layout & component behavior rules', prefix: 'LCB' },
} as const;

export const aiMdTarget = (category: Rule['category']) => (category === 'navigation' ? AI_MD_SECTIONS.navigation : AI_MD_SECTIONS.default);

/** The one-line form for AI-short.md. */
export const shortRuleLine = (rule: Rule) => {
  const dont = rule.donts[0]?.replace(/^(never|don'?t|do not)\s+/i, '');
  const point = dont ? `Never ${dont[0].toLowerCase()}${dont.slice(1)}` : rule.dos[0] ?? rule.description.split('\n')[0];
  return `- **${rule.title.trim()}** — ${point.trim().replace(/\.?$/, '.')}`;
};

/**
 * Inserts `rule` at the end of its AI.md section with the next free id there
 * (LCB-13 after LCB-12). Returns the new file and the rule as written. Every
 * other line of the file is unchanged.
 */
export function insertRuleIntoAiMd(md: string, rule: Rule): { md: string; rule: Rule } {
  const target = aiMdTarget(rule.category);
  const ls = md.replace(/\r\n/g, '\n').split('\n');
  const start = ls.findIndex((l) => l.trim() === target.heading);
  if (start < 0) throw new Error(`AI.md has no “${target.heading.slice(3)}” section.`);
  let end = start + 1;
  let inFence = false;
  for (; end < ls.length; end++) {
    if (/^```/.test(ls[end])) inFence = !inFence;
    if (!inFence && /^## /.test(ls[end])) break;
  }
  // Land before the section's closing `---` and the blank lines around it.
  let at = end;
  while (at > start + 1 && (!ls[at - 1].trim() || /^---\s*$/.test(ls[at - 1]))) at--;
  const ids = parseRuleSections(md).map((r) => r.id);
  const written: Rule = { ...rule, id: nextRuleId(target.prefix, ids) };
  const block = renderRule(written, { meta: false }).trimEnd().split('\n');
  return { md: [...ls.slice(0, at), '', ...block, ...ls.slice(at)].join('\n'), rule: written };
}
