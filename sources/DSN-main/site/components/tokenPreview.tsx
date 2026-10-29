import type { ReactNode } from 'react';

// Colors: the color tier, color primitives, and component color tokens (--button-background-*).
const isColor = (name: string) =>
  name.startsWith('--color-') ||
  (name.startsWith('--primitive-') && !/^--primitive-(size|font-size)-/.test(name)) ||
  /^--[a-z-]+-(background|foreground|border)(-|$)/.test(name);

// Lengths can be negative (overlaps, spreads) — preview their magnitude.
const abs = (v: string) => `max(${v}, calc(-1 * ${v}))`;

export const tokenPreview = (name: string): ReactNode => {
  const v = `var(${name})`;
  if (isColor(name)) return <span className="swatch" style={{ background: v }} />;
  if (name.startsWith('--effect-blur-')) return <span className="tok-blur" style={{ filter: `blur(${v})` }} />;
  if (name.startsWith('--effect-shadow-') || /-shadow(-|$)/.test(name)) return <span className="tok-box" style={{ boxShadow: v }} />;
  if (name.startsWith('--shape-radius-')) return <span className="tok-radius" style={{ borderTopLeftRadius: v }} />;
  if (name.startsWith('--size-border-')) return <span className="tok-line" style={{ borderTopWidth: v }} />;
  if (/^--(size|space|primitive-size)-/.test(name)) return <span className="tok-bar" style={{ width: abs(v) }} />;
  if (name.startsWith('--font-family-')) return <span className="tok-text" style={{ fontFamily: v }}>Aa Gg 123</span>;
  if (name.startsWith('--font-size-')) return <span className="tok-text" style={{ fontSize: v }}>Aa</span>;
  if (name.startsWith('--font-weight-')) return <span className="tok-text" style={{ fontWeight: v }}>Aa Gg</span>;
  if (name.startsWith('--font-letter-spacing-')) return <span className="tok-text" style={{ letterSpacing: v }}>Tracking</span>;
  if (name.startsWith('--font-line-height-')) return <span className="tok-bar tok-bar-v" style={{ height: v }} />;
  if (name.startsWith('--motion-duration-')) return <span className="tok-motion"><span style={{ transition: `transform ${v} ease` }} /></span>;
  if (name.startsWith('--motion-ease-')) return <span className="tok-motion"><span style={{ transition: `transform 600ms ${v}` }} /></span>;
  if (name.startsWith('--motion-transition-')) return <span className="tok-motion"><span style={{ transition: `transform ${v}` }} /></span>;
  return null;
};
