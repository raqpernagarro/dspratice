/**
 * Shape (roundness) and Density — mirror the Figma `shape` and `density`
 * variable collections, whose modes the size collection aliases. Each mode
 * re-values the existing size tokens on :root; no new tokens. The default
 * modes (Rounded, Default) equal tokens.css, so they emit no overrides.
 */

export type Shape = 'square' | 'subtle' | 'rounded' | 'pill';
export type Density = 'compact' | 'default' | 'comfortable' | 'spacious';

export const SHAPES: { value: Shape; label: string; hint: string }[] = [
  { value: 'square', label: 'Square', hint: 'No rounding. Circles (avatars, dots) stay round.' },
  { value: 'subtle', label: 'Subtle', hint: 'Light rounding for a crisp, enterprise feel.' },
  { value: 'rounded', label: 'Rounded', hint: 'Generous rounding (Nagarro default).' },
  { value: 'pill', label: 'Pill', hint: 'Pill-shaped controls at every density; rounder surfaces.' },
];

export const DENSITIES: { value: Density; label: string; hint: string }[] = [
  { value: 'compact', label: 'Compact', hint: 'Spacing ×0.75, 28px controls. For data-heavy screens.' },
  { value: 'default', label: 'Default', hint: 'Spacing ×1, 32px controls (Nagarro default).' },
  { value: 'comfortable', label: 'Comfortable', hint: 'Spacing ×1.25, 36px controls.' },
  { value: 'spacious', label: 'Spacious', hint: 'Spacing ×1.5, 40px controls. For touch and marketing.' },
];

/**
 * Shape mode → px per CSS token. Control radius stays finite: the control tokens
 * also round multi-line containers (Callout, TextArea), and 20/16 already makes
 * controls pill-shaped up to 40/32px tall.
 */
export const SHAPE_TABLE: Record<string, Record<Shape, number>> = {
  '--shape-radius-2xs': { square: 0, subtle: 2, rounded: 4, pill: 4 }, // 12px checkbox box: more reads as a radio
  '--shape-radius-xs': { square: 0, subtle: 3, rounded: 8, pill: 10 },
  '--shape-radius-sm': { square: 0, subtle: 4, rounded: 12, pill: 16 },
  '--shape-radius-md': { square: 0, subtle: 8, rounded: 16, pill: 20 },
  '--shape-radius-lg': { square: 0, subtle: 12, rounded: 24, pill: 28 },
  '--shape-radius-xl': { square: 0, subtle: 16, rounded: 32, pill: 36 },
  '--shape-radius-control-md': { square: 0, subtle: 8, rounded: 16, pill: 20 },
  '--shape-radius-control-sm': { square: 0, subtle: 4, rounded: 12, pill: 16 },
};

const SCALE: Record<Density, number> = { compact: 0.75, default: 1, comfortable: 1.25, spacious: 1.5 };
// The --space-* ladder at default density. none and 3xs stay fixed.
const SPACE = { '2xs': 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, '2xl': 48, '3xl': 64 };
const CONTROL_HEIGHT: Record<Density, [md: number, sm: number]> = {
  compact: [28, 20], default: [32, 24], comfortable: [36, 28], spacious: [40, 32],
};

// Snap to the 2px grid.
const scaled = (px: number, d: Density) => Math.round((px * SCALE[d]) / 2) * 2;

/** Density mode → px per CSS token. */
export const DENSITY_TABLE: Record<string, Record<Density, number>> = Object.fromEntries([
  ...Object.entries(SPACE).map(([step, px]) => [`--space-${step}`, perMode((d) => scaled(px, d))]),
  ['--size-control-height-md', perMode((d) => CONTROL_HEIGHT[d][0])],
  ['--size-control-height-sm', perMode((d) => CONTROL_HEIGHT[d][1])],
]);

function perMode(fn: (d: Density) => number) {
  return Object.fromEntries((Object.keys(SCALE) as Density[]).map((d) => [d, fn(d)])) as Record<Density, number>;
}

const px = (v: number) => `${v}px`;

export function shapeVars(shape: Shape): Record<string, string> {
  if (shape === 'rounded') return {};
  return Object.fromEntries(Object.entries(SHAPE_TABLE).map(([k, v]) => [k, px(v[shape])]));
}

export function densityVars(density: Density): Record<string, string> {
  if (density === 'default') return {};
  return Object.fromEntries(Object.entries(DENSITY_TABLE).map(([k, v]) => [k, px(v[density])]));
}
