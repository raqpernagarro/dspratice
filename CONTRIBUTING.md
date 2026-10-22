# Contributing

Keep the hub honest: every simulated part says so on screen, every statement cites a source, and nothing internal reaches the demo build or a client.

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
- **Demos** are listed under `DEMOS` in the same file, with:
  - the duration and what it proves;
  - presenter notes;
  - `audience: 'client-safe'` or `'internal'`.

  Only client-safe demos may appear in the demo build. The Prototyping Tool stays internal.

## Change the deck mapping

`src/deck/fromOpportunity.ts` maps responses onto Carolina's templates. Use only templates listed in `src/deck/catalog.generated.json` and only their schema fields. The deck tests run `checkDeck` on the Northwind plan and fail on any error.

## Add an internal-only string

If you add text that names a real client, a person or an internal document, keep it out of shared modules. Put it under `src/internal/` or a fixture that only `register.ts` imports. If it is a marker worth guarding, add it to `scripts/check-demo-build.mjs`.
