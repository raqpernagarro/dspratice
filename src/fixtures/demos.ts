// What we can show in a meeting, as ready-made mini-demos: each is a playlist of the client demo's
// chapters (src/features/demo/steps.ts) or one page of it. "Build a demo" puts chapters together
// for one meeting from the words someone types (CHAPTER_KEYWORDS), with no model call.
// Titles and lines here appear on the Demos page and in the client demo build: client-safe only.

import type { RouteFamily } from '@/app/routes'

export interface MiniDemo {
  id: string
  title: string
  /** What the audience sees happen, in one line. */
  shows: string
  minutes: number
  audience: 'client' | 'internal'
  /** A playlist of chapters, walked with the guide bar… */
  chapters?: string[]
  /** …or the short (meeting) or full story… */
  story?: 'meeting' | 'full'
  /** …or one page of the client demo, explored by hand. */
  page?: (c: RouteFamily) => string
  /** Words that point at this demo, for the "Build a demo" box. */
  keywords: string[]
  tips: string[]
  /** Its social cut, if it has one (src/fixtures/social-cuts.ts). */
  cut?: string
}

export const MINI_DEMOS: MiniDemo[] = [
  {
    id: 'ai-on-system',
    title: 'AI keeps to the system',
    shows: 'A prompt becomes a screen made of the system’s own components, and a made-up colour is refused.',
    minutes: 3,
    audience: 'client',
    chapters: ['ai'],
    keywords: ['ai', 'prompt', 'agent', 'screen', 'refuse', 'llm', 'mcp', 'generate', 'on system', 'ai ready'],
    tips: ['Say that a rule-based planner stands in for the AI model in this demo.', 'Compare with the same prompt in any public AI tool.'],
    cut: 'ai-keeps-to-the-system',
  },
  {
    id: 'retheme',
    title: 'One system, two brands, light and dark',
    shows: 'The same component switches brand and mode; only the token values change.',
    minutes: 3,
    audience: 'client',
    page: (c) => c.component('button'),
    keywords: ['brand', 'brands', 'multi brand', 'multi-brand', 'theme', 'theming', 'dark mode', 'light', 'retheme', 'white label'],
    tips: ['Use the brand and mode switches above the preview.', 'Point at the hover state in dark mode: it is the inconsistency the story follows.'],
    cut: 'one-system-two-brands',
  },
  {
    id: 'fix-travels',
    title: 'A fix travels from Figma to code',
    shows: 'One inconsistency, what it affects, the proposed fix, and its review in code and in Figma.',
    minutes: 6,
    audience: 'client',
    chapters: ['inconsistency', 'impact', 'fix', 'review'],
    keywords: ['fix', 'drift', 'inconsistency', 'figma', 'code', 'pull request', 'review', 'governance', 'impact', 'handoff', 'parity'],
    tips: ['Ask how they find out today that Figma and code disagree.', 'Show me runs each step; pause on the impact numbers.'],
    cut: 'a-fix-travels',
  },
  {
    id: 'scorecard',
    title: 'AI-readiness scorecard',
    shows: 'Ten questions answered together, and the first step that fits.',
    minutes: 5,
    audience: 'client',
    page: (c) => c.scorecard,
    keywords: ['scorecard', 'readiness', 'maturity', 'assess', 'assessment', 'score', 'how ready', 'audit'],
    tips: ['Fill it in together, live; do not send it as a form.', 'Marketing tracks the official assessment on nagarro.com; point to it at the end.'],
    cut: 'ai-readiness-in-60-seconds',
  },
  {
    id: 'meeting-story',
    title: 'The story, short',
    shows: 'From the challenge to what an engagement leaves behind, in the five chapters that matter most.',
    minutes: 12,
    audience: 'client',
    story: 'meeting',
    keywords: ['story', 'overview', 'first meeting', 'intro', 'introduction', 'whole', 'everything', 'pitch'],
    tips: ['Best for a first meeting with a design or product lead.', 'Open your notes window first, then share only the demo tab.'],
  },
  {
    id: 'full-story',
    title: 'The story, full',
    shows: 'All eight chapters, including the assessment and the review in code and Figma.',
    minutes: 25,
    audience: 'client',
    story: 'full',
    keywords: ['full', 'deep dive', 'workshop', 'all chapters', 'long'],
    tips: ['For a workshop with designers and engineers together.', 'Close on the next conversation, usually the 2-week AI audit.'],
  },
  {
    id: 'workspace',
    title: 'How the workspace routes a job',
    shows: 'For colleagues: someone types what they need, and the workspace finds the journey, with no model call.',
    minutes: 2,
    audience: 'internal',
    page: () => '/nagarro',
    keywords: ['workspace', 'internal', 'colleagues', 'route', 'journey'],
    tips: ['Use sample data only when filming.'],
    cut: 'your-job-routed',
  },
  {
    id: 'explore',
    title: 'Explore the example system',
    shows: 'Components, tokens, findings and changes, for people who want to look around themselves.',
    minutes: 10,
    audience: 'client',
    page: (c) => c.components,
    keywords: ['explore', 'components', 'tokens', 'look around', 'browse', 'library'],
    tips: ['Ask which page they would open first.'],
  },
]

/** Words that point at each chapter of the story, for "Build a demo". */
export const CHAPTER_KEYWORDS: Record<string, string[]> = {
  challenge: ['why', 'problem', 'challenge', 'context', 'intro', 'introduction', 'start'],
  example: ['example', 'assessment', 'scan', 'assess', 'audit', 'analyse', 'analyze'],
  inconsistency: ['inconsistency', 'inconsistent', 'drift', 'bug', 'button', 'hover', 'component'],
  impact: ['impact', 'affect', 'affects', 'risk', 'cost', 'why it matters', 'blast radius'],
  fix: ['fix', 'change', 'token', 'tokens', 'proposal', 'solve'],
  review: ['review', 'pull request', 'pr', 'figma', 'code', 'merge', 'governance', 'approval', 'handoff'],
  ai: ['ai', 'prompt', 'agent', 'agents', 'screen', 'prototype', 'refuse', 'llm', 'mcp', 'generate', 'copilot'],
  outcome: ['outcome', 'next step', 'engagement', 'value', 'handover', 'what you get', 'close', 'roi'],
}
