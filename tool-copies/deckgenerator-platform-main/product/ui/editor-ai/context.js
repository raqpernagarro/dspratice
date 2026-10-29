// product/ui/editor-ai/context.js
// =============================================================================
// Shared context for the editor-ai module. Populated once by createAiPanel()
// (index.js) before any other function in this module runs. Leaf modules
// import each other directly wherever that doesn't create a cycle (e.g.
// proposals.js importing from thinking.js). `ctx` exists for the few things
// that WOULD create a cycle if imported directly: the iface passed in by
// editor.js, the panel's DOM refs, and callbacks that host-still-resident
// functions (renderAiPanel, renderAiScope, sendAi, composer) register late so
// early-loaded modules can call them without importing the module that
// defines them.
// =============================================================================

const $ = (id) => document.getElementById(id);

export const ctx = {
  /** The aiInterface passed in by editor.js — see index.js for the shape. */
  iface: null,

  // Panel DOM. These ids live in editor.html and belong to the AI panel, so
  // the module owns their lookup; the host never touches them.
  dom: null,

  /** Set by panel.js at init: () => void. Everything that needs a re-render
   *  calls ctx.renderAiPanel() instead of importing panel.js. */
  renderAiPanel: () => {},
  /** Set by conversation.js at init. */
  renderAiScope: () => {},
  /** Set by composer.js at init. */
  sendAi: () => {},
  /** Set by composer.js at init: { draft(text) }. */
  composer: null,
  /** Set by panel.js at init: () => void. Wholesale rebuild of the cross-
   *  slide task strip — called when the set of working items changes (an ask
   *  started or settled), never from the 1s ticker (see patchTaskStripElapsed). */
  renderTaskStrip: () => {},
  /** Set by panel.js at init: () => void. Ticker-only patch of the task
   *  strip's existing rows' elapsed text, in place — used by thinking.js's
   *  tickLive instead of renderTaskStrip so a focused row (e.g. its Cancel
   *  button) survives every tick instead of being destroyed by a rebuild. */
  patchTaskStripElapsed: () => {},
};

export function initContext(iface) {
  ctx.iface = iface;
  ctx.dom = {
    aiScopeEl: $("ai-scope"),
    aiScopeText: $("ai-scope-text"),
    aiActivity: $("ai-activity"),
    aiScroll: $("ai-scroll"),
    aiJump: $("ai-jump-latest"),
    aiHealthBody: $("ai-health-body"),
    aiSlidePicker: $("ai-slide-picker"),
    aiSlidePickerLabel: $("ai-slide-picker-label"),
    aiSlideMenu: $("ai-slide-menu"),
    aiStatus: $("ai-status"),
    aiComposer: $("ai-composer"),
    aiInput: $("ai-input"),
    aiSend: $("ai-send"),
    aiClearBtn: $("ai-clear-btn"),
    aiTasks: $("ai-tasks"),
    // The Pending Changes queue mount — renderPendingQueue() (proposals.js)
    // rebuilds its entire content on every change, so there's nothing else
    // to look up here (its old static label/accept/discard ids no longer
    // exist in editor.html).
    reviewBar: $("ed-review"),
  };
}
