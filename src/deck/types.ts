// Decks built on Carolina Baptista's Nagarro Master Slides engine. A slide spec is exactly the
// engine's own format ({ template, theme, ...fields }); we add provenance around it.

import type { RecordedSource } from '../knowledge/types.ts'
import type { Citation } from '../opportunity/types.ts'

/** The nagarro-slides plugin's 12-point brief, field for field. */
export interface DeckBrief {
  deckName: string
  keyMessages: string[]
  audiencePurpose: string
  slideCount: number
  client: { name: string; logo: string }
  verbatim: string[]
  hook: string
  tone: string
  mustHaveSlides: string[]
  takeaways: string[]
  pictures: string[]
  sources: string[]
}

export interface SlideSpec {
  template: string
  theme?: 'light' | 'dark'
  [field: string]: unknown
}

/** A slide that hands over to the live client demo: at a page, or at a chapter of the guided story. */
export interface DemoLink { label: string; routeKey: 'home' | 'components' | 'tokens' | 'foundations' | 'changes' | 'report' | 'assessment' | 'handover' | 'outcome' | 'prototype' | 'channels' | 'proposalSummary' | 'scorecard'; id?: string; chapter?: string }

export interface DeckSlide {
  id: string
  spec: SlideSpec
  /** The slide's claim in plain words (the plan's "what this slide says"). */
  claim: string
  notes: string
  citations: Citation[]
  picture?: 'none' | 'placeholder' | 'yours'
  demoLink?: DemoLink
  edited?: boolean
}

export type DeckStage = 'brief' | 'plan' | 'built' | 'checked' | 'exported'

export interface Deck {
  id: string
  projectId: string
  opportunityId?: string
  title: string
  structure: 'proposal' | 'readout' | 'kickoff' | 'update'
  durationMin: number
  brief: DeckBrief
  slides: DeckSlide[]
  stage: DeckStage
  engine: { artifactVersion: string; templates: number }
  recorded: { requestHash?: string; responseVersion?: number; responseHash?: string; requirementsHash?: string; sources: RecordedSource[] }
  generatedBy: 'template' | 'model'
  builtAt: number
  builtBy: string
  exportedAt?: number
}
