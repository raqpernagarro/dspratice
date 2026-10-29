/**
 * Written docs pages: guidance a person owns (tone of voice, best practices…). Each starts as sample
 * text filled in with the system's name and product type; once edited, the project file keeps the
 * Markdown (`pages[id]`) and the sample is no longer used. Later the agent can draft these from a
 * brief and the brand.
 */

export interface WrittenPage {
  id: string
  title: string
  summary: string
  /** Who usually owns this page, shown as its byline. */
  owner: string
  sample: (ctx: PageContext) => string
}

export interface PageContext {
  name: string
  /** "dashboard", "admin panel"… */
  product: string
  description: string
}

export const fill = (text: string, ctx: PageContext) => text.replaceAll('{{name}}', ctx.name).replaceAll('{{product}}', ctx.product)

export const WRITTEN_PAGES: WrittenPage[] = [
  {
    id: 'principles',
    title: 'Principles',
    summary: 'The ideas behind every component and rule.',
    owner: 'Design system team',
    sample: () => `Three ideas behind every component and every rule in these docs.

### Clarity first
The interface frames the content and gets out of the way. Color, weight and motion are for meaning, never decoration.

### Calm by default
Quiet surfaces, one primary action per view, nothing that moves unless it means something.

### Honest about state
Loading, empty, stale and failed each look different, so nobody mistakes a gap for a result.`,
  },
  {
    id: 'introduction',
    title: 'Introduction',
    summary: 'What is in the system and who it is for.',
    owner: 'Design system team',
    sample: () => `{{name}} is the design system for our {{product}}. It gives designers and engineers the same building blocks, with the same names, so a screen looks and behaves the same wherever it's built.

## What's in the system
- **Foundations:** color, type, spacing, radius and elevation, set once in the theme.
- **Tokens:** named values every component reads. Change a token and every screen follows.
- **Components:** React components with matching Figma components.
- **Patterns and guidelines:** how to combine them, and how to write for them.

## Who it's for
Designers working in the {{name}} Figma library, and engineers building with the component package. Both use the same names, so a hand-off needs no translation.

> This is sample text. Make it yours with **Edit page** above.`,
  },
  {
    id: 'contributing',
    title: 'Contributing',
    summary: 'How a change moves from an idea to a release.',
    owner: 'Design system team',
    sample: () => `Anyone can propose a change. The system team reviews it, and every accepted change becomes a new version.

1. Open an issue that describes the problem, with a screenshot of where it shows up.
2. Try the change with **Edit system**, then save it as a new version. That gives you a file change to put in a pull request.
3. A designer and an engineer from the system team review it, usually within two working days.
4. Once merged, the new version appears on this site and in the Figma library.

## What makes a good proposal
- It solves a problem seen in a real screen, not a hypothetical one.
- It names the components and tokens it touches.
- It says what happens to screens that already use them.`,
  },
  {
    id: 'iconography',
    title: 'Iconography',
    summary: 'Which icons we use and when.',
    owner: 'Product design team',
    sample: () => `Icons point the way; words carry the meaning.

## The set
We use [Phosphor](https://phosphoricons.com) icons in the filled weight, on a 24px grid. Close, check, plus and minus use the bold weight so they stay crisp at small sizes.

## Rules
- Pair an icon with a label. Icon-only buttons are fine in tight toolbars, with an accessible name.
- Use one icon per idea across the product: the bell always means notifications.
- Never use an icon as the only signal for status. Add text or a badge.

\`\`\`do
A labelled button: "Export" with a download icon.
\`\`\`
\`\`\`dont
Three unlabelled icons in a row that each mean something different.
\`\`\``,
  },
  {
    id: 'forms',
    title: 'Forms',
    summary: 'Short, single-column, labelled.',
    owner: 'Product design team',
    sample: () => `Forms in {{name}} are short, single-column and labelled.

- One column. Put fields side by side only when they are read together, like a date range.
- Every control has a visible label. Placeholder text shows an example, never the label.
- Validate when the person leaves a field, and say how to fix it: "Enter a date after 1 Jan 2024".
- The primary action sits at the end of the form, aligned with the fields.

\`\`\`do
Label: "Report name". Placeholder: "Q4 revenue by region".
\`\`\`
\`\`\`dont
No label, placeholder only: "Enter report name here…"
\`\`\``,
  },
  {
    id: 'states',
    title: 'Empty & loading states',
    summary: 'Every state looks different.',
    owner: 'Product design team',
    sample: () => `An empty result must never look like a zero, and a loading screen must never look like an empty one.

| State | Show | Say |
|---|---|---|
| Loading | A skeleton in the shape of the content | Nothing; the skeleton is enough |
| Empty | An empty state with one action | "No reports yet. Create one to see results here." |
| Stale | The data, plus a warning badge | "Last updated 3 hours ago" |
| Failed | An error alert with a retry | "We couldn't load this. Try again." |`,
  },
  {
    id: 'voice',
    title: 'Tone of voice',
    summary: 'How {{name}} sounds.',
    owner: 'Content design',
    sample: () => `{{name}} sounds like a sharp colleague: direct, calm and precise.

## We are
- **Direct.** Lead with the answer or the action. "Your report is ready", not "We're happy to let you know that…".
- **Calm.** Even bad news is stated plainly. No exclamation marks, no alarm words unless something is actually broken.
- **Precise.** Say which period, which item, which source. "Last 30 days" beats "recently".

## In practice
\`\`\`do
We couldn't load this chart. Try again.
\`\`\`
\`\`\`dont
Oops! Something went wrong 😬 (Error 503)
\`\`\`

> Sample text. Rewrite it from your brand brief, or ask the agent to draft it.`,
  },
  {
    id: 'writing',
    title: 'Writing guidelines',
    summary: 'Labels, numbers, dates and errors.',
    owner: 'Content design',
    sample: () => `Words help people read and act. Keep them short and specific.

- **Sentence case** for everything, including buttons and headings.
- **Buttons are verbs:** "Create report", "Save changes". Never "OK" or "Submit".
- **Numbers:** round to what matters ("€128.4k"), and pair a change with its period ("+12% vs last month").
- **Dates:** "14 Oct 2026". Times in 24-hour format, with the timezone when people work across regions.
- **Errors** say what happened and how to fix it, without blame or codes.`,
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    summary: 'What every screen must get right.',
    owner: 'Design system team',
    sample: () => `Every screen should work with a keyboard, a screen reader and 200% zoom.

- Text meets 4.5:1 contrast; large text and icons 3:1. The theme checks this for every token pair.
- Never use color alone for status. Pair it with a label or an icon.
- Focus is always visible. Don't remove the focus ring; the theme styles it.
- Every form control has a label, and every icon-only button an accessible name.
- Components handle keyboard behavior for you (Base UI). Don't rebuild it in product code.`,
  },
  {
    id: 'theming',
    title: 'Theming rules',
    summary: 'Changing the look without breaking the system.',
    owner: 'Design system team',
    sample: () => `- Change the look with **Edit system → Edit theme**, never by overriding component styles in product code.
- In product code, use semantic tokens (\`--color-background-neutral-primary\`). Primitives like \`colors/blue/500\` are for the theme only.
- Pick tokens by job, not by value: two tokens that look the same today can differ tomorrow.
- Every theme change is a new version with a one-line note, so the team knows what moved.`,
  },
]

export const writtenPage = (id: string) => WRITTEN_PAGES.find((p) => p.id === id)
