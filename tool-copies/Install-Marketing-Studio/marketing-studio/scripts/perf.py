#!/usr/bin/env python3
"""Enter the numbers a post earned, typed in by hand from the network's own analytics.

Usage:
    python3 scripts/perf.py <id> --impressions N [--reactions N] [--comments N] [--reposts N] [--saves N]
                            [--clicks N] [--workspace brands/me]

--impressions is required; a number left out is recorded as empty, not as 0. Entering again replaces the
earlier numbers. Prints "performance <id> entered". Any piece takes numbers, but learn.py counts only
published posts, so a piece that is not one also gets "perf: <id> is <status>, learn counts published posts
only" on stderr; the numbers are still saved and the exit is 0. Exit 2 when the piece does not exist.
Nothing here contacts a social network.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.lib import content  # noqa: E402

COUNTS = ("impressions", "reactions", "comments", "reposts", "saves", "clicks")


def enter(workspace: Path, id: str, impressions: int, now: str | None = None, **counts: int | None) -> dict:
    """Record the performance on the piece, bump `updated` and save; return what was recorded."""
    unexpected = sorted(set(counts) - set(COUNTS))
    if unexpected:
        raise ValueError("unknown count: %s" % ", ".join(unexpected))
    path = content.object_path(Path(workspace), id)
    if not path.is_file():
        raise FileNotFoundError("no such piece: %s" % id)
    now = now or content.now_iso()
    meta, body = content.load(path)
    performance = {"impressions": impressions}
    for key in COUNTS[1:]:
        performance[key] = counts.get(key)
    performance["entered_at"] = now
    meta["performance"] = performance
    meta["updated"] = now
    content.save(path, meta, body)
    return performance


def _count(text: str) -> int:
    value = int(text)
    if value < 0:
        raise argparse.ArgumentTypeError("%r is below 0" % text)
    return value


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("id")
    parser.add_argument("--impressions", type=_count, required=True)
    for key in COUNTS[1:]:
        parser.add_argument("--" + key, type=_count, default=None)
    parser.add_argument("--workspace", default="brands/me")
    args = parser.parse_args(argv)
    counts = {key: getattr(args, key) for key in COUNTS[1:]}
    try:
        enter(Path(args.workspace), args.id, args.impressions, **counts)
    except FileNotFoundError as error:
        print(error, file=sys.stderr)
        return 2
    print("performance %s entered" % args.id)
    meta, _ = content.load(content.object_path(Path(args.workspace), args.id))
    if meta.get("type") != "post" or meta.get("status") != "published":
        print("perf: %s is %s, learn counts published posts only" % (args.id, meta.get("status")), file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
