// product/ui/editor-ai/index.js
// =============================================================================
// Public entry for the AI panel. editor.js constructs an aiInterface and calls
// createAiPanel(iface); everything the panel needs from the host goes through
// that object — the module never reaches into editor.js internals.
//
// aiInterface shape (all functions; live values are getters because the host
// reassigns its `slides` / `selection` / `scene` bindings):
//   getSlides()        → slide[]            (live array reference)
//   getCurrentIndex()  → number
//   getSelection()     → selection | null
//   getFieldDefs()     → fieldDef[]
//   getScene()         → sceneGraph | null
//   getBusy()          → boolean
//   getCanvas()        → HTMLElement        (the #ed-canvas node)
//   presentationId     → string
//   getPresentation()  → { id, updatedAt }  (record fields)
//   patchPresentation(fields) → Promise<record>  (PATCH + local record refresh;
//                        no busy/save hooks, caller handles rollback. Unused
//                        by the panel today — the deck-memory feature that
//                        needed it was removed; kept on the interface because
//                        editor.js still exposes it.)
//   setBusy(b), beginSave(), endSave(ok, msg?)
//   writeField(slide, field, value, prevValue, opts) → Promise<boolean>
//   writeStyle(slide, nextMap, prevMap) → Promise<void>
//   pushHistory(entry), renderCanvas(), paintThumb(i),
//   adoptSlides(presentation, index), selectSlide(i),
//   styleKeyFor(origin) → string | null
//   deepEqual(a, b) → boolean
//   errText(err, fallback) → string
//   clearSelection()   → void
//   highlightField(field, on) → void
// =============================================================================
import { initContext } from "./context.js";
import { initConversation, renderAiScope, stateFor } from "./conversation.js";
import { initPanel, renderAiPanel } from "./panel.js";
import { initComposer, sendAi, wireAiWorkspace, focusComposer, syncSendState, slideBusy } from "./composer.js";
import { applyCanvasPreview, clearCanvasPreviewDom, hasPreview } from "./proposals.js";
import { runDeckReview, notifyDeckChanged } from "./review.js";
import { initMemory, refreshMemory } from "./memory.js";

// Call once per page load. It wires DOM listeners (composer, panel, workspace)
// that are never torn down, so a second call would double-register them.
export function createAiPanel(iface) {
  initContext(iface);
  initConversation();
  initPanel();
  initComposer();
  wireAiWorkspace();
  const toggleMemory = initMemory(document.getElementById("ai-memory-host"));
  return {
    toggleMemory,
    refreshMemory,
    renderPanel: renderAiPanel,
    renderScope: renderAiScope,
    stateFor,
    sendAi,
    runDeckReview,
    notifyDeckChanged,
    applyCanvasPreview,
    clearCanvasPreview: clearCanvasPreviewDom,
    hasPreview,
    focusComposer,
    syncSendState,
    slideBusy,
  };
}
