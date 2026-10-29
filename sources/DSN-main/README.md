# DS-Nagarro

An AI-first React component library designed so that AI agents can generate correct UI code without hallucination or guesswork.

Every structural and naming decision in this library prioritises **AI agent interpretability** over aesthetic preference.

---

## Resources


| Resource | URL                                                                                                                              |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Figma    | [https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro](https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro) |


---

## Stack


| Layer         | Technology                                       |
| ------------- | ------------------------------------------------ |
| Framework     | React 18 + TypeScript                            |
| Build         | Vite                                             |
| Styling       | Styled Components v6                             |
| Documentation | Storybook v10 + Chromatic                        |
| Docs site     | Next.js 16 (`site/` workspace)                   |
| Icons         | lucide-react (apps list it at the same version ds-ngr uses) |


---

## Running locally

The repo is an npm workspace with three parts: the **library** (`src/`), **Storybook**, and the **docs site** (`site/`). The site and Storybook render the same components from the same source, so they never drift apart.

### First-time setup

```bash
npm install
```

Run it once at the repo root — it installs the library, `site/` and `cli/` together. Requires Node 20.9+.

### Run everything (recommended)

```bash
npm run dev:docs
```

| What      | URL                     |
| --------- | ----------------------- |
| Docs site | http://localhost:3100   |
| Storybook | http://localhost:6006   |

This starts Storybook and the site side by side, with the site's component previews pointing at your live Storybook. Edit a component, story or spec and both update on save.

### Run them separately

```bash
npm run storybook
```

```bash
npm run site:dev
```

Run on its own, the site embeds the last **built** Storybook (`site/public/storybook/`) instead of the live one. To make it use your running Storybook instead, copy `site/.env.example` to `site/.env.local` and set `NEXT_PUBLIC_STORYBOOK_URL=http://localhost:6006`.

### How they stay in sync

| Content                                  | Source of truth                         | Storybook                 | Docs site                                                   |
| ---------------------------------------- | --------------------------------------- | ------------------------- | ----------------------------------------------------------- |
| Components                               | `src/components/`                       | imports source            | imports `../src` directly (`site/next.config.ts`) — no build or publish step |
| Stories / interactive previews           | `*.stories.tsx`                         | renders them              | embeds Storybook in an iframe (live URL or `public/storybook/`) |
| Component index, props, AI specs         | `ds-index.json`, `*.spec.md`, `specs/`  | regenerated on `prestorybook` | regenerated on `predev` / `prebuild`                    |
| Tokens and rules                         | `tokens.css`, `AI.md`, `AI-short.md`    | imported                  | read at runtime (MCP + chat routes)                         |

Every `site:dev` and `site:build` also re-packs the starter pack and CLI, and copies `storybook-static/` into `site/public/storybook/` when it is newer — so you never run those steps by hand.

### Production build

```bash
npm run build:full --workspace site
```

Builds Storybook into `site/public/storybook/`, then builds the site. Serve it with `npm run start --workspace site` (port 3100). Use `npm run site:build` alone only when the bundled Storybook is already current.

### Optional environment

All variables are optional for local work — see `site/.env.example`. The `ORG_AI_*` keys enable the shared in-site chat on `/prototype/company`; leave them unset locally.

---

## Installation

This library is **local and private**. There is no published npm package. Two ways to use it:

- **New app — starter pack.** On the docs site, open **Brands**, set up your brand(s), and use **Starter pack → Download starter (.zip)**. It's a Vite + React app with the theme applied, the starting page you picked (blank, dashboard, data page or form page), the ds-ngr package bundled in `vendor/`, and `CLAUDE.md` / `AGENTS.md` for AI agents. Unzip, `npm install`, `npm run dev`. The template lives in `starter/template/`; `scripts/build-starter-assets.mjs` packs the library for it (runs automatically before `site:dev` and `site:build`).
- **New app — CLI.** `npx <docs site>/cli/ds-ngr-cli.tgz create my-app --page dashboard` writes the same starter from the terminal (Brands → Starter pack → **Copy CLI command** fills in your theme). Generated apps include the CLI: `npx ds-ngr docs <Component>`, `npx ds-ngr add <template>`, `npx ds-ngr mcp --write`, `npx ds-ngr agents`. Source in `cli/` (no dependencies); `scripts/build-cli-assets.mjs` packs it into `site/public/cli/` before `site:dev` and `site:build`. Full reference: `cli/README.md`; on the site, **Prototype → Build with the CLI** (`/prototype/cli`).
- **Existing app — `npm link`**, as below.

