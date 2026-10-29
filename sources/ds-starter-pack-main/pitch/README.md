# Pitch deck

A presentation about the starter pack that builds itself from this folder and from live facts in the repo (component count, parity, test and accessibility results, screenshots).

**Latest version:** the [Pitch deck (latest)](https://github.com/nagarro-dv/ds-starter-pack/releases/tag/pitch-latest) release. Download `pitch-deck.html` and open it in a browser (arrow keys or click to move between slides), or use the PDF.

## What you edit

| File | What it holds |
|---|---|
| [story.md](story.md) | The narrative, slide by slide. |
| [roadmap.md](roadmap.md) | Every idea, under **Done**, **In progress** or **Ideas**. Move a line to change its status: "Done" feeds the *What's built* slide, the other two *What's next*. |

### story.md, in short

- Slides are separated by a line with only `---`.
- `# ` is the slide title, `## ` a subtitle. Paragraphs, `- ` bullets and `1. ` numbered steps work, and so do **bold**, *italic* and `code`.
- `<!-- layout: title -->` or `<!-- layout: statement -->` on a slide changes its layout.
- `{{name}}` inserts a live fact: `components`, `categories`, `tokens`, `brands`, `parity`, `stories`, `tests`, `commits`, `since`.
- A slide whose whole body is one of these is generated:

| Directive | Slide |
|---|---|
| `{{facts}}` | The numbers, read from the repo |
| `{{gallery: id, id, …}}` | Screenshots of Storybook stories: ids as in Storybook's URL, without `base-ui-components-` (e.g. `dialog--preview`) |
| `{{configurator}}` | A screenshot of the DS Configurator |
| `{{roadmap: done}}` / `{{roadmap: next}}` | Items from roadmap.md |

## When it rebuilds

- **Automatically**, when a pull request with the **`pitch`** label is merged into `main` (workflow: `.github/workflows/pitch.yml`). Add the label to pull requests worth showing.
- **By hand**: GitHub → Actions → *Pitch deck* → *Run workflow*.
- **Locally**: `npm run pitch:build` (a few minutes: it runs the tests and builds Storybook and the configurator for the screenshots). For quick text edits, `npm run pitch:build -- --skip-tests --skip-screenshots` reuses the last results. Output goes to `pitch/dist/` (not committed).

## How it's built

`scripts/pitch/`: **collect** (`collect.ts`) turns the two Markdown files and the live facts into the deck as plain data (`pitch/dist/slides.json`). The **web renderer** (`render-web.ts`) turns that data into one self-contained HTML file, styled with the design system's own tokens and font, and prints it to PDF.

To use a PowerPoint template later, add a second renderer that reads the same `slides.json`. Nothing else has to change.
