# Licences and third-party material

| Material | Where | Terms | Notes |
|---|---|---|---|
| **Equip and Equip Extended** web fonts (Hoftype) | `public/fonts/equip/` | Nagarro's licence | Internal use. Do not redistribute the files. Before a **public** deployment of the demo build, confirm that the licence covers web embedding on that domain; otherwise build the demo with the fallback stack (system fonts). |
| **Nagarro Master Slides** engine, tokens and kit (Carolina Baptista) | `public/vendor/nagarro-master-slides/` | Nagarro internal | Vendored unmodified from the design-system artifact (version in `VERSION.json`), which is synced from Carolina's `Presentation_v1` repository. Do not edit; re-run `npm run slides:sync`. Credit Carolina in anything built with it. |
| **DSN** (Rui Dias) and **DS Starter Pack** (Nuno Almeida) | not in this repo (`../demo tools/` or `./sources/`) | Nagarro internal, private repositories | Read only, never copied. Optional: the hub runs without them. |
| **figma-cli** (silships) | not in this repo | MIT | Referenced as an optional reader. Use its Safe or Browser mode; its default "Yolo" mode patches the Figma desktop app, which Nagarro-managed machines should not do. |
| npm dependencies | `node_modules/` | their own licences (`npm ls`) | |

The standalone HTML deck export inlines the Equip fonts and Carolina's engine into one file: share it with clients as a presentation, but do not publish it on a public site until the font licence is confirmed for that use.

Practice knowledge snapshots in `src/fixtures/knowledge/docs/` are Nagarro internal material. Client-specific material (uploads, client-scoped sources, real requests) stays in each user's browser storage and is never committed.
