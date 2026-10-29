import 'server-only';
import { parse } from '@babel/parser';
import type * as t from '@babel/types';
import * as Lucide from 'lucide-react';
import { getIndex } from '@/lib/ds-knowledge';
import { BINARY_OPS, CALL_METHODS, type BinaryOp, type CallMethod, type ElementType, type Expr, type FnExpr, type Issue, type Param } from './ir';

/**
 * JSX source → prototype IR. The source is parsed, never run: anything the IR
 * cannot express (loops, hooks other than useState, arbitrary calls, imports
 * of other packages) is reported as an issue and left out of the tree.
 */

const NON_ICON_EXPORTS = new Set(['icons', 'Icon', 'createLucideIcon', 'LucideProvider', 'useLucideContext']);
export const isLucideIcon = (name: string): boolean =>
  !NON_ICON_EXPORTS.has(name) && /^[A-Z]/.test(name) && name in Lucide;

const MAX_SOURCE = 200_000;

type Binding = { kind: 'ds'; name: string } | { kind: 'icon'; name: string } | { kind: 'react' };

interface Ctx {
  issues: Issue[];
  imports: Map<string, Binding>;
  /** Top-level and component-body consts, converted lazily. */
  consts: Map<string, t.Expression>;
  resolved: Map<string, Expr>;
  resolving: Set<string>;
  /** Function parameter names in scope, innermost last. */
  params: Set<string>[];
  dsNames: Set<string>;
  /** Team kit component names in scope. */
  kitNames: Set<string>;
}

const line = (n: t.Node) => n.loc?.start.line;

const fail = (ctx: Ctx, node: t.Node, message: string): Expr => {
  ctx.issues.push({ severity: 'error', rule: 'unsupported-syntax', message, line: line(node) });
  return { k: 'undef' };
};

const resolveName = (ctx: Ctx, name: string): ElementType | null => {
  const bound = ctx.imports.get(name);
  if (bound?.kind === 'ds') return { ns: 'ds', name: bound.name };
  if (bound?.kind === 'icon') return { ns: 'icon', name: bound.name };
  if (ctx.kitNames.has(name)) return { ns: 'kit', name };
  if (ctx.dsNames.has(name)) return { ns: 'ds', name };
  if (isLucideIcon(name)) return { ns: 'icon', name };
  return null;
};

const inParams = (ctx: Ctx, name: string) => ctx.params.some((s) => s.has(name));

// ─── Expressions ─────────────────────────────────────────────────────────────

function convert(ctx: Ctx, node: t.Node | null | undefined): Expr {
  if (!node) return { k: 'undef' };
  switch (node.type) {
    case 'StringLiteral':
    case 'NumericLiteral':
    case 'BooleanLiteral':
      return { k: 'lit', v: node.value };
    case 'NullLiteral':
      return { k: 'lit', v: null };
    case 'TemplateLiteral':
      return {
        k: 'tpl',
        quasis: node.quasis.map((q) => q.value.cooked ?? q.value.raw),
        exprs: node.expressions.map((e) => convert(ctx, e)),
      };
    case 'ParenthesizedExpression':
    case 'TSAsExpression':
    case 'TSSatisfiesExpression':
    case 'TSNonNullExpression':
    case 'TSTypeAssertion':
      return convert(ctx, node.expression);
    case 'Identifier':
      return convertIdentifier(ctx, node);
    case 'ArrayExpression':
      return {
        k: 'arr',
        items: node.elements.map((el) =>
          el?.type === 'SpreadElement' ? fail(ctx, el, 'Spread inside arrays is not supported — write the items out.') : convert(ctx, el),
        ),
      };
    case 'ObjectExpression':
      return convertObject(ctx, node);
    case 'JSXElement':
    case 'JSXFragment':
      return convertElement(ctx, node);
    case 'MemberExpression':
    case 'OptionalMemberExpression':
      return {
        k: 'mem',
        obj: convert(ctx, node.object),
        prop: node.computed ? convert(ctx, node.property) : { k: 'lit', v: (node.property as t.Identifier).name },
        optional: node.type === 'OptionalMemberExpression' || undefined,
      };
    case 'ConditionalExpression':
      return { k: 'cond', test: convert(ctx, node.test), then: convert(ctx, node.consequent), else: convert(ctx, node.alternate) };
    case 'LogicalExpression':
      return { k: 'log', op: node.operator, l: convert(ctx, node.left), r: convert(ctx, node.right) };
    case 'BinaryExpression':
      if (!(BINARY_OPS as readonly string[]).includes(node.operator)) return fail(ctx, node, `Operator \`${node.operator}\` is not supported.`);
      return { k: 'bin', op: node.operator as BinaryOp, l: convert(ctx, node.left as t.Expression), r: convert(ctx, node.right) };
    case 'UnaryExpression':
      if (node.operator === 'void') return { k: 'undef' };
      if (node.operator !== '!' && node.operator !== '-' && node.operator !== '+') return fail(ctx, node, `Operator \`${node.operator}\` is not supported.`);
      return { k: 'un', op: node.operator, arg: convert(ctx, node.argument) };
    case 'ArrowFunctionExpression':
    case 'FunctionExpression':
      return convertFunction(ctx, node);
    case 'CallExpression':
    case 'OptionalCallExpression':
      return convertCall(ctx, node);
    default:
      return fail(ctx, node, `\`${node.type}\` is not supported in prototypes — use literal values, JSX, .map() and ternaries.`);
  }
}

