// The Home prompt routes common phrasings to the right journey with no model call.
import { describe, expect, it } from 'vitest'
import { matchJourneys, normalise } from './intent'
import { JOURNEYS } from '@/fixtures/journeys'

const top = (text: string) => matchJourneys(text)[0]?.journey.id

describe('journey metadata', () => {
  it('has unique ids, four featured per group, and steps on every guide', () => {
    expect(new Set(JOURNEYS.map((j) => j.id)).size).toBe(JOURNEYS.length)
    for (const g of ['clients', 'projects'] as const) expect(JOURNEYS.filter((j) => j.group === g && j.featured)).toHaveLength(4)
    for (const j of JOURNEYS) {
      expect(j.keywords.length).toBeGreaterThan(3)
      expect(j.to.startsWith('/')).toBe(true)
      if (j.status === 'guide') expect(j.steps?.length).toBeGreaterThan(0)
    }
  })
})

describe('intent router', () => {
  it.each([
    ['We got an RFP from a bank', 'respond-request'],
    ['answer a vendor questionnaire', 'respond-request'],
    ['I need slides for Thursday’s pitch', 'presentation'],
    ['make a pitch deck for Contoso', 'presentation'],
    ['show the client a live demo of design, code and AI', 'client-demo'],
    ['how AI-ready is their design system?', 'ai-readiness'],
    ['maturity scorecard for a prospect', 'ai-readiness'],
    ['a keynote on design systems and AI', 'idea-deck'],
    ['write a recap after the meeting with next steps', 'follow-up'],
    ['what package and scope should we propose, rough estimate', 'shape-offer'],
    ['set up a new design system from scratch', 'new-system'],
    ['greenfield project, no design system yet', 'new-system'],
    ['audit and consolidate their existing design system', 'improve-system'],
    ['drift and inconsistencies in their existing system', 'improve-system'],
    ['Jane needs a prototype on the ASSA ABLOY design system', 'prototype'],
    ['clickable screens on the client’s components', 'prototype'],
    ['I joined a product team to redesign the app', 'product-design'],
    ['add component metadata and llms.txt so agents stay on system', 'ai-ready-system'],
    ['set up Code Connect between Figma variables and Storybook', 'figma-code'],
    ['steering meeting status update', 'project-update'],
  ])('“%s” → %s', (text, id) => {
    expect(top(text)).toBe(id)
  })

  it('returns nothing for empty or unrelated text, and at most three matches', () => {
    expect(matchJourneys('')).toEqual([])
    expect(matchJourneys('lunch on friday')).toEqual([])
    expect(matchJourneys('rfp deck demo prototype figma scorecard').length).toBe(3)
  })

  it('says which words matched', () => {
    expect(matchJourneys('respond to the tender')[0].matched).toEqual(expect.arrayContaining(['tender', 'respond']))
  })

  it('normalises case, punctuation and plurals', () => {
    expect(normalise('Prototypes, Designs & RFPs!')).toEqual(['prototype', 'design', 'rfp'])
  })
})
