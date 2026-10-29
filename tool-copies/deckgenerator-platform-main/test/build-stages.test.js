// test/build-stages.test.js
// =============================================================================
// The home page's build checklist: which rows are active, done or hidden for a
// progress frame. An import runs no drafting, so its drafting rows are hidden
// rather than ticked as if they had run.
// =============================================================================
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { stageStates, DRAFTING_STAGES } from "../product/ui/lib/build-stages.js";

describe("build stages", () => {
  test("a prompt build ticks every stage before the active one", () => {
    const s = stageStates({ stage: "choosing" });
    for (const k of ["understanding", "story", "drafting", "analyzing", "planning"]) assert.deepEqual(s[k], { active: false, done: true, hidden: false }, k);
    assert.deepEqual(s.choosing, { active: true, done: false, hidden: false });
    assert.deepEqual(s.writing, { active: false, done: false, hidden: false });
  });

  test("an import hides the drafting rows instead of ticking them", () => {
    const s = stageStates({ stage: "choosing" }, { imported: true });
    for (const k of DRAFTING_STAGES) assert.deepEqual(s[k], { active: false, done: false, hidden: true }, k);
    assert.equal(s.analyzing.done, true);
    assert.equal(s.choosing.active, true);
  });
});
