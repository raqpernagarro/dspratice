'use client';

import { Children, Component, createElement, Fragment, isValidElement, type ReactNode } from 'react';
import * as DS from 'ds-ngr';
import * as Lucide from 'lucide-react';
import { BLOCKED_PROPS, HTML_TAGS, isSafeUrl, overrideCss, typeLabel, type ElementType, type Expr, type KitSnapshot, type Param } from '@/lib/prototype/ir';

/**
 * Renders prototype IR with real DS-Ngr components. This is an interpreter
 * over a closed expression set — no source text is ever evaluated — with an
 * operation budget so a malformed tree cannot hang the tab.
 */

const BUDGET = 200_000;
const MAX_KIT_DEPTH = 32;

/** Per-render state: the operation budget and the team kit in scope. */
class Budget {
  left = BUDGET;
  depth = 0;
  constructor(
    public kit: KitSnapshot['components'] = {},
    /** The kit's default props per DS-Ngr component. */
    public defaults: Record<string, Record<string, unknown>> = {},
  ) {}
  tick() {
    if (--this.left < 0) throw new Error('Prototype is too large to render (operation budget exceeded).');
  }
}

type Env = Map<string, unknown>;

const lookup = (type: ElementType): unknown => {
  if (type.ns === 'icon') return (Lucide as Record<string, unknown>)[type.name];
  if (type.ns !== 'ds') return undefined;
  let cur = (DS as Record<string, unknown>)[type.name];
  for (const m of type.member ?? []) cur = cur && (cur as Record<string, unknown>)[m];
  return cur;
};

const isRenderable = (c: unknown) => typeof c === 'function' || (typeof c === 'object' && c !== null && '$$typeof' in c);

function Missing({ name }: { name: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        padding: 'var(--space-2xs) var(--space-xs)',
        border: 'var(--size-border-sm, 1px) dashed var(--color-border-feedback-error, currentColor)',
        borderRadius: 'var(--shape-radius-sm)',
        color: 'var(--color-foreground-error-strong)',
        fontSize: 'var(--font-size-body-sm)',
      }}
    >
      {`<${name}>`}
    </span>
  );
}

class Boundary extends Component<{ name: string; children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(err: Error) {
    return { error: err.message };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return <Missing name={`${this.props.name} failed: ${this.state.error.slice(0, 120)}`} />;
  }
}

/** Own-property read only: prototype chains (constructor, __proto__) are off-limits. */
const read = (obj: unknown, key: unknown): unknown => {
  if (obj === null || obj === undefined) return undefined;
  if (typeof key !== 'string' && typeof key !== 'number') return undefined;
  if (typeof obj === 'string' && key === 'length') return obj.length;
  if (Array.isArray(obj) && key === 'length') return obj.length;
  if (typeof obj !== 'object' && typeof obj !== 'string') return undefined;
  return Object.prototype.hasOwnProperty.call(obj, key) ? (obj as Record<string, unknown>)[key as string] : undefined;
};

function bindParams(params: Param[], args: unknown[], env: Env): Env {
  const next = new Map(env);
  params.forEach((p, i) => {
    if ('name' in p) next.set(p.name, args[i]);
    else for (const [key, local] of p.destructure) next.set(local, read(args[i], key));
  });
  return next;
}

