// Retired templates (replacedBy) render for old decks but are never offered.
import { test } from "node:test";
import assert from "node:assert/strict";
import { allTemplates } from "../js/templates/index.js";
import { liveTemplates, isLive } from "../product/domain/live-templates.js";
import { shortlistFor } from "../product/domain/template-scoring.js";

const retired = allTemplates.filter((t) => t.replacedBy);

test("there are retired templates, and they are still registered", () => {
  assert.ok(retired.length > 0);
  assert.ok(retired.some((t) => t.name === "portfolio/grid-14"));
});

test("the live list is the registry minus the retired ones", () => {
  assert.equal(liveTemplates.length, allTemplates.length - retired.length);
  assert.ok(liveTemplates.every(isLive));
});

test("every replacedBy points at a live template", () => {
  const live = new Set(liveTemplates.map((t) => t.name));
  for (const t of retired) assert.ok(live.has(t.replacedBy), `${t.name} → ${t.replacedBy}`);
});

test("the layout chooser never shortlists a retired template", () => {
  const sigs = [
    { shape: "single", role: "closing", items: 1, chars: 10 },
    { shape: "grid", role: "brief", items: 4, chars: 200 },
    { shape: "single", role: "divider", items: 1, chars: 8 },
  ];
  for (const sig of sigs) {
    const names = shortlistFor(sig, { limit: 400 }).map((t) => t.name ?? t.template?.name ?? t);
    for (const t of retired) assert.ok(!names.includes(t.name), `${t.name} was shortlisted`);
  }
});
