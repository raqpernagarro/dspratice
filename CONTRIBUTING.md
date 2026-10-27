# Contributing

Keep the workspace honest: every simulated part says so where it could be mistaken for a live action, every statement cites a source, sample figures are labelled, and nothing internal reaches the demo build or the client demo. Write in the voice described in [docs/writing.md](docs/writing.md).

## Before you open a pull request

```bash
npm test
npm run build
npm run build:demo
npm run e2e
```

`npm run e2e` runs in Microsoft Edge and needs the demo build. Do not edit anything under `../demo tools/` or `public/vendor/nagarro-master-slides/`.

## Add a practice source to the bundled library

1. Add an entry to `src/fixtures/knowledge/registry.ts`. Fill in:
   - the id (`src-…`), slug, title and kind;
   - the scope, location and owner;
   - the audience. Choose `internal` unless the text can be shown to a client as it is.
2. Set `approval: 'draft'`. Only the owner approves, and an approved entry needs `approvedBy`, `approvedAt` and a note.
3. Produce its document:
   - **Practice file:** give the entry `location: { type: 'local', path: '<folder>/<file>' }`, then run `npm run knowledge:local`; the script reads every local entry. For in-app **Read again**, the folder must be one of the local API's allowed roots (`DEFAULT_ROOTS` in `server/local-api.ts`).
   - **Figma:** capture with the knowledge plugin, then run `npm run knowledge:figma -- capture.json --source <id>`. Use `--exclude-text` for any client frame.
4. Run `npm test`. The registry tests check that every seed resolves, that no client footer slipped in, and that approvals have approvers.

Client material never goes into the bundled library. Users add it in the app as a client-scoped source.

## Add a tool or a demo

- **Tools** are listed in `src/fixtures/hub.ts`, under `SOLUTIONS` (the three solutions and their parts) or `PRACTICE_TOOLS`. Give each one an owner, a status, how to get it and the access needed.
- **A tool the workspace opens** (in a frame or its own tab) is two entries:
  - its server in `src/fixtures/tool-servers.json`: owner, folder name, version checked, default port, a fast probe path, the start and install commands, what it needs and what it writes into its own folder (the reason it runs from a copy);
  - one experience per page in `src/fixtures/experiences.ts`: the path, what you do and get, `frame` or `tab`, and the token grammar if it produces tokens.

  `npm run tools`, the local API and the tool pages all read these files; a journey in `src/fixtures/journeys.ts` links to the tool. A tool that writes into its folder never runs from `../demo tools`: add the folder to `scripts/check-sources.mjs` and run it with `--write` once.
- **A new journey** gets a card on Home only when real use shows the need (see `docs/writing.md`, *Journey*).
- **Demos** are listed under `DEMOS` in the same file, with:
  - the duration and what it shows;
  - tips for the presenter;
  - `audience: 'client-safe'` or `'internal'`.

  Only client-safe demos may appear in the demo build. The Prototyping Tool stays internal.

## Change the client demo story

- Chapters live in `src/features/demo/steps.ts` and contain **client-facing text only** (title, headline, what it shows, why it matters, route, action, prerequisites in `needs`). They ship in the demo build.
- Presenter notes for each chapter go in `src/internal/presenterNotes.ts`. Never import that file from `src/features/demo`, `src/shell` or any client route.
- `src/features/demo/demo.test.ts` enters every chapter directly from a fresh demo and checks its action completes; keep it passing.

## Change the deck mapping

`src/deck/fromOpportunity.ts` maps responses onto Carolina's templates. Use only templates listed in `src/deck/catalog.generated.json` and only their schema fields. The deck tests run `checkDeck` on the Northwind plan and fail on any error.

## Add an internal-only string

If you add text that names a real client, a person or an internal document, keep it out of shared modules. Put it under `src/internal/` or a fixture that only `register.ts` imports. If it is a marker worth guarding, add it to `scripts/check-demo-build.mjs`.

## Adding a journey, a demo or a social cut

- **A journey** is one entry in `src/fixtures/journeys.ts`: what you get, who it is for, the words people use, where it starts, what backs it, and when not to pick it. Add phrasings to `src/features/nagarro/intent.test.ts` so the router keeps finding it. See [docs/journeys.md](docs/journeys.md).
- **A mini-demo** is one entry in `src/fixtures/demos.ts` (chapters, the story, or one page). Its text ships in the client demo build: client-safe only.
- **A social cut** is one entry in `src/fixtures/social-cuts.ts`. Keep it under 30 seconds, captions under 80 characters, and notes on where every fact comes from; `src/features/demos/demos.test.ts` checks its chapters and focus targets exist.
- **Sample project cards** (a brief, a country) go in `src/fixtures/project-cards.json`. No people and no real client work: projects are not shared (NDA).