function call(method: string, target: unknown, args: unknown[], budget: Budget): unknown {
  if (method === 'String') return String(args[0] ?? '');
  if (method === 'Number') return Number(args[0]);
  const fn = args[0] as ((...a: unknown[]) => unknown) | undefined;
  if (Array.isArray(target)) {
    budget.left -= target.length;
    switch (method) {
      case 'map': return typeof fn === 'function' ? target.map((x, i) => fn(x, i)) : target;
      case 'filter': return typeof fn === 'function' ? target.filter((x, i) => fn(x, i)) : target;
      case 'find': return typeof fn === 'function' ? target.find((x, i) => fn(x, i)) : undefined;
      case 'some': return typeof fn === 'function' ? target.some((x, i) => fn(x, i)) : false;
      case 'every': return typeof fn === 'function' ? target.every((x, i) => fn(x, i)) : true;
      case 'slice': return target.slice(args[0] as number, args[1] as number);
      case 'join': return target.join(typeof args[0] === 'string' ? args[0] : ',');
      case 'includes': return target.includes(args[0]);
      case 'concat': return target.concat(...args);
      case 'reverse': return [...target].reverse();
      default: return undefined;
    }
  }
  if (typeof target === 'string') {
    switch (method) {
      case 'toUpperCase': return target.toUpperCase();
      case 'toLowerCase': return target.toLowerCase();
      case 'trim': return target.trim();
      case 'includes': return target.includes(String(args[0]));
      case 'startsWith': return target.startsWith(String(args[0]));
      case 'endsWith': return target.endsWith(String(args[0]));
      case 'charAt': return target.charAt(Number(args[0]) || 0);
      case 'slice': return target.slice(args[0] as number, args[1] as number);
      case 'split': return target.split(String(args[0] ?? ''));
      case 'toString': return target;
      default: return undefined;
    }
  }
  if (typeof target === 'number') {
    switch (method) {
      case 'toFixed': return target.toFixed(Math.min(20, Math.max(0, Number(args[0]) || 0)));
      case 'toLocaleString': return target.toLocaleString('en');
      case 'toString': return String(target);
      default: return undefined;
    }
  }
  return undefined;
}

const sanitizeProps = (props: Record<string, unknown>) => {
  for (const key of Object.keys(props)) {
    if (BLOCKED_PROPS.has(key)) delete props[key];
    else if ((key === 'href' || key === 'src') && (typeof props[key] !== 'string' || !isSafeUrl(key, props[key] as string))) delete props[key];
  }
  return props;
};

function evaluate(e: Expr, env: Env, budget: Budget): unknown {
  budget.tick();
  switch (e.k) {
    case 'lit': return e.v;
    case 'undef': return undefined;
    case 'arr': return e.items.map((i) => evaluate(i, env, budget));
    case 'obj': {
      const out: Record<string, unknown> = {};
      for (const [k, v] of e.props) if (k !== '__proto__') out[k] = evaluate(v, env, budget);
      return out;
    }
    case 'ref': return env.get(e.name);
    case 'comp': return lookup(e.type);
    case 'mem': {
      const obj = evaluate(e.obj, env, budget);
      if (e.optional && (obj === null || obj === undefined)) return undefined;
      return read(obj, evaluate(e.prop, env, budget));
    }
    case 'cond': return evaluate(e.test, env, budget) ? evaluate(e.then, env, budget) : evaluate(e.else, env, budget);
    case 'log': {
      const l = evaluate(e.l, env, budget);
      if (e.op === '&&') return l ? evaluate(e.r, env, budget) : l;
      if (e.op === '||') return l ? l : evaluate(e.r, env, budget);
      return l ?? evaluate(e.r, env, budget);
    }
    case 'bin': {
      const l = evaluate(e.l, env, budget) as never;
      const r = evaluate(e.r, env, budget) as never;
      switch (e.op) {
        case '===': return l === r;
        case '!==': return l !== r;
        case '==': return l == r; // eslint-disable-line eqeqeq
        case '!=': return l != r; // eslint-disable-line eqeqeq
        case '<': return l < r;
        case '>': return l > r;
        case '<=': return l <= r;
        case '>=': return l >= r;
        case '+': return (l as number) + (r as number);
        case '-': return (l as number) - (r as number);
        case '*': return (l as number) * (r as number);
        case '/': return (l as number) / (r as number);
        case '%': return (l as number) % (r as number);
      }
      return undefined;
    }
    case 'un': {
      const v = evaluate(e.arg, env, budget);
      return e.op === '!' ? !v : e.op === '-' ? -(v as number) : +(v as number);
    }
    case 'tpl': {
      let out = e.quasis[0] ?? '';
      e.exprs.forEach((x, i) => (out += String(evaluate(x, env, budget) ?? '') + (e.quasis[i + 1] ?? '')));
      return out;
    }
    case 'fn': {
      const { params, body } = e;
      if (!body) return () => {};
      return (...args: unknown[]) => evaluate(body, bindParams(params, args, env), budget);
    }
    case 'call': {
      const target = evaluate(e.callee, env, budget);
      return call(e.method, target, e.args.map((a) => evaluate(a, env, budget)), budget);
    }
    case 'el': return renderElement(e, env, budget);
  }
}

