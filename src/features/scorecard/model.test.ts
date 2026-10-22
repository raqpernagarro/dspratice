// The public AI-readiness scorecard: levels, weakest dimensions and the package it points to.
import { describe, expect, it } from 'vitest'
import { QUESTIONS, score } from './model'

const all = (v: number) => Object.fromEntries(QUESTIONS.map((q) => [q.id, v]))

describe('scorecard scoring', () => {
  it('has ten questions over five dimensions, four answers each', () => {
    expect(QUESTIONS).toHaveLength(10)
    expect(new Set(QUESTIONS.map((q) => q.dimension)).size).toBe(5)
    for (const q of QUESTIONS) expect(q.answers).toHaveLength(4)
  })

  it('maps the extremes to levels 1 and 5 and always starts with the audit', () => {
    expect(score(all(0)).level).toBe(1)
    expect(score(all(3)).level).toBe(5)
    expect(score(all(1)).first).toBe('2-week AI audit')
    expect(score(all(0)).then).toBe('DS Build')
  })

  it('names the three weakest dimensions and counts answers', () => {
    const r = score({ ...all(3), q3: 0, q4: 0 })
    expect(r.answered).toBe(10)
    expect(r.weakest).toHaveLength(3)
    expect(r.weakest[0]).toBe('parity')
    expect(score({}).answered).toBe(0)
  })
})
