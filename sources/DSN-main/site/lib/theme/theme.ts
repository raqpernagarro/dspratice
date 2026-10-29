import { contrast, hexToOklch, oklchToHex, type Oklch } from './color';
import { SURFACE_STYLES, surfaceVars, type SurfaceStyle } from './styles';
import { DENSITIES, SHAPES, densityVars, shapeVars, type Density, type Shape } from './shape-density';

/**
 * Theme configurator engine. A theme only re-values existing *primitive*
 * tokens (--primitive-accent-*, -neutral-*, -red/green/yellow-*, --font-family-default)
 * plus the tokens the Shape/Density modes own (--shape-radius-*, space,
 * inset, control height). Semantic tokens in tokens.css re-point to these, so
 * light and dark both follow without any semantic overrides. No new tokens.
 * Exception: the css-only chart series (--color-background-dataviz-1…8) are
 * literal per mode in tokens.css, so they are overridden per mode.
 */

// Mirrors the Figma primitive collection in tokens.css (synced 2026-04-16).
// The OKLCH lightness/chroma curve of these scales is what new scales follow.
export const REF_ACCENT: Record<string, string> = {
  '25': '#F0FDFA', '50': '#E0FFF8', '100': '#9AFEDB', '200': '#5FECC0', '300': '#47D7AC', '400': '#0CAA83',
  '500': '#0A7F76', '600': '#0F766E', '700': '#115E59', '800': '#134E4A', '900': '#042E2D', '950': '#022827',
};
export const REF_NEUTRAL: Record<string, string> = {
  '50': '#FCFCFC', '100': '#F7F6F9', '200': '#EFEFFA', '300': '#B4B3D1', '400': '#9696AD', '500': '#757590',
  '600': '#61617B', '700': '#4E4E67', '800': '#1B1B33', '900': '#100E23', '950': '#06041F',
};

export const DEFAULT_BRAND = '0F766E'; // primitive-accent-600, the light-mode CTA step

export type NeutralMode = 'default' | 'gray' | 'match';

// ── Feedback (error / success / warning) ──────────────────────────────────
// The red, green and yellow primitive ramps behind every feedback, danger and
// tag-status token. Re-valuing them re-colours both modes, like the neutrals.

type Scale = Record<string, string>;
export type FeedbackScales = { red: Scale; green: Scale; yellow: Scale };
export type FeedbackMode = 'default' | 'standard' | 'harmonized';

export const FEEDBACK_MODES: { value: FeedbackMode; label: string; description: string }[] = [
  { value: 'default', label: 'Nagarro', description: 'Sunset Pink, Mint Green, Vanilla Yellow' },
  { value: 'standard', label: 'Standard', description: 'Conventional red, green and amber' },
  { value: 'harmonized', label: 'Harmonized', description: 'Standard, hues nudged toward your brand' },
];

// Mirrors the Figma primitive collection in tokens.css (synced 2026-04-17).
export const REF_FEEDBACK: FeedbackScales = {
  red: {
    '25': '#FFFBFA', '50': '#FFF4F4', '100': '#FCD0D7', '200': '#FEBBC4', '300': '#F97586', '400': '#F8485E',
    '500': '#E02F4C', '600': '#BF4059', '700': '#940929', '800': '#7E0823', '900': '#4E0717', '950': '#280F1A',
  },
  green: {
    '25': '#F7FFFA', '50': '#F0FDF4', '100': '#D1F5EA', '200': '#A3EBD5', '300': '#75E1C1', '400': '#47D7AC',
    '500': '#3AAB94', '600': '#2D807B', '700': '#205463', '800': '#1C5F51', '900': '#103931', '950': '#06231D',
  },
  yellow: {
    '25': '#FFFEF3', '50': '#FEFCE8', '100': '#FDF4DC', '200': '#FEF08A', '300': '#FDE047', '400': '#FACC15',
    '500': '#EAB308', '600': '#7D5F02', '700': '#664F11', '800': '#453406', '900': '#352805', '950': '#241A02',
  },
};

// Conventional status hues with even lightness steps. Same step roles as the
// Nagarro ramps (text 700/800 on tint 100 in light, 300/200 on 950 in dark).
export const STANDARD_FEEDBACK: FeedbackScales = {
  red: {
    '25': '#FFF8F8', '50': '#FEF2F2', '100': '#FEE2E2', '200': '#FECACA', '300': '#FCA5A5', '400': '#F87171',
    '500': '#EF4444', '600': '#DC2626', '700': '#B91C1C', '800': '#991B1B', '900': '#7F1D1D', '950': '#450A0A',
  },
  green: {
    '25': '#F6FEF9', '50': '#F0FDF4', '100': '#DCFCE7', '200': '#BBF7D0', '300': '#86EFAC', '400': '#4ADE80',
    '500': '#22C55E', '600': '#16A34A', '700': '#15803D', '800': '#166534', '900': '#14532D', '950': '#052E16',
  },
  yellow: {
    '25': '#FFFDF5', '50': '#FFFBEB', '100': '#FEF3C7', '200': '#FDE68A', '300': '#FCD34D', '400': '#FBBF24',
    '500': '#F59E0B', '600': '#D97706', '700': '#A84D08', '800': '#92400E', '900': '#78350F', '950': '#451A03',
  },
};

