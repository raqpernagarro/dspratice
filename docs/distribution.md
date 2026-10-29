# Getting the workspace to colleagues

## Recommended now: a private GitHub repository, run locally

Each designer or consultant clones the repo and runs:

```bash
npm run setup
npm run dev
```

**Why local first**
- Keys stay on each person's machine.
- Client text stays in their browser.
- Nobody needs a hosted service approved before they can use it.
- Without a key the workspace spends no model tokens at all.

**Steps for Raquel**
1. Create a private repository in the Nagarro GitHub organisation (for example `nagarro-dv/ds-hub`).
2. Push this folder, with `README.md`, `docs/` and `CONTRIBUTING.md` at the root.
3. Give the practice read access. Give owners (Nuno, Rui, Carolina) write access to their areas.
4. The DSN and Starter Pack snapshots in `sources/` give everyone the real component previews and the tools. Colleagues with access to the owners' repositories can replace a snapshot with their own clone (`npm run setup -- --clone-sources` into `sources/`).

## What is committed, and what never is

| Committed | Never committed (`.gitignore`) |
|---|---|
| Source, docs, tests, scripts | `.env.local` (keys) |
| The bundled knowledge snapshot (`src/fixtures/knowledge/docs/`): practice material only | `node_modules`, `.next/`, `storybook-static/` anywhere, including inside the vendored tools |
| Carolina's engine (pinned, credited) | `dist/`, `dist-demo/`, `test-results/`, `playwright-report/` |
| The Equip web fonts, for internal use under Nagarro's licence | `.cache/` (raw Figma captures), `knowledge-local/` |
| The practice tools: DSN and the Starter Pack in `sources/`, Presentation Studio and the Marketing Studio installer in `tool-copies/` (snapshots, see [LICENSES.md](../LICENSES.md)) | What the tools write when used (`ds.project.json`, `site/.data`, Studio's `product/data`) |
| | The ASSA ABLOY DS Prototyping Tooling: client material |
| | Anything a user uploads or creates: it lives in their browser |

Before the first push, run these checks:

```bash
npm test
npm run build
npm run build:demo
node scripts/check-sources.mjs
```

Also search the history for keys.

## Keys

- `ANTHROPIC_API_KEY` is optional. Use a Nagarro-approved key: per person, or a shared one from a team account with a spend limit. The workspace shows the estimate and usage of every call.
- `FIGMA_TOKEN` is optional: a personal access token with read scopes only.

## Next options, when the practice outgrows "run it locally"

| Option | What it adds | What it needs |
|---|---|---|
| Hosted internal instance (Nagarro SSO in front) | No setup for colleagues; one shared library | A shared store for the library and opportunities, which is not built: today everything is per browser. Plus a server-side key, hosting approval and a data-protection review for client text |
| Shared library through Git | Owners approve sources by pull request; everyone pulls the same snapshot | Already possible: `npm run knowledge:local` / `knowledge:figma`, then commit |
| Public demo site | Prospects try the scorecard and the walkthrough | See [demo-build.md](demo-build.md) |

The shared-library-through-Git route is the cheapest next step. It turns source approval into a reviewed change with an owner, which is real token governance for the practice's knowledge.