function convertIdentifier(ctx: Ctx, node: t.Identifier): Expr {
  const { name } = node;
  if (name === 'undefined') return { k: 'undef' };
  if (inParams(ctx, name)) return { k: 'ref', name };
  if (ctx.consts.has(name)) {
    const cached = ctx.resolved.get(name);
    if (cached) return cached;
    if (ctx.resolving.has(name)) return fail(ctx, node, `\`${name}\` refers to itself.`);
    ctx.resolving.add(name);
    const out = convert(ctx, ctx.consts.get(name));
    ctx.resolving.delete(name);
    ctx.resolved.set(name, out);
    return out;
  }
  const type = resolveName(ctx, name);
  if (type) return { k: 'comp', type };
  ctx.issues.push({
    severity: 'error',
    rule: 'unknown-identifier',
    message: `\`${name}\` is not defined. Declare data as a const with a literal value, or import the component/icon.`,
    line: line(node),
  });
  return { k: 'undef' };
}

function propKey(key: t.Node, computed: boolean): string | null {
  if (computed) return key.type === 'StringLiteral' ? key.value : null;
  if (key.type === 'Identifier') return key.name;
  if (key.type === 'StringLiteral') return key.value;
  if (key.type === 'NumericLiteral') return String(key.value);
  return null;
}

function convertObject(ctx: Ctx, node: t.ObjectExpression): Expr {
  const props: [string, Expr][] = [];
  for (const p of node.properties) {
    if (p.type === 'SpreadElement') {
      const spread = convert(ctx, p.argument);
      if (spread.k === 'obj') props.push(...spread.props);
      else fail(ctx, p, 'Only spreads of literal objects are supported.');
      continue;
    }
    const key = propKey(p.key, p.computed);
    if (key === null) {
      fail(ctx, p, 'Computed object keys are not supported.');
      continue;
    }
    if (p.type === 'ObjectMethod') props.push([key, convertFunction(ctx, p)]);
    else props.push([key, convert(ctx, p.value)]);
  }
  return { k: 'obj', props };
}

function convertParams(ctx: Ctx, params: t.Node[]): Param[] | null {
  const out: Param[] = [];
  for (const raw of params) {
    const p = raw.type === 'AssignmentPattern' ? raw.left : raw;
    if (p.type === 'Identifier') out.push({ name: p.name });
    else if (p.type === 'ObjectPattern') {
      const pairs: [string, string][] = [];
      for (const prop of p.properties) {
        if (prop.type !== 'ObjectProperty') return null;
        const key = propKey(prop.key, prop.computed);
        const local = prop.value.type === 'AssignmentPattern' ? prop.value.left : prop.value;
        if (key === null || local.type !== 'Identifier') return null;
        pairs.push([key, local.name]);
      }
      out.push({ destructure: pairs });
    } else return null;
  }
  return out;
}

const paramNames = (params: Param[]) => new Set(params.flatMap((p) => ('name' in p ? [p.name] : p.destructure.map(([, l]) => l))));

