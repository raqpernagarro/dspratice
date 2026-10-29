// =============================================================================
// Shared slide renderer — builds a 1920×1080 <section.stage> from a slide.
// Used by the viewer (engine.js) and the dashboard thumbnails (dashboard.js).
// =============================================================================
import { getTemplate, installTemplateStyles } from "./templates/index.js";
import { Chrome, esc } from "./components.js";
import { applyStyleOverrides } from "./style-overrides.js";

installTemplateStyles();

/**
 * Build a stage element for one slide.
 * @param {object} slide     - a slide entry from a deck
 * @param {object} deckMeta  - the owning deck's meta (footer defaults, etc.)
 */
export function buildStage(slide, deckMeta = {}) {
  const tpl = getTemplate(slide.template);
  const stage = document.createElement("section");
  stage.className = "stage";
  stage.dataset.theme = slide.theme || tpl.theme || "light";
  stage.dataset.template = tpl.name;

  // Chrome (logo + footer) is painted AFTER the template content so it sits on
  // top of full-bleed imagery. A slide or template may opt out with chrome:false.
  const useChrome = slide.chrome ?? tpl.chrome ?? true;
  const content = tpl.render(slide, { deck: deckMeta, esc });
  stage.innerHTML = content + (useChrome ? Chrome(slide, deckMeta) : "");

  // Templates write asset paths as SITE-ROOT-RELATIVE strings, e.g.
  // "assets/figma/39/<hash>.svg" — correct only when the browser resolves
  // it against "/", which is true for the pages this function was written
  // for (engine.js's deck.html, dashboard.js's index.html: both served from
  // the site root). Product's own pages — editor.html, templates.html,
  // present.html, presentations.html — live under /product/ui/, so the
  // exact same relative string resolved against THEIR url instead, landing
  // on /product/ui/assets/... and 404ing: broken image icons in the Swap
  // Template picker, applied templates, Present mode, and the Library grid,
  // everywhere this one shared renderer is the thing doing the drawing.
  // Rewriting bare-relative <img src> to be root-absolute here fixes every
  // caller uniformly and changes nothing for the callers that were already
  // correct (prefixing "/" onto a path already resolving against "/" is a
  // no-op) — the "don't fork rendering behaviour" principle this function
  // exists for, applied to a genuine cross-cutting bug rather than worked
  // around per page.
  for (const img of stage.querySelectorAll("img")) {
    const src = img.getAttribute("src");
    if (src && !/^(\/|https?:|data:)/i.test(src)) img.setAttribute("src", `/${src}`);
  }

  // Per-element visual edits (font size/weight/style/color/alignment and
  // free movement), applied on top of whatever the template rendered. A
  // slide without overrides — every static deck in js/decks/ — is untouched,
  // so this changes no existing output. Doing it HERE, in the one shared
  // renderer, is what makes the editor canvas, thumbnails, Present mode and
  // the PPTX/PDF export capture all agree without any of them knowing that
  // per-element styling exists. See js/style-overrides.js.
  if (slide.styleOverrides) applyStyleOverrides(stage, slide, slide.styleOverrides);

  return stage;
}
