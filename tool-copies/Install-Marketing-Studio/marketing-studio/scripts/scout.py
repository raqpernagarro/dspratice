#!/usr/bin/env python3
"""Scout the open web for dated topic signals and write them into the workspace.

Usage:
    python3 scripts/scout.py [--workspace brands/me] [--max-age 7]

Reads <workspace>/sources.md (the feeds, the Hacker News queries and the keywords per
pillar), fetches every source with a 10 second timeout, and writes
<workspace>/research/signals-<YYYY-MM-DD>.md: the signals no older than --max-age days,
newest first, each tagged with the pillars its words touch, then the sources that failed.

Prints one line: `signals <path> <n> signals from <s> sources (<f> failed)`.
Exit 0 when at least one source answered, 1 when every source failed, 2 when sources.md is
missing or malformed. Only read-only GET requests are made; nothing is posted anywhere.
"""
from __future__ import annotations

import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.lib import scout  # noqa: E402


def run(workspace: Path, max_age_days: int = 7, fetch=None, now: datetime | None = None) -> tuple[Path, int, int, int]:
    """Scout the sources of `workspace`; returns (signals file, signals, sources, failed sources)."""
    workspace = Path(workspace)
    sources = scout.load_sources(workspace / "sources.md")
    now = now or datetime.now(timezone.utc)
    signals, failures = scout.scout(sources, fetch or scout.fetch_url, now, max_age_days)
    path = workspace / "research" / scout.signals_filename(now)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(scout.signals_markdown(signals, failures, now), encoding="utf-8")
    return path, len(signals), scout.source_count(sources), scout.failed_count(failures)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--workspace", default="brands/me")
    parser.add_argument("--max-age", type=int, default=7, metavar="DAYS", help="drop signals older than this many days")
    args = parser.parse_args(argv)
    try:
        path, count, total, failed = run(Path(args.workspace), args.max_age)
    except FileNotFoundError as error:
        print("scout: no such file: %s" % error.filename, file=sys.stderr)
        return 2
    except (OSError, ValueError) as error:
        print("scout: %s" % error, file=sys.stderr)
        return 2
    print("signals %s %d signals from %d sources (%d failed)" % (path, count, total, failed))
    return 1 if total and failed == total else 0


if __name__ == "__main__":
    sys.exit(main())