function convertFunction(ctx: Ctx, node: t.ArrowFunctionExpression | t.FunctionExpression | t.ObjectMethod): Expr {
  const params = convertParams(ctx, node.params);
  if (!params) return fail(ctx, node, 'Only plain or { destructured } function parameters are supported.');
  ctx.params.push(paramNames(params));
  try {
    if (node.body.type !== 'BlockStatement') {
      // `() => setOpen(true)`, `() => (x = 1)`: side effects → a no-op handler, not an error.
      if (node.body.type === 'AssignmentExpression' || node.body.type === 'UpdateExpression' || (node.body.type === 'CallExpression' && !isPureCall(node.body))) {
        return { k: 'fn', params, body: null };
      }
      return { k: 'fn', params, body: convert(ctx, node.body) };
    }
    // A body that only declares consts and returns a value is a render function.
    const ret = renderReturn(ctx, node.body);
    if (ret === undefined) return { k: 'fn', params, body: null }; // event handler → no-op on the canvas
    return { k: 'fn', params, body: ret };
  } finally {
    ctx.params.pop();
  }
}

/** Returns the converted return value of a pure render body, or undefined for a side-effecting body. */
function renderReturn(ctx: Ctx, body: t.BlockStatement): Expr | undefined {
  // Body-local consts are visible while the return value converts, then the outer bindings come back.
  const shadowed = new Map<string, t.Expression | undefined>();
  const restore = () => {
    for (const [name, prev] of shadowed) {
      if (prev) ctx.consts.set(name, prev);
      else ctx.consts.delete(name);
      ctx.resolved.delete(name);
    }
  };
  try {
    for (const stmt of body.body) {
      if (stmt.type === 'ReturnStatement') return stmt.argument ? convert(ctx, stmt.argument) : undefined;
      if (stmt.type !== 'VariableDeclaration' || stmt.kind !== 'const') return undefined;
      for (const d of stmt.declarations) {
        if (d.id.type !== 'Identifier' || !d.init) return undefined;
        if (!shadowed.has(d.id.name)) shadowed.set(d.id.name, ctx.consts.get(d.id.name));
        ctx.consts.set(d.id.name, d.init);
        ctx.resolved.delete(d.id.name);
      }
    }
    return undefined;
  } finally {
    restore();
  }
}

const isPureCall = (node: t.CallExpression): boolean =>
  (node.callee.type === 'Identifier' && (node.callee.name === 'String' || node.callee.name === 'Number')) ||
  (node.callee.type === 'MemberExpression' && node.callee.property.type === 'Identifier' && (CALL_METHODS as readonly string[]).includes(node.callee.property.name));

function convertCall(ctx: Ctx, node: t.CallExpression | t.OptionalCallExpression): Expr {
  const args = node.arguments.map((a) =>
    a.type === 'SpreadElement' || a.type === 'ArgumentPlaceholder'
      ? fail(ctx, a, 'Spread arguments are not supported.')
      : convert(ctx, a),
  );
  const { callee } = node;
  if (callee.type === 'Identifier' && (callee.name === 'String' || callee.name === 'Number')) {
    return { k: 'call', callee: { k: 'undef' }, method: callee.name, args };
  }
  if ((callee.type === 'MemberExpression' || callee.type === 'OptionalMemberExpression') && !callee.computed && callee.property.type === 'Identifier') {
    const method = callee.property.name;
    if ((CALL_METHODS as readonly string[]).includes(method)) {
      return { k: 'call', callee: convert(ctx, callee.object), method: method as CallMethod, args };
    }
    return fail(ctx, node, `\`.${method}()\` is not supported. Supported: ${CALL_METHODS.filter((m) => m[0] === m[0].toLowerCase()).join(', ')}.`);
  }
  return fail(ctx, node, 'Function calls are not supported — inline the value instead.');
}

// ─── JSX ─────────────────────────────────────────────────────────────────────

