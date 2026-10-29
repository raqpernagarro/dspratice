# Licences and third-party material

| Material | Where | Terms | Notes |
|---|---|---|---|
| **Equip and Equip Extended** web fonts (Hoftype) | `public/fonts/equip/` | Nagarro's licence | Internal use. Do not redistribute the files. Before a **public** deployment of the demo build, confirm that the licence covers web embedding on that domain; otherwise build the demo with the fallback stack (system fonts). |
| **Nagarro Master Slides** engine, tokens and kit (Carolina Baptista) | `public/vendor/nagarro-master-slides/` | Nagarro internal | Vendored unmodified from the design-system artifact (version in `VERSION.json`), which is synced from Carolina's `Presentation_v1` repository. Do not edit; re-run `npm run slides:sync`. Credit Carolina in anything built with it. |
| **DSN** (Rui Dias) | `sources/DSN-main/` | Nagarro internal, private repository `nagarro-dv/DSN` | Vendored copy (ds-ngr 0.1.44) without dependencies or build output. Rui's repository is the source of truth; replace the snapshot, do not edit it here. |
| **DS Starter Pack** and the DS Configurator (Nuno Almeida) | `sources/ds-starter-pack-main/` | Nagarro internal, private repository `nagarro-dv/ds-starter-pack` | Vendored copy (1.0.0), same rule. |
| **Presentation Studio** (Carolina Baptista) | `tool-copies/deckgenerator-platform-main/` | Nagarro internal, `Presentation_v1` | Vendored copy (1.4.0) with its template assets, same rule. Decks it generates need the Claude CLI. |
| **Marketing Studio** installer (Hugo França) | `tool-copies/Install-Marketing-Studio/` | Nagarro internal; TryPost upstream under its own licence | Python plus Docker, see its INSTALL.md. Vendored unchanged. |
| **DS Prototyping Tooling** (ASSA ABLOY) | not in this repo | Client project material | Never committed: it holds the client's tokens, fonts, logos and screens. The `prototyping` tool page explains it is not on this machine. |
| **figma-cli** (silships) | not in this repo | MIT | Referenced as an optional reader. Use its Safe or Browser mode; its default "Yolo" mode patches the Figma desktop app, which Nagarro-managed machines should not do. |
| npm dependencies | `node_modules/` | their own licences (`npm ls`) | |

The standalone HTML deck export inlines the Equip fonts and Carolina's engine into one file: share it with clients as a presentation, but do not publish it on a public site until the font licence is confirmed for that use.

Practice knowledge snapshots in `src/fixtures/knowledge/docs/` are Nagarro internal material. Client-specific material (uploads, client-scoped sources, real requests) stays in each user's browser storage and is never committed.
