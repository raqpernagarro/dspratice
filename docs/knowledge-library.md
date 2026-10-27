# Sources (formerly the knowledge library)

The library is the product. Generation is replaceable; curated, owned, approved and cited sources are what make the workspace AI-*ready* rather than an AI-*generated* text machine. Every draft cites the library, and only the library.

Open it at **Settings › Sources** (`/nagarro/settings/sources`; the old `/nagarro/knowledge` paths redirect). It left the sidebar in round 7: people reach sources from a client request's Sources step, and the AI reads them; the page is for owners who approve and add.

## What a source records

| Field | Meaning |
|---|---|
| Title, kind | Point of view, offering, approach, governance model, method, deck, template, proposal section, case study, resource, request |
| Location | Figma file (frames), FigJam board, Figma folder (team), practice file, upload, link, repository |
| Owner | Who answers for it (Raquel, Nuno, Rui…) |
| Approval | `draft`, `approved` (with approver and date), `outdated` |
| Audience | `internal`, `client-safe`, `public` |
| Scope | Practice-wide, or one client (optionally approved for reuse elsewhere) |
| Availability | `available`, `not-read`, `unsupported`, `inaccessible`, with a message |
| Read | When, by which route (Figma plugin, REST, figma-cli, MCP, practice file, upload, paste), and a hash of what was read |

The list shows these as columns and chips. Its tabs are All, Practice, Client-scoped and Needs attention (outdated, not read, unsupported, inaccessible).

## Supported sources

| Source | How it is read | Refresh |
|---|---|---|
| Figma design file or slides, by frame | Knowledge plugin, figma-cli, REST (`FIGMA_TOKEN`), or the one-off MCP capture | Read again (REST), or Replace with a new plugin or CLI JSON |
| FigJam board | Same text extractor (stickies, shapes, text) | Same |
| Figma folder (team) | REST lists the team's projects and files (`projects:read`) | Register the folder, then add the files you want |
| Practice file (`gtm/`, `product-scoping/`, the two repos' docs) | Local API, allowlisted folders only | Read again compares an MD5 hash |
| Upload: `.md`, `.txt`, `.docx`, `.pdf` with a text layer, Figma text JSON | In the browser (mammoth, pdf.js loaded on demand). Nothing is uploaded anywhere | Replace |
| Pasted text | In the browser | Replace |
| Link only | Not read; recorded as a pointer | Add the content later |

Not read: `.pptx` and Keynote (export to PDF or read from Figma), old `.doc`, spreadsheets, scanned PDFs, images. The app says why when it refuses a file.

**Limits**
- At most 2 MB per local file.
- Upload size is capped per format.
- A document is capped in sections and characters. The capture lists what it left out under "Missing".

## Approval and audience rules

- **"Approved" needs an approver.** Only recorded verdicts start approved:
  - the offer deck ("use, canonical plans", 20 Oct);
  - the case studies index ("use, evidence library", internal until each client clears it);
  - the big-idea line (21 Oct);
  - the public capability page and blog.

  Everything else starts as a draft with its owner.
- **Supported statements** cite approved sources only. Draft sources give a *recommendation*. Outdated sources give a recommendation with a caveat, and a section that cites one cannot be published.
- **Refreshing changed text demotes an approved source to outdated** until someone approves it again. Responses and decks built on it show "Behind its inputs" or "Outdated".
- **Internal-only sources** may inform a draft. Their citations are removed from anything published, and a section that still quotes one word for word cannot be published until it is rewritten. Deck checks warn about the same thing on slides.

## Client scope and isolation

- A client-scoped source is visible only to that client's opportunities, unless it is approved for reuse. Retrieval only ever receives `opportunitySources(...)`, the sources visible to that project minus exclusions.
- The seeded Contoso questionnaire carries `CONTOSO-ISOLATION-MARKER`. Tests and the Edge run check that it never appears in another client's evidence, draft, packet or export.
- Other clients' names in a draft are flagged by the validator's deny-list. The list is internal-only and registered from `src/internal/register.ts`.
- Your uploads and new sources live in your browser (localStorage for the record, IndexedDB for the text). They are never committed. **Reset** removes a client's custom sources with the client.

## Conflicts

The library knows five places where the practice's material disagrees:
- package names: old against canonical;
- five pillars against six;
- the Starter Pack's 49 against 56 components;
- the DSN README against its code;
- the names for AI in delivery.

A draft that touches one shows the conflict and the canonical wording. A numeric heuristic flags other mismatches between cited sections.

## Refreshing the bundled seed

- **Practice files.** Run `npm run knowledge:local` to re-read them, or `npm run knowledge:local -- --check` to confirm the bundled snapshot is current.
- **Figma.** Re-capture with the plugin or figma-cli, then convert the JSON. Exclude client frames with `--exclude-text`.

  ```bash
  npm run knowledge:figma -- capture.json --source src-offer-deck --exclude-text '\bcharter\b'
  ```

Both write `src/fixtures/knowledge/docs/*.doc.json` and `index.generated.json`. Commit those; everyone then shares the same read and nobody spends tokens on it again.