/**
 * Rotates each ramp's hue toward the brand by half the gap (Material's
 * "harmonize"), capped per ramp: red reads orange past ~4° in OKLCH, so it
 * moves least. Measured at step 600 so the whole ramp turns together. Lightness is kept, so the contrast pairs barely move. A near-gray
 * brand has no hue to pull toward, so the ramps stay Standard.
 */
function harmonize(scales: FeedbackScales, brand: Oklch): FeedbackScales {
  if (brand.c < 0.03) return scales;
  const turn = (scale: Scale, cap: number): Scale => {
    const diff = ((brand.h - hexToOklch(scale['600']).h + 540) % 360) - 180;
    const rot = Math.sign(diff) * Math.min(Math.abs(diff) / 2, cap);
    return Object.fromEntries(
      Object.entries(scale).map(([k, v]) => {
        const lch = hexToOklch(v);
        return [k, oklchToHex({ ...lch, h: (lch.h + rot + 360) % 360 })];
      }),
    );
  };
  return { red: turn(scales.red, 4), green: turn(scales.green, 8), yellow: turn(scales.yellow, 6) };
}

// ── Data viz (categorical series) ─────────────────────────────────────────
// --color-background-dataviz-1…8 are literal per-mode values in tokens.css
// (css-only), so a theme overrides them per mode. positive/negative/warning
// point at the feedback ramps and follow the Feedback choice on their own.

export type DatavizMode = 'default' | 'balanced' | 'brand' | 'shades';
export type DatavizSets = { light: string[]; dark: string[] };

export const DATAVIZ_MODES: { value: DatavizMode; label: string; description: string }[] = [
  { value: 'default', label: 'Nagarro', description: 'The Nagarro brand colours' },
  { value: 'balanced', label: 'Balanced', description: 'Eight evenly weighted hues, brand-neutral' },
  { value: 'brand', label: 'Brand-led', description: 'Starts at your brand, hues spread from it' },
  { value: 'shades', label: 'Brand shades', description: 'Steps of the accent ramp, best for up to 4 series' },
];

export const REF_DATAVIZ: DatavizSets = {
  light: ['#47D7AC', '#13294B', '#6240A8', '#F8485E', '#FAB46D', '#2D807B', '#9680C5', '#FBA3AF'],
  dark: ['#75E1C1', '#6240A8', '#F8485E', '#F97586', '#FCE195', '#3AAB94', '#B8A8D8', '#FCD0D7'],
};

// Neighbouring series differ in both hue and lightness. Lightness stays in the
// band that keeps 3:1 against the page (WCAG 1.4.11) in each mode.
// Warm hues sit on the lighter slot, where they stay orange/gold instead of brown.
const SERIES_L = { light: [0.47, 0.58], dark: [0.72, 0.84] };
const BALANCED_HUES = [255, 55, 175, 90, 300, 350, 140, 215]; // blue, orange, teal, gold, violet, pink, green, cyan
const BRAND_OFFSETS = [0, 180, 90, 270, 45, 225, 135, 315];

function hueSet(hues: number[], chroma: (i: number) => number): DatavizSets {
  const set = (ls: number[]) => hues.map((h, i) => oklchToHex({ l: ls[i % 2], c: chroma(i), h: (h + 360) % 360 }));
  return { light: set(SERIES_L.light), dark: set(SERIES_L.dark) };
}

// Accent steps per mode, alternating dark/light so neighbours separate.
const SHADE_STEPS = {
  light: ['600', '300', '900', '400', '800', '500', '950', '700'],
  dark: ['300', '600', '100', '400', '200', '500', '50', '700'],
};

function buildDataviz(mode: DatavizMode, brand: Oklch, accent: Scale): DatavizSets | null {
  if (mode === 'balanced') return hueSet(BALANCED_HUES, () => 0.15);
  // Series 1 keeps the brand's own chroma (a gray brand gives a gray first series).
  if (mode === 'brand') return hueSet(BRAND_OFFSETS.map((o) => brand.h + o), (i) => (i === 0 ? Math.min(brand.c, 0.16) : 0.15));
  if (mode === 'shades') return { light: SHADE_STEPS.light.map((k) => accent[k]), dark: SHADE_STEPS.dark.map((k) => accent[k]) };
  return null;
}

