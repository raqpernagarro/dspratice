type Rgba = readonly [r: number, g: number, b: number, a: number]

let ctx: CanvasRenderingContext2D | null = null
const cache = new Map<string, Rgba>()

/** Resolves any CSS color (oklch, rgba, named…) to sRGB by painting one pixel. */
export function resolveRgba(color: string): Rgba {
  const hit = cache.get(color)
  if (hit) return hit
  if (!ctx) {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    ctx = canvas.getContext('2d', { willReadFrequently: true })
  }
  if (!ctx) return [0, 0, 0, 1]
  ctx.clearRect(0, 0, 1, 1)
  ctx.fillStyle = '#000'
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  const rgba: Rgba = [r, g, b, a / 255]
  cache.set(color, rgba)
  return rgba
}

export function toHex(color: string) {
  const [r, g, b, a] = resolveRgba(color)
  const hex = `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`.toUpperCase()
  return a < 1 ? `${hex} · ${Math.round(a * 100)}%` : hex
}

function luminance(color: string) {
  const [r, g, b] = resolveRgba(color).map((v, i) => {
    if (i === 3) return v
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 2 contrast ratio between two opaque colors. */
export function contrastRatio(fg: string, bg: string) {
  const [l1, l2] = [luminance(fg), luminance(bg)].sort((a, b) => b - a)
  return (l1 + 0.05) / (l2 + 0.05)
}

export interface Hsv {
  h: number
  s: number
  v: number
}

export function hexToHsv(hex: string): Hsv {
  const [r, g, b] = resolveRgba(hex).map((x, i) => (i < 3 ? x / 255 : x))
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  let h = 0
  if (d) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
  }
  return { h: (h * 60 + 360) % 360, s: max ? d / max : 0, v: max }
}

export function hsvToHex({ h, s, v }: Hsv) {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  return `#${[f(5), f(3), f(1)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('')}`
}
