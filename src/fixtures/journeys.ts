// The jobs colleagues come to the workspace to do, described once so people and machines read
// the same thing: Home shows them, the prompt router (src/features/nagarro/intent.ts) matches
// against them with no model call, and "Ask AI" sends this list as its only context.
//
// A journey either ends in something that works (`status: 'tool'`: a hub workflow or a practice
// tool) or is an honest set-up guide (`status: 'guide'`: steps and links, no tool of its own yet).
// Guides never show progress. Add or change a journey here, not in the page.

import { practice } from '@/app/routes'

export type JourneyGroup = 'clients' | 'projects'

export interface JourneyStep {
  title: string
  body: string
  to?: string
  toLabel?: string
}

export interface JourneyDef {
  id: string
  group: JourneyGroup
  title: string
  /** What you get, in one line. */
  outcome: string
  forWho: string
  /** Where the journey starts. Guides start on their own page. */
  to: string
  /** The hub workflow or practice tool behind it. */
  backedBy: string
  status: 'tool' | 'guide'
  /** Shown in its group on Home (four per group); the rest are under "All journeys". */
  featured?: boolean
  /** Words and phrases people use for this job, lower case. Phrases count more than words. */
  keywords: string[]
  /** When this is the wrong journey, and which one to pick instead. */
  antiUse?: string
  /** Guides only. */
  steps?: JourneyStep[]
  /** Guides that start with a question. */
  branch?: { question: string; options: { label: string; to: string }[] }
}

export const JOURNEY_GROUPS: Record<JourneyGroup, { title: string; lead: string }> = {
  clients: { title: 'Client conversations', lead: 'Getting ready for a client: answer, present, show, follow up.' },
  projects: { title: 'Project work', lead: 'Hands-on design system work: start, improve, prototype.' },
}

const guide = (id: string) => `/nagarro/journeys/${id}`

