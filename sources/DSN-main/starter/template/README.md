# {{title}}

A React + Vite app on **DS-Ngr {{dsVersion}}**, themed by the DS-Ngr theme configurator.

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

Requires Node 20.19+ or 22.12+.

## What's inside

| Path | What it is |
|---|---|
| `src/pages/Home.tsx` | The starting page: {{pageLabel}} |
| `src/Layout.tsx` | App frame: `AppShell` + `Sidebar` + `Navbar`, with a light/dark toggle |
| `src/styles/{{themeFile}}` | Your theme. Generated — re-export it from the configurator rather than editing it |
| `src/styles/overrides.css` | Your hand-made token changes. Yours to edit; never overwritten |
| `src/main.tsx` | CSS import order: `tokens.css` → theme → `overrides.css` → `global.css` → `style.css` |
| `vendor/{{dsTarball}}` | The DS-Ngr package itself, installed from this file |
| `theme.tokens.json` | The same theme as DTCG tokens, for Figma |
| `AGENTS.md`, `CLAUDE.md` | Instructions for AI coding agents — see [AI instructions](#ai-instructions) |
| `vendor/{{cliTarball}}` | The `ds-ngr` CLI — see [From the terminal](#from-the-terminal) |

## Change the theme

Open the configurator with your current settings, adjust, export the CSS again and replace `src/styles/{{themeFile}}`:

{{shareUrl}}
{{themeNotes}}
## Customize tokens

Every DS-Ngr token ships with the package, in `node_modules/ds-ngr/dist/tokens.css`. The theme only re-values the ones you changed in the configurator. To change anything else, re-value the token in `src/styles/overrides.css` — it loads after the theme, so it wins, and re-exporting the theme never touches it:

```css
:root {
  --color-foreground-interactive-primary-selected: var(--primitive-accent-700);
}

:root[data-theme="dark"] {
  --color-foreground-interactive-primary-selected: var(--primitive-accent-200);
}
```

Don't edit `tokens.css` or copy it into the app: package updates would no longer reach you.

## AI instructions

`AGENTS.md` has three parts:

- **DS-Ngr rules** — between the `<!-- ds-ngr:start -->` and `<!-- ds-ngr:end -->` markers. Owned by the design system; `npm run ds:agents` replaces it with the rules of the installed DS-Ngr version.
- **Theme** — where your theme comes from.
- **Project rules** — yours. Add, edit or remove rules freely; nothing overwrites them. A project rule that contradicts a DS-Ngr rule wins, so you never need to edit the managed block.

`CLAUDE.md` points Claude Code at `AGENTS.md`; add Claude-only notes there.

## Build with the design system

Component rules, layout rules and patterns live in `node_modules/ds-ngr/AI.md` (installed with the package). AI agents read it automatically through `CLAUDE.md` / `AGENTS.md`.

## From the terminal

The `ds-ngr` CLI is installed with the app:

```bash
npx ds-ngr docs DataTable     # props and usage rules for a component
npx ds-ngr add data-page      # copy a page template into src/pages/
npx ds-ngr mcp --write        # connect Claude Code to the DS-Ngr MCP server (.mcp.json)
npx ds-ngr agents             # refresh the DS-Ngr rules in AGENTS.md
```

`npx ds-ngr --help` lists everything.

## Update DS-Ngr

Download a new starter pack from the configurator and copy its `vendor/*.tgz` here, then update the `ds-ngr` path in `package.json`, run `npm install`, and run `npm run ds:agents` to pick up the new DS-Ngr rules.