function elementType(ctx: Ctx, name: t.JSXIdentifier | t.JSXMemberExpression | t.JSXNamespacedName): ElementType | null {
  if (name.type === 'JSXNamespacedName') return null;
  if (name.type === 'JSXMemberExpression') {
    const path: string[] = [];
    let cur: t.JSXMemberExpression | t.JSXIdentifier = name;
    while (cur.type === 'JSXMemberExpression') {
      path.unshift(cur.property.name);
      cur = cur.object;
    }
    if (cur.name === 'React' && path.join('.') === 'Fragment') return { ns: 'fragment' };
    const root = resolveName(ctx, cur.name);
    return { ns: 'ds', name: root?.ns === 'ds' ? root.name : cur.name, member: path };
  }
  if (name.name === 'Fragment') return { ns: 'fragment' };
  if (/^[a-z]/.test(name.name)) return { ns: 'html', name: name.name };
  // Unknown capitalised names stay as `ds` so the validator can report them by name.
  return resolveName(ctx, name.name) ?? { ns: 'ds', name: name.name };
}

/** React's JSX whitespace rule: trim each line, drop blank lines, join with a single space. */
function jsxText(raw: string): string | null {
  const lines = raw.split(/\r\n|\n|\r/);
  if (lines.length === 1) return raw === '' ? null : raw;
  const parts = lines
    .map((l, i) => {
      let s = l.replace(/\t/g, ' ');
      if (i !== 0) s = s.replace(/^ +/, '');
      if (i !== lines.length - 1) s = s.replace(/ +$/, '');
      return s;
    })
    .filter((s) => s !== '');
  return parts.length ? parts.join(' ') : null;
}

function convertElement(ctx: Ctx, node: t.JSXElement | t.JSXFragment): Expr {
  const type: ElementType | null = node.type === 'JSXFragment' ? { ns: 'fragment' } : elementType(ctx, node.openingElement.name);
  if (!type) return fail(ctx, node, 'Namespaced JSX tags are not supported.');
  const props: [string, Expr][] = [];
  if (node.type === 'JSXElement') {
    for (const attr of node.openingElement.attributes) {
      if (attr.type === 'JSXSpreadAttribute') {
        const spread = convert(ctx, attr.argument);
        if (spread.k === 'obj') props.push(...spread.props);
        else fail(ctx, attr, 'Only spreads of literal objects are supported.');
        continue;
      }
      if (attr.name.type === 'JSXNamespacedName') {
        fail(ctx, attr, 'Namespaced attributes are not supported.');
        continue;
      }
      const name = attr.name.name;
      const v = attr.value;
      if (!v) props.push([name, { k: 'lit', v: true }]);
      else if (v.type === 'StringLiteral') props.push([name, { k: 'lit', v: v.value }]);
      else if (v.type === 'JSXExpressionContainer') {
        if (v.expression.type !== 'JSXEmptyExpression') props.push([name, convert(ctx, v.expression)]);
      } else props.push([name, convertElement(ctx, v)]);
    }
  }
  const children: Expr[] = [];
  for (const c of node.children) {
    if (c.type === 'JSXText') {
      const text = jsxText(c.value);
      if (text !== null) children.push({ k: 'lit', v: text });
    } else if (c.type === 'JSXExpressionContainer') {
      if (c.expression.type !== 'JSXEmptyExpression') children.push(convert(ctx, c.expression));
    } else if (c.type === 'JSXSpreadChild') fail(ctx, c, 'Spread children are not supported.');
    else children.push(convertElement(ctx, c));
  }
  return { k: 'el', type, props, children, loc: line(node) };
}

// ─── Module ──────────────────────────────────────────────────────────────────

function collectImports(ctx: Ctx, decl: t.ImportDeclaration) {
  const source = decl.source.value;
  for (const s of decl.specifiers) {
    const local = s.local.name;
    if (source === 'react') {
      ctx.imports.set(local, { kind: 'react' });
      continue;
    }
    const imported = s.type === 'ImportSpecifier' ? (s.imported.type === 'Identifier' ? s.imported.name : s.imported.value) : local;
    if (source === 'ds-ngr') {
      // ds-ngr bundles lucide, so icons may come from either package.
      ctx.imports.set(local, ctx.dsNames.has(imported) ? { kind: 'ds', name: imported } : { kind: 'icon', name: imported });
    } else if (source === 'lucide-react') {
      ctx.imports.set(local, { kind: 'icon', name: imported });
    } else if (!/\.css$/.test(source) && !ctx.kitNames.has(imported)) {
      ctx.issues.push({ severity: 'warning', rule: 'foreign-import', message: `Import from \`${source}\` is ignored — prototypes can only use ds-ngr and lucide-react.`, line: line(decl) });
    }
  }
}

