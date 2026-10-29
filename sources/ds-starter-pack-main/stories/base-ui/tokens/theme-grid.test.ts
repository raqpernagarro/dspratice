import { describe, expect, it } from 'vitest'

import { withDefaults } from './theme-config'
import { generateTokens, radiusScale, snapToGrid } from './theme-generator'

const SPACE = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'].map((s) => `space/${s}`)
const SIZES = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl'].map((s) => `size/${s}`)
const onGrid = (v: number) => v === 0 || v === 2 || v % 4 === 0
const n = (v: string) => parseFloat(v)

describe('the 4px grid', () => {
  it('is on unless switched off, also for older saved themes', () => {
    expect(withDefaults({}).grid).toBe(true)
    expect(withDefaults({ grid: false }).grid).toBe(false)
  })

  it('rounds to multiples of 4, and 2 below 4', () => {
    expect([0, 1.5, 2.3, 3.2, 5, 9.2, 14, 18.4, 37].map(snapToGrid)).toEqual([0, 2, 2, 4, 4, 8, 16, 20, 36])
  })

  it('keeps every density on the grid, in order and distinct', () => {
    for (let k = 0.75; k <= 1.3; k += 0.05) {
      const out = generateTokens(withDefaults({ density: k }))
      for (const ladder of [SPACE, SIZES]) {
        const values = ladder.map((p) => n(out[p]))
        expect(values.every(onGrid), `×${k.toFixed(2)} ${values}`).toBe(true)
        expect(values.every((v, i) => i === 0 || v > values[i - 1]), `×${k.toFixed(2)} ${values}`).toBe(true)
      }
    }
  })

  it('keeps corners on the grid', () => {
    for (let md = 0; md <= 24; md++) expect(Object.values(radiusScale(md, true)).every(onGrid)).toBe(true)
    expect(radiusScale(8, true)).toEqual({ sm: 4, md: 8, lg: 12 })
  })

  it('switched off, any pixel value is possible', () => {
    const out = generateTokens(withDefaults({ density: 1.15, radius: 8, grid: false }))
    expect(n(out['space/md'])).toBe(14)
    expect(n(out['shape/radius/lg'])).toBe(13)
  })
})
