# Page templates

Runnable reference pages built only from DS-Ngr components and tokens. Each one is
the canonical implementation of a pattern in `specs/patterns/` (or of a common
screen — settings, sign-in, AI chat) and is shown in three places:

- **Docs site** — `/templates` gallery, `/templates/<slug>` preview + code, "Open in playground"
- **Storybook** — `Templates/*` (fullscreen, so Chromatic catches visual regressions)
- **`ds-index.json`** — the `templates` section, for agents

## Authoring rules

Templates are read by the prototype compiler (`site/lib/prototype/compile.ts`), which
parses JSX without running it. Keep to its subset:

- One file, one `export default function`. Imports only from `ds-ngr` and `lucide-react`.
- Data as top-level `const` literals. Inline `.map()` callbacks and ternaries are fine;
  local helper components and arbitrary function calls are not.
- No hooks besides `useState` (rendered with its initial value on the site).
- Tokens only — no hex colours, px spacing or font families. Sample people and emails
  must be fictional (`@example.com`).

## Adding one

1. Write `templates/<slug>.jsx` following the pattern spec it implements.
2. Add `{ slug, title, category, description, pattern? }` to `templates/index.json`.
3. Add a story to `src/stories/Templates.stories.tsx`.
4. `npm run index:generate`, then `npm test` — the site test fails on any rule error or warning.
