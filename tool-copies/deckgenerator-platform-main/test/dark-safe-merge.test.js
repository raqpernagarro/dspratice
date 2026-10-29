import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { mergeDarkSafe } from "../tools/lib/dark-safe-merge.mjs";

const existing = {
  generatedBy: "tools/audit-dark-mode.mjs", contrastFloor: 3, total: 3,
  safe: ["a/one", "a/two"], unsafe: [{ name: "a/three", reason: "low contrast" }],
};

test("a filtered run only touches the audited names", () => {
  const out = mergeDarkSafe(existing, {
    safe: ["a/three"], unsafe: [], audited: ["a/three"],
  });
  assert.deepEqual(out.safe, ["a/one", "a/three", "a/two"]); // sorted, three promoted
  assert.deepEqual(out.unsafe, []);
  assert.equal(out.total, 3);
});

test("a previously safe template demoted by a re-audit moves to unsafe", () => {
  const out = mergeDarkSafe(existing, {
    safe: [], unsafe: [{ name: "a/one", reason: "regressed" }], audited: ["a/one"],
  });
  assert.ok(!out.safe.includes("a/one"));
  assert.ok(out.unsafe.some((u) => u.name === "a/one"));
});

test("unaudited names are untouched", () => {
  const out = mergeDarkSafe(existing, { safe: [], unsafe: [], audited: [] });
  assert.deepEqual(out.safe, existing.safe);
});

// audit-dark-mode.mjs's --strict exit-code logic is CLI-level (it calls
// process.exit inside a top-level script, nothing to import and assert
// against directly) — this is a source assertion, matching the pattern used
// elsewhere in this repo for prompt caps etc: it doesn't run the CLI, it
// checks the source encodes the ruling now, and will fail loudly if a future
// edit reverts to "only --strict exits 1" (which used to also swallow
// unsafe results on a FULL run, the actual bug this fixed).
test("a full run exits 1 on unsafe regardless of --strict; a filtered run needs --strict", () => {
  const auditScript = fileURLToPath(new URL("../tools/audit-dark-mode.mjs", import.meta.url));
  const source = readFileSync(auditScript, "utf8");
  assert.match(source, /const isFullRun = auditPool === null;/);
  assert.match(
    source,
    /if \(unsafe\.length && \(isFullRun \|\| process\.argv\.includes\("--strict"\)\)\) process\.exit\(1\);/
  );
});