/**
 * Primary button fill. Nagarro ships near-black CTAs in light mode
 * (fixed-dark: contrast holds for any brand); 'brand' re-points light mode to
 * the accent ramp, the way dark mode already does. 'exact' fills both modes
 * with the picked hex itself and picks the label (dark or light) that reads on it.
 */
export type CtaMode = 'contrast' | 'brand' | 'exact';

export const CTA_MODES: { value: CtaMode; label: string; hint: string }[] = [
  { value: 'contrast', label: 'Safe contrast', hint: 'Near-black in light mode. Readable on any brand (Nagarro default).' },
  { value: 'brand', label: 'Ramp color', hint: 'Accent ramp step in light mode; may differ from the picked hex (default for other brands).' },
  { value: 'exact', label: 'Exact color', hint: 'The brand hex in both modes; label flips dark or light to stay readable.' },
];

/** Nagarro keeps its near-black CTA; any other brand defaults to its accent ramp. */
export const defaultCta = (brand: string): CtaMode => (brand.toUpperCase() === DEFAULT_BRAND ? 'contrast' : 'brand');

/** Selector for light-only overrides: the dark block in tokens.css already uses the accent. */
export const LIGHT_SELECTOR = ':root:not([data-theme="dark"])';

export const FONTS = [
  { id: 'default', label: 'Equip (Nagarro)', google: null, stack: null, note: 'Humanist sans, the Nagarro brand face' },
  { id: 'inter', label: 'Inter', google: 'Inter', stack: "'Inter', sans-serif", note: 'Neutral grotesque, built for UI' },
  { id: 'geist', label: 'Geist', google: 'Geist', stack: "'Geist', sans-serif", note: 'Crisp, technical grotesque' },
  { id: 'manrope', label: 'Manrope', google: 'Manrope', stack: "'Manrope', sans-serif", note: 'Modern geometric, open shapes' },
  { id: 'dm-sans', label: 'DM Sans', google: 'DM Sans', stack: "'DM Sans', sans-serif", note: 'Low-contrast geometric, friendly' },
  { id: 'plus-jakarta', label: 'Plus Jakarta Sans', google: 'Plus Jakarta Sans', stack: "'Plus Jakarta Sans', sans-serif", note: 'Geometric with a warm, wide stance' },
  { id: 'ibm-plex', label: 'IBM Plex Sans', google: 'IBM Plex Sans', stack: "'IBM Plex Sans', sans-serif", note: 'Engineered grotesque, corporate' },
  { id: 'source-sans', label: 'Source Sans 3', google: 'Source Sans 3', stack: "'Source Sans 3', sans-serif", note: 'Humanist, highly readable' },
  { id: 'system', label: 'System UI', google: null, stack: "system-ui, -apple-system, 'Segoe UI', sans-serif", note: 'The OS font, nothing to load' },
] as const;

export type FontId = (typeof FONTS)[number]['id'];

export type ThemeSettings = {
  brand: string; // 6-digit hex, no '#'
  neutral: NeutralMode;
  feedback: FeedbackMode;
  dataviz: DatavizMode;
  cta: CtaMode;
  font: FontId;
  style: SurfaceStyle;
  shape: Shape;
  density: Density;
};

export const DEFAULT_SETTINGS: ThemeSettings = { brand: DEFAULT_BRAND, neutral: 'default', feedback: 'default', dataviz: 'default', cta: 'contrast', font: 'default', style: 'embossed', shape: 'rounded', density: 'default' };

export const PRESETS: { label: string; settings: ThemeSettings }[] = [
  { label: 'Nagarro', settings: DEFAULT_SETTINGS },
  { label: 'Ocean', settings: { brand: '1D5FD1', neutral: 'match', feedback: 'harmonized', dataviz: 'brand', cta: 'brand', font: 'inter', style: 'soft', shape: 'pill', density: 'comfortable' } },
  { label: 'Forest', settings: { brand: '2F7D32', neutral: 'gray', feedback: 'standard', dataviz: 'balanced', cta: 'brand', font: 'manrope', style: 'flat', shape: 'subtle', density: 'default' } },
  { label: 'Berry', settings: { brand: 'B4236A', neutral: 'match', feedback: 'harmonized', dataviz: 'brand', cta: 'brand', font: 'dm-sans', style: 'embossed', shape: 'rounded', density: 'default' } },
  { label: 'Amber', settings: { brand: 'B45309', neutral: 'gray', feedback: 'standard', dataviz: 'shades', cta: 'brand', font: 'plus-jakarta', style: 'soft', shape: 'rounded', density: 'spacious' } },
  { label: 'Graphite', settings: { brand: '3F3F46', neutral: 'gray', feedback: 'standard', dataviz: 'balanced', cta: 'brand', font: 'ibm-plex', style: 'outlined', shape: 'square', density: 'compact' } },
];

