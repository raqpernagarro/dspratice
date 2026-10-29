/**
 * Prototype IR — the safe, serialisable form of an AI-written JSX screen.
 *
 * Source JSX is parsed (never executed) into this expression tree. The canvas
 * evaluates it with a small interpreter, so a shared prototype link can only
 * ever render DS-Ngr components, Lucide icons and a short list of HTML tags.
 *
 * Shared by server (compile, validate) and client (render) — keep it pure.
 */

export type ElementType =
  | { ns: 'ds'; name: string; member?: string[] } // <Button>, <Command.Item>
  | { ns: 'icon'; name: string } // <Search />
  | { ns: 'kit'; name: string } // <ProjectCard> from the team kit
  | { ns: 'html'; name: string } // <div>
  | { ns: 'fragment' };

export type Expr =
  | { k: 'lit'; v: string | number | boolean | null }
  | { k: 'undef' }
  | { k: 'arr'; items: Expr[] }
  | { k: 'obj'; props: [string, Expr][] }
  | { k: 'el'; type: ElementType; props: [string, Expr][]; children: Expr[]; loc?: number }
  /** A component or icon passed by reference, e.g. icon={Rocket}. */
  | { k: 'comp'; type: ElementType }
  /** A function parameter in scope. */
  | { k: 'ref'; name: string }
  | { k: 'mem'; obj: Expr; prop: Expr; optional?: boolean }
  | { k: 'cond'; test: Expr; then: Expr; else: Expr }
  | { k: 'log'; op: '&&' | '||' | '??'; l: Expr; r: Expr }
  | { k: 'bin'; op: BinaryOp; l: Expr; r: Expr }
  | { k: 'un'; op: '!' | '-' | '+'; arg: Expr }
  | { k: 'tpl'; quasis: string[]; exprs: Expr[] }
  /** Arrow/function. `body: null` is an event handler kept as a no-op. */
  | { k: 'fn'; params: Param[]; body: Expr | null }
  | { k: 'call'; callee: Expr; method: CallMethod; args: Expr[] };

export type Param = { name: string } | { destructure: [string, string][] };

export const BINARY_OPS = ['===', '!==', '==', '!=', '<', '>', '<=', '>=', '+', '-', '*', '/', '%'] as const;
export type BinaryOp = (typeof BINARY_OPS)[number];

/** Methods the interpreter will call; everything else is rejected at compile time. */
export const CALL_METHODS = [
  'map', 'filter', 'slice', 'join', 'includes', 'find', 'some', 'every', 'concat', 'reverse',
  'toUpperCase', 'toLowerCase', 'trim', 'toFixed', 'toLocaleString', 'toString', 'charAt', 'startsWith', 'endsWith', 'split',
  // global helpers: String(x), Number(x)
  'String', 'Number',
] as const;
export type CallMethod = (typeof CALL_METHODS)[number];

export type Severity = 'error' | 'warning' | 'info';

export interface Issue {
  severity: Severity;
  rule: string;
  message: string;
  /** 1-based source line, when known. */
  line?: number;
}

export interface CompileResult {
  ok: boolean;
  root: Expr | null;
  issues: Issue[];
}

export const typeLabel = (t: ElementType): string =>
  t.ns === 'fragment' ? 'Fragment' : t.ns === 'ds' && t.member?.length ? [t.name, ...t.member].join('.') : t.name;

/** HTML the canvas will render. Layout and inline text only — no scripts, frames, forms or embeds. */
export const HTML_TAGS = new Set([
  'div', 'span', 'section', 'header', 'footer', 'main', 'nav', 'aside', 'article',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'strong', 'em', 'b', 'i', 'small', 'code', 'br', 'hr', 'img', 'a', 'label',
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
]);

/** Props the canvas drops on every element, whatever the source says. */
export const BLOCKED_PROPS = new Set(['dangerouslySetInnerHTML', 'ref', 'srcDoc', 'formAction']);

/** Only http(s), mailto, relative and in-page URLs survive in href/src. Images may also be data: URIs. */
export const isSafeUrl = (prop: string, value: string): boolean => {
  // Browsers ignore tabs, newlines and control characters inside a scheme ("java\nscript:").
  const v = value.replace(/[\u0000-\u0020\u007f]/g, '').toLowerCase();
  if (/^(https?:|mailto:|#|\/(?!\/)|\.)/.test(v) || !/^[a-z][a-z0-9+.-]*:/.test(v)) return true;
  return prop === 'src' && /^data:image\/(png|jpe?g|gif|webp|svg\+xml);/.test(v);
};

// ─── Team kits ───────────────────────────────────────────────────────────────

export type FnExpr = Extract<Expr, { k: 'fn' }>;

/** A team composition built from DS-Ngr parts, written in the same JSX subset. */
export interface KitComponent {
  name: string;
  description: string;
  source: string;
  /** Prop names it reads (from its destructured parameter). */
  params: string[];
  fn: FnExpr;
  issues: Issue[];
}

export interface KitPattern {
  name: string;
  description: string;
  /** Example screen showing the pattern. */
  source: string;
}

/**
 * A team's layer on top of one DS-Ngr component: its own component tokens
 * pointed at other tokens, and default prop values. Never a fork of the source.
 */
export interface KitOverride {
  tokens: Record<string, string>;
  defaults: Record<string, string | number | boolean>;
  note: string;
}

/** What a prototype carries to render kit components: name → function. */
export interface KitSnapshot {
  id: string;
  version: number;
  components: Record<string, { params: string[]; fn: FnExpr }>;
  /** DS-Ngr component name → the kit's override of it. */
  overrides?: Record<string, Pick<KitOverride, 'tokens' | 'defaults'>>;
}

const TOKEN_NAME_RE = /^--[a-z0-9-]+$/;
const TOKEN_REF_RE = /^var\(--[a-z0-9-]+\)$/;

/**
 * Override tokens as one CSS rule. Re-checks every name and value, so stored
 * data that skipped validation still can't inject CSS. The repeated :root
 * outranks tokens.css and the theme layer in both modes.
 */
export function overrideCss(overrides: KitSnapshot['overrides']): string {
  const decls = Object.values(overrides ?? {}).flatMap((o) =>
    Object.entries(o.tokens).filter(([k, v]) => TOKEN_NAME_RE.test(k) && TOKEN_REF_RE.test(v)).map(([k, v]) => `${k}:${v}`),
  );
  return decls.length ? `:root:root:root:root{${decls.join(';')}}` : '';
}
