# Design ↔ code sync

How tokens move between Figma and code, and which side owns what.

---

## Source of truth

| Layer | Owner | Notes |
|-------|-------|-------|
| Primitives (color ramps, type families) | Figma, DS-Nagarro library | Pulled into `tokens.css` |
| Semantic tokens | `tokens.css` | Hand-maintained; aliases follow Figma names |
| Shape & Density themes | `site/lib/theme/shape-density.ts` | Px per mode for `--shape-radius-*`, `--space-*` and `--size-control-height-*`. Figma holds only the defaults (single-mode `shape`, `space` and `size` collections) |
| Client themes | Theme page export | Re-values primitives and Shape/Density size tokens; never written to the main library |

---

## Figma → code (pull)

Maintainers run `npm run fetch:tokens`, then `npm run sync:tokens`, then `npm run apply:tokens` (the `ds-token-sync` skill). This reads the Figma Variables REST API, writes one `Design Tokens/<tier>.tokens.json` per tier (color, font, space, size, shape, effect, motion, z-index), plus `primitive.tokens.json` and `component.tokens.json`, and patches primitives in `tokens.css`. The output file comes from the variable name's first segment (a tier, `primitive`, or a component listed in `Design Tokens/vocabulary.json`), not its collection; anything else is skipped with a warning. Groups starting with an uppercase letter (`Deprecated/…`) are skipped too.

---

### Collections

One collection per semantic tier (`color`, `font`, `space`, `size`, `shape`, `effect`, `motion`, `z-index`), plus `primitive` and `component`. `component` holds every component token (`button/background/primary/default`, `popover/width/md`, …) in a **single mode**: each variable aliases a semantic variable, so it follows whatever mode the `color` collection is set to. A component token must therefore never change its alias target per mode — put that switch in a semantic token instead (e.g. `color/background/interactive/strong/*`, the primary button fill: ink in light, accent in dark).

### Shape & Density

Figma holds only the default values: Rounded shape and Default density. The `shape`, `space` and `size` collections each have a single mode, and there are no separate mode collections. The other modes (Square, Subtle, Pill; Compact, Comfortable, Spacious) exist only in code: `SHAPE_TABLE` and `DENSITY_TABLE` in `site/lib/theme/shape-density.ts` give px per mode, keyed by CSS token name. On the Customize page, the Roundness and Density pickers emit them as `--shape-radius-*`, `--space-*` and `--size-control-height-*` overrides. `tokens.css` holds only the defaults.

---

## Code → Figma (push)

The website can't write to Figma directly. Figma's REST API has no component writes, and variable writes need an Enterprise plan. Pushing goes through the **Figma agent** on your duplicate file (Agents panel in desktop or web), or through an external agent (Claude Code or Cursor) connected to a Figma MCP (official remote or figma-console).

1. On the **Customize** page, build the theme and open **Send to Figma**.
2. Paste the URL of a **duplicate or branch** of your Figma file.
3. Copy the **parity check** prompt and paste it into your agent. It only reads and returns a diff table.
4. When you're ready, copy the **apply** prompt. The agent shows the diff again, waits for your approval, writes, and then re-reads to verify.

With the **Figma tokens** format selected, **Export → Copy prompt** copies the same apply prompt; the agent asks for the file URL if you didn't set one.

To theme an app instead, choose **theme.css → Copy prompt** and paste it into the agent in the app repo. It saves `theme.css` and imports it right after `ds-ngr/tokens.css`.

Inside this repo, the `ds-figma-apply` skill runs the same flow on `Design Tokens/*.json` or a downloaded `theme.tokens.json`.

### Multi-brand

Under **Brands**, save each client brand by name, then pick **Export → All brands**. You get:

- `themes.css`: one block per brand, scoped to `:root[data-brand="<slug>"]`. The default brand also matches `:root:not([data-brand])`. The app sets `data-brand` on `<html>`. It has no effect on inner elements, because semantic tokens resolve primitives on the root, so there is one brand per page.
- `themes.tokens.json`: `brands.<slug>` in the single-brand shape. In Figma each brand is a mode of the `primitive` and `typography` collections, and the default brand uses the first mode. The apply prompt may add missing brand modes (never delete or rename them) and stops if the plan's mode limit is too low. Per-brand Shape, Density and Surface style are reported, not applied.

Saved brands live in this browser. **Copy share link** carries the whole set (`?brands=…`).

### Guarantees

- Variables are matched by exact name (`colors/accent/500` in collection `primitive`).
- Nothing is deleted, renamed or moved. A missing collection gets reported, not created. The only thing the apply step creates is a missing brand mode in a multi-brand payload.
- The main DS-Nagarro library file needs explicit confirmation before any write.

## Components (props parity)

`npm run fetch:components` writes every component set's properties from the library to `Design Tokens/figma-components.json`. `npm run sync:components` compares them with the React props in `ds-index.json` and reports Figma-only and code-only props, differing variant values, type mismatches and renames. Name exceptions live in `Design Tokens/component-map.json`. The `ds-component-sync` skill walks the drift and, per item, updates Figma or code. A weekly CI job (`component-sync.yml`) runs the offline diff against the committed snapshot.

Figma `State` (hover, pressed, focused) is never compared — it is a CSS pseudo-class, not a prop.

### Not covered yet

Code Connect mappings, and the effects Style mode (Surface style is still a code-only prototype). A theme's Shape and Density choices are applied as explicit page modes, not written as values.
