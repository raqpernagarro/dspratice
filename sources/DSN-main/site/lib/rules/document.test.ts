import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ConflictError, deleteBlock, outline, replaceBlock } from './document';
import { parseRuleSections, renderRule } from './markdown';

const aiMd = fs.readFileSync(path.resolve(__dirname, '../../../AI.md'), 'utf8');
const blocks = outline(aiMd);

describe('outline', () => {
  it('covers the whole file: blocks joined give AI.md back', () => {
    const rebuilt = blocks.map((b) => b.text).join('\n');
    expect(rebuilt.replace(/\n+/g, '\n')).toBe(aiMd.replace(/\s+$/, '').replace(/\n+/g, '\n'));
  });

  it('has unique keys and finds every numbered rule', () => {
    expect(new Set(blocks.map((b) => b.key)).size).toBe(blocks.length);
    expect(blocks.filter((b) => b.rule).map((b) => b.rule!.id)).toEqual(parseRuleSections(aiMd).map((r) => r.id));
  });

  it('ignores # lines inside code fences', () => {
    expect(blocks.some((b) => b.heading.startsWith('root'))).toBe(false);
    expect(blocks.find((b) => b.key.endsWith('› LCB-03'))?.text).toContain('// ❌ WRONG — never add spacing directly on DS components');
  });
});

describe('replaceBlock', () => {
  const lcb11 = blocks.find((b) => b.key.endsWith('› LCB-11'))!;

  it('changes only that block', () => {
    const next = replaceBlock(aiMd, lcb11.key, lcb11.text, '### LCB-11: Centered content pages\nShort now.');
    const after = outline(next);
    expect(after.find((b) => b.key === lcb11.key)?.text).toBe('### LCB-11: Centered content pages\nShort now.');
    expect(after.filter((b) => b.key !== lcb11.key)).toEqual(blocks.filter((b) => b.key !== lcb11.key));
  });

  it('round-trips a rule through the form renderer', () => {
    const next = replaceBlock(aiMd, lcb11.key, lcb11.text, renderRule(lcb11.rule!, { meta: false }));
    expect(outline(next).find((b) => b.key === lcb11.key)?.rule).toEqual(lcb11.rule);
  });

  it('is a no-op when the text is unchanged', () => {
    expect(replaceBlock(aiMd, lcb11.key, lcb11.text, lcb11.text)).toBe(aiMd);
  });

  it('refuses when the block changed underneath', () => {
    expect(() => replaceBlock(aiMd, lcb11.key, lcb11.text + ' (stale)', 'x')).toThrow(ConflictError);
    expect(() => replaceBlock(aiMd, 'Nope › XYZ-01', '', 'x')).toThrow(ConflictError);
  });

  it('deletes a block', () => {
    const next = deleteBlock(aiMd, lcb11.key, lcb11.text);
    expect(outline(next).some((b) => b.key === lcb11.key)).toBe(false);
    expect(outline(next)).toHaveLength(blocks.length - 1);
  });
});