function renderElement(e: Extract<Expr, { k: 'el' }>, env: Env, budget: Budget): ReactNode {
  const props = sanitizeProps(Object.fromEntries(e.props.map(([k, v]) => [k, evaluate(v, env, budget)])));
  // Keys from .map() output: let React assign stable ones.
  const children = e.children.map((c) => evaluate(c, env, budget)) as ReactNode[];
  const kids = children.length ? Children.toArray(children) : undefined;
  const label = typeLabel(e.type);

  if (e.type.ns === 'fragment') return createElement(Fragment, null, ...(kids ?? []));
  if (e.type.ns === 'html') {
    if (!HTML_TAGS.has(e.type.name)) return <Missing name={label} />;
    return createElement(e.type.name, props, ...(kids ?? []));
  }
  if (e.type.ns === 'kit') {
    const def = budget.kit[e.type.name];
    if (!def?.fn.body) return <Missing name={label} />;
    if (budget.depth >= MAX_KIT_DEPTH) return <Missing name={`${label}: nested too deep`} />;
    // A kit component is its function body evaluated with the element's props.
    budget.depth++;
    try {
      const out = evaluate(def.fn.body, bindParams(def.fn.params, [{ ...props, children: kids ?? props.children }], new Map()), budget) as ReactNode;
      return <Boundary name={label}>{out}</Boundary>;
    } catch (err) {
      if ((err as Error).message.includes('operation budget')) throw err;
      return <Missing name={`${label} failed: ${(err as Error).message.slice(0, 120)}`} />;
    } finally {
      budget.depth--;
    }
  }
  const comp = lookup(e.type);
  if (!isRenderable(comp)) return <Missing name={label} />;
  // Team defaults sit under the element's own props: what the screen says wins.
  const defaults = e.type.ns === 'ds' && !e.type.member?.length ? budget.defaults[e.type.name] : undefined;
  const merged = defaults ? { ...sanitizeProps({ ...defaults }), ...withoutUndefined(props) } : props;
  const el = createElement(comp as Parameters<typeof createElement>[0], merged, ...(kids ?? []));
  return e.type.ns === 'ds' ? <Boundary name={label}>{el}</Boundary> : el;
}

const withoutUndefined = (props: Record<string, unknown>) => Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined));

export function PrototypeRenderer({ root, kit }: { root: Expr; kit?: KitSnapshot | null }) {
  let out: unknown;
  const defaults = Object.fromEntries(Object.entries(kit?.overrides ?? {}).map(([name, o]) => [name, o.defaults]));
  try {
    out = evaluate(root, new Map(), new Budget(kit?.components, defaults));
  } catch (err) {
    return <Missing name={(err as Error).message} />;
  }
  if (out === null || out === undefined || typeof out === 'boolean') return null;
  if (isValidElement(out) || typeof out === 'string' || typeof out === 'number' || Array.isArray(out)) {
    const css = overrideCss(kit?.overrides);
    return (
      <>
        {css && <style id="dsn-kit-overrides">{css}</style>}
        <Boundary name="Prototype">{out as ReactNode}</Boundary>
      </>
    );
  }
  return <Missing name="Prototype root is not renderable" />;
}
