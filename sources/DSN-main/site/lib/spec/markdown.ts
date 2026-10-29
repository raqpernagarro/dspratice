import { SECTION_HEADINGS, type ComponentSpec, type KnownKind, type SpecSection, type TableRow } from './types';

/**
 * ComponentSpec ↔ `.spec.md`. parse(render(spec)) returns the same spec, and
 * parsing an existing spec never loses text: a section whose content doesn't
 * fit its typed shape comes back as `custom` markdown under its heading.
 */

const FENCE = /^(```|~~~)/;
const lines = (s: string) => s.replace(/\r\n/g, '\n').split('\n');
const trimBlock = (ls: string[]) => ls.join('\n').replace(/^\n+|\s+$/g, '');

// ─── render ──────────────────────────────────────────────────────────────────

const row = (cells: string[]) => `| ${cells.map((c) => c.replace(/\|/g, '\\|').trim()).join(' | ')} |`;
const table = (rows: TableRow[]) => (rows.length ? [row(rows[0]), row(rows[0].map(() => '---')), ...rows.slice(1).map(row)].join('\n') : '');
const join = (...parts: string[]) => parts.filter((p) => p.trim()).join('\n\n');
const bullets = (items: string[], prefix = '- ') => items.filter((i) => i.trim()).map((i) => prefix + i.trim()).join('\n');

function renderBody(s: SpecSection): string {
  switch (s.kind) {
    case 'whatItIs': return s.text.trim();
    case 'whenToUse':
    case 'whenNotToUse': return join(s.lead, bullets(s.items));
    case 'variants': return join(s.lead, ...s.tables.map((t) => join(`### ${t.heading.trim()}`, table(t.rows))));
    case 'spatial': {
      const f = [['Owns its padding', s.ownsPadding], ['Owns its margin', s.ownsMargin], ['Fills its container', s.fillsContainer], ['Notes', s.notes]] as const;
      return join(s.lead, f.filter(([, v]) => v.trim()).map(([k, v]) => `- **${k}:** ${v.trim()}`).join('\n'));
    }
    case 'composition': return join(s.lead, [bullets(s.allowed, '- ✅ '), bullets(s.never, '- ❌ ')].filter(Boolean).join('\n'));
    case 'props': return join(s.lead, s.rows.length ? table([['Prop', 'Type', 'When to set'], ...s.rows.map((r) => [r.prop, r.type, r.when])]) : '');
    case 'mistakes': return join(s.lead, s.items.filter((m) => m.mistake.trim()).map((m, i) => `${i + 1}. **${m.mistake.trim()}**${m.fix.trim() ? ` — ${m.fix.trim()}` : ''}`).join('\n'));
    case 'examples': return join(s.lead, ...s.blocks.filter((b) => b.code.trim()).map((b) => `\`\`\`${b.lang}\n${b.code.replace(/\s+$/, '')}\n\`\`\``));
    case 'custom': return s.body.trim();
  }
}

const headingOf = (s: SpecSection) => (s.kind === 'custom' ? s.heading : SECTION_HEADINGS[s.kind]);

export function renderSpec(spec: ComponentSpec): string {
  const meta = [
    spec.tier.trim() && `**Tier:** ${spec.tier.trim()}`,
    spec.location.trim() && `**Location:** \`${spec.location.trim()}\``,
    spec.version.trim() && `**Version:** ${spec.version.trim()}`,
    ...spec.metaExtra,
  ].filter(Boolean).join('  \n');
  const sections = spec.sections.map((s) => `## ${headingOf(s).trim()}\n\n${renderBody(s)}`.trimEnd() + (s.hr ? '\n\n---' : ''));
  return [spec.preamble?.trim() ?? '', `# ${spec.name.trim()}`, meta, spec.intro.trim(), ...sections].filter(Boolean).join('\n\n') + '\n';
}

// ─── parse ───────────────────────────────────────────────────────────────────

const BY_HEADING = new Map(Object.entries(SECTION_HEADINGS).map(([k, h]) => [h.toLowerCase(), k as KnownKind]));