```bash
# In the DSN repo
npm install
npm link

# In the consuming app
npm link ds-ngr

```

The consuming app also needs to import the stylesheets **in this order** (required for layout parity with Storybook):

```js
import 'ds-ngr/tokens.css';
import 'ds-ngr/global.css';
import 'ds-ngr/style.css';

```

`global.css` includes the universal `box-sizing: border-box` reset, base typography, and the AppShell `html`/`body` height chain. Without it, layout primitives such as `SectionHeader` can render taller than in Storybook (e.g. popover headers ~16px too tall).

**v0.1.44+:** Consumers must add `import 'ds-ngr/global.css'`. `style.css` also prepends a minimal box-sizing reset, but full parity requires `global.css`.

After making changes to the library, run `npm run build` in the DSN repo for changes to reflect in the consuming app.

Consuming apps with `@visx` peer dependency conflicts must install with `--legacy-peer-deps`.

---

## Repository structure

```
DSN/
├── src/
│   ├── components/
│   │   ├── atoms/
│   │   ├── molecules/
│   │   └── organisms/
│   ├── docs/                  # Storybook MDX documentation pages
│   ├── styles/
│   │   └── global.css
│   ├── types/
│   │   └── common.ts
│   └── index.ts               # Public API
├── tokens.css                 # Design tokens — mirrors Figma exactly
├── specs/
│   └── patterns/              # Page patterns and component relationship maps
├── cli/                       # `ds-ngr` CLI — create / add / docs / mcp / agents
├── starter/template/          # App the starter pack and `ds-ngr create` generate
├── AI.md                      # Rules for agents consuming the library ← read this
├── AI-short.md                # Condensed version for context-limited tools
├── AGENTS.md                  # Rules for agents building the library
└── CLAUDE.md                  # Entry point — 6-line pointer file only

```

**Atoms** — Avatar, Badge, Button, ButtonGroup, Checkbox, Chip, Combobox, CustomViewTab, DataListCell, DataTableCell, DataTableHeaderCell, DateTimePicker, FileThumbnail, LoadingBar, MenuCell, NumberInput, OTPInput, Pagination, PasswordInput, PhoneInput, ProgressBar, ProgressRing, Radio, SearchBar, SegmentControl, Select, SectionHeader, Separator, Shortcut, SkeletonLoading, Stat, Switcher, Tab, Tag, TextArea, TextInput, UploadArea

**Molecules** — Accordion, Breadcrumbs, BulkActionBar, Callout, CheckboxField, ChipField, ChoiceList, EmptyState, HorizontalInput, MultiChoice, PopoverWrapper, RichTextEditor, SidebarMenuSelector, SingleChoice, Slider, Toast, Toolbar, Tooltip

**Organisms** — AlertDialog, AppShell, CalendarView, Card, Charts, DataTable, Drawer, Modal, Navbar, PopoverMenu, Sidebar

---

## For AI agents

1. Read `AI.md` before writing any code — it is the authoritative usage guide.
2. Try connecting to the Storybook MCP server for interactive component lookup. If the MCP server is unavailable, continue using `src/docs/` and `specs/patterns/`.
   In a consuming app with the CLI installed, `npx ds-ngr docs <Component> --json` returns the same props and spec without MCP.
3. Never fetch the Chromatic URL programmatically — it exists for human reference only.

---

## Where to go


| I want to…                                           | Go to                                                                 |
| ---------------------------------------------------- | --------------------------------------------------------------------- |
| Use the library in an app                            | `AI.md`                                                               |
| Use a shorter version for context-limited tools      | `AI-short.md`                                                         |
| Build or modify the library                          | `AGENTS.md`                                                           |
| Browse components and usage                          | Storybook MCP → if unavailable, use `src/docs/` and `specs/patterns/` |
| Check or update tokens                               | Figma → `tokens.css`                                                  |
| Read component specs                                 | `src/docs/`                                                           |
| Understand page patterns and component relationships | `specs/patterns/`                                                     |


