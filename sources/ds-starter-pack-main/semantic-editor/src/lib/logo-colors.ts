/**
 * A logo's brand colors, read in the browser (the file never leaves the page). Pixels are grouped
 * by hue; transparent pixels, whites, blacks and greys are ignored, since a brand color is the
 * chromatic part of a logo. Groups are ranked by how much of the logo they cover, weighted by
 * how saturated they are.
 */
import { oklchToHex, toOklch } from '../../../stories/base-ui/tokens/color-math'
import type { Oklch3 } from '../../../stories/base-ui/tokens/theme-config'

export interface LogoColor {
  hex: string
  oklch: Oklch3
  /** Share of the logo's colored pixels, 0–1. */
  share: number
}

const SIZE = 96
const BUCKET = 15 // degrees of hue per group
const MIN_CHROMA = 0.04

export async function logoColors(file: File, max = 5): Promise<LogoColor[]> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const scale = Math.min(1, SIZE / Math.max(img.naturalWidth || SIZE, img.naturalHeight || SIZE))
    const w = Math.max(1, Math.round((img.naturalWidth || SIZE) * scale))
    const h = Math.max(1, Math.round((img.naturalHeight || SIZE) * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return []
    ctx.drawImage(img, 0, 0, w, h)
    const { data } = ctx.getImageData(0, 0, w, h)

    const groups = new Map<number, { n: number; weight: number; l: number; c: number; x: number; y: number }>()
    let colored = 0
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue
      const hex = `#${[data[i], data[i + 1], data[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('')}`
      const o = toOklch(hex)
      if (!o || o.c < MIN_CHROMA || o.l < 0.12 || o.l > 0.97) continue
      colored++
      const key = Math.floor(o.h / BUCKET) % (360 / BUCKET)
      const g = groups.get(key) ?? { n: 0, weight: 0, l: 0, c: 0, x: 0, y: 0 }
      g.n++
      g.weight += o.c
      g.l += o.l
      g.c += o.c
      // Average hue as a vector, so 359° and 1° average to 0°, not 180°.
      g.x += Math.cos((o.h * Math.PI) / 180)
      g.y += Math.sin((o.h * Math.PI) / 180)
      groups.set(key, g)
    }
    if (!colored) return []

    const ranked = [...groups.values()]
      .sort((a, b) => b.weight - a.weight)
      .map((g) => {
        const oklch = { h: ((Math.atan2(g.y, g.x) * 180) / Math.PI + 360) % 360, c: g.c / g.n, l: g.l / g.n }
        return { oklch, hex: oklchToHex({ ...oklch, alpha: 1 }), share: g.n / colored }
      })
    // Neighbouring groups are usually one color across a bucket edge: keep the stronger one.
    const distinct: LogoColor[] = []
    for (const c of ranked) {
      if (c.share < 0.02) continue
      if (distinct.some((d) => hueDistance(d.oklch.h, c.oklch.h) < 25)) continue
      distinct.push(c)
      if (distinct.length === max) break
    }
    return distinct
  } finally {
    URL.revokeObjectURL(url)
  }
}

export const hueDistance = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}
