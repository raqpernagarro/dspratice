#!/usr/bin/env python3
"""Record the result of a brand-review run on a Content Object, or clear it.

Usage:
    python3 scripts/review.py <id> [--high TEXT]... [--medium TEXT]... [--low TEXT]... [--workspace brands/me]
    python3 scripts/review.py <id> --clear [--workspace brands/me]

Each run replaces the whole flag set, so pass every flag of the latest review. A run
with no flags records a clean review. The option names the severity: a flag typed with
its own "High:", "Medium:" or "Low:" in front (any case) loses it, so `--high "High: x"`
is stored once as "High: x". Any High flag blocks `mark.py <id> approved`
until a later review has none (or `--clear` forgets the review). Prints
"review <id> high=N medium=N low=N blocked|clear", where blocked means at least one
High flag, or "review <id> cleared". Exits 2 when the piece is missing or invalid.

A long-form piece (an article, an essay or a note) has no rubric score, so the review is its gate:
a review with no High flag on a draft that check.py passes moves it to in-review, and a High flag
moves an in-review one back to draft. Any other status is left alone, and so is every other post,
which the score gates (score.py). When the status changes it also prints "status <id> <new>".
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts import check  # noqa: E402
from scripts.lib import content  # noqa: E402

# The formats with no rubric score: the review gates them instead (posts are gated by score.py).
LONG_FORM_FORMATS = ("article", "essay", "note")

# A severity typed into the flag's own text ("High: body line 1: x"); the option already names it.
TYPED_SEVERITY = re.compile(r"^(?:(?:%s)\s*:\s*)+" % "|".join(content.SEVERITIES), re.IGNORECASE)


def flag_text(text: str) -> str:
    """The flag as typed, trimmed, without a severity prefix of its own."""
    return TYPED_SEVERITY.sub("", text.strip()).strip()


def _load(workspace: Path, id: str) -> tuple[Path, dict, str]:
    path = content.object_path(Path(workspace), id)
    if not path.is_file():
        raise FileNotFoundError("no such object: %s" % id)
    meta, body = content.load(path)
    problems = content.validate(meta)
    if problems:
        raise ValueError("; ".join(problems))
    return path, meta, body


def long_form_status(workspace: Path, meta: dict, body: str) -> str | None:
    """The status the long-form gate moves a reviewed piece to, or None when it stays: a draft with no High flag whose
    check.py is clean goes to in-review, an in-review piece with a High flag goes back to draft."""
    if meta.get("type") != "post" or meta.get("format") not in LONG_FORM_FORMATS:
        return None
    blocked = meta["review"]["high"] > 0
    if blocked and meta["status"] == "in-review":
        return "draft"
    if not blocked and meta["status"] == "draft" and not check.check_object(Path(workspace), meta, body):
        return "in-review"
    return None


def apply(workspace: Path, id: str, flags: list[str], now: str | None = None) -> tuple[dict, bool, str | None]:
    """Record the flags of a review run, apply the long-form gate and save; return the review, whether a High flag
    blocks approval, and the new status (None when it stays)."""
    path, meta, body = _load(workspace, id)
    review = content.set_review(meta, now or content.now_iso(), flags)
    new_status = long_form_status(workspace, meta, body)
    if new_status:
        meta["status"] = new_status
    content.save(path, meta, body)
    return review, review["high"] > 0, new_status


def clear(workspace: Path, id: str, now: str | None = None) -> None:
    """Forget the recorded review of the object and save."""
    path, meta, body = _load(workspace, id)
    content.clear_review(meta, now or content.now_iso())
    content.save(path, meta, body)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("id")
    parser.add_argument("--high", action="append", default=[], metavar="TEXT", help="a High flag; repeat for more")
    parser.add_argument("--medium", action="append", default=[], metavar="TEXT", help="a Medium flag; repeat for more")
    parser.add_argument("--low", action="append", default=[], metavar="TEXT", help="a Low flag; repeat for more")
    parser.add_argument("--clear", action="store_true", help="forget the recorded review")
    parser.add_argument("--workspace", default="brands/me")
    args = parser.parse_args(argv)
    texts = {"High": args.high, "Medium": args.medium, "Low": args.low}
    if args.clear and any(texts.values()):
        parser.error("--clear cannot be combined with --high, --medium or --low")
    if any(not flag_text(text) for group in texts.values() for text in group):
        parser.error("a flag needs some text")
    flags = ["%s: %s" % (severity, flag_text(text)) for severity in content.SEVERITIES for text in texts[severity]]
    try:
        if args.clear:
            clear(Path(args.workspace), args.id)
        else:
            review, blocked, new_status = apply(Path(args.workspace), args.id, flags)
    except (FileNotFoundError, ValueError) as error:
        print("%s: %s" % (args.id, error))
        return 2
    if args.clear:
        print("review %s cleared" % args.id)
    else:
        print("review %s high=%d medium=%d low=%d %s" % (args.id, review["high"], review["medium"], review["low"], "blocked" if blocked else "clear"))
        if new_status:
            print("status %s %s" % (args.id, new_status))
    return 0


if __name__ == "__main__":
    sys.exit(main())
