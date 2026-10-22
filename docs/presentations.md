# Presentations on the Nagarro Master Slides engine

Decks in the hub use **Carolina Baptista's Nagarro Master Slides engine**:
- the same 508 master templates, slide spec and tokens as her Presentation Studio (`Presentation_v1`), her nagarro-slides plugin for Claude Slides, and the "DS Nagarro Master Slides" design system;
- the same vocabulary: brief → plan → build → check → review;
- the same look.

Open decks at **Presentations** (`/nagarro/presentations`, filter by project). Start one with **New presentation**:

- **Answer a client request**: from a reviewed response (also reachable from the request's *Share and present* step);
- **Assessment readout**: from a project's own data, no request needed;
- **Project update**: from a project's own data, for a steering group (what changed, decisions, open points, next steps).

## The flow

1. **Brief**: the plugin's 12 points (deck name, key messages, audience and purpose, slide count, client, verbatim lines, hook, tone, must-have slides, takeaways, pictures, sources), prefilled from what the deck is built from.
2. **Plan**: one line per slide, to approve before building. Each line holds what the slide says, light or dark, the layout (described in words; template names on request, for Presentation Studio) and notes. Structures: Proposal, Assessment readout, Discovery kickoff and Project update; 15 to 60 minutes.
3. **Slides**: rendered by `NagarroSlides.renderDeck` inside an isolated frame (`slides.html`), with speaker notes beside them.
4. **Check**:
   - every slide is a registered template, with only its schema's fields, within capacity;
   - covers, dividers and the closing are dark;
   - no two neighbours share a template;
   - no empty titles or placeholder text;
   - numbers have a source;
   - no slide still quotes internal-only material.

   Balance and rhythm stay a human judgement: look at the slides.
5. **Share**: downloads, and where to continue for formats this hub does not produce.

**Present** opens a full-screen presenter (arrow keys or space, F for full screen, Escape to exit). On slides with a demo link, **Open the live demo** switches to the client demo in the same tab, at the right chapter; **Back to preparation** returns to the same slide.

## What the hub produces, and what it does not

| Format | Here | Where else |
|---|---|---|
| One-file HTML deck with present mode | Yes | |
| `deck.json` (the engine's spec) | Yes | Opening it in Presentation Studio is to be confirmed with Carolina |
| `brief.md` (12 points and plan) | Yes | Paste into the nagarro-slides plugin in Claude Slides |
| Speaker notes (Markdown) | Yes | |
| Editable PowerPoint (`.pptx`) or PDF | **No** | Carolina's Presentation Studio exports both; until `deck.json` import is confirmed, rebuild there from `brief.md` |

## Mapping

`src/deck/fromOpportunity.ts` maps the response onto registered templates with no model:

| Response content | Template |
|---|---|
| Opening | `main/cover-01` |
| Agenda | `main/index-01` |
| Chapter breaks | `core/divider-single` |
| Understanding | `main/summary-01` |
| What they asked for | `core/cards-row-4/5`, `core/cards-grid-6` |
| Recommendation | `marketing/text-02` |
| Phases | `planning/data-01` |
| Governance | `core/cards-row-4` |
| Enablement | `main/overview-01` |
| Assumptions and open points | `core/table-rows-3` |
| Next steps | `pitch/grid-15` |
| Closing | `main/closing-01` |

Picture slots stay empty: the hub never invents an image. The header name and the footer's deck and client names are filled on every slide.

## Exports

| File | For |
|---|---|
| Standalone HTML | Presenting anywhere: the engine, fonts and assets inlined, with present mode |
| `deck.json` | The engine's own format (`{engine, deck, slides}`), for Presentation Studio. **Import is to be confirmed with Carolina**; until then, rebuild there from `brief.md` |
| `brief.md` | The 12 points and the slide plan, for the nagarro-slides plugin in Claude Slides ("make a Nagarro deck", then paste it) |
| Speaker notes | Markdown, one section per slide |

Editable PowerPoint and PDF export stay in Presentation Studio.

## Outdated decks

A deck records the request version, response version and hash, requirements hash and source hashes it was built from. When any of them changes, the deck shows **Outdated** with the reason and **Rebuild**. A source refreshed or marked outdated counts as a change.

## The vendored engine

- **Where it lives.** `public/vendor/nagarro-master-slides/` holds Carolina's files unmodified. `VERSION.json` records:
  - the artifact URL: `FTePiAfzdDWtb71Bogjpn2`;
  - the version: `1792662579-390e`;
  - the upstream: `Presentation_v1` at `ed1dd7e`;
  - a SHA-256 hash for each file.
- **Generated files.** `src/deck/catalog.generated.json` is the template manifest, read from her bundle in jsdom. `src/styles/brand-tokens.css` comes from her `tokens.json`.
- **Updating.** Download the artifact's files, then run:

  ```bash
  npm run slides:sync -- <folder> --version <id>
  npm run tokens:sync
  npm test
  ```

  The deck mapping tests fail if a template the hub uses disappears or changes its schema.
- **Isolation.** Her CSS loads only in the slides frame, never in the shell.
- **Credit.** She is credited on the Hand off tab, on the Tools page and in [LICENSES.md](../LICENSES.md).

**Vendoring creates a fork.** Mitigation: no local edits, a pinned version, a sync script, and a check-in with Carolina. Long term, one versioned engine package should be consumed by her Studio, her plugin, her artifact and this hub.
