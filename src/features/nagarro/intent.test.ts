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
    // the way designers and engineers actually type it
    ['need a deck for monday', 'presentation'],
    ['slides for the client workshop next week', 'presentation'],
    ['a client sent us a tender for a design system', 'respond-request'],
    ['help me answer this RFI', 'respond-request'],
    ['rfp due friday, where do I start', 'respond-request'],
    ['prepare the demo for tomorrow’s meeting', 'client-demo'],
    ['client wants to see a live demo of the AI', 'client-demo'],
    ['show a prospect how design and code stay in sync', 'client-demo'],
    ['quick maturity check of their design system', 'ai-readiness'],
    ['is their system ready for AI tools?', 'ai-readiness'],
    ['I have a topic for a talk and need slides', 'idea-deck'],
    ['webinar about design systems and AI', 'idea-deck'],
    ['recap deck after yesterday’s meeting', 'follow-up'],
    ['what should we propose and how big is the team', 'shape-offer'],
    ['statement of work for a design system', 'shape-offer'],
    ['the client has no design system, we start from zero', 'new-system'],
    ['set up tokens and components with the starter pack', 'new-system'],
    ['their design system is a mess, help me clean it up', 'improve-system'],
    ['migrate an old component library', 'improve-system'],
    ['Figma variables out of sync with the code', 'figma-code'],
    ['link Figma components to Storybook', 'figma-code'],
    ['design handoff keeps breaking', 'figma-code'],
    ['make a clickable prototype for the customer portal', 'prototype'],
    ['mock up a few screens with their components', 'prototype'],
    ['protoype the dashboard', 'prototype'],
    ['new feature for the app, do they have a design system?', 'product-design'],
    ['joining a product team for discovery', 'product-design'],
    ['write llms.txt and component metadata for agents', 'ai-ready-system'],
    ['set up an MCP server so Claude uses our components', 'ai-ready-system'],
    ['weekly progress update for stakeholders', 'project-update'],
    ['presentaton for the steering group', 'presentation'],
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
