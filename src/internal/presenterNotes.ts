// Presenter notes for the client demo. Internal only: shown in the separate notes window and on the
// meeting-prep page, never on the shared screen, and never imported by the demo build.

export interface PresenterNote {
  /** What to say, in one breath. */
  say: string
  /** What to do on screen, if anything. */
  action?: string
  points: string[]
  /** About how long the chapter takes. */
  minutes: number
}

export const PRESENTER_NOTES: Record<string, PresenterNote> = {
  challenge: {
    say: 'Open with the problem, not the tool: two versions of the system, and AI now copying both.',
    points: ['Ask: “Where does your design system live today: Figma, code, or both?”', 'Say clearly that Demo Brand is fictional and the figures are sample data.', 'Big idea, if it fits the room: “AI will build your interfaces anyway. Make sure it builds yours.”'],
    minutes: 1,
  },
  example: {
    say: 'A read-only assessment gives a baseline in minutes. Nothing is written to their files.',
    action: 'Click “Run the assessment”, or “Show me” on the guide bar.',
    points: ['Supported profile today: React, JSON tokens, Figma variables. Never promise another stack.', 'The assessment lists; people decide what to fix when they agree the plan.', 'Real client cases are internal until there is written clearance. Use Demo Brand.'],
    minutes: 3,
  },
  inconsistency: {
    say: 'One component, one page: the real Button, its tokens, its Figma link and its checks.',
    action: 'Switch the preview to dark mode and hover the primary button.',
    points: ['Default and hover both resolve to #1F6FEB in dark mode.', 'The Tokens tab marks the token out of sync; the Checks tab links the finding.', 'What AI tools read is the same data, as JSON.'],
    minutes: 2,
  },
  impact: {
    say: 'The finding shows its evidence and the rule behind it. Best practice you can read, not a black box.',
    points: ['Source of the rule: the DSN token-collision audit, which runs in CI today.', 'Dismissing a finding needs a reason, and the reason is recorded.', 'Three components share the token: Button, Icon button, Tabs.'],
    minutes: 2,
  },
  fix: {
    say: 'Before anything merges: every component, Figma layer, docs page and AI tool file it touches.',
    action: 'Click “Create PR + Figma change set”.',
    points: ['The figures come from the token’s usage data, not a guess.', 'Anyone can propose; merging needs the system’s owner.', 'Pull requests and Figma changes are simulated in this demo. Say so if asked.'],
    minutes: 3,
  },
  review: {
    say: 'Five checks; the Figma–code check fails until the Figma change is applied. Then the owner merges.',
    action: 'Open the Figma review, apply the change, then merge as the owner.',
    points: ['A version of the Figma file is saved first; rolling back is one step.', 'Switch “Acting as” to a contributor to show that merging is refused.', 'After the merge, the AI tool files go out of date until they are refreshed.'],
    minutes: 4,
  },
  ai: {
    say: 'The planner builds from real components only and refuses the invented token, with the nearest real one.',
    action: 'Generate the prefilled prompt.',
    points: ['Say it plainly: a rule-based planner stands in for the model in this demo.', 'The same rules go to every AI tool the client uses.', 'Contrast with a blind prompt in any public AI tool.'],
    minutes: 3,
  },
  outcome: {
    say: 'Close on what the client keeps and the next conversation, not on the tool.',
    points: ['This is an example outcome; what an engagement delivers is agreed per client.', 'Name the owner early: the strongest predictor that a system lasts.', 'Propose the next step: a 2-week AI audit of their own system, then the package that fits (DS Accelerate, DS Build or DS Scale).'],
    minutes: 2,
  },
}
