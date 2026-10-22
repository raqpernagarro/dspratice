// The client demo's meeting story, in eight chapters. Everything here is client-facing and ships in
// the client-safe demo build. Presenter notes live in src/internal/presenterNotes.ts and never
// reach the shared screen or the demo build.
//
// Story: client challenge → example system → one inconsistency → why it matters → the proposed
// fix → reviewed in code and Figma → AI using the system → what an engagement could deliver.

import type { AppState } from '@/state/store'
import type { RouteFamily } from '@/app/routes'
import type { GuideMode, SystemState } from '@/state/types'

export interface TourStep {
  id: string
  n: number
  /** Short chapter name, used in the chapter list and the kicker. */
  title: string
  /** The headline on the guide bar: one phrase is highlighted. */
  headline: { before: string; hl: string; after?: string }
  /** The challenge in a client's own words. */
  problem: string
  /** What this chapter shows, in plain words, for someone seeing it for the first time. */
  clientSay: string
  why: string
  /** In the short meeting path (about 12 minutes). */
  short: boolean
  route: (sys: SystemState, r: RouteFamily) => string
  /** The element to scroll to and highlight (data-demo-focus). */
  focus?: string
  /** When true, this chapter's own action has happened. Undefined = nothing to do. */
  expect?: (sys: SystemState) => boolean
  /** Performs the chapter's action ("Show me"). */
  skip?: (a: AppState, sys: SystemState) => void
  /** Chapters whose action must have happened before this one makes sense. */
  needs: string[]
  /** Puts the system into this chapter's starting state (e.g. a proposed fix) when entered directly. */
  enter?: (a: AppState, sys: SystemState) => void
  /** Said once on screen when entering directly had to set something up. */
  setupNote?: string
  /** "Show me" runs the whole action at once (it spans several timed steps). */
  instant?: boolean
}

export const HERO = 'f-hover-dark'

const heroPR = (sys: SystemState) => sys.pullRequests.find((p) => p.findingIds.includes(HERO))