function buildScale(ref: Record<string, string>, target: Oklch, chromaFactor: number, pinHex?: string) {
  const refLch = Object.fromEntries(Object.entries(ref).map(([k, v]) => [k, hexToOklch(v)]));
  const out: Record<string, string> = {};
  for (const [step, r] of Object.entries(refLch)) {
    out[step] = oklchToHex({ l: r.l, c: r.c * chromaFactor, h: target.h });
  }
  if (pinHex) {
    const closest = Object.entries(refLch).reduce((a, b) => (Math.abs(b[1].l - target.l) < Math.abs(a[1].l - target.l) ? b : a));
    out[closest[0]] = `#${pinHex.toUpperCase()}`;
  }
  return out;
}

/** Exact-color CTA: the picked hex, hover/pressed derived from it, and the label that reads on all three. */
export type ExactCta = { default: string; hover: string; pressed: string; label: string };

export type ThemeOutput = {
  accent: Record<string, string> | null;
  neutral: Record<string, string> | null;
  feedback: FeedbackScales | null;
  dataviz: DatavizSets | null;
  cta: CtaMode;
  exact: ExactCta | null;
  font: (typeof FONTS)[number];
  style: SurfaceStyle;
  shape: Shape;
  density: Density;
};

export function buildTheme(s: ThemeSettings): ThemeOutput {
  const brand = hexToOklch(`#${s.brand}`);
  const isDefaultBrand = s.brand.toUpperCase() === DEFAULT_BRAND;

  let accent: ThemeOutput['accent'] = null;
  if (!isDefaultBrand) {
    // Scale chroma relative to the reference step nearest in lightness, so a
    // muted brand yields a muted ramp and a vivid brand a vivid one.
    const refLch = Object.values(REF_ACCENT).map(hexToOklch);
    const nearest = refLch.reduce((a, b) => (Math.abs(b.l - brand.l) < Math.abs(a.l - brand.l) ? b : a));
    accent = buildScale(REF_ACCENT, brand, brand.c / Math.max(nearest.c, 1e-3), s.brand);
  }

  let neutral: ThemeOutput['neutral'] = null;
  if (s.neutral === 'gray') neutral = buildScale(REF_NEUTRAL, { ...brand, h: 0 }, 0);
  // 0.6 of the Nagarro violet tint: enough to read as brand, not enough to colour dark surfaces.
  if (s.neutral === 'match') neutral = buildScale(REF_NEUTRAL, brand, 0.6);

  const exact = s.cta === 'exact' ? exactCta(s.brand, neutral ?? REF_NEUTRAL) : null;

  let feedback: ThemeOutput['feedback'] = null;
  if (s.feedback === 'standard') feedback = STANDARD_FEEDBACK;
  if (s.feedback === 'harmonized') feedback = harmonize(STANDARD_FEEDBACK, brand);

  const dataviz = buildDataviz(s.dataviz, brand, accent ?? REF_ACCENT);

  return { accent, neutral, feedback, dataviz, cta: s.cta, exact, font: FONTS.find((f) => f.id === s.font) ?? FONTS[0], style: s.style, shape: s.shape, density: s.density };
}

/**
 * Label: the theme's darkest or lightest neutral, whichever contrasts more with
 * the fill (pure black/white if neither reaches AA; one of those always does).
 * Hover/pressed step the lightness toward the label, the usual direction (light
 * buttons darken, dark ones lighten), or away from it if pressed would drop the
 * label below AA.
 */
function exactCta(brand: string, neutral: Record<string, string>): ExactCta {
  const fill = `#${brand.toUpperCase()}`;
  const best = (cands: string[]) => cands.reduce((a, b) => (contrast(b, fill) > contrast(a, fill) ? b : a));
  let label = best([neutral['950'], neutral['50']]);
  if (contrast(label, fill) < 4.5) label = best(['#000000', '#FFFFFF']);
  const lch = hexToOklch(fill);
  const shift = (dir: number, amount: number) => oklchToHex({ ...lch, l: Math.min(1, Math.max(0, lch.l + dir * amount)) });
  // One direction for both states, so hover and pressed never move opposite ways.
  let dir = hexToOklch(label).l < lch.l ? -1 : 1;
  if (contrast(label, shift(dir, 0.1)) < 4.5) dir = -dir;
  // Near black a 0.05 lightness step is invisible: grow it until the state reads apart (≥ 1.1:1).
  // Pressed starts where hover's step ended, so it always sits beyond hover.
  let amount = 0;
  const visible = (from: string) => {
    let out = shift(dir, (amount += 0.05));
    while (contrast(out, from) < 1.1 && amount < 0.5) out = shift(dir, (amount += 0.01));
    return out;
  };
  const hover = visible(fill);
  return { default: fill, hover, pressed: visible(hover), label };
}

