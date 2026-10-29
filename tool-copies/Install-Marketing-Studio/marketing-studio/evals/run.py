#!/usr/bin/env python3
"""Quality harness runner for the author's Marketing Studio.

Runs the deterministic rules on every fixture in evals/fixtures/drafts/ and
compares what they report with evals/fixtures/expectations.json. It proves the
harness catches each planted defect and passes every clean fixture, before any
skill relies on it. Judge cases that need an LLM are listed as PENDING-LLM.

Usage:
    python3 evals/run.py       # run every deterministic check
    python3 evals/run.py -v    # also print every message a fixture produced

Exit code 0 means every expectation was met; 1 means a defect slipped through
or a clean fixture was wrongly flagged.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent))

from evals.lib import checks  # noqa: E402
from scripts.lib import campaigns, content, frontmatter  # noqa: E402

WORKSPACE = ROOT.parent / "brands" / "me"
DRAFTS = ROOT / "fixtures" / "drafts"
EXPECT = ROOT / "fixtures" / "expectations.json"
WORKSPACE_FILES = ("brand-profile.md", "voice.md", "content-rules.md", "nagarro-overlay.md", "kit.md", "playbook.md")


def workspace_results():
    """L0-lite: yield (ok, label, notes, messages) for each workspace file and each campaign."""
    for name in WORKSPACE_FILES:
        yield (WORKSPACE / name).is_file(), "workspace has %s" % name, [], []
    for slug in campaigns.list_slugs(WORKSPACE):
        try:
            campaigns.load(WORKSPACE, slug)
            ok = True
        except OSError:
            ok = False
        yield ok, "campaign %s loads" % slug, [], []


def fixture_result(name: str, fails: list):
    """Run every rule on one fixture and return (ok, label, notes, messages)."""
    path = DRAFTS / name
    if not path.is_file():
        return False, name, ["fixture file missing"], []
    meta, body = frontmatter.parse(path.read_text(encoding="utf-8"))
    campaign = None
    if meta.get("campaign"):
        try:
            campaign = campaigns.load(WORKSPACE, meta["campaign"])
        except FileNotFoundError as error:
            return False, name, [str(error)], []
    messages = content.validate(meta) + checks.run_all(meta, body, campaign)
    unexpected = [m for m in messages if not any(m.startswith(prefix) for prefix in fails)]
    missing = [prefix for prefix in fails if not any(m.startswith(prefix) for m in messages)]
    notes = ["unexpected: %s" % m for m in unexpected] + ["missing: nothing starts with '%s'" % p for p in missing]
    return not notes, name, notes, messages


def main() -> int:
    verbose = "-v" in sys.argv[1:]
    fixtures = json.loads(EXPECT.read_text(encoding="utf-8"))["fixtures"]

    results = list(workspace_results())
    results += [fixture_result(name, expect["fails"]) for name, expect in fixtures.items()]
    pending = [(name, case) for name, expect in fixtures.items() for case in expect.get("llm_pending", [])]

    print("=" * 64)
    print("MARKETING STUDIO EVAL: deterministic layers (workspace, schema, rules)")
    print("=" * 64)
    for ok, label, notes, messages in results:
        print("  [%s] %s" % ("PASS" if ok else "FAIL", label))
        for note in notes:
            print("        %s" % note)
        if verbose:
            for message in messages:
                print("        - %s" % message)
    if pending:
        print("\nLLM-as-judge cases (wire when the judged skill exists):")
        for name, case in pending:
            print("  [PENDING-LLM] %s :: %s" % (name, case))

    failed = sum(1 for ok, *_ in results if not ok)
    print("-" * 64)
    print("Deterministic: %d/%d fixtures met; %d LLM cases pending" % (len(results) - failed, len(results), len(pending)))
    print("RESULT: GREEN" if failed == 0 else "RESULT: RED (%d mismatch)" % failed)
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
