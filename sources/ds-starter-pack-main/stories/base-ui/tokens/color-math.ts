/** Minimal sRGB ↔ OKLCH helpers (no DOM) used by the theme generator. */

export interface Oklch {
  l: number
  c: number
  h: number
  alpha: number
}

const srgbToLinear = (x: number) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)
const linearToSrgb = (x: number) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055)

/** Parses #rgb, #rrggbb, #rrggbbaa and rgb()/rgba(). */
export function parseColor(input: string): { r: number; g: number; b: number; a: number } | null {
  const s = input.trim()
  const hex = s.match(/^#([0-9a-f]{3,8})$/i)
  if (hex) {
    let h = hex[1]
    if (h.length === 3) h = h.split('').map((c) => c + c).join('')
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16) / 255
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) : 1 }
  }
  const rgb = s.match(/^rgba?\(([^)]+)\)$/i)
  if (rgb) {
    const [r, g, b, a = '1'] = rgb[1].split(/[\s,/]+/).filter(Boolean)
    return { r: +r / 255, g: +g / 255, b: +b / 255, a: +a }
  }
  return null
}

export function toOklch(input: string): Oklch | null {
  const c = parseColor(input)
  if (!c) return null
  const [r, g, b] = [c.r, c.g, c.b].map(srgbToLinear)
  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_
  const chroma = Math.hypot(A, B)
  const hue = ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360
  return { l: L, c: chroma, h: hue, alpha: c.a }
}

/** OKLCH → hex (clamped to sRGB). */
export function oklchToHex({ l, c, h }: Oklch): string {
  const a = c * Math.cos((h * Math.PI) / 180)
  const b = c * Math.sin((h * Math.PI) / 180)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const rgb = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ]
  return `#${rgb
    .map((x) => Math.round(Math.min(1, Math.max(0, linearToSrgb(x))) * 255).toString(16).padStart(2, '0'))
    .join('')}`
}

export function withAlpha(hex: string, alpha: number) {
  const c = parseColor(hex)
  if (!c) return hex
  if (alpha >= 1) return hex
  return `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${Math.round(alpha * 1000) / 1000})`
}

export type RampStep = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950
const STEPS: [RampStep, number, number][] = [
  // step, lightness, chroma share
  [50, 0.975, 0.12],
  [100, 0.945, 0.24],
  [200, 0.895, 0.45],
  [300, 0.82, 0.7],
  [400, 0.73, 0.9],
  [500, 0.645, 1],
  [600, 0.565, 1],
  [700, 0.485, 0.92],
  [800, 0.405, 0.8],
  [900, 0.32, 0.65],
  [950, 0.235, 0.5],
]

/**
 * An 11-step ramp sharing the seed's hue; chroma follows the seed, tapering at the ends.
 * `contrast` spreads (>1) or compresses (<1) lightness around the middle of the ramp.
 */
export function ramp(seedHex: string, contrast = 1): Record<RampStep, string> {
  const seed = toOklch(seedHex) ?? { l: 0.6, c: 0.15, h: 260, alpha: 1 }
  const out = {} as Record<RampStep, string>
  for (const [step, l, share] of STEPS) {
    const spread = Math.min(0.99, Math.max(0.12, 0.6 + (l - 0.6) * contrast))
    out[step] = oklchToHex({ l: spread, c: seed.c * share, h: seed.h, alpha: 1 })
  }
  return out
}

/** WCAG relative luminance. */
export function luminance(input: string) {
  const c = parseColor(input)
  if (!c) return 0
  const [r, g, b] = [c.r, c.g, c.b].map(srgbToLinear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

/** Whichever of `light` / `dark` reads better on `bg`. */
export function readableOn(bg: string, light = '#ffffff', dark = '#06041f') {
  return contrast(light, bg) >= contrast(dark, bg) ? light : dark
}