/** Splits a body into a leading prose block and the rest, at the first line that matches `start`. */
function lead(body: string[], start: (l: string) => boolean): [string, string[]] {
  const i = body.findIndex((l) => start(l) || FENCE.test(l));
  return i < 0 ? [trimBlock(body), []] : [trimBlock(body.slice(0, i)), body.slice(i)];
}

const cells = (l: string) =>
  l.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.replace(/\\\|/g, '|').trim());
const isSep = (l: string) => /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l.trim());

/** A markdown table at the top of `ls` (header, separator, rows) and the lines after it. */
function readTable(ls: string[]): [TableRow[], string[]] | null {
  if (!ls[0]?.trim().startsWith('|') || !isSep(ls[1] ?? '')) return null;
  const rows: TableRow[] = [cells(ls[0])];
  let i = 2;
  for (; i < ls.length && ls[i].trim().startsWith('|'); i++) rows.push(cells(ls[i]));
  return [rows, ls.slice(i)];
}

const nonBlank = (ls: string[]) => ls.filter((l) => l.trim());

/** Every non-blank line must match `re`; returns the captures, or null. */
function all<T>(ls: string[], re: RegExp, pick: (m: RegExpExecArray) => T): T[] | null {
  const out: T[] = [];
  for (const l of nonBlank(ls)) {
    const m = re.exec(l);
    if (!m) return null;
    out.push(pick(m));
  }
  return out;
}

const BULLET = /^- (.+)$/;

