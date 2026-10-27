// Social cuts: short, captioned 4:5 clips of the demos, zoomed for phones, for posts on the Nagarro
// Design page and our own accounts. Each is written like a script, one line per shot, the way Nuno
// Almeida's Content Builder writes the Starter Pack clips, so a cut can move to it later.
// The player (src/features/demos/CutPlayer.tsx) runs a cut on the real client demo; `npm run clips`
// films it. Honesty rule from those posts: every cut keeps notes on where its facts come from, and
// says so on screen when a wait is sped up.

export interface Shot {
  /** What the viewer reads, burned into the clip. Short: phones, often muted. */
  caption: string
  /** A path opened before the shot: relative to /client/<slug>, or a workspace path starting /nagarro. */
  open?: string
  /** A chapter of the story to enter (its set-up is done first). */
  chapter?: string
  /** data-demo-focus target to zoom onto. */
  focus?: string
  /** Something to do during the shot: the guide's Show me, a button by its visible label, or typing into a data-testid field. */
  action?: 'show-me' | { click: string } | { type: string; into: string } | { press: 'Enter'; in: string }
  seconds: number
}

export interface SocialCut {
  id: string
  title: string
  /** The mini-demo it is cut from (src/fixtures/demos.ts). */
  demo: string
  /** The opening line of the post that goes with it. */
  hook: string
  shots: Shot[]
  /** Where every fact on screen comes from; what is simulated or sped up. */
  notes: string
}

export const SOCIAL_CUTS: SocialCut[] = [
  {
    id: 'ai-keeps-to-the-system',
    title: 'AI keeps to the system',
    demo: 'ai-on-system',
    hook: 'Ask a general AI for a screen and it guesses. Ask one that reads your design system, and it says no to a made-up colour.',
    shots: [
      { caption: 'Same prompt. One design system.', chapter: 'ai', focus: 'refusal', seconds: 3 },
      { caption: 'The screen is built from the system’s own components', action: 'show-me', focus: 'refusal', seconds: 5 },
      { caption: 'A colour that isn’t in the system is refused', focus: 'refusal', seconds: 4 },
      { caption: 'Rules written for machines keep AI on the system', seconds: 3 },
    ],
    notes: 'Filmed on Demo Brand, a fictional company. A rule-based planner stands in for the AI model in this demo: say so in the post. The wait for the screen is sped up.',
  },
  {
    id: 'one-system-two-brands',
    title: 'One system, two brands, light and dark',
    demo: 'retheme',
    hook: 'A second brand without a second component library: same components, same token names, other values.',
    shots: [
      { caption: 'One button. One set of token names.', open: '/explore/components/button', focus: 'component-stage', seconds: 3 },
      { caption: 'Another brand: only the values change', focus: 'component-stage', action: { click: 'Violet' }, seconds: 4 },
      { caption: 'Dark mode is a second set of values, not a second design', focus: 'component-stage', action: { click: 'Dark' }, seconds: 4 },
      { caption: 'How many copies of your component library exist?', seconds: 3 },
    ],
    notes: 'Filmed on Demo Brand, a fictional company, in the client demo’s component page. The brand and mode switches are the page’s own.',
  },
  {
    id: 'a-fix-travels',
    title: 'A fix travels from Figma to code',
    demo: 'fix-travels',
    hook: 'One hover colour in dark mode. Here is how a fix travels from the finding to Figma and code, reviewed on both sides.',
    shots: [
      { caption: 'One inconsistency: the hover colour in dark mode', chapter: 'inconsistency', focus: 'component-stage', seconds: 3 },
      { caption: 'What it affects, before anyone changes anything', chapter: 'impact', focus: 'rule-panel', seconds: 4 },
      { caption: 'The fix, proposed once', chapter: 'fix', action: 'show-me', focus: 'impact-numbers', seconds: 5 },
      { caption: 'Reviewed in code and in Figma, then merged', chapter: 'review', action: 'show-me', focus: 'checks-list', seconds: 5 },
      { caption: 'Fixed once, reviewed in both places', seconds: 3 },
    ],
    notes: 'Filmed on Demo Brand, a fictional company. Nothing reaches GitHub or Figma: the pull request, checks and Figma change are simulated, and their timers are sped up.',
  },
  {
    id: 'ai-readiness-in-60-seconds',
    title: 'AI-readiness in 60 seconds',
    demo: 'scorecard',
    hook: 'Ten questions tell you how ready a design system is for AI tools, and what to fix first.',
    shots: [
      { caption: 'Is your design system ready for AI tools?', open: '/scorecard', seconds: 3 },
      { caption: 'Ten questions, answered together', seconds: 5 },
      { caption: 'And the first step that fits', seconds: 4 },
    ],
    notes: 'The scorecard’s questions are the practice’s own. No answers are stored or sent anywhere.',
  },
  {
    id: 'your-job-routed',
    title: 'Your job, routed',
    demo: 'workspace',
    hook: 'We described every job our designers and sellers do once, for people and machines. Type what you need; the workspace takes you there.',
    shots: [
      { caption: 'What do you need to do?', open: '/nagarro', seconds: 3 },
      { caption: '“A designer needs a prototype on the client’s design system”', action: { type: 'A designer needs a prototype on the client’s design system', into: 'home-ask' }, seconds: 4 },
      { caption: 'Matched to a journey, and it says why', action: { press: 'Enter', in: 'home-ask' }, seconds: 4 },
      { caption: 'No model call: the jobs are written down where machines can read them', seconds: 4 },
    ],
    notes: 'Internal workspace, filmed with sample data only: the Try suggestions and the in-progress line are hidden in the cut because they can name clients. The router is keyword matching over src/fixtures/journeys.ts; no AI is involved.',
  },
]

export function socialCut(id: string) {
  return SOCIAL_CUTS.find((c) => c.id === id)
}
