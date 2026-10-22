// The eight chapters of the client demo. Routes resolve against the client route family and the
// session system, so the same definitions serve the presenter (notes on) and the client (notes off).

import type { AppState } from '@/state/store'
import type { RouteFamily } from '@/app/routes'
import type { SystemState } from '@/state/types'

export interface TourStep {
  id: string
  n: number
  title: string
  problem: string
  /** Presenter line: what to say. */
  say: string
  /** Client line: what this step shows, in plain words. */
  clientSay: string
  seeing: string
  why: string
  talkingPoints: string[]
  evidence: { label: string; to: (r: RouteFamily) => string }[]
  route: (sys: SystemState, r: RouteFamily) => string
  /** The element to scroll to and highlight (data-demo-focus). */
  focus?: string
  /** When true, "Next" is enabled. Undefined = enabled on visit. */
  expect?: (sys: SystemState) => boolean
  hint?: string
  /** Performs the step's action ("Do it" / "Show me"). */
  skip?: (a: AppState, sys: SystemState) => void
}

const HERO = 'f-hover-dark'

export const TOUR: TourStep[] = [
  {
    id: 'stand',
    n: 1,
    title: 'Where your system stands',
    problem: '“We don’t know how bad our system is.”',
    say: 'Connect the repo and the Figma file read-only, run the assessment, and get a baseline in minutes: drift, missing code names, contrast, what AI can’t read.',
    clientSay: 'We read your repository and Figma file without changing anything, and measure where design, code and AI disagree.',
    seeing: 'A six-stage assessment of a sample, messy design system: repository, Figma, token mapping, comparison, contrast, report.',
    why: 'A baseline in minutes, not opinions. Every later number refers back to it.',
    talkingPoints: ['Read-only: nothing is written until a pull request is approved.', 'Supported profile today: React + JSON tokens + Figma variables; say so, never promise any stack.', 'The scan lists; people decide what to fix in the readout.'],
    evidence: [
      { label: 'Assessment', to: (r) => r.assessment },
      { label: 'Report', to: (r) => r.report },
    ],
    route: (_sys, r) => r.assessment,
    focus: 'scan-stages',
    expect: (sys) => sys.journey.scan.status === 'done',
    hint: 'Run the assessment on this screen.',
    skip: (a, sys) => {
      if (sys.journey.scan.status !== 'done') a.runScan()
    },
  },
  {
    id: 'found',
    n: 2,
    title: 'What the assessment found',
    problem: '“Has anyone fixed this before?”',
    say: 'The report shows the baseline and where it ends up. Real client cases are shown internally only after written clearance; the sample brand carries the numbers.',
    clientSay: 'This is where your system stands today and where it ends up after the engagement.',
    seeing: 'AI readiness 2/5, 62% Figma ↔ code, 8 contrast fails, 12 drift items. The findings table names the side to fix.',
    why: 'Fix side and rule category turn a list of complaints into a plan with owners.',
    talkingPoints: ['Before numbers are frozen at scan time; after numbers are live.', 'A real client case (four button sets → one Button) exists; show it only with clearance.', 'Link the package: Audit → Accelerate or Scale.'],
    evidence: [
      { label: 'Read-only share link', to: (r) => `/share/${r.slug}` },
      { label: 'Findings', to: (r) => r.changes },
    ],
    route: (_sys, r) => r.report,
    focus: 'before-after',
  },
  {
    id: 'one-truth',
    n: 3,
    title: 'One component, one truth',
    problem: '“Our designers and devs see different things.”',
    say: 'One view of the real Button: its live preview, tokens, Figma link, guidance and checks. The hover token is out of sync in dark mode.',
    clientSay: 'One page shows the real Button as code renders it, the tokens it uses, its Figma link and what the checks say.',
    seeing: 'The real React Button in light and dark, three brands; tabs for usage, tokens, Figma and checks.',
    why: 'Designers and developers look at the same thing. Drift becomes visible where it is, not in a spreadsheet.',
    talkingPoints: ['Switch to dark: default and hover render identically.', 'The Tokens tab marks the token out of sync; the Checks tab links the finding.', 'What agents see is the same data, as JSON.'],
    evidence: [
      { label: 'Tokens explorer', to: (r) => r.token('color-background-interactive-primary-hover') },
      { label: 'Guidance', to: (r) => r.guidance('button') },
    ],
    route: (_sys, r) => r.component('button'),
    focus: 'component-stage',
  },
  {
    id: 'rule-to-fix',
    n: 4,
    title: 'From finding to fix',
    problem: '“We don’t know what good looks like.”',
    say: 'The suggestion shows its rule, its source script and the evidence. Best practice you can read, not a black box. Propose the fix.',
    clientSay: 'Every suggestion comes with the rule behind it and the evidence, so your team can agree or switch the rule off.',
    seeing: 'Evidence swatches (default and hover both #1F6FEB in dark), the rule “hover must differ from default in every theme”, its source audit script.',
    why: 'Rules are explicit and switchable in the contract. Nothing is a black box.',
    talkingPoints: ['Source: the DSN token-collision audit, running in CI today.', 'Dismiss with a reason is recorded in the audit trail.', 'Propose a fix creates a draft change, not a merge.'],
    evidence: [
      { label: 'Rules in force', to: (r) => r.contract },
      { label: 'Audit trail', to: (r) => r.audit },
    ],
    route: (_sys, r) => r.finding(HERO),
    focus: 'rule-panel',
    expect: (sys) => sys.findings.find((f) => f.id === HERO)?.status !== 'open',
    hint: 'Click “Propose a fix”.',
    skip: (a, sys) => {
      if (sys.findings.find((x) => x.id === HERO)?.status === 'open') a.proposeFix(HERO)
    },
  },
  {
    id: 'impact',
    n: 5,
    title: 'See the impact first',
    problem: '“Changes break things we don’t see.”',
    say: 'Before anything merges: 7 components, 34 Figma layers, 2 docs pages and 6 AI channels. Know the blast radius, then create the pull request and the Figma change set.',
    clientSay: 'Before a change goes anywhere, you see everything it touches: components, Figma layers, documentation and AI channels.',
    seeing: 'Four impact numbers computed from the token’s usage, plus the change set and the affected components rendered in dark mode.',
    why: 'Blast radius first. Nobody merges a token change blind.',
    talkingPoints: ['Impact comes from token usage data, not a guess.', 'You can propose; merging needs the design system owner.', 'One click creates both the pull request and the Figma change set.'],
    evidence: [{ label: 'Token usage', to: (r) => r.token('color-background-interactive-primary-hover') }],
    route: (sys, r) => {
      const f = sys.findings.find((x) => x.id === HERO)
      return f?.changeId ? r.impact(f.changeId) : r.changes
    },
    focus: 'impact-numbers',
    expect: (sys) => sys.pullRequests.some((p) => p.findingIds.includes(HERO)),
    hint: 'Click “Create PR + Figma change set”.',
    skip: (a, sys) => {
      const f = sys.findings.find((x) => x.id === HERO)
      if (f?.changeId && !sys.pullRequests.some((p) => p.findingIds.includes(HERO))) a.createPR(f.changeId)
    },
  },
  {
    id: 'both-tools',
    n: 6,
    title: 'Reviewed in both tools',
    problem: '“Figma and code drift apart.”',
    say: 'The pull request runs five checks. Parity fails until the Figma change set is applied in the 3-way review, then the owner merges. One change, reviewed in both tools.',
    clientSay: 'The change is reviewed in code and in Figma. The checks block the merge until both sides agree.',
    seeing: 'Five checks; parity fails on purpose until the Figma change set is applied; then the owner merges and six channels go stale.',
    why: 'Code review and Figma review are one process. Drift cannot sneak in from either side.',
    talkingPoints: ['Open the Figma review: Figma now, at last sync, the system.', 'A version is saved first; rollback is one step.', 'Presenters can switch “acting as” to a contributor: merge is refused.'],
    evidence: [
      { label: 'Figma change sets', to: (r) => r.changesTab('figma') },
      { label: 'AI channels (stale after merge)', to: (r) => r.channels },
    ],
    route: (sys, r) => {
      const pr = sys.pullRequests.find((p) => p.findingIds.includes(HERO))
      return pr ? r.pr(pr.number) : r.changes
    },
    focus: 'checks-list',
    expect: (sys) => sys.pullRequests.some((p) => p.findingIds.includes(HERO) && p.status === 'merged'),
    hint: 'Apply the Figma change set, then merge as the owner.',
    skip: (a, sys) => {
      const pr = sys.pullRequests.find((p) => p.findingIds.includes(HERO))
      if (!pr) return
      const cs = pr.figmaChangeSetId ? sys.figmaChangeSets.find((c) => c.id === pr.figmaChangeSetId) : undefined
      if (cs && cs.status === 'pending') a.applyFigmaChangeSet(cs.id)
      else if (pr.status === 'waiting_review' || pr.status === 'approved') {
        if (a.ui.presenter && a.ui.actingAs !== 'p-owner') a.setActingAs('p-owner')
        a.mergePR(pr.number)
      }
    },
  },
  {
    id: 'ai-on-system',
    n: 7,
    title: 'AI builds on your system',
    problem: '“AI makes things up.”',
    say: 'Ask the prototype agent for a screen that references an invented token. It builds from real components and refuses the token, with the nearest real one.',
    clientSay: 'An AI builds a screen from your real components only. A token that does not exist is refused, with the nearest real one suggested.',
    seeing: 'A prompt that mentions --color-brand-pop and 18px gaps; the planner builds from real components, refuses the token and warns about the spacing.',
    why: 'AI-ready means the system constrains what AI can produce. Absences and a closed vocabulary do that before generation.',
    talkingPoints: ['The absences list and the vocabulary come from the DSN index.', 'The same rules are published to every AI channel.', 'The release eval scores this across tools.'],
    evidence: [
      { label: 'Release eval', to: (r) => r.evals },
      { label: 'AI channels', to: (r) => r.channels },
    ],
    route: (_sys, r) => `${r.prototype}?demo=1`,
    focus: 'refusal',
    expect: (sys) => sys.prototypes.some((p) => p.refused.length > 0),
    hint: 'Generate the prefilled prompt.',
    skip: (a, sys) => {
      if (!sys.prototypes.some((p) => p.refused.length > 0)) a.generatePrototype('A settings page with notifications and a danger zone. Use --color-brand-pop for the header and 18px gaps.')
    },
  },
  {
    id: 'what-you-keep',
    n: 8,
    title: 'What you keep',
    problem: '“What happens when you leave?”',
    say: 'The handover list: repository, Figma library, the panel, CI checks, AI channels, evals, a named owner. You own it and can run it.',
    clientSay: 'Everything stays in your repository and your Figma file, with a named owner, checks and a baseline. You can run it without us.',
    seeing: 'The handover checklist, the baseline against now, and the read-only share link for the steering group.',
    why: 'The deliverable is the client-owned system. The panel ships inside it.',
    talkingPoints: ['“Show the end state” fast-forwards the engagement so the handover numbers show where it lands.', 'Name the owner before building: strongest predictor the system survives.', 'Next step: book the readout; propose the package that fits.'],
    evidence: [
      { label: 'Read-only share link', to: (r) => `/share/${r.slug}` },
      { label: 'Trust levels', to: (r) => r.trust },
    ],
    route: (_sys, r) => r.handover,
    focus: 'handover-list',
  },
]

export const TOUR_BY_ID = Object.fromEntries(TOUR.map((s) => [s.id, s])) as Record<string, TourStep>
export const tourIndex = (id: string | null) => Math.max(0, TOUR.findIndex((s) => s.id === id))