export const JOURNEYS: JourneyDef[] = [
  // ---- Client conversations ----
  {
    id: 'respond-request',
    group: 'clients',
    title: 'Answer an RFP or proposal',
    outcome: 'A first draft from approved material, for you to check.',
    forWho: 'Account leads, sellers and the designers helping them',
    to: practice.opportunityStart,
    backedBy: 'Client requests (hub)',
    status: 'tool',
    featured: true,
    keywords: ['rfp', 'rfi', 'rfq', 'tender', 'proposal', 'questionnaire', 'request for proposal', 'respond', 'response', 'answer', 'bid', 'procurement', 'vendor questionnaire', 'brief', 'client request'],
    antiUse: 'For a deck without a written request, use "Build a presentation".',
  },
  {
    id: 'presentation',
    group: 'clients',
    title: 'Make a presentation',
    outcome: 'A Nagarro deck from a request or a project.',
    forWho: 'Anyone meeting a client or prospect',
    to: practice.deckNew,
    backedBy: 'Presentations on Nagarro Master Slides (hub)',
    status: 'tool',
    featured: true,
    keywords: ['deck', 'presentation', 'slides', 'pitch', 'pptx', 'powerpoint', 'present', 'kickoff', 'kick-off', 'pitch deck', 'sales deck'],
    antiUse: 'For a deck about a topic rather than a client, use "Turn an idea into a deck".',
  },
  {
    id: 'client-demo',
    group: 'clients',
    title: 'Get a demo ready',
    outcome: 'A live demo of design, code and AI working together.',
    forWho: 'Whoever presents in the meeting',
    to: practice.demos,
    backedBy: 'Client demo (hub)',
    status: 'tool',
    featured: true,
    keywords: ['demo', 'showcase', 'show', 'meeting', 'walkthrough', 'walk through', 'live demo', 'show the client', 'present the demo', 'prospect', 'show how'],
  },
  {
    id: 'ai-readiness',
    group: 'clients',
    title: 'See how AI-ready a client is',
    outcome: 'Ten quick questions and the first thing to fix.',
    forWho: 'Sellers and designers in a first conversation',
    to: practice.scorecard,
    backedBy: 'AI-readiness scorecard (hub)',
    status: 'tool',
    featured: true,
    keywords: ['ai readiness', 'ai-readiness', 'ai ready', 'ai-ready', 'readiness', 'maturity', 'scorecard', 'score', 'assess', 'assessment', 'how ready', 'check', 'ready for ai', 'ready for ai tools'],
    antiUse: 'To do the work of making a system AI-ready, use "Make a design system AI-ready".',
  },
  {
    id: 'idea-deck',
    group: 'clients',
    title: 'Turn an idea into slides',
    outcome: 'An editable deck from a topic, in Presentation Studio.',
    forWho: 'Speakers, practice leads, anyone with a topic',
    to: practice.tool('studio'),
    backedBy: 'Presentation Studio (Carolina Baptista)',
    status: 'tool',
    keywords: ['idea', 'topic', 'talk', 'keynote', 'thought leadership', 'webinar', 'studio', 'presentation studio', 'conference', 'point of view'],
  },
  {
    id: 'follow-up',
    group: 'clients',
    title: 'Follow up after a meeting',
    outcome: 'A short readout: what we saw and the next step.',
    forWho: 'Whoever owns the client relationship',
    to: `${practice.deckNew}?kind=project&structure=readout`,
    backedBy: 'Presentations, readout structure (hub)',
    status: 'tool',
    keywords: ['follow up', 'follow-up', 'followup', 'readout', 'recap', 'summary', 'after the meeting', 'next steps', 'next step', 'debrief'],
  },
  {
    id: 'shape-offer',
    group: 'clients',
    title: 'Shape the offer',
    outcome: 'The right package and scope, ready for an estimate.',
    forWho: 'Account leads and delivery managers',
    to: guide('shape-offer'),
    backedBy: 'The practice’s packages',
    status: 'guide',
    keywords: ['offer', 'package', 'scope', 'scoping', 'estimate', 'estimation', 'pricing', 'price', 'cost', 'sow', 'statement of work', 'team size', 'budget', 'commercial', 'propose', 'how big', 'how many people'],
    steps: [
      { title: 'Find the starting point', body: 'Does the client have a design system, a partial one, or none? Run the scorecard with them if nobody knows.', to: practice.scorecard, toLabel: 'Open the scorecard' },
      { title: 'Pick the package', body: 'Match the need to one of the five packages: 2-week AI audit, DS Build, DS Accelerate, DS Scale or Support.' },
      { title: 'Write the scope down', body: 'Products and brands in scope, platforms, who maintains the system afterwards, and what is out of scope.' },
      { title: 'Ask delivery for the estimate', body: 'The workspace does not price work. Share the scope with the delivery lead and keep the estimate with the request.' },
    ],
  },

  // ---- Project work ----
  {
    id: 'new-system',
    group: 'projects',
    title: 'Start a design system',
    outcome: 'Set it up in the Starter Pack and keep it in a project.',
    forWho: 'Designers and engineers on a new project',
    to: practice.startSystem('new'),
    backedBy: 'DS Starter Pack (Nuno Almeida)',
    status: 'tool',
    featured: true,
    keywords: ['new design system', 'new system', 'from scratch', 'greenfield', 'starter', 'starter pack', 'create a design system', 'build a design system', 'set up', 'setup', 'configurator', 'new'],
    antiUse: 'If the client already has a system, even a partial one, use "Improve an existing design system".',
  },
  {
    id: 'improve-system',
    group: 'projects',
    title: 'Improve a design system',
    outcome: 'Find where Figma and code disagree, and fix it.',
    forWho: 'Designers and engineers joining a system that exists',
    to: practice.startSystem('improve'),
    backedBy: 'Improve journey (hub) with DSN and the Starter Pack',
    status: 'tool',
    featured: true,
    keywords: ['improve', 'existing', 'mature', 'audit', 'consolidate', 'migrate', 'migration', 'drift', 'inconsistency', 'inconsistent', 'refactor', 'clean up', 'existing design system', 'legacy', 'mess', 'messy', 'clean', 'tidy'],
  },
  {
    id: 'prototype',
    group: 'projects',
    title: 'Prototype on a client’s system',
    outcome: 'Clickable screens built from the client’s own components.',
    forWho: 'Designers on a project who need screens fast',
    to: practice.tool('assa-prototyping'),
    backedBy: 'DS Prototyping Tooling (reference build: ASSA ABLOY)',
    status: 'tool',
    featured: true,
    keywords: ['prototype', 'prototyping', 'mockup', 'mock-up', 'mock up', 'screens', 'clickable', 'wireframe', 'figma prototype', 'assa abloy', 'yale', 'build screens'],
    antiUse: 'The tool is built for one client. For another client it is a new copy on that client’s tokens and components.',
  },
  {
    id: 'product-design',
    group: 'projects',
    title: 'Start product design work',
    outcome: 'The right first step, with or without a design system.',
    forWho: 'Product designers joining a product team',
    to: guide('product-design'),
    backedBy: 'Set-up guide',
    status: 'guide',
    featured: true,
    keywords: ['product design', 'product', 'discovery', 'ux', 'user research', 'feature', 'app', 'redesign', 'user journey', 'flows', 'product team', 'new feature'],
    branch: {
      question: 'Does the product already have a design system?',
      options: [
        { label: 'Yes, and we should use it', to: practice.tool('assa-prototyping') },
        { label: 'Yes, but it needs work', to: practice.startSystem('improve') },
        { label: 'No, we need one', to: practice.startSystem('new') },
      ],
    },
    steps: [
      { title: 'Answer the question above', body: 'It decides whether you prototype on what exists, improve it first, or start a system.' },
      { title: 'Record the project', body: 'Add it under Projects with its client and links, so you can pick it up later.', to: practice.myWork, toLabel: 'Open My work' },
      { title: 'Plan research with the product team', body: 'The workspace has no research tool yet. Agree goals, users and the first flows with the product owner.' },
    ],
  },
  {
    id: 'ai-ready-system',
    group: 'projects',
    title: 'Make a design system AI-ready',
    outcome: 'Rules and metadata so AI tools stay on the system.',
    forWho: 'Design-system leads and engineers',
    to: guide('ai-ready-system'),
    backedBy: 'Set-up guide, using the project AI tab',
    status: 'guide',
    keywords: ['ai-ready system', 'make it ai ready', 'metadata', 'component metadata', 'llms.txt', 'mcp', 'agents', 'agent', 'machine readable', 'machine-readable', 'ai tools', 'guidelines for ai', 'evals', 'mcp server', 'claude', 'cursor', 'copilot'],
    steps: [
      { title: 'Measure where it is', body: 'Run the scorecard on the system to see what AI tools can and cannot read today.', to: practice.scorecard, toLabel: 'Open the scorecard' },
      { title: 'Write the rules down', body: 'Each component needs its use cases, anti-patterns and composition rules as structured data, not only prose in Figma.' },
      { title: 'Generate the files AI tools read', body: 'A project’s AI tab shows the files each AI tool gets from the system contract, and a release check.', to: '/nagarro/clients/demo-brand/ai/channels', toLabel: 'See it on Demo Brand' },
      { title: 'Check AI output stays on the system', body: 'Ask an AI tool for a screen and compare it with the system’s rules before each release.' },
    ],
  },
  {
    id: 'figma-code',
    group: 'projects',
    title: 'Connect Figma and code',
    outcome: 'The same names on both sides, and a check for drift.',
    forWho: 'Designers and engineers on a system',
    to: guide('figma-code'),
    backedBy: 'Set-up guide',
    status: 'guide',
    keywords: ['figma', 'code connect', 'sync', 'handoff', 'hand-off', 'handover', 'tokens pipeline', 'variables', 'storybook', 'dev mode', 'parity', 'figma and code', 'design to code'],
    steps: [
      { title: 'Agree the token names', body: 'Figma variables and code tokens use the same names, so a developer inspecting Figma sees the name that is in the CSS.' },
      { title: 'Pick which side leads, per part', body: 'Figma is the source of truth for tokens and components unless the project says otherwise. Record it in the system contract.' },
      { title: 'Map components', body: 'Link each Figma component to its coded component (Code Connect), so both sides point at each other.' },
      { title: 'Check for drift', body: 'Compare the Figma file with the code regularly; the improve journey shows the findings.', to: practice.startSystem('improve'), toLabel: 'Start the improve journey' },
    ],
  },
  {
    id: 'project-update',
    group: 'projects',
    title: 'Share a project update',
    outcome: 'An update deck from the project’s progress.',
    forWho: 'Project leads',
    to: `${practice.deckNew}?kind=project&structure=update`,
    backedBy: 'Presentations, update structure (hub)',
    status: 'tool',
    keywords: ['update', 'status', 'progress', 'steering', 'report', 'stakeholder', 'stakeholders', 'status update', 'project update', 'weekly'],
  },
]

export function journey(id: string): JourneyDef | undefined {
  return JOURNEYS.find((j) => j.id === id)
}