function parseKnown(kind: KnownKind, body: string[]): SpecSection | null {
  switch (kind) {
    case 'whatItIs': return { kind, text: trimBlock(body) };
    case 'whenToUse':
    case 'whenNotToUse': {
      const [l, rest] = lead(body, (x) => BULLET.test(x));
      const items = all(rest, BULLET, (m) => m[1].trim());
      return items && { kind, lead: l, items };
    }
    case 'variants': {
      const [l, rest] = lead(body, (x) => x.startsWith('### ') || x.trim().startsWith('|'));
      const tables: { heading: string; rows: TableRow[] }[] = [];
      let ls = rest;
      while (nonBlank(ls).length) {
        while (ls.length && !ls[0].trim()) ls = ls.slice(1);
        const h = /^### (.+)$/.exec(ls[0] ?? '');
        if (!h) return null;
        ls = ls.slice(1);
        while (ls.length && !ls[0].trim()) ls = ls.slice(1);
        const t = readTable(ls);
        if (!t) return null;
        tables.push({ heading: h[1].trim(), rows: t[0] });
        ls = t[1];
      }
      return { kind, lead: l, tables };
    }
    case 'spatial': {
      const [l, rest] = lead(body, (x) => BULLET.test(x));
      const f = all(rest, /^- \*\*(Owns its padding|Owns its margin|Fills its container|Notes):\*\*\s*(.*)$/, (m) => [m[1], m[2].trim()] as const);
      if (!f || new Set(f.map(([k]) => k)).size !== f.length) return null;
      const get = (k: string) => f.find(([key]) => key === k)?.[1] ?? '';
      return { kind, lead: l, ownsPadding: get('Owns its padding'), ownsMargin: get('Owns its margin'), fillsContainer: get('Fills its container'), notes: get('Notes') };
    }
    case 'composition': {
      const [l, rest] = lead(body, (x) => BULLET.test(x));
      const f = all(rest, /^- (✅|❌) (.+)$/, (m) => [m[1], m[2].trim()] as const);
      if (!f) return null;
      // Order is part of the content: all ✅ before ❌, or it can't round-trip.
      const firstNever = f.findIndex(([k]) => k === '❌');
      if (firstNever >= 0 && f.slice(firstNever).some(([k]) => k === '✅')) return null;
      return { kind, lead: l, allowed: f.filter(([k]) => k === '✅').map(([, v]) => v), never: f.filter(([k]) => k === '❌').map(([, v]) => v) };
    }
    case 'props': {
      const [l, rest] = lead(body, (x) => x.trim().startsWith('|'));
      if (!nonBlank(rest).length) return { kind, lead: l, rows: [] };
      const t = readTable(rest);
      if (!t || nonBlank(t[1]).length || t[0][0].length !== 3 || t[0].slice(1).some((r) => r.length !== 3)) return null;
      if (t[0][0].join('|').toLowerCase() !== 'prop|type|when to set') return null;
      return { kind, lead: l, rows: t[0].slice(1).map(([prop, type, when]) => ({ prop, type, when })) };
    }
    case 'mistakes': {
      const [l, rest] = lead(body, (x) => /^\d+\. /.test(x));
      const items = all(rest, /^\d+\. \*\*(.+?)\*\*(?: — (.+))?$/, (m) => ({ mistake: m[1].trim(), fix: (m[2] ?? '').trim() }));
      return items && { kind, lead: l, items };
    }
    case 'examples': {
      const [l, rest] = lead(body, () => false);
      const blocks: { lang: string; code: string }[] = [];
      for (let i = 0; i < rest.length; i++) {
        if (!rest[i].trim()) continue;
        const open = /^(```|~~~)(\S*)\s*$/.exec(rest[i]);
        if (!open) return null;
        const code: string[] = [];
        for (i++; i < rest.length && !rest[i].startsWith(open[1]); i++) code.push(rest[i]);
        if (i >= rest.length) return null;
        blocks.push({ lang: open[2] || 'tsx', code: code.join('\n').replace(/\s+$/, '') });
      }
      return { kind, lead: l, blocks };
    }
  }
}

export function parseSpec(md: string): ComponentSpec {
  const ls = lines(md);
  const spec: ComponentSpec = { name: '', tier: '', location: '', version: '', metaExtra: [], intro: '', sections: [] };
  let i = 0;
  const titleAt = ls.findIndex((l) => /^# /.test(l));
  if (titleAt > 0 && !ls.slice(0, titleAt).some((l) => /^## /.test(l))) {
    spec.preamble = trimBlock(ls.slice(0, titleAt));
    i = titleAt;
  }
  while (i < ls.length && !ls[i].trim()) i++;
  const title = /^# (.+)$/.exec(ls[i] ?? '');
  if (title) {
    spec.name = title[1].trim();
    i++;
  }

  // Meta lines, then intro, up to the first `## ` outside a fence.
  const pre: string[] = [];
  let inFence = false;
  for (; i < ls.length; i++) {
    if (FENCE.test(ls[i])) inFence = !inFence;
    if (!inFence && /^## /.test(ls[i])) break;
    pre.push(ls[i]);
  }
  let p = 0;
  while (p < pre.length && !pre[p].trim()) p++;
  for (; p < pre.length; p++) {
    const m = /^\*\*([^*]+):\*\*\s*(.*?)\s*$/.exec(pre[p]);
    if (!m) break;
    const v = m[2];
    if (m[1] === 'Tier') spec.tier = v;
    else if (m[1] === 'Location') spec.location = v.replace(/^`|`$/g, '');
    else if (m[1] === 'Version') spec.version = v;
    else spec.metaExtra.push(pre[p].replace(/\s+$/, ''));
  }
  spec.intro = trimBlock(pre.slice(p));

  while (i < ls.length) {
    const heading = ls[i].slice(3).trim();
    const body: string[] = [];
    inFence = false;
    for (i++; i < ls.length; i++) {
      if (FENCE.test(ls[i])) inFence = !inFence;
      if (!inFence && /^## /.test(ls[i])) break;
      body.push(ls[i]);
    }
    // A trailing `---` rule separates sections; it is not section content.
    while (body.length && !body.at(-1)!.trim()) body.pop();
    const hr = body.length > 0 && /^---\s*$/.test(body.at(-1)!);
    if (hr) body.pop();
    const kind = BY_HEADING.get(heading.toLowerCase());
    const known = kind && parseKnown(kind, body);
    const section: SpecSection = known || { kind: 'custom', heading, body: trimBlock(body) };
    spec.sections.push(hr ? { ...section, hr } : section);
  }
  return spec;
}
