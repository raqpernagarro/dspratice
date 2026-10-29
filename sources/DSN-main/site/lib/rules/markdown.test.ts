import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { insertRuleIntoAiMd, parseRule, parseRuleSections, renderRule, shortRuleLine } from './markdown';
import { nextRuleId, type Rule } from './types';

const sample: Rule = {
  id: 'KIT-01',
  title: 'Destructive actions need a confirmation',
  category: 'components',
  appliesTo: ['Button', 'Modal'],
  description: 'Deleting anything a user cannot get back goes through a confirmation `Modal`.\n\nThe modal names the thing being deleted.',
  dos: ['Name the item in the modal title', 'Use `variant="destructive"` on the confirm button'],
  donts: ['Delete on a single click'],
  examples: [
    { kind: 'good', lang: 'tsx', label: 'confirm first', code: '<Modal title="Delete “Q3 plan”?">…</Modal>' },
    { kind: 'bad', lang: 'css', code: '.x { color: red; }' },
    { kind: 'mixed', lang: 'tsx', code: '// ✅ a\n<A />\n// ❌ b\n<B />' },
  ],
};

describe('renderRule / parseRule', () => {
  it('round-trips', () => {
    expect(parseRule(renderRule(sample))).toEqual(sample);
  });

  it('round-trips a bare rule', () => {
    const bare: Rule = { ...sample, appliesTo: [], dos: [], donts: [], examples: [], description: 'Just prose.' };
    expect(parseRule(renderRule(bare))).toEqual(bare);
  });

  it('renders in AI.md style', () => {
    const md = renderRule(sample);
    expect(md).toMatch(/^### KIT-01: Destructive actions need a confirmation\n\*\*Category:\*\* components · \*\*Applies to:\*\* `Button`, `Modal`\n/);
    expect(md).toContain('✅ Name the item in the modal title\n');
    expect(md).toContain('❌ Delete on a single click\n');
    expect(md).toContain('```tsx\n// ✅ CORRECT — confirm first\n');
    expect(md).toContain('```css\n/* ❌ WRONG */\n');
  });

  it('omits the meta line when asked (AI.md proposals)', () => {
    expect(renderRule(sample, { meta: false })).not.toContain('**Category:**');
  });
});

describe('AI.md', () => {
  const aiMd = fs.readFileSync(path.resolve(__dirname, '../../../AI.md'), 'utf8');
  const rules = parseRuleSections(aiMd);

  it('finds every numbered rule', () => {
    const headings = aiMd.split('\n').filter((l) => /^### [A-Z]{2,4}-\d/.test(l));
    expect(rules.map((r) => r.id)).toHaveLength(headings.length);
  });

  it.each(rules.map((r) => [r.id, r]))('%s parses with a title and content', (_id, rule) => {
    const r = rule as Rule;
    expect(r.title).toBeTruthy();
    expect(r.description || r.dos.length || r.donts.length || r.examples.length).toBeTruthy();
  });

  it('reads ✅/❌ lines and Never bullets', () => {
    const lcb02 = rules.find((r) => r.id === 'LCB-02')!;
    expect(lcb02.category).toBe('layout');
    expect(lcb02.dos[0]).toContain('var(--color-background-dataviz-1)');
    expect(lcb02.donts).toHaveLength(2);
    const lcb11 = rules.find((r) => r.id === 'LCB-11')!;
    expect(lcb11.donts.some((d) => d.startsWith('Never hardcode a pixel max-width'))).toBe(true);
  });

  it('re-renders without losing text', () => {
    for (const r of rules) {
      const again = parseRule(renderRule(r));
      expect(again).toEqual(r);
    }
  });
});

describe('nextRuleId', () => {
  it('counts up from the highest', () => {
    expect(nextRuleId('KIT', [])).toBe('KIT-01');
    expect(nextRuleId('KIT', ['KIT-01', 'KIT-07', 'NAV-12'])).toBe('KIT-08');
    expect(nextRuleId('LCB', ['LCB-06d', 'LCB-12'])).toBe('LCB-13');
  });
});

describe('insertRuleIntoAiMd', () => {
  const aiMd = fs.readFileSync(path.resolve(__dirname, '../../../AI.md'), 'utf8');
  const before = parseRuleSections(aiMd);

  it('adds the rule with the next id at the end of its section, changing nothing else', () => {
    const { md, rule } = insertRuleIntoAiMd(aiMd, { ...sample, category: 'layout' });
    const lcb = before.filter((r) => r.id.startsWith('LCB')).map((r) => Number(r.id.slice(4, 6)));
    expect(rule.id).toBe(`LCB-${Math.max(...lcb) + 1}`);
    const after = parseRuleSections(md);
    expect(after.filter((r) => r.id !== rule.id)).toEqual(before);
    expect(after.find((r) => r.id === rule.id)).toEqual({ ...rule, appliesTo: [], category: 'layout' });
    // Still inside the layout section: the next ## heading follows it.
    const added = md.indexOf(`### ${rule.id}:`);
    expect(md.lastIndexOf('## Layout & component behavior rules', added)).toBeGreaterThan(md.lastIndexOf('\n## ', added - 1) - 1);
    expect(md.replace(renderRule(rule, { meta: false }).trimEnd() + '\n', '').replace(/\n{3,}/g, '\n\n')).toBe(aiMd.replace(/\n{3,}/g, '\n\n'));
  });

  it('puts navigation rules under NAV', () => {
    expect(insertRuleIntoAiMd(aiMd, { ...sample, category: 'navigation' }).rule.id).toMatch(/^NAV-\d+$/);
  });

  it('writes a one-liner for AI-short.md', () => {
    expect(shortRuleLine(sample)).toBe('- **Destructive actions need a confirmation** — Never delete on a single click.');
  });
});