const isFn = (n: t.Node | null | undefined): n is t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression =>
  !!n && (n.type === 'FunctionDeclaration' || n.type === 'ArrowFunctionExpression' || n.type === 'FunctionExpression');

const isJsx = (n: t.Node | null | undefined): n is t.JSXElement | t.JSXFragment => {
  while (n && (n.type === 'ParenthesizedExpression' || n.type === 'TSAsExpression')) n = n.expression;
  return !!n && (n.type === 'JSXElement' || n.type === 'JSXFragment');
};

/** Pulls the returned JSX out of a component, registering its consts and useState values on the way. */
function componentBody(ctx: Ctx, fn: t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression): t.Expression | null {
  if (fn.body.type !== 'BlockStatement') return fn.body;
  let ret: t.Expression | null = null;
  for (const stmt of fn.body.body) {
    if (stmt.type === 'ReturnStatement') {
      ret = stmt.argument ?? null;
      break;
    }
    if (stmt.type !== 'VariableDeclaration') continue;
    for (const d of stmt.declarations) {
      const init = d.init;
      // const [value, setValue] = useState(initial) → value is the initial value; setters are no-ops.
      if (d.id.type === 'ArrayPattern' && init?.type === 'CallExpression' && init.callee.type === 'Identifier' && /^use(State|Reducer)$/.test(init.callee.name)) {
        const [value] = d.id.elements;
        if (value?.type === 'Identifier' && init.arguments[0] && init.arguments[0].type !== 'SpreadElement' && init.arguments[0].type !== 'ArgumentPlaceholder') {
          ctx.consts.set(value.name, init.arguments[0] as t.Expression);
        }
        ctx.issues.push({ severity: 'info', rule: 'static-state', message: `\`${init.callee.name}\` is rendered with its initial value — canvas prototypes are not interactive yet.`, line: line(d) });
        continue;
      }
      if (d.id.type === 'Identifier' && init) {
        if (init.type === 'CallExpression' && init.callee.type === 'Identifier' && /^use[A-Z]/.test(init.callee.name)) {
          ctx.issues.push({ severity: 'warning', rule: 'unsupported-hook', message: `\`${init.callee.name}\` is ignored on the canvas.`, line: line(d) });
          continue;
        }
        ctx.consts.set(d.id.name, init);
      }
    }
  }
  return ret;
}

type FnNode = t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression;

/** Registers imports and top-level consts; returns the component functions and the default export. */
function scanProgram(ctx: Ctx, program: t.Program) {
  const functions = new Map<string, FnNode>();
  let exported: t.Node | null = null;
  let lastJsx: t.Expression | null = null;

  for (const stmt of program.body) {
    const s = stmt.type === 'ExportNamedDeclaration' && stmt.declaration ? stmt.declaration : stmt;
    if (s.type === 'ImportDeclaration') collectImports(ctx, s);
    else if (s.type === 'ExportDefaultDeclaration') exported = s.declaration;
    else if (s.type === 'FunctionDeclaration' && s.id) functions.set(s.id.name, s);
    else if (s.type === 'VariableDeclaration') {
      for (const d of s.declarations) {
        if (d.id.type !== 'Identifier' || !d.init) continue;
        if (isFn(d.init) && /^[A-Z]/.test(d.id.name)) functions.set(d.id.name, d.init);
        else ctx.consts.set(d.id.name, d.init);
      }
    } else if (s.type === 'ExpressionStatement' && isJsx(s.expression)) lastJsx = s.expression;
  }
  return { functions, exported, lastJsx };
}

function findRoot(ctx: Ctx, program: t.Program): t.Expression | null {
  const { functions, exported: exp, lastJsx } = scanProgram(ctx, program);
  let exported = exp;
  if (exported?.type === 'Identifier') exported = functions.get(exported.name) ?? null;
  if (isFn(exported)) return componentBody(ctx, exported);
  if (exported && isJsx(exported)) return exported as t.Expression;
  if (lastJsx) return lastJsx;
  // No default export: take the last capitalised component in the file.
  const last = [...functions.values()].pop();
  return last ? componentBody(ctx, last) : null;
}

