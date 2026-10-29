# 0002 — Fixed 1920×1080 canvas, scaled via CSS transform

## Status
Accepted (in effect since v1.0; explicitly called out as a "critical gotcha" to
preserve in `CLAUDE.md`).

## Context
Slides are derived pixel-for-pixel from Figma frames (`js/templates/_CONTRACT.md`
mandates "exact px coordinates, sizes, and colors" from Figma's
`get_design_context` output). The system also needs to render correctly at any
window size (fullscreen presentation, a smaller browser window, dashboard
thumbnails) and needs the exported PDF to be pixel-identical to the live view.

## Decision
Every slide is authored as absolutely-positioned content inside a fixed
1920×1080 virtual canvas (`--frame-w`/`--frame-h` tokens). At render time,
`js/engine.js`'s `fit()` computes a single uniform scale factor
(`min(window.innerWidth/1920, window.innerHeight/1080)`) and applies it via
`transform: translate(...) scale(...)` on the `#viewport` element — never by
resizing individual template elements or using responsive units. Templates are
explicitly forbidden (`CLAUDE.md`) from using `vw`/`vh`/`%`-of-window units.

## Consequences
- A template author copies literal px values from Figma with no unit
  conversion or responsive-design reasoning required — the "exact px" rule in
  `_CONTRACT.md` is enforceable by inspection.
- The dashboard's live thumbnails (`js/dashboard.js`) and the export capture
  surface (`export.html`) both reuse the same fixed-canvas assumption:
  thumbnails scale the same stage down via `transform: scale()`; the export
  surface renders at native 1:1 (no scale) so `getBoundingClientRect()` yields
  exact slide-space pixel coordinates directly, with no unscaling math needed
  in the DOM walker (see ADR 0005).
- Any template that violates the "no responsive units" rule breaks silently
  under scaling (it will render correctly at 1920×1080 native testing but drift
  at other window sizes) — there is no automated check for this (see
  `docs/ROADMAP.md`).

## Benefits
- One rendering model serves three different consumers (full-screen viewer,
  small dashboard card, headless export capture) with no per-consumer layout
  logic.
- Figma fidelity is mechanical, not interpretive — reduces a whole class of
  "close enough" layout drift between design and implementation.

## Trade-offs
- Not responsive in the conventional sense (no reflow at different aspect
  ratios) — by design, since brand fidelity to an exact Figma frame is a higher
  priority here than adaptive layout. This would be the wrong choice for a
  general-purpose web app; it is treated as correct for this project because
  presentations are inherently fixed-aspect-ratio artifacts.

## Confidence
**High.** The 1920×1080 fixed-canvas rule and the "never use viewport units"
constraint are both explicitly documented (`CLAUDE.md` → "Scaling" gotcha,
`_CONTRACT.md`). The specific claim that this choice is *why* the dashboard
thumbnail and export-capture code paths could reuse the same `buildStage()`
function without per-context math is **inferred** from reading
`js/render.js`/`js/dashboard.js`/`export.html` together, not stated outright
anywhere.
