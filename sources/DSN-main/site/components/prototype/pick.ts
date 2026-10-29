/**
 * Pointing at part of a rendered DS-Ngr component. Components name their DOM
 * `dsn-<component>` (the root) and `dsn-<component>-<part>` (inner parts), so
 * the nearest such class says what was clicked without any extra markup.
 */

export const PICK_MESSAGE = 'dsn-prototype-preview:pick';

export interface Pick {
  /** Short name for the chip, e.g. "Button · icon" or "Button". */
  label: string;
  /** The DOM class that identified it, e.g. "dsn-button-icon". */
  className: string;
  /** The component it belongs to, in kebab case, e.g. "button". */
  component: string;
  /** The part inside it, or null for the whole component. */
  part: string | null;
  /** The sample it was in, when the canvas labels them (e.g. "Default"). */
  sample?: string;
  /** The props it was rendered with, when set in the canvas (e.g. `variant="secondary"`). */
  props?: string;
  /** What it reads, shortened — tells one Card from another on a prototype. */
  text?: string;
}

const DSN = /^dsn-[a-z0-9-]+$/;
const pascal = (kebab: string) => kebab.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase());

/** The nearest DS-Ngr part at or above `start`, with the element that carries it. */
export function describePick(start: Element): { el: Element; pick: Pick } | null {
  for (let el: Element | null = start; el && el !== document.body; el = el.parentElement) {
    const cls = [...el.classList].find((c) => DSN.test(c) && !c.includes('--'));
    if (!cls) continue;
    // The shortest dsn- class on an ancestor that prefixes this one is the owning component.
    const owner = ownerOf(el, cls);
    const component = owner ?? cls.slice(4);
    const part = owner && cls !== `dsn-${owner}` ? cls.slice(5 + owner.length) : null;
    const label = part ? `${pascal(component)} · ${part.replace(/-/g, ' ')}` : pascal(component);
    return { el, pick: { label, className: cls, component, part, sample: sampleOf(el), text: textOf(el) } };
  }
  return null;
}

function ownerOf(el: Element, cls: string): string | null {
  let best: string | null = null;
  for (let a: Element | null = el; a && a !== document.body; a = a.parentElement) {
    for (const c of a.classList) {
      if (!DSN.test(c) || c.includes('--')) continue;
      if (cls === c || cls.startsWith(`${c}-`)) {
        const name = c.slice(4);
        if (!best || name.length < best.length) best = name;
      }
    }
  }
  return best;
}

const TEXT_MAX = 60;

function textOf(el: Element): string | undefined {
  const t = (el.getAttribute('aria-label') || (el instanceof HTMLElement ? el.innerText : el.textContent) || '').replace(/\s+/g, ' ').trim();
  return t ? (t.length > TEXT_MAX ? `${t.slice(0, TEXT_MAX - 1)}…` : t) : undefined;
}

/** Sample sheets wrap each usage in a <section> led by its label (see sheetSource). */
function sampleOf(el: Element): string | undefined {
  const section = el.closest('section');
  const first = section?.firstElementChild;
  return first?.tagName === 'SPAN' ? first.textContent?.trim() || undefined : undefined;
}

/** What the model reads: the part, where it was, and how to find its tokens. */
export function pickPrompt(p: Pick, component: string): string {
  const where = [p.sample && ` in the "${p.sample}" preview`, p.props && ` rendered with ${p.props}`].filter(Boolean).join(',');
  const what =
    p.part === null && pascal(p.component) === component
      ? `the whole ${component}`
      : p.part === null
        ? `the ${pascal(p.component)} inside ${component}`
        : `the ${p.part.replace(/-/g, ' ')} part of ${pascal(p.component)} (.${p.className})`;
  return `[Pointing at ${what}${where}.]`;
}

/** Prototype mode: which element on the screen, told apart by what it reads. */
export function prototypePickPrompt(p: Pick): string {
  const what = p.part === null ? `the ${pascal(p.component)}` : `the ${p.part.replace(/-/g, ' ')} part of a ${pascal(p.component)}`;
  // Quotes and the closing ".]" would break the prefix POINTING reads back.
  const reads = p.text ? ` that reads “${p.text.replace(/[“”"\]]/g, '')}”` : '';
  return `[Pointing at ${what}${reads} (.${p.className}) on the canvas.]`;
}

/** Finds the pointing prefix pickPrompt() put on a sent message, to show it as a chip. */
export const POINTING = /^\[Pointing at (.+?)\.\]\s*/;
