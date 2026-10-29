import 'server-only';
import * as Lucide from 'lucide-react';
import { getIndex, getTokenNames, isPrimitiveToken } from '@/lib/ds-knowledge';
import { isTitleCase } from '@/lib/rules/lint';
import { BLOCKED_PROPS, HTML_TAGS, isSafeUrl, typeLabel, type Expr, type Issue } from './ir';

/**
 * Checks a compiled prototype against DS-Ngr's own sources: ds-index.json for
 * components and values, tokens.css for custom properties, and the AI.md rules
 * that can be decided from static JSX. Errors break the design system; warnings
 * are rule violations a reviewer would flag; info is context for the author.
 */

type El = Extract<Expr, { k: 'el' }>;

const lit = (props: [string, Expr][], name: string): string | number | boolean | null | undefined => {
  const e = props.find(([n]) => n === name)?.[1];
  return e?.k === 'lit' ? e.v : undefined;
};
const has = (props: [string, Expr][], name: string) => props.some(([n]) => n === name);

/** Static text inside an expression (children or a string prop). */
const textOf = (e: Expr | undefined): string =>
  !e ? '' : e.k === 'lit' && typeof e.v === 'string' ? e.v : e.k === 'el' ? e.children.map(textOf).join(' ') : e.k === 'arr' ? e.items.map(textOf).join(' ') : '';

