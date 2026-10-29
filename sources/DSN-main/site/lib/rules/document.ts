import { parseRule } from './markdown';
import type { Rule } from './types';

/**
 * AI.md as a list of editable blocks: each `## ` section's intro (the text
 * before its first `### `) and each `### ` subsection. Numbered subsections
 * (NAV-05a, LCB-11) also parse as rules, so the rule form can edit them.
 *
 * Edits are by block text, not line numbers: the editor sends the block as it
 * saw it, and the change applies only if the file still has exactly that
 * text — someone else's edit in between is a conflict, never overwritten.
 */

export interface DocBlock {
  /** Stable while the heading doesn't change: "Layout & component behavior rules › LCB-11". */
  key: string;
  level: 2 | 3;
  /** Heading text without the hashes; '' for the file's preamble. */
  heading: string;
  /** The `## ` section this block belongs to. */
  section: string;
  /** Exact text of the block, heading line included, without trailing blank lines. */
  text: string;
  rule: Rule | null;
}

const lines = (md: string) => md.replace(/\r\n/g, '\n').split('\n');

interface Span { start: number; end: number; level: 0 | 2 | 3; heading: string }

/** Heading spans, fence-aware. A block ends where the next heading of any level starts. */
function spans(ls: string[]): Span[] {
  const out: Span[] = [{ start: 0, end: ls.length, level: 0, heading: '' }];
  let inFence = false;
  ls.forEach((l, i) => {
    if (/^(```|~~~)/.test(l)) inFence = !inFence;
    const m = !inFence && /^(##|###) (.+)$/.exec(l);
    if (!m) return;
    out.at(-1)!.end = i;
    out.push({ start: i, end: ls.length, level: m[1].length as 2 | 3, heading: m[2].trim() });
  });
  return out;
}

const blockText = (ls: string[], s: Span) => {
  const body = ls.slice(s.start, s.end);
  while (body.length && !body.at(-1)!.trim()) body.pop();
  return body.join('\n');
};

export function outline(md: string): DocBlock[] {
  const ls = lines(md);
  let section = '';
  const seen = new Map<string, number>();
  return spans(ls).map((s) => {
    if (s.level === 2) section = s.heading;
    const id = s.level === 3 ? (/^([A-Z]{2,4}-\d+[a-z]?)/.exec(s.heading)?.[1] ?? s.heading) : s.heading;
    let key = s.level === 0 ? '(top)' : s.level === 2 ? section : `${section} › ${id}`;
    // Headings can repeat (e.g. two "Examples" in one section); keep keys unique.
    const n = (seen.get(key) ?? 0) + 1;
    seen.set(key, n);
    if (n > 1) key = `${key} (${n})`;
    const text = blockText(ls, s);
    return { key, level: s.level === 0 ? 2 : s.level, heading: s.heading, section, text, rule: s.level === 3 ? parseRule(text) : null };
  });
}

export class ConflictError extends Error {}

function locate(md: string, key: string, original: string) {
  const ls = lines(md);
  const all = spans(ls);
  const blocks = outline(md);
  const i = blocks.findIndex((b) => b.key === key);
  if (i < 0) throw new ConflictError(`“${key}” is no longer in AI.md.`);
  if (blocks[i].text !== original.replace(/\s+$/, '')) throw new ConflictError(`“${key}” changed in AI.md since you opened it. Reload and redo your edit.`);
  return { ls, span: all[i] };
}

/** Replaces one block's text. `text` keeps its own heading line; the blank line before the next block is kept. */
export function replaceBlock(md: string, key: string, original: string, text: string): string {
  const { ls, span } = locate(md, key, original);
  const body = ls.slice(span.start, span.end);
  let tail = 0;
  while (tail < body.length && !body[body.length - 1 - tail].trim()) tail++;
  const next = text.replace(/\r\n/g, '\n').replace(/\s+$/, '');
  const replacement = next ? [...next.split('\n'), ...Array(Math.max(tail, span.end < ls.length ? 1 : 0)).fill('')] : [];
  return [...ls.slice(0, span.start), ...replacement, ...ls.slice(span.end)].join('\n');
}

export const deleteBlock = (md: string, key: string, original: string) => replaceBlock(md, key, original, '');
