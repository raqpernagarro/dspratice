/**
 * A usage rule as structured data. The rule editor, the kit store, the MCP
 * context and proposed AI.md changes all go through this one shape, and
 * render.ts turns it into the markdown style AI.md already uses.
 */

export const RULE_CATEGORIES = [
  { id: 'layout', label: 'Layout', prefix: 'LCB' },
  { id: 'navigation', label: 'Navigation', prefix: 'NAV' },
  { id: 'forms', label: 'Forms', prefix: 'LCB' },
  { id: 'tokens', label: 'Tokens', prefix: 'TOK' },
  { id: 'typography', label: 'Typography', prefix: 'TYP' },
  { id: 'components', label: 'Components', prefix: 'CMP' },
  { id: 'content', label: 'Writing and content', prefix: 'TXT' },
  { id: 'other', label: 'Other', prefix: 'GEN' },
] as const;

export type RuleCategory = (typeof RULE_CATEGORIES)[number]['id'];

export const isRuleCategory = (v: unknown): v is RuleCategory =>
  RULE_CATEGORIES.some((c) => c.id === v);

/** A code sample. `mixed` holds both, marked inside the code, as AI.md often does. */
export interface RuleExample {
  kind: 'good' | 'bad' | 'mixed';
  code: string;
  /** Fence language: tsx, css, … */
  lang: string;
  /** Short note after the marker: "✅ CORRECT — fluid grid". */
  label?: string;
}

export interface Rule {
  /** NAV-05a, LCB-11, KIT-01. */
  id: string;
  title: string;
  category: RuleCategory;
  /** DS-Ngr component export names the rule is about. */
  appliesTo: string[];
  /** Prose; markdown allowed. */
  description: string;
  dos: string[];
  donts: string[];
  examples: RuleExample[];
}

export const emptyRule = (id: string): Rule => ({
  id,
  title: '',
  category: 'other',
  appliesTo: [],
  description: '',
  dos: [],
  donts: [],
  examples: [],
});

/** The next free id with this prefix: KIT-03 after KIT-01, KIT-02. */
export const nextRuleId = (prefix: string, taken: Iterable<string>): string => {
  let max = 0;
  const re = new RegExp(`^${prefix}-(\\d+)`);
  for (const id of taken) {
    const m = re.exec(id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${prefix}-${String(max + 1).padStart(2, '0')}`;
};
