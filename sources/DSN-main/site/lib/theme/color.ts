/**
 * Minimal OKLCH ⇄ sRGB conversion, gamut clamping and WCAG contrast.
 * OKLab matrices from Björn Ottosson (https://bottosson.github.io/posts/oklab/).
 */

export type Oklch = { l: number; c: number; h: number };
type Rgb = [number, number, number]; // linear sRGB, 0–1

const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const toGamma = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

export function hexToLinear(hex: string): Rgb {
  const n = hex.replace('#', '');
  return [0, 2, 4].map((i) => toLinear(parseInt(n.slice(i, i + 2), 16) / 255)) as Rgb;
}

export function linearToHex(rgb: Rgb): string {
  return (
    '#' +
    rgb
      .map((v) => Math.round(Math.min(1, Math.max(0, toGamma(v))) * 255).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

export function linearToOklch([r, g, b]: Rgb): Oklch {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const h = (Math.atan2(B, A) * 180) / Math.PI;
  return { l: L, c: Math.hypot(A, B), h: h < 0 ? h + 360 : h };
}

export function oklchToLinear({ l: L, c, h }: Oklch): Rgb {
  const A = c * Math.cos((h * Math.PI) / 180);
  const B = c * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

export const hexToOklch = (hex: string) => linearToOklch(hexToLinear(hex));

const inGamut = (rgb: Rgb) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

/** OKLCH → hex, reducing chroma (keeping L and H) until the colour fits sRGB. */
export function oklchToHex(color: Oklch): string {
  if (inGamut(oklchToLinear(color))) return linearToHex(oklchToLinear(color));
  let lo = 0;
  let hi = color.c;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklchToLinear({ ...color, c: mid }))) lo = mid;
    else hi = mid;
  }
  return linearToHex(oklchToLinear({ ...color, c: lo }));
}

export function isHex(value: string) {
  return /^#?[0-9a-fA-F]{6}$/.test(value);
}

/** WCAG 2.x contrast ratio between two hex colours. */
export function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = hexToLinear(hex);
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
