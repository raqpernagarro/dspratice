# The client-safe demo build

`npm run build:demo` builds a separate static site into `dist-demo/` for prospects and events. It contains:

- a short landing page ("AI will build your interfaces anyway. Make sure it builds yours.");
- the client experience on the fictional **Demo Brand**, with the guided walkthrough (`/client/demo-brand?guide=meeting`);
- the **AI-readiness scorecard** (`/scorecard`): ten questions in five dimensions, a level from 1 to 5, the three weakest areas and a first step. Answers never leave the page; there is a print view.

It contains no Nagarro workspace, no knowledge library, no opportunities, no internal seeds and no local API. Any other path falls back to the landing page.

## How internal material is kept out

- The demo router (`src/app/router.demo.tsx`) only knows the landing page, the scorecard and the client routes.
- `src/internal/register.ts` registers the knowledge library, the sample opportunities and the client deny-list. In demo mode it is swapped for `register.demo.ts`, which is empty, so Rollup never bundles that material.
- Carolina's engine is removed from the output: the demo has no slides, and her template examples name real clients.
- Internal board chips ("screen 30 · partly works") are hidden, and the page has a public title.
- The demo uses its own storage key (`unified-ds-tool:demo`).
- `scripts/check-demo-build.mjs` scans every output file for 25 internal markers and fails the build on any hit:
  - internal source identifiers and the Contoso isolation marker;
  - "Battle card" and "Authority engine";
  - real client names;
  - internal people;
  - `ANTHROPIC_API_KEY`, `FIGMA_TOKEN` and `/api/generate`.

Check it locally:

```bash
npm run build:demo
npm run preview:demo
```

Then open <http://localhost:4302>. `npm run e2e` includes a demo spec: landing, scorecard result, walkthrough, and no internal pages.

## Before any public deployment

Deploying is outward-facing. It needs, in this order:

1. **Raquel's go-ahead** on the content and the URL.
2. **Marketing's OK** (Elisabeth, Deeksha) on the scorecard. It must not compete with the official AI-readiness assessment on nagarro.com: it links to it, reuses the practice's discovery questions and collects no data.
3. **The Equip web-font licence** confirmed for that domain. Otherwise build with the fallback font stack.
4. **A last read of the shared fixtures.**
   - The bundle carries the fictional engagements (Northwind, Contoso, Fabrikam) and an engagement owner's name (Raquel Pereira), even though the demo pages never render them.
   - Replace the name in `src/fixtures/projects` if it should not be public.
   - Then run `npm run build:demo` again.

A static host such as Vercel works: build command `npm run build:demo`, output `dist-demo`, with a single-page fallback to `index.html`. No server, keys or environment variables are needed.
