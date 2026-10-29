// product/ui/lib/build-stages.js
// =============================================================================
// Which rows of the home page's build checklist are active, done or hidden for
// one `progress` frame. Pure, so it is tested without a browser.
// =============================================================================

/** Stages in the order the server moves through them (the `progress` shape on
 *  the generation record). "done" has no row of its own — the checklist is
 *  hidden the moment the build finishes. */
export const BUILD_STAGES = ["understanding", "story", "drafting", "analyzing", "planning", "choosing", "writing", "voice", "reviewing", "assembling", "done"];

/** The prompt path's drafting stages. An import never runs them. */
export const DRAFTING_STAGES = ["understanding", "story", "drafting"];

/**
 * @param {{stage?: string}} progress
 * @param {{imported?: boolean}} [opts] an import hides the drafting rows
 *   rather than ticking them as done: nothing was drafted.
 * @returns {Record<string, {active: boolean, done: boolean, hidden: boolean}>}
 */
export function stageStates(progress, { imported = false } = {}) {
  const current = BUILD_STAGES.indexOf(progress?.stage);
  const out = {};
  BUILD_STAGES.forEach((stage, idx) => {
    if (stage === "done") return;
    const hidden = imported && DRAFTING_STAGES.includes(stage);
    out[stage] = { active: !hidden && idx === current, done: !hidden && current >= 0 && idx < current, hidden };
  });
  return out;
}
