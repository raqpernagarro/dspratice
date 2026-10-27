# Reading Figma into Sources

The library reads Figma as **text in reading order, frame by frame**, with a link back to each frame. One extractor, `figma-plugin/extract-text.js` (format `figma-text@1`), runs in four places. Every route produces the same JSON, which the app and `npm run knowledge:figma` turn into a knowledge document.

## Routes, cheapest first

| Route | Model tokens | Needs | Lists folders | Use it for |
|---|---|---|---|---|
| **Knowledge export plugin** (`figma-plugin/`) | 0 | Figma desktop, any plan, view access. No AI permission, no network | No | The default for designers, and for clients without MCP or AI permissions |
| **Figma REST** through the local API | 0 | `FIGMA_TOKEN` with `file_content:read` (and `projects:read` or `folders:read` for folders) | **Yes**: team → projects → files | In-app **Read again** and folder discovery |
| **figma-cli** ([silships/figma-cli](https://github.com/silships/figma-cli), MIT) | 0 | Figma desktop over its local debugging bridge | No (lists open files only) | Optional. Scripted refreshes without opening the plugin |
| **Figma MCP `use_figma`** running the same extractor | About the size of the text | Claude Code with the Figma MCP, edit access | No | A one-off seed capture only |
| Figma MCP `get_design_context` | About 8–10K per slide | Claude Code with the Figma MCP | No | Not for routine reads: too expensive |

## The plugin (zero tokens)

1. `figma-plugin/code.js` is generated and committed. Rebuild it with `node scripts/build-figma-plugin.mjs` only after editing the extractor or the plugin glue.
2. In Figma desktop, open **Plugins › Development › Import plugin from manifest…** and pick `figma-plugin/manifest.json`.
3. Open the file and the page, then run **Nagarro knowledge export**. Choose **Copy JSON** or **Download JSON**.
4. In the workspace, open **Settings › Sources › Add a source** (or **Replace** on an existing source) and drop the JSON in.

The plugin:
- is read-only;
- has no network access (`networkAccess.allowedDomains: ["none"]`);
- works in Figma, FigJam and Slides;
- reads only the current page.

## REST (zero tokens, needs a token)

1. Put `FIGMA_TOKEN` in `.env.local`.
2. Restart `npm run dev`.

**Settings › Integrations** then shows Figma REST as on. A Figma source gains **Read again**, which fetches its frames and compares hashes. A changed approved source becomes outdated. Folder sources list their files.

Status: built and unit-tested against mocked responses, **not exercised against Figma** until someone adds a token.

## figma-cli (optional, zero tokens)

```bash
node scripts/figma-cli-extract.mjs <path-to-figma-cli> --file-key <key> [--page <id>] [--port 9222] --out capture.json
npm run knowledge:figma -- capture.json --source <source-id>
```

The adapter runs the same extractor through figma-cli's `eval`.

**Use Safe or Browser mode only.** figma-cli's default "Yolo" mode patches the Figma desktop app. Do not use it on Nagarro-managed machines.

Status: written, **not exercised** in this round.

## What the seed capture cost

On 22 Oct 2026 the seed was read once through `use_figma` running the extractor, text only. The capture covered:
- the offer deck, in two calls (the response limit is 48 KB);
- the Case Studies index;
- the FigJam strategy board.

It cost roughly 30K tokens in total. The same capture through `get_design_context` would have cost several hundred thousand.

Exclusions are listed in each document's "Missing" section:
- cover, index and confidentiality frames;
- image-only mockups;
- the client chapter "Understanding Charter";
- every "Prepared for Charter Communications" footer.

## Folder ingestion: what the MCP can and cannot do

- The Figma MCP reads files and nodes you name. It **does not list a folder or team**. Do not assume an MCP connection means a curated folder can be ingested whole.
- Folder discovery needs REST with `projects:read`. The two Figma teams (Decks; Product Studio – Proposals) are registered as `figma-folder` sources, marked "not read" until a token exists.
- A file you cannot open returns an explicit "inaccessible" state with the reason; nothing is guessed.