/** Scales to preview: the generated ones, or the Nagarro reference when unchanged. */
export const previewScales = (t: ThemeOutput) => ({
  accent: t.accent ?? REF_ACCENT,
  neutral: t.neutral ?? REF_NEUTRAL,
  feedback: t.feedback ?? REF_FEEDBACK,
  dataviz: t.dataviz ?? REF_DATAVIZ,
});

/** Label of the preset these settings match, or 'custom'. */
export const presetFor = (s: ThemeSettings) =>
  PRESETS.find((p) => encodeSettings(p.settings) === encodeSettings(s))?.label ?? 'custom';

/** Every override as CSS custom properties. Empty when nothing changed. */
export function themeVars(t: ThemeOutput): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [k, v] of Object.entries(t.accent ?? {})) vars[`--primitive-accent-${k}`] = v;
  for (const [k, v] of Object.entries(t.neutral ?? {})) vars[`--primitive-neutral-${k}`] = v;
  for (const [ramp, scale] of Object.entries(t.feedback ?? {})) {
    for (const [k, v] of Object.entries(scale)) vars[`--primitive-${ramp}-${k}`] = v;
  }
  if (t.font.stack) vars['--font-family-default'] = t.font.stack;
  Object.assign(vars, surfaceVars(t.style), shapeVars(t.shape), densityVars(t.density));
  return vars;
}

/**
 * Light-only overrides ('brand'). --color-border-interactive-strong follows
 * the strong fill on :root, so re-pointing the three fill states is enough.
 */
export function ctaLightVars(cta: CtaMode): Record<string, string> {
  if (cta !== 'brand') return {};
  return {
    '--color-background-interactive-strong-default': 'var(--color-background-interactive-primary-default)',
    '--color-background-interactive-strong-hover': 'var(--color-background-interactive-primary-hover)',
    '--color-background-interactive-strong-active': 'var(--color-background-interactive-primary-active)',
  };
}

/** Dark-only overrides: must outrank tokens.css's [data-theme="dark"] block. */
export const DARK_SELECTOR = ':root[data-theme="dark"]';

/** Categorical chart series for one mode. tokens.css declares them per mode, so they are overridden per mode. */
export function datavizVars(t: ThemeOutput, mode: 'light' | 'dark'): Record<string, string> {
  if (!t.dataviz) return {};
  return Object.fromEntries(t.dataviz[mode].map((hex, i) => [`--color-background-dataviz-${i + 1}`, hex]));
}

/** Selector for overrides in both modes: must outrank tokens.css's [data-theme="dark"] block. */
export const BOTH_MODES_SELECTOR = ':root, :root[data-theme]';

/** Both-mode overrides ('exact'): literal fills plus the label that reads on them. */
export function ctaExactVars(t: ThemeOutput): Record<string, string> {
  if (!t.exact) return {};
  return {
    '--color-background-interactive-strong-default': t.exact.default,
    '--color-background-interactive-strong-hover': t.exact.hover,
    '--color-background-interactive-strong-active': t.exact.pressed,
    '--button-foreground-primary': t.exact.label,
  };
}

const googleFontUrl = (family: string) =>
  `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@400;500;600&display=swap`;

/** Stack that renders a font's own sample, even while another font is applied. Mirrors tokens.css for Equip. */
export const sampleStack = (f: (typeof FONTS)[number]) => f.stack ?? "'Equip', 'Geist Sans', 'Inter', sans-serif";

/** One stylesheet with every Google font in the list, subset to the glyphs of its own name plus "Aa" (a few KB). */
export const fontSamplesHref = () =>
  `https://fonts.googleapis.com/css2?${FONTS.filter((f) => f.google)
    .map((f) => `family=${f.google!.replace(/ /g, '+')}`)
    .join('&')}&text=${encodeURIComponent([...new Set(FONTS.map((f) => f.label).join('') + 'Aa')].join(''))}&display=swap`;

export const fontHref = (t: ThemeOutput) => (t.font.google ? googleFontUrl(t.font.google) : null);

const declLines = (vars: Record<string, string>) => Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join('\n');

/** Declarations of one theme, grouped and commented the same way in single- and multi-brand files. */
function themeBody(t: ThemeOutput): string {
  const block = (vars: Record<string, string>, comment: string) =>
    Object.keys(vars).length ? `\n  /* ${comment} */\n${declLines(vars)}` : '';
  return [
    declLines(themeVars({ ...t, style: 'embossed', shape: 'rounded', density: 'default' })),
    block(shapeVars(t.shape), `Shape: ${t.shape} — Figma \`shape\` collection mode.`),
    block(densityVars(t.density), `Density: ${t.density} — Figma \`density\` collection mode.`),
    block(surfaceVars(t.style), `Surface style: ${t.style} — PROTOTYPE, pending the Figma effects \`Style\` mode.`),
  ].join('');
}

