import { describe, expect, it } from 'vitest';
import { emptyRule } from '@/lib/rules/types';
import { emptySpec } from '@/lib/spec/types';
import { runAssist, sentenceCase, tighten, type AssistResult } from './mock';
import type { Rule } from '@/lib/rules/types';
import type { SpecSection } from '@/lib/spec/types';

const components = ['Card', 'DataTable', 'DataListCell', 'Stat', 'SectionHeader'];

describe('assist mock', () => {
  it('drafts a rule from a sentence, picking up named components', () => {
    const r = runAssist({ target: 'rule', action: 'custom', instruction: 'Amounts In A DataTable always show the currency so users never guess', rule: emptyRule(''), components }) as AssistResult<Rule>;
    expect(r.value.title).toBe('Amounts in a DataTable always show the currency');
    expect(r.value.appliesTo).toEqual(['DataTable']);
    expect(r.value.dos.length).toBeGreaterThan(0);
    expect(r.changes).toContain('Title');
  });

  it('tighten moves lines that read as the opposite', () => {
    const rule = { ...emptyRule('X-01'), title: 'Keep It Short', dos: ['Never wrap Stat in a Card'], donts: ['Always use tokens'] };
    const r = runAssist({ target: 'rule', action: 'custom', instruction: 'make it tighter', rule, components }) as AssistResult<Rule>;
    expect(r.value.title).toBe('Keep it short');
    expect(r.value.dos).toEqual(['Always use tokens']);
    expect(r.value.donts).toEqual(['Never wrap Stat in a Card']);
  });

  it('drafts empty spec sections and keeps written ones', () => {
    const spec = emptySpec('DataTable', 'organism', 'x');
    spec.sections[0] = { kind: 'whatItIs', text: 'Hand written.' };
    const r = runAssist({ target: 'spec', action: 'draft-empty', instruction: '', sections: spec.sections, name: 'DataTable', props: { density: "'compact' | 'default'" }, components }) as AssistResult<SpecSection[]>;
    expect(r.value[0]).toEqual({ kind: 'whatItIs', text: 'Hand written.' });
    const nots = r.value.find((s) => s.kind === 'whenNotToUse');
    expect(nots?.kind === 'whenNotToUse' && nots.items.some((i) => i.includes('`DataListCell`'))).toBe(true);
    expect(r.changes).not.toContain('What it is');
  });

  it('leaves code in markdown alone', () => {
    const text = '### Rule\n* just do it\n```tsx\n// really  keep\n```';
    const r = runAssist({ target: 'markdown', action: 'format', instruction: '', text }) as AssistResult<string>;
    expect(r.value).toBe('### Rule\n\n- just do it\n```tsx\n// really  keep\n```');
  });

  it('helpers', () => {
    expect(tighten('Please just use `very  tight` code')).toBe('use `very  tight` code');
    expect(sentenceCase('Use The Card Component', new Set(['Card']))).toBe('Use the Card component');
  });
});
