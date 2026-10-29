/**
 * Surface styles ("look and feel") — PROTOTYPE pending a Figma effects-collection
 * `Style` mode. Each look re-values the existing composite box-shadow tokens in
 * tokens.css; no new tokens. Composites reference the colour sub-tokens, which
 * dark mode already re-points, so one definition serves light and dark.
 *
 * Every look keeps the 1px ring (`0 0 0 1px …`): the composites double as the
 * control outline, so dropping it would remove borders, not just the emboss.
 */

export type SurfaceStyle = 'embossed' | 'flat' | 'outlined' | 'soft';

export const SURFACE_STYLES: { value: SurfaceStyle; label: string; hint: string }[] = [
  { value: 'embossed', label: 'Embossed', hint: 'Tactile: inner highlight, shade and a soft drop shadow (Nagarro default).' },
  { value: 'flat', label: 'Flat', hint: 'Outline only. No highlights or shadows.' },
  { value: 'outlined', label: 'Outlined', hint: 'Flat with a crisper border. Suits dense, enterprise UIs.' },
  { value: 'soft', label: 'Soft', hint: 'No emboss; lifted by a larger, softer shadow.' },
];

const ring = (color: string) => `0 0 0 var(--primitive-size-1) ${color}`;
const insetRing = (color: string) => `inset 0 0 0 var(--primitive-size-1) ${color}`;
const lift = 'var(--primitive-size-4) var(--effect-blur-md) 0 var(--color-shadow-outer-strong)';
const liftHover = 'var(--primitive-size-4) var(--effect-blur-lg) 0 var(--color-shadow-outer-strong)';

const PRIMARY = 'var(--button-border-primary)';
const DANGER = 'var(--button-border-destructive)';
const SOFT_LINE = 'var(--color-shadow-outer-soft)';
const SWITCH_LINE = 'var(--primitive-alpha-dark-5)'; // as in tokens.css switcher composites
const STRONG_LINE = 'var(--color-border-interactive-hover)'; // neutral-300: visibly crisper than the 5% alpha ring

function flatLike(line: string, switchLine: string, inputBorder?: string): Record<string, string> {
  return {
    // TextInput/SearchBar draw a real border, not the input shadow composite.
    ...(inputBorder && { '--input-border-default': inputBorder }),
    '--button-shadow-primary-default': ring(PRIMARY),
    '--button-shadow-primary-hover': ring(PRIMARY),
    '--button-shadow-destructive-default': ring(DANGER),
    '--button-shadow-destructive-hover': ring(DANGER),
    '--button-shadow-secondary-default': ring(line),
    '--button-shadow-secondary-hover': ring(line),
    '--button-shadow-active': insetRing(line),
    '--button-shadow-group': ring(line),
    '--input-shadow': insetRing(line),
    '--switcher-shadow-track-off': insetRing(switchLine),
    '--switcher-shadow-thumb': ring(switchLine),
  };
}

const SOFT: Record<string, string> = {
  '--button-shadow-primary-default': `${ring(PRIMARY)}, 0 ${lift}`,
  '--button-shadow-primary-hover': `${ring(PRIMARY)}, 0 ${liftHover}`,
  '--button-shadow-destructive-default': `${ring(DANGER)}, 0 ${lift}`,
  '--button-shadow-destructive-hover': `${ring(DANGER)}, 0 ${liftHover}`,
  '--button-shadow-secondary-default': `${ring(SOFT_LINE)}, 0 ${lift}`,
  '--button-shadow-secondary-hover': `${ring(SOFT_LINE)}, 0 ${liftHover}`,
  '--button-shadow-active': insetRing(SOFT_LINE),
  '--button-shadow-group': `${ring(SOFT_LINE)}, 0 ${lift}`,
  '--input-shadow': insetRing(SOFT_LINE),
  '--switcher-shadow-track-off': insetRing(SWITCH_LINE),
  '--switcher-shadow-thumb': `${ring(SWITCH_LINE)}, 0 ${lift}`,
};

export function surfaceVars(style: SurfaceStyle): Record<string, string> {
  if (style === 'flat') return flatLike(SOFT_LINE, SWITCH_LINE);
  if (style === 'outlined') return flatLike(STRONG_LINE, STRONG_LINE, STRONG_LINE);
  if (style === 'soft') return SOFT;
  return {};
}
