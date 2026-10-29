# Design system build — "Nagarro Master Slides"

Builds the **Nagarro Master Slides** design system, a Claude Design System artifact, from this
repository: https://claude.ai/artifact/FTePiAfzdDWtb71Bogjpn2 (`artifact.json`).

It contains the brand tokens, the Equip fonts, the slide engine bundled as one script
(`window.NagarroSlides`, so all registered master templates render live), one preview card per
slide category, the frame and block cards, a sample deck, the brand photo library and the brand book.

## Build

```bash
node tools/design-system/build.mjs                # full build (~20 s)
node tools/design-system/build.mjs --skip-media   # reuse the re-encoded media
```

Output goes to `tools/design-system/.build/out/project/` (git-ignored). The build fails if any
template throws while rendering its example, or if any media file is still over 512 KB.

Needs: Node, Python 3, macOS `sips` (media re-encoding), and esbuild (it uses
`node_modules/.bin/esbuild` if present, otherwise `npx esbuild@0.28.1`).

## What comes from where

| Output | Source |
| --- | --- |
| `components/bundle.js` | `entry.js` → `js/templates/index.js`, `js/frame.js`, `js/components.js`, `js/icons.js`, `js/metric-blocks.js`, `js/logo.js`; categories from `ROLE_CATEGORY` in `product/domain/template-service.js` |
| `components/bundle.css` | `css/primitives.css` verbatim, the stage and legacy chrome rules of `css/deck.css`, per-theme colour pins |
| `tokens.json` | Colours: `figma-tokens.json`, the Figma Theme (Light, Dark) and Colors variables. Text styles, spacing and radius: `make-tokens-and-library.mjs`, matching Figma |
| Slide colour pins in `bundle.css` | Every colour variable in `css/tokens.css`, `css/primitives.css` and `css/deck.css`, so slides render as in the product. The build prints where Figma and the HTML differ, and the Colour section lists it |
| Slide library cards, `12–15-catalog-*.md`, `components/index.d.ts` | `make-tokens-and-library.mjs`, from each template's metadata |
| Frame, brand, block and deck cards | `make-cards.mjs` |
| `README.md`, `01–11-*.md`, `kit/deck-starter.html`, asset-group READMEs, the cover | `static/` (hand-written; `{{SOURCE_REF}}` and `{{SOURCE_DATE}}` are filled in) |
| `media/` | `media.py`: every file the template examples reference plus `assets/photography/`, re-encoded |
| `fonts/` | `fonts/web/*.woff2` |
| `design-system.json` | `build.mjs`: brand asset records from `assets-blobs.txt`, marker from `artifact.json` |

When a template is added, changed or removed, rebuild: the cards, catalog, types and bundle all
follow the registry. Edit the brand book in `static/`, never in `.build/`.

## Refreshing the Figma tokens

`figma-tokens.json` holds the Figma variables. When they change in Figma, ask Claude to read them again (Figma Desktop Bridge plugin open on Master Slides) and rewrite this file: Theme collection, Light and Dark modes only, plus the Colors primitives; `/` in names becomes `-`.

## Preview locally

```bash
cd tools/design-system/.build
node ../harness.mjs light        # or: dark
cd out && python3 -m http.server 4711
```

Then open `http://127.0.0.1:4711/project/components/<Card>/_test.html`. The harness writes
`_test*` files that are never published.

## Publish

Ask Claude (Claude Code, with the Artifact tool) to publish `.build/out` to the URL in
`artifact.json`, following `.build/publish-plan.json`:

- One Artifact `publish` per batch, with `root` = `.build/out` and the batch's paths as `files`.
  At most 255 files and 16 MiB per call; the media batches go first.
- The **last** call carries the docs, components, fonts, `tokens.json` and
  `file_path` = `project/design-system.json`. Read the live index first: if someone has added or
  renamed assets on the page, merge those records in rather than overwriting them.
- `components/index.d.ts` must be sent with `contentType: "text/plain"`.
- Unchanged media can be skipped on a republish.

### Brand assets (Logos, Caring, Scribbles)

These are asset uploads, not files. The build stages them in `.build/upload/` and looks up each
one's upload id in `assets-blobs.txt` (`Group file id`). A new or renamed SVG is reported as missing:
upload it to the artifact (Artifact `publish` with `asset: true`), add its line to
`assets-blobs.txt`, and rebuild.