export function toCss(t: ThemeOutput, shareUrl: string): string {
  const href = fontHref(t);
  const decl = declLines;
  const cta = ctaLightVars(t.cta);
  const exact = ctaExactVars(t);
  const vizLight = datavizVars(t, 'light');
  const vizDark = datavizVars(t, 'dark');
  const body = themeBody(t);
  return [
    '/**',
    ' * DS-Ngr theme — generated by the theme configurator. Do not edit by hand.',
    ' * Load AFTER tokens.css. Re-values existing primitive and size tokens only;',
    ' * light and dark modes both follow because semantic tokens point at these.',
    ` * Edit: ${shareUrl}`,
    ' */',
    href ? `@import url('${href}');\n` : '',
    `:root {\n${body || '  /* Nagarro defaults — no overrides */'}\n}`,
    Object.keys(cta).length
      ? `\n/* Primary button: brand color in light mode (dark mode already uses the accent). */\n${LIGHT_SELECTOR} {\n${decl(cta)}\n}`
      : '',
    Object.keys(exact).length
      ? `\n/* Primary button: exact brand color in both modes, label picked for contrast. */\n${BOTH_MODES_SELECTOR} {\n${decl(exact)}\n}`
      : '',
    Object.keys(vizLight).length
      ? `\n/* Chart series — light mode (css-only tokens, declared per mode). */\n${LIGHT_SELECTOR} {\n${decl(vizLight)}\n}\n\n/* Chart series — dark mode. */\n${DARK_SELECTOR} {\n${decl(vizDark)}\n}`
      : '',
    '',
  ].join('\n');
}

const dtcgColor = (hex: string) => {
  const n = hex.replace('#', '');
  return {
    $type: 'color',
    $value: {
      colorSpace: 'srgb',
      components: [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255),
      alpha: 1,
      hex: hex.toUpperCase(),
    },
  };
};

/** Same shape as Design Tokens/primitive.tokens.json + font.tokens.json, for Figma import. */
export function toDtcg(t: ThemeOutput) {
  const colors: Record<string, Record<string, unknown>> = {};
  if (t.accent) colors.accent = Object.fromEntries(Object.entries(t.accent).map(([k, v]) => [k, dtcgColor(v)]));
  if (t.neutral) colors.neutral = Object.fromEntries(Object.entries(t.neutral).map(([k, v]) => [k, dtcgColor(v)]));
  for (const [ramp, scale] of Object.entries(t.feedback ?? {})) {
    colors[ramp] = Object.fromEntries(Object.entries(scale).map(([k, v]) => [k, dtcgColor(v)]));
  }
  return {
    primitive: colors,
    ...(t.font.stack && {
      font: { family: { default: { $type: 'string', $value: t.font.google ?? t.font.label } } },
    }),
    ...((t.style !== 'embossed' || t.shape !== 'rounded' || t.density !== 'default' || t.cta !== 'contrast' || t.dataviz) && {
      $extensions: {
        'ds-ngr': {
          ...(t.cta === 'brand' && {
            primaryButton: 'brand',
            primaryButtonNote: 'Light mode: point color/background/interactive/strong/{default,hover,active} at color/background/interactive/primary/* instead of color/background/fixed-dark/*',
          }),
          ...(t.exact && {
            primaryButton: 'exact',
            primaryButtonValues: { ...t.exact },
            primaryButtonNote: 'Both modes: set color/background/interactive/strong/{default,hover,active} and button/foreground/primary to these values. button/foreground/primary aliases color/foreground/inverse/primary by default.',
          }),
          ...((t.shape !== 'rounded' || t.density !== 'default') && {
            modes: { shape: SHAPES.find((x) => x.value === t.shape)!.label, density: DENSITIES.find((x) => x.value === t.density)!.label },
          }),
          ...(t.style !== 'embossed' && { surfaceStyle: t.style, note: 'Pending Figma effects Style mode' }),
          ...(t.dataviz && {
            dataviz: { ...t.dataviz },
            datavizNote: 'color/background/dataviz-1…8 per mode (light, dark). css-only until the dataviz tokens exist in Figma.',
          }),
        },
      },
    }),
  };
}

// ── Contrast checks (the semantic pairings in tokens.css) ──────────────────
const pick = (scale: Record<string, string> | null, ref: Record<string, string>, step: string) => (scale ?? ref)[step];

export type ContrastCheck = { label: string; ratio: number; fg: string; bg: string };

