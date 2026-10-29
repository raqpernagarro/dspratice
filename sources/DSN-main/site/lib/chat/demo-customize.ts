import 'server-only';
import { getIndex } from '@/lib/ds-knowledge';
import { customizable } from '@/lib/prototype/customize';

/**
 * Scripted customizations for the demo source (lib/chat/demo.ts). Works for any
 * component from what customizable() reports: radius tokens become "Rounder" /
 * "Sharper", a size prop "Compact", a variant prop another default variant, and
 * a few boolean props a default. Samples are generated from the component's
 * props so before and after render from the same usages. Components with none of
 * these (charts, layout shells, command parts) get no options.
 */

type Option = { name: string; summary: string; tokens: Record<string, string>; defaults: Record<string, string | boolean> };
type Sample = { label: string; usage: string };

const SMALL = ['xs', 'sm', 'small', 'compact'];
/** Boolean props that make a visible, harmless difference when turned on by default. */
const FLAGS: Record<string, { name: string; summary: string }> = {
  bordered: { name: 'Bordered', summary: 'Shows a border by default, to separate it from busy backgrounds.' },
  fullWidth: { name: 'Full width', summary: 'Fills its container by default.' },
  showValue: { name: 'Shows value', summary: 'Shows the current value by default.' },
  dismissible: { name: 'Dismissible', summary: 'Can be dismissed by default.' },
};
const cap = (v: string) => v[0].toUpperCase() + v.slice(1);
const SAMPLE_TEXT: Record<string, string> = {
  label: 'Label',
  title: 'Quarterly report',
  description: 'Updated 2 hours ago',
  name: 'Ana Costa',
  placeholder: 'Type here',
  value: 'Value',
  'aria-label': 'Example',
  text: 'Example text',
};

type Value = string | number | boolean;

/** Props a usage needs to render sensibly: required ones and the usual text props. */
export function demoProps(component: string): Record<string, Value> {
  const props = getIndex().components[component]?.props ?? {};
  const out: Record<string, Value> = {};
  for (const [name, p] of Object.entries(props)) {
    const wanted = p.required || name in SAMPLE_TEXT;
    if (!wanted || name === 'variant' || name === 'size') continue;
    if (p.values?.length) out[name] = p.values[0];
    else if (p.type === 'string') out[name] = SAMPLE_TEXT[name] ?? 'Example';
    else if (p.type === 'number') out[name] = 40;
    else if (p.type === 'boolean') out[name] = true;
  }
  if ('showHeader' in props && 'title' in props) out.showHeader = true;
  if ('showBottomBar' in props) out.showBottomBar = false;
  return out;
}

/** Placeholder content for components that take children. */
export function demoChildren(component: string): string | null {
  if (!getIndex().components[component]?.acceptsChildren) return null;
  return /Card|Panel|Section|Callout|Drawer|Accordion/.test(component) ? 'Content goes here.' : 'Save changes';
}

const attr = (name: string, v: Value) => (typeof v === 'string' ? `${name}=${JSON.stringify(v)}` : `${name}={${v}}`);

function attrsFor(component: string): string[] {
  return Object.entries(demoProps(component)).map(([k, v]) => attr(k, v));
}

/** A default usage (so changed defaults show), plus up to two explicit variants. */
export function demoSamples(component: string): Sample[] {
  const entry = getIndex().components[component];
  if (!entry) return [];
  const attrs = attrsFor(component);
  const text = demoChildren(component);
  const body = text === null ? null : text === 'Save changes' ? text : `<span>${text}</span>`;
  const usage = (extra: string[]) => {
    const all = [...attrs, ...extra].join(' ');
    const open = `<${component}${all ? ` ${all}` : ''}`;
    return body ? `${open}>${body}</${component}>` : `${open} />`;
  };
  const variants = entry.props?.variant?.values ?? [];
  return [{ label: 'Default', usage: usage([]) }, ...(variants.length > 1 ? variants.slice(0, 2).map((v) => ({ label: cap(v), usage: usage([`variant="${v}"`]) })) : [])];
}

/** Up to three options this component supports, ordered by what the request asks for. */
export function demoOptions(component: string, request: string): Option[] {
  const { tokens, props } = customizable(component);
  const radius = tokens.map((t) => t.name).filter((n) => /radius/.test(n));
  const size = props.find((p) => p.name === 'size' && p.values?.length);
  const small = size?.values?.find((v) => SMALL.includes(v));
  const out: { option: Option; match: RegExp }[] = [];
  if (radius.length) {
    out.push({
      option: { name: 'Rounder', summary: 'Softer, rounder corners.', tokens: Object.fromEntries(radius.map((n) => [n, 'var(--shape-radius-xl)'])), defaults: {} },
      match: /soft|round|friendl|calm/i,
    });
  }
  if (small) {
    out.push({
      option: { name: 'Compact', summary: `Uses the ${small} size by default, for dense screens.`, tokens: {}, defaults: { size: small } },
      match: /compact|dense|small|tight/i,
    });
  }
  const variant = props.find((p) => p.name === 'variant' && (p.values?.length ?? 0) > 1);
  if (variant?.values) {
    const v = variant.values[1];
    out.push({ option: { name: `${cap(v)} by default`, summary: `Uses the ${v} variant unless a screen asks for another.`, tokens: {}, defaults: { variant: v } }, match: /brand|accent|style|look|variant/i });
  }
  for (const p of props) {
    const flag = FLAGS[p.name];
    if (flag && p.type === 'boolean') out.push({ option: { ...flag, tokens: {}, defaults: { [p.name]: true } }, match: /border|wide|value|dismiss/i });
  }
  if (radius.length) {
    out.push({
      option: { name: 'Sharper', summary: 'Crisper, squarer corners.', tokens: Object.fromEntries(radius.map((n) => [n, 'var(--shape-radius-sm)'])), defaults: {} },
      match: /sharp|square|crisp|serious/i,
    });
  }
  return out.sort((a, b) => Number(b.match.test(request)) - Number(a.match.test(request))).slice(0, 3).map((o) => o.option);
}
