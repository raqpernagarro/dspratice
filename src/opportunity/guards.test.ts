// The honesty guards applied to every draft (template or model): no invented figures, no other
// client's name, and source text is passed to a model as data, never as instructions.
import { describe, expect, it } from 'vitest'
import { guardFigures, NOT_IN_SOURCES, otherClientHits, type AllowedSection } from './validate'
import { SYSTEM_RULES } from './prompts'

describe('draft guards', () => {
  const allowed = new Map<string, AllowedSection>([['sec-1', { sourceId: 'src-a', text: 'The 2-week AI audit ends with a readout.', approval: 'approved' }]])

  it('keeps a figure found in the cited section and replaces one that is not', () => {
    const cite = [{ sourceId: 'src-a', sectionId: 'sec-1' }]
    expect(guardFigures('A 2-week AI audit first.', cite, allowed).replaced).toEqual([])
    const out = guardFigures('It cuts drift by 40% in 3 months.', cite, allowed)
    expect(out.text).toContain(NOT_IN_SOURCES)
    expect(out.replaced.length).toBeGreaterThan(0)
  })

  it('flags other clients but not the client the response is for', () => {
    expect(otherClientHits('We did the same for Vorwerk and ASSA ABLOY.', 'Northwind Retail')).toEqual(expect.arrayContaining(['Vorwerk', 'ASSA ABLOY']))
    expect(otherClientHits('Northwind Retail teams own the system.', 'Northwind Retail')).toEqual([])
  })

  it('tells the model that source text is reference material, not instructions', () => {
    expect(SYSTEM_RULES).toMatch(/reference material|not instructions/i)
    expect(SYSTEM_RULES).toMatch(/pric/i)
  })
})