export function contrastChecks(t: ThemeOutput): ContrastCheck[] {
  const a = (s: string) => pick(t.accent, REF_ACCENT, s);
  const n = (s: string) => pick(t.neutral, REF_NEUTRAL, s);
  const { red, green, yellow } = t.feedback ?? REF_FEEDBACK;
  const pairs: [string, string, string][] = [
    ['Light · accent text on page', a('600'), n('50')],
    ['Light · primary text on page', n('950'), n('50')],
    ['Light · secondary text on page', n('600'), n('50')],
    ...(t.cta === 'brand'
      ? ([
          ['Light · CTA label on accent', n('50'), a('600')],
          ['Light · CTA label on hover', n('50'), a('500')],
        ] as [string, string, string][])
      : []),
    ...(t.exact
      ? ([
          ['Both · CTA label on brand', t.exact.label, t.exact.default],
          ['Both · CTA label on hover', t.exact.label, t.exact.hover],
          ['Both · CTA label on pressed', t.exact.label, t.exact.pressed],
        ] as [string, string, string][])
      : ([['Dark · CTA label on accent', n('950'), a('300')]] as [string, string, string][])),
    ['Dark · accent text on page', a('300'), n('900')],
    ['Dark · primary text on page', n('50'), n('900')],
    ['Light · error text on error tint', red['700'], red['100']],
    ['Light · success text on success tint', green['800'], green['100']],
    ['Light · warning text on warning tint', yellow['700'], yellow['100']],
    ['Light · danger text on page', red['600'], n('50')],
    ['Dark · error text on error tint', red['300'], red['950']],
    ['Dark · success text on success tint', green['300'], green['950']],
    ['Dark · warning text on warning tint', yellow['200'], yellow['950']],
    ['Dark · danger text on page', red['400'], n('900')],
  ];
  return pairs.map(([label, fg, bg]) => ({ label, fg, bg, ratio: contrast(fg, bg) }));
}

// ── URL state ──────────────────────────────────────────────────────────────
export function encodeSettings(s: ThemeSettings): string {
  const p = new URLSearchParams();
  if (s.brand.toUpperCase() !== DEFAULT_BRAND) p.set('brand', s.brand.toLowerCase());
  if (s.neutral !== 'default') p.set('neutral', s.neutral);
  if (s.feedback !== 'default') p.set('feedback', s.feedback);
  if (s.dataviz !== 'default') p.set('dataviz', s.dataviz);
  if (s.cta !== defaultCta(s.brand)) p.set('cta', s.cta);
  if (s.font !== 'default') p.set('font', s.font);
  if (s.style !== 'embossed') p.set('style', s.style);
  if (s.shape !== 'rounded') p.set('shape', s.shape);
  if (s.density !== 'default') p.set('density', s.density);
  return p.toString();
}

export function decodeSettings(query: string): ThemeSettings {
  const p = new URLSearchParams(query);
  const brand = p.get('brand') ?? '';
  const neutral = p.get('neutral');
  const font = p.get('font');
  const style = p.get('style');
  const shape = p.get('shape');
  const density = p.get('density');
  const hex = /^[0-9a-fA-F]{6}$/.test(brand) ? brand.toUpperCase() : DEFAULT_BRAND;
  return {
    brand: hex,
    neutral: neutral === 'gray' || neutral === 'match' ? neutral : 'default',
    feedback: FEEDBACK_MODES.some((x) => x.value === p.get('feedback')) ? (p.get('feedback') as FeedbackMode) : 'default',
    dataviz: DATAVIZ_MODES.some((x) => x.value === p.get('dataviz')) ? (p.get('dataviz') as DatavizMode) : 'default',
    cta: CTA_MODES.some((x) => x.value === p.get('cta')) ? (p.get('cta') as CtaMode) : defaultCta(hex),
    font: FONTS.some((f) => f.id === font) ? (font as FontId) : 'default',
    style: SURFACE_STYLES.some((x) => x.value === style) ? (style as SurfaceStyle) : 'embossed',
    shape: SHAPES.some((x) => x.value === shape) ? (shape as Shape) : 'rounded',
    density: DENSITIES.some((x) => x.value === density) ? (density as Density) : 'default',
  };
}

// ── Multi-brand ────────────────────────────────────────────────────────────
// Semantic tokens resolve primitives where they are declared (:root and
// [data-theme]), so a brand only takes effect on <html>: one brand per page.

export type Brand = { name: string; slug: string; settings: ThemeSettings };

/** Kebab-case slug for data-brand, unique against `taken`. */
export function slugify(name: string, taken: string[] = []): string {
  const base = name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'brand';
  let slug = base;
  for (let i = 2; taken.includes(slug); i++) slug = `${base}-${i}`;
  return slug;
}

const brandScope = (slug: string, isDefault: boolean) =>
  `:root[data-brand="${slug}"]${isDefault ? ', :root:not([data-brand])' : ''}`;