const SPACING_KEYS = /^(padding|margin|gap|rowGap|columnGap|minHeight)/;
const PX_KEYS = /^(padding|margin|gap|rowGap|columnGap|top|right|bottom|left|inset|fontSize|width|height|minWidth|maxWidth|minHeight|maxHeight|borderRadius|borderWidth)/;
const COLOR_RE = /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|oklch|oklab|lab|lch)\(/i;
const LABEL_BLOCKLIST = new Set(['ok', 'okay', 'confirm', 'yes', 'no', 'submit']);
/** Text props that carry user-facing copy and must be sentence case. */
const COPY_PROPS = ['title', 'label', 'heading', 'description'];


const levenshtein = (a: string, b: string) => {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
};

export const suggest = (name: string, pool: Iterable<string>) => {
  let best: string | null = null;
  let score = Math.max(2, Math.floor(name.length / 3));
  const lower = name.toLowerCase();
  for (const cand of pool) {
    const d = levenshtein(lower, cand.toLowerCase());
    if (d < score || (d === score && best === null)) {
      best = cand;
      score = d;
    }
  }
  return best;
};

export interface ValidateOptions {
  /** Kit components in scope: name → prop names it reads. */
  kit?: Record<string, { params: string[] }>;
  /** Validating a kit component body, not a screen: skip page-level checks. */
  component?: boolean;
}

export function validate(root: Expr, opts: ValidateOptions = {}): Issue[] {
  const issues: Issue[] = [];
  const index = getIndex();
  const tokens = getTokenNames();
  const add = (severity: Issue['severity'], rule: string, message: string, line?: number) => {
    // One report per rule+message keeps .map() output from flooding the list.
    if (!issues.some((i) => i.rule === rule && i.message === message)) issues.push({ severity, rule, message, line });
  };

  const counts = { primary: 0, appShell: 0 };

  const checkTokens = (value: string, line?: number) => {
    for (const m of value.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g)) {
      const name = m[1];
      if (!tokens.has(name)) {
        const hint = suggest(name, tokens);
        add('error', 'unknown-token', `Token \`${name}\` does not exist.${hint ? ` Did you mean \`${hint}\`?` : ''}`, line);
      } else if (isPrimitiveToken(name)) {
        add('error', 'primitive-token', `\`${name}\` is a primitive — use a semantic token (e.g. --color-foreground-*, --space-*).`, line);
      }
    }
  };

  const checkStyle = (el: El, style: Expr, isDs: boolean) => {
    if (style.k !== 'obj') return;
    const label = typeLabel(el.type);
    for (const [key, v] of style.props) {
      if (isDs && SPACING_KEYS.test(key)) {
        add('error', 'spacing-override', `Never put \`${key}\` on <${label}> — apply space tokens to a wrapper element instead.`, el.loc);
      }
      if (key === 'fontFamily') add('error', 'font-family', 'Never set fontFamily — typography is inherited from the design system.', el.loc);
      if (v.k !== 'lit') continue;
      if (typeof v.v === 'string') {
        if (COLOR_RE.test(v.v)) add('error', 'hardcoded-color', `Hardcoded color in \`${key}: ${v.v}\` — use a --color-* token.`, el.loc);
        if (/\d(px|rem|em)\b/.test(v.v) && PX_KEYS.test(key) && !/^(\s*0(px)?\s*)$/.test(v.v)) {
          add('warning', 'hardcoded-size', `\`${key}: ${v.v}\` — use a token (--space-*, --size-*, --font-size-*, --shape-radius-*).`, el.loc);
        }
      } else if (typeof v.v === 'number' && v.v !== 0 && PX_KEYS.test(key)) {
        add('warning', 'hardcoded-size', `\`${key}: ${v.v}\` is ${v.v}px — use a token (--space-*, --size-*, --font-size-*).`, el.loc);
      }
    }
  };

  const checkElement = (el: El, ancestors: El[]) => {
    const label = typeLabel(el.type);
    const within = (name: string) => ancestors.some((a) => a.type.ns === 'ds' && a.type.name === name && !a.type.member?.length);

    for (const [name, v] of el.props) {
      if (BLOCKED_PROPS.has(name)) add('error', 'blocked-prop', `\`${name}\` is not allowed in prototypes and is removed.`, el.loc);
      if ((name === 'href' || name === 'src') && v.k === 'lit' && typeof v.v === 'string' && !isSafeUrl(name, v.v)) {
        add('error', 'unsafe-url', `Unsafe URL in \`${name}\` on <${label}> — it is removed.`, el.loc);
      }
    }

    if (el.type.ns === 'html') {
      const tag = el.type.name;
      if (!HTML_TAGS.has(tag)) {
        add('error', 'unknown-element', tag === 'table' ? '<table> is not rendered — use DataTable.' : `<${tag}> is not rendered on the canvas — use a DS-Ngr component.`, el.loc);
      }
      if (/^h[1-6]$/.test(tag)) add('warning', 'raw-heading', `<${tag}> — use SectionHeader for titles, or Card/Modal/Drawer \`title\`.`, el.loc);
      const style = el.props.find(([n]) => n === 'style')?.[1];
      if (/^(h[1-6]|p)$/.test(tag) && style?.k === 'obj' && style.props.some(([k]) => /^font/.test(k))) {
        add('warning', 'raw-typography', `<${tag}> with custom font styling — typography comes from the design system.`, el.loc);
      }
      if (style) checkStyle(el, style, false);
      return;
    }
    if (el.type.ns === 'kit') {
      const def = opts.kit?.[el.type.name];
      if (!def) {
        add('error', 'unknown-component', `<${label}> is not in this team kit.`, el.loc);
        return;
      }
      if (def.params.length) {
        for (const [name] of el.props) {
          if (name !== 'key' && name !== 'children' && !def.params.includes(name)) {
            add('warning', 'unknown-prop', `<${label}> has no \`${name}\` prop — it reads: ${def.params.join(', ')}.`, el.loc);
          }
        }
      }
      return;
    }
    if (el.type.ns !== 'ds') return;

    const entry = index.components[el.type.name];
    if (!entry) {
      const hint = suggest(el.type.name, [...Object.keys(index.components), ...Object.keys(Lucide).filter((n) => /^[A-Z]/.test(n) && !/(Icon|^Lucide)/.test(n))]);
      add('error', 'unknown-component', `<${label}> is not a DS-Ngr component or Lucide icon.${hint ? ` Did you mean <${hint}>?` : ''}`, el.loc);
      return;
    }
    if (el.type.member?.length) return; // Command.Item etc. — sub-part props aren't indexed.

    const name = el.type.name;
    // `values` is only indexed when the prop type is a closed string-literal union, so anything else is invalid.
    for (const [prop, v] of el.props) {
      const allowed = entry.props[prop]?.values;
      if (!allowed?.length || v.k !== 'lit' || typeof v.v !== 'string' || allowed.includes(v.v)) continue;
      add('error', 'invalid-value', `<${name} ${prop}="${v.v}"> is not a valid value — use one of: ${allowed.join(', ')}.`, el.loc);
    }

    const style = el.props.find(([n]) => n === 'style')?.[1];
    if (style) checkStyle(el, style, true);

    if (name === 'AppShell') {
      counts.appShell++;
      const parent = ancestors.at(-1);
      const pStyle = parent?.props.find(([n]) => n === 'style')?.[1];
      const ok = parent?.type.ns === 'html' && pStyle?.k === 'obj' && pStyle.props.some(([k, v]) => k === 'height' && v.k === 'lit' && v.v === '100vh');
      if (!ok) add('warning', 'appshell-wrapper', 'AppShell must sit inside <div style={{ height: \'100vh\', display: \'flex\' }}>.', el.loc);
      if (style) add('error', 'appshell-sizing', 'Never size or pad AppShell itself.', el.loc);
    }
    if (name === 'Sidebar' && has(el.props, 'collapsed')) add('warning', 'sidebar-collapsed', 'Never pass `collapsed` to Sidebar — AppShell controls it.', el.loc);
    if (name === 'DataTable' && within('Card')) add('error', 'datatable-in-card', 'DataTable is never wrapped in a Card — it is always full-width.', el.loc);
    if (name === 'Card') {
      if (lit(el.props, 'showHeader') === false || !has(el.props, 'title')) {
        add('warning', 'card-header', 'Cards always have a header — set `title` (and `showBottomBar={false}` when there is no footer).', el.loc);
      }
      if (el.children.some((c) => c.k === 'el' && c.type.ns === 'ds' && c.type.name === 'SectionHeader')) {
        add('warning', 'card-sectionheader', 'Use Card props (`title`, `headerSize`) instead of mounting SectionHeader inside a Card.', el.loc);
      }
    }
    if (name === 'Tag' && has(el.props, 'onClick')) add('warning', 'tag-interactive', 'Tags are non-interactive — use Chip for a selectable option.', el.loc);
    if (name === 'Button') {
      const variant = lit(el.props, 'variant');
      if (variant === 'primary') {
        counts.primary++;
        if (within('Card') && !(within('Form') && lit(el.props, 'type') === 'submit')) {
          add('warning', 'primary-in-card', 'The primary CTA belongs in Navbar `rightActions`, never inside a Card.', el.loc);
        }
      }
      if (has(el.props, 'style')) add('error', 'button-position', 'Never style or position a Button directly.', el.loc);
      const text = textOf({ k: 'arr', items: el.children }).trim();
      if (LABEL_BLOCKLIST.has(text.toLowerCase())) add('warning', 'button-label', `Button label "${text}" — use a specific verb ("Save changes", "Delete project").`, el.loc);
    }

    // Copy checks on the component's own text and its text props.
    const copy = [
      ['children', textOf({ k: 'arr', items: el.children })],
      ...COPY_PROPS.map((p) => [p, typeof lit(el.props, p) === 'string' ? (lit(el.props, p) as string) : ''] as const),
    ] as const;
    for (const [where, text] of copy) {
      if (text && isTitleCase(text) && ['Button', 'Tag', 'Chip', 'SectionHeader', 'Card', 'Navbar', 'Modal', 'Drawer', 'EmptyState', 'Tab', 'Callout'].includes(name)) {
        add('warning', 'sentence-case', `"${text}" on <${name}${where === 'children' ? '' : ` ${where}`}> — use sentence case.`, el.loc);
      }
    }
  };

  const walk = (e: Expr, ancestors: El[]) => {
    switch (e.k) {
      case 'lit':
        if (typeof e.v === 'string' && e.v.includes('var(')) checkTokens(e.v, ancestors.at(-1)?.loc);
        return;
      case 'el': {
        checkElement(e, ancestors);
        const next = e.type.ns === 'fragment' ? ancestors : [...ancestors, e];
        // A Card's bottom bar is its footer, not its content: form pages put the submit there (specs/patterns/form-page.md).
        const isCard = e.type.ns === 'ds' && e.type.name === 'Card' && !e.type.member?.length;
        for (const [name, v] of e.props) walk(v, isCard && name.startsWith('bottomBar') ? ancestors : next);
        for (const c of e.children) walk(c, next);
        return;
      }
      case 'arr':
        return e.items.forEach((i) => walk(i, ancestors));
      case 'obj':
        return e.props.forEach(([, v]) => walk(v, ancestors));
      case 'mem':
        walk(e.obj, ancestors);
        return walk(e.prop, ancestors);
      case 'cond':
        walk(e.test, ancestors);
        walk(e.then, ancestors);
        return walk(e.else, ancestors);
      case 'log':
      case 'bin':
        walk(e.l, ancestors);
        return walk(e.r, ancestors);
      case 'un':
        return walk(e.arg, ancestors);
      case 'tpl':
        e.quasis.forEach((q) => checkTokens(q, ancestors.at(-1)?.loc));
        return e.exprs.forEach((x) => walk(x, ancestors));
      case 'fn':
        if (e.body) walk(e.body, ancestors);
        return;
      case 'call':
        walk(e.callee, ancestors);
        return e.args.forEach((a) => walk(a, ancestors));
      default:
        return;
    }
  };

  walk(root, []);

  if (!opts.component) {
    if (counts.primary > 1) add('warning', 'one-primary', `${counts.primary} primary buttons — keep one primary action per view.`);
    if (counts.appShell === 0) add('info', 'no-appshell', 'No AppShell — fine for a component sketch; full pages should use AppShell.');
  }

  const order = { error: 0, warning: 1, info: 2 };
  return issues.sort((a, b) => order[a.severity] - order[b.severity] || (a.line ?? 0) - (b.line ?? 0));
}
