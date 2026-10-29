// tools/lib/baseline.mjs
// =============================================================================
// Known findings, so an audit can fail on NEW ones without failing on old ones.
//
// The deck audits found 25 real problems on their first run. Wiring them into
// CI as-is would make every build red from day one, and a check that is always
// red is a check someone turns off — which is exactly how the product ended up
// with 190 findings nobody had seen.
//
// So each audit records what it currently finds. After that, CI fails only when
// something NEW appears. Fixing a known finding is rewarded too: the audit says
// the baseline is stale and should be re-recorded, so the debt cannot quietly
// grow back into the space a fix freed up.
//
//   node tools/audit-decks.mjs --record-baseline   # accept what is there today
//   node tools/audit-decks.mjs --ci                # fail on anything new
// =============================================================================
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const dir = fileURLToPath(new URL("../baselines/", import.meta.url));

const pathFor = (name) => `${dir}${name}.json`;

/** A finding's identity. Deliberately excludes measurements — a gap that grows
 *  from 38px to 44px is the same finding, not a new one, and treating it as new
 *  would make the baseline churn on every layout tweak. */
export const fingerprint = (f) =>
  `${f.kind}|${f.deck}|${f.slide}|${String(f.detail).replace(/-?\d+(\.\d+)?/g, "#")}`;

export function readBaseline(name) {
  const file = pathFor(name);
  if (!existsSync(file)) return null;
  try {
    return new Set(JSON.parse(readFileSync(file, "utf8")).findings || []);
  } catch {
    return null;
  }
}

export function writeBaseline(name, findings) {
  mkdirSync(dirname(pathFor(name)), { recursive: true });
  writeFileSync(pathFor(name), JSON.stringify({
    tool: name,
    note: "Known findings. Re-record with --record-baseline after fixing some.",
    findings: [...new Set(findings.map(fingerprint))].sort(),
  }, null, 2) + "\n");
}

/**
 * Decides the exit code, and says why.
 *
 * @param {string} name      the audit's baseline file name
 * @param {Array} findings   everything found this run
 * @param {{record: boolean, ci: boolean}} mode
 * @returns {number} process exit code
 */
export function reconcile(name, findings, { record = false, ci = false } = {}) {
  if (record) {
    writeBaseline(name, findings);
    console.log(`\nBaseline recorded: ${new Set(findings.map(fingerprint)).size} known findings.`);
    return 0;
  }

  const known = readBaseline(name);
  if (!known) {
    if (ci) {
      console.error(`\nNo baseline for ${name}. Run with --record-baseline and commit it.`);
      return 1;
    }
    return findings.length ? 1 : 0;
  }

  const seen = new Set(findings.map(fingerprint));
  const fresh = findings.filter((f) => !known.has(fingerprint(f)));
  const fixed = [...known].filter((k) => !seen.has(k));

  if (fresh.length) {
    console.log(`\n${fresh.length} NEW finding(s) since the baseline:`);
    for (const f of fresh) console.log(`  ${f.deck} s${f.slide}  ${f.kind}: ${f.detail}`);
  }
  if (fixed.length) {
    console.log(`\n${fixed.length} baseline finding(s) no longer occur — re-record so they cannot come back.`);
  }
  if (!fresh.length && !fixed.length) console.log(`\nNo change against the baseline (${known.size} known).`);

  // Only NEW findings fail. A fix that makes the baseline stale is reported,
  // not punished — nobody should have to choose between fixing and a green build.
  return ci && fresh.length ? 1 : 0;
}