const brandBothScope = (slug: string, isDefault: boolean) =>
  `:root[data-brand="${slug}"], :root[data-brand="${slug}"][data-theme]${isDefault ? ', :root:not([data-brand]), :root:not([data-brand])[data-theme]' : ''}`;
const brandLightScope = (slug: string, isDefault: boolean) =>
  `:root[data-brand="${slug}"]:not([data-theme="dark"])${isDefault ? ', :root:not([data-brand]):not([data-theme="dark"])' : ''}`;
const brandDarkScope = (slug: string, isDefault: boolean) =>
  `:root[data-brand="${slug}"][data-theme="dark"]${isDefault ? ', :root:not([data-brand])[data-theme="dark"]' : ''}`;

/**
 * One file for several brands. Each block only re-values what that brand
 * changes; anything left at Nagarro falls through to tokens.css, because
 * :root[data-brand] outranks tokens.css's :root.
 */
export function toMultiCss(brands: Brand[], defaultSlug: string, shareUrl: string): string {
  const fonts = [...new Set(brands.map((b) => fontHref(buildTheme(b.settings))).filter((h): h is string => !!h))];
  const blocks = brands.map((b) => {
    const t = buildTheme(b.settings);
    const isDefault = b.slug === defaultSlug;
    const cta = ctaLightVars(t.cta);
    const exact = ctaExactVars(t);
    const vizLight = datavizVars(t, 'light');
    const vizDark = datavizVars(t, 'dark');
    return [
      `/* ${b.name}${isDefault ? ' (default)' : ''} */`,
      `${brandScope(b.slug, isDefault)} {\n${themeBody(t) || '  /* Nagarro defaults — no overrides */'}\n}`,
      Object.keys(cta).length ? `${brandLightScope(b.slug, isDefault)} {\n${declLines(cta)}\n}` : '',
      Object.keys(exact).length ? `${brandBothScope(b.slug, isDefault)} {\n${declLines(exact)}\n}` : '',
      Object.keys(vizLight).length ? `${brandLightScope(b.slug, isDefault)} {\n${declLines(vizLight)}\n}` : '',
      Object.keys(vizDark).length ? `${brandDarkScope(b.slug, isDefault)} {\n${declLines(vizDark)}\n}` : '',
    ].filter(Boolean).join('\n');
  });
  return [
    '/**',
    ' * DS-Ngr multi-brand theme — generated by the theme configurator. Do not edit by hand.',
    ' * Load AFTER tokens.css. Set data-brand on <html> (not on inner elements):',
    ` *   ${brands.map((b) => `<html data-brand="${b.slug}">`).join('  ')}`,
    ` * Without data-brand the default brand (${defaultSlug}) applies.`,
    ` * Edit: ${shareUrl}`,
    ' */',
    ...fonts.map((h) => `@import url('${h}');`),
    '',
    blocks.join('\n\n'),
    '',
  ].join('\n');
}

/**
 * Each brand in today's single-brand DTCG shape, keyed by slug. In Figma a brand
 * is a collection mode, so scales are always written out: a brand left at
 * Nagarro still needs its own values in its mode.
 */
export function toMultiDtcg(brands: Brand[], defaultSlug: string) {
  return {
    $extensions: { 'ds-ngr': { brands: brands.map((b) => ({ slug: b.slug, name: b.name })), default: defaultSlug } },
    brands: Object.fromEntries(
      brands.map((b) => {
        const t = buildTheme(b.settings);
        const dtcg = toDtcg({ ...t, ...previewScales(t) });
        return [b.slug, { ...dtcg, font: { family: { default: { $type: 'string', $value: t.font.stack ? (t.font.google ?? t.font.label) : 'Equip' } } } }];
      }),
    ),
  };
}

// Share link for a bundle: ?brands=<base64url JSON [{n, q, d?}]>, q = encodeSettings().
const b64url = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

export function encodeBrands(brands: Brand[], defaultSlug: string): string {
  return b64url(JSON.stringify(brands.map((b) => ({ n: b.name, q: encodeSettings(b.settings), ...(b.slug === defaultSlug && { d: 1 }) }))));
}

export function decodeBrands(param: string): { brands: Brand[]; defaultSlug: string } | null {
  try {
    const raw = JSON.parse(unb64url(param)) as { n: string; q: string; d?: 1 }[];
    if (!Array.isArray(raw)) return null;
    const brands: Brand[] = [];
    let defaultSlug = '';
    for (const r of raw) {
      if (typeof r?.n !== 'string' || typeof r.q !== 'string') continue;
      const slug = slugify(r.n, brands.map((b) => b.slug));
      brands.push({ name: r.n.slice(0, 40), slug, settings: decodeSettings(r.q) });
      if (r.d) defaultSlug = slug;
    }
    return brands.length ? { brands, defaultSlug: defaultSlug || brands[0].slug } : null;
  } catch {
    return null;
  }
}