export interface CompileOptions {
  /** Team kit component names that may be used as elements. */
  kitNames?: Iterable<string>;
}

type Parsed = { program: t.Program } | { issues: Issue[] };

function parseProgram(source: string): Parsed {
  if (source.length > MAX_SOURCE) {
    return { issues: [{ severity: 'error', rule: 'too-large', message: `Source is over ${MAX_SOURCE / 1000} KB.` }] };
  }
  const opts = { sourceType: 'module' as const, plugins: ['jsx' as const, 'typescript' as const] };
  try {
    return { program: parse(source, opts).program };
  } catch (err) {
    // Several sibling elements at the top level: wrap them in a fragment and retry.
    try {
      return { program: parse(`<>${source}</>`, opts).program };
    } catch {
      const e = err as { message: string; loc?: { line: number } };
      return { issues: [{ severity: 'error', rule: 'parse-error', message: e.message.replace(/\s*\(\d+:\d+\)$/, ''), line: e.loc?.line }] };
    }
  }
}

const newCtx = (opts: CompileOptions = {}): Ctx => ({
  issues: [],
  imports: new Map(),
  consts: new Map(),
  resolved: new Map(),
  resolving: new Set(),
  params: [],
  dsNames: new Set(Object.keys(getIndex().components)),
  kitNames: new Set(opts.kitNames ?? []),
});

export function compile(source: string, opts: CompileOptions = {}): { root: Expr | null; issues: Issue[] } {
  const parsed = parseProgram(source);
  if ('issues' in parsed) return { root: null, issues: parsed.issues };
  const ctx = newCtx(opts);
  const rootNode = findRoot(ctx, parsed.program);
  if (!rootNode) {
    ctx.issues.push({ severity: 'error', rule: 'no-root', message: 'No JSX found. Provide a JSX element or a component that returns one.' });
    return { root: null, issues: ctx.issues };
  }
  return { root: convert(ctx, rootNode), issues: ctx.issues };
}

/**
 * A team kit component: one function component whose props come from a single
 * destructured parameter, e.g. `function ProjectCard({ name, status }) { … }`.
 */
export function compileComponent(source: string, opts: CompileOptions = {}): { name: string | null; params: string[]; fn: FnExpr | null; issues: Issue[] } {
  const parsed = parseProgram(source);
  if ('issues' in parsed) return { name: null, params: [], fn: null, issues: parsed.issues };
  const ctx = newCtx(opts);
  const { functions, exported } = scanProgram(ctx, parsed.program);
  let name: string | null = null;
  let fn: t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression | null = null;
  if (exported?.type === 'Identifier' && functions.has(exported.name)) [name, fn] = [exported.name, functions.get(exported.name)!];
  else if (exported?.type === 'FunctionDeclaration') [name, fn] = [exported.id?.name ?? null, exported];
  else if (isFn(exported)) fn = exported;
  else if (functions.size) [name, fn] = [...functions.entries()].pop()!;
  if (!fn) {
    ctx.issues.push({ severity: 'error', rule: 'no-component', message: 'Provide one function component, e.g. `export default function ProjectCard({ name }) { return <Card title={name} /> }`.' });
    return { name, params: [], fn: null, issues: ctx.issues };
  }
  if (fn.params.length > 1) ctx.issues.push({ severity: 'error', rule: 'component-params', message: 'Kit components take a single props parameter.', line: line(fn) });
  const params = convertParams(ctx, fn.params.slice(0, 1));
  if (!params) {
    ctx.issues.push({ severity: 'error', rule: 'component-params', message: 'Use a destructured props parameter: `({ title, status })`.', line: line(fn) });
    return { name, params: [], fn: null, issues: ctx.issues };
  }
  ctx.params.push(paramNames(params));
  const ret = componentBody(ctx, fn);
  const body = ret ? convert(ctx, ret) : null;
  ctx.params.pop();
  if (!body) {
    ctx.issues.push({ severity: 'error', rule: 'no-root', message: 'The component must return JSX.', line: line(fn) });
    return { name, params: [], fn: null, issues: ctx.issues };
  }
  const propNames = params.flatMap((p) => ('destructure' in p ? p.destructure.map(([key]) => key) : []));
  return { name, params: propNames, fn: { k: 'fn', params, body }, issues: ctx.issues };
}