export const TOUR: TourStep[] = [
  {
    id: 'challenge',
    n: 1,
    title: 'The challenge',
    headline: { before: 'Design, code and AI tools ', hl: 'drift apart', after: '.' },
    problem: '“Our designers and developers see different things, and now AI copies both.”',
    clientSay: 'Most organisations keep one version of their design system in Figma and another in code. AI tools now build screens from both, and repeat whatever inconsistencies they find.',
    why: 'Every inconsistency gets repeated, by people and now by AI, faster than anyone can review it. In this demo we use {intro}.',
    short: true,
    route: (_sys, r) => r.home,
    focus: 'demo-intro',
    needs: [],
  },
  {
    id: 'example',
    n: 2,
    title: 'An example system',
    headline: { before: 'First, see where ', hl: 'the system stands', after: '.' },
    problem: '“We don’t know how inconsistent our system is.”',
    clientSay: 'We read {system}’s code, token files and Figma file without changing anything, and measure where they disagree. Six checks, about ten seconds.',
    why: 'A baseline turns opinions into a list everyone can see. Every later figure refers back to it. The figures here are sample data.',
    short: false,
    route: (_sys, r) => r.assessment,
    focus: 'scan-stages',
    expect: (sys) => sys.journey.scan.status === 'done',
    skip: (a, sys) => {
      if (sys.journey.scan.status !== 'done') a.runScan()
    },
    needs: [],
  },
  {
    id: 'inconsistency',
    n: 3,
    title: 'One inconsistency',
    headline: { before: 'In dark mode, the button’s hover state ', hl: 'does nothing', after: '.' },
    problem: '“Small differences slip through and nobody notices.”',
    clientSay: 'This page shows the real Button as the code renders it, with its tokens, its Figma link and its checks. Switch to dark mode: the default and hover states are the same colour.',
    why: 'Designers and developers look at the same page, so a difference shows up where it happens, not in a spreadsheet.',
    short: true,
    route: (_sys, r) => r.component('button'),
    focus: 'component-stage',
    needs: [],
  },
  {
    id: 'impact',
    n: 4,
    title: 'Why it matters',
    headline: { before: 'One wrong token reaches ', hl: 'three components', after: '.' },
    problem: '“It’s only one colour. Does it matter?”',
    clientSay: 'The finding shows the evidence (both states resolve to the same blue), the rule it breaks, and every component that uses the token: Button, Icon button and Tabs.',
    why: 'People get no feedback when they hover, and an AI tool that reads this system would copy the mistake into every new screen it builds.',
    short: true,
    route: (_sys, r) => r.finding(HERO),
    focus: 'rule-panel',
    needs: [],
  },
  {
    id: 'fix',
    n: 5,
    title: 'The proposed fix',
    headline: { before: 'See what the fix ', hl: 'affects', after: ' before anyone merges it.' },
    problem: '“Changes break things we don’t see.”',
    clientSay: 'The suggested fix uses a token the system already has. Before anything changes, the preview lists every component, Figma layer, documentation page and AI tool file it touches. One click then opens a pull request and the matching Figma change.',
    why: 'Nobody approves a change to a shared token without seeing where it lands.',
    short: true,
    route: (sys, r) => {
      const f = sys.findings.find((x) => x.id === HERO)
      return f?.changeId ? r.impact(f.changeId) : r.finding(HERO)
    },
    focus: 'impact-numbers',
    expect: (sys) => Boolean(heroPR(sys)),
    enter: (a, sys) => {
      if (sys.findings.find((x) => x.id === HERO)?.status === 'open') a.proposeFix(HERO)
    },
    skip: (a, sys) => {
      const f = sys.findings.find((x) => x.id === HERO)
      if (f?.status === 'open') {
        const changeId = a.proposeFix(HERO)
        if (changeId) a.createPR(changeId)
        return
      }
      if (f?.changeId && !heroPR(sys)) a.createPR(f.changeId)
    },
    needs: [],
    setupNote: 'A fix has been proposed so we can look at what it affects.',
  },
  {
    id: 'review',
    n: 6,
    title: 'Reviewed in code and Figma',
    headline: { before: 'One change, reviewed in ', hl: 'both tools', after: '.' },
    problem: '“Figma and code drift apart again after every release.”',
    clientSay: 'The pull request runs five checks. The Figma–code check fails until the matching change is applied in Figma; then the system’s owner merges it. Hover now looks different in dark mode.',
    why: 'Code review and Figma review become one process, so differences can’t creep back in from either side.',
    short: false,
    route: (sys, r) => {
      const pr = heroPR(sys)
      return pr ? r.pr(pr.number) : r.changes
    },
    focus: 'checks-list',
    expect: (sys) => heroPR(sys)?.status === 'merged',
    skip: (a, sys) => {
      const pr = heroPR(sys)
      if (!pr) return
      const cs = pr.figmaChangeSetId ? sys.figmaChangeSets.find((c) => c.id === pr.figmaChangeSetId) : undefined
      if (cs && cs.status === 'pending') a.applyFigmaChangeSet(cs.id)
      if (a.ui.presenter && a.ui.actingAs !== 'p-owner') a.setActingAs('p-owner')
      a.mergePR(pr.number)
    },
    needs: ['fix'],
    setupNote: 'The fix and its pull request have been created so we can review them.',
    instant: true,
  },
  {
    id: 'ai',
    n: 7,
    title: 'AI uses the system',
    headline: { before: 'AI builds with ', hl: 'real components', after: ' and refuses what doesn’t exist.' },
    problem: '“AI tools make things up.”',
    clientSay: 'We ask for a settings screen and mention a colour token that doesn’t exist. The screen is built from the system’s own components; the made-up token is refused and the nearest real one is suggested. In this demo a rule-based planner stands in for the AI model.',
    why: 'An AI-ready system limits what AI can produce to what the system allows, instead of hoping the AI guesses right.',
    short: true,
    route: (_sys, r) => `${r.prototype}?demo=1`,
    focus: 'refusal',
    expect: (sys) => sys.prototypes.some((p) => p.refused.length > 0),
    skip: (a, sys) => {
      if (!sys.prototypes.some((p) => p.refused.length > 0)) a.generatePrototype('A settings page with notifications and a danger zone. Use --color-brand-pop for the header and 18px gaps.')
    },
    needs: [],
  },
  {
    id: 'outcome',
    n: 8,
    title: 'Outcome and next step',
    headline: { before: 'What an engagement could ', hl: 'leave behind', after: '.' },
    problem: '“What happens when you leave?”',
    clientSay: 'An example of what a client keeps: the system in their own repository and Figma file, checks on every change, files that AI tools read, a named owner and a baseline. Then the next conversation: a short assessment of your own system.',
    why: 'The value is a system your team owns and can run, not a tool you depend on.',
    short: true,
    route: (_sys, r) => r.outcome,
    focus: 'outcome-next',
    needs: ['example'],
  },
]

export const TOUR_BY_ID = Object.fromEntries(TOUR.map((s) => [s.id, s])) as Record<string, TourStep>
export const tourIndex = (id: string | null) => Math.max(0, TOUR.findIndex((s) => s.id === id))

/** The chapters a meeting walks through: the short path (meeting) or every chapter (full). */
export function pathFor(mode: GuideMode): TourStep[] {
  return mode === 'full' ? TOUR : TOUR.filter((s) => s.short)
}

/** Chapter text names the system on screen: {system} is its name, {intro} says whether it is fictional. */
export function demoText(text: string, name: string, fictional: boolean) {
  return text.replaceAll('{system}', name).replaceAll('{intro}', fictional ? `${name}, a fictional company` : `${name}’s own system`)
}

export const PATH_MINUTES = { meeting: 12, full: 25 } as const
