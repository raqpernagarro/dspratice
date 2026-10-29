import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseSpec, renderSpec } from './markdown';
import { emptySpec, KNOWN_ORDER, SECTION_HEADINGS } from './types';

const REPO = path.resolve(__dirname, '../../..');
const specFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? specFiles(path.join(dir, e.name)) : e.name.endsWith('.spec.md') ? [path.join(dir, e.name)] : [],
  );
const files = specFiles(path.join(REPO, 'src/components'));
const norm = (s: string) => s.replace(/\s+/g, '');

describe('renderSpec', () => {
  it('a blank spec has every template heading in order', () => {
    const md = renderSpec(emptySpec('Widget', 'molecule', 'src/components/molecules/Widget/Widget.spec.md'));
    const headings = md.split('\n').filter((l) => l.startsWith('## ')).map((l) => l.slice(3));
    expect(headings).toEqual(KNOWN_ORDER.map((k) => SECTION_HEADINGS[k]));
    expect(md).toMatch(/^# Widget\n\n\*\*Tier:\*\* molecule {2}\n\*\*Location:\*\* `src\/components\/molecules\/Widget\/Widget.spec.md` {2}\n\*\*Version:\*\* 1.0.0\n/);
  });

  it('matches the spec template file headings', () => {
    const template = fs.readFileSync(path.join(REPO, 'specs/_template/component.spec.md'), 'utf8');
    const headings = template.split('\n').filter((l) => l.startsWith('## ')).map((l) => l.slice(3));
    expect(headings).toEqual(KNOWN_ORDER.map((k) => SECTION_HEADINGS[k]));
  });
});

describe('existing specs', () => {
  it('finds the co-located specs', () => expect(files.length).toBeGreaterThan(50));

  it.each(files.map((f) => [path.relative(REPO, f), f]))('%s round-trips without losing text', (_rel, file) => {
    const md = fs.readFileSync(file, 'utf8');
    const spec = parseSpec(md);
    expect(spec.name).toBeTruthy();
    // Stable: parsing what we render gives the same structure back.
    expect(parseSpec(renderSpec(spec))).toEqual(spec);
    // Lossless up to whitespace, table separators, fence style and list numbering (rendering renumbers).
    const strip = (s: string) =>
      norm(s.split('\n').filter((l) => !/^\s*\|?[\s:|-]*-[\s:|-]*$/.test(l) || !l.includes('|')).join('\n').replace(/^\d+\. /gm, '1. ')).replace(/~~~/g, '```');
    expect(strip(renderSpec(spec))).toBe(strip(md));
  });

  it('reads most known sections as structured fields', () => {
    let known = 0;
    let custom = 0;
    for (const f of files) {
      for (const s of parseSpec(fs.readFileSync(f, 'utf8')).sections) {
        if (s.kind !== 'custom') known++;
        else if (Object.values(SECTION_HEADINGS).map((h) => h.toLowerCase()).includes(s.heading.toLowerCase())) custom++;
      }
    }
    expect(known / (known + custom)).toBeGreaterThan(0.85);
  });

  it('reads CheckboxField field by field', () => {
    const spec = parseSpec(fs.readFileSync(path.join(REPO, 'src/components/molecules/CheckboxField/CheckboxField.spec.md'), 'utf8'));
    expect(spec).toMatchObject({ name: 'CheckboxField', tier: 'molecule', version: '1.0.0' });
    const kinds = spec.sections.map((s) => (s.kind === 'custom' ? s.heading : s.kind));
    expect(kinds).toEqual(['whatItIs', 'whenToUse', 'whenNotToUse', 'variants', 'spatial', 'composition', 'Field rules', 'props', 'mistakes', 'examples']);
    const spatial = spec.sections.find((s) => s.kind === 'spatial');
    expect(spatial).toMatchObject({ ownsPadding: expect.stringMatching(/^yes/), ownsMargin: expect.stringMatching(/^no/) });
    const mistakes = spec.sections.find((s) => s.kind === 'mistakes');
    expect(mistakes?.kind === 'mistakes' && mistakes.items).toHaveLength(3);
  });
});
