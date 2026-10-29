# {{title}} — agent instructions

{{dsAgentsBlock}}

## Theme
`src/styles/{{themeFile}}` is this app's theme. To change it, re-export from {{shareUrl}}
{{agentThemeNotes}}
## Looking things up
- `npx ds-ngr docs <Component>` prints a component's props and usage rules; `npx ds-ngr docs` lists every component. Check it before using a component — never guess prop names.
- `npx ds-ngr add` lists the page templates; `npx ds-ngr add <slug>` copies one into `src/pages/` as a starting point.

## Project rules
These rules belong to this project — add, edit or remove them freely. `npm run ds:agents` only rewrites the DS-Ngr block above, never this section. When a project rule contradicts a DS-Ngr rule, the project rule wins.

- Every page renders inside `Layout` (`src/Layout.tsx`), which wraps `AppShell`. Pass the page title and the page's primary action to `Layout`.
- `<html>` carries `data-theme="light"` or `"dark"` (default light, set in `index.html`). The dark-mode toggle flips it; keep it so the toggle has something to switch. Tokens default to light without it.

<!-- Add your own rules here, for example:
- Data comes from `src/api/`; never fetch inside components.
- Dates are shown as "12 Oct 2026".
-->
