#!/usr/bin/env python3
"""Summarise the entered performance of the published posts and, on request, put it in the playbook.

Usage:
    python3 scripts/learn.py [--write] [--workspace brands/me]

Prints "learn <n> pieces, confidence <level>". With --write, the `## Data` section of the workspace's
playbook.md is replaced (or added after the first heading and its paragraph) and the rest of the file is
kept; the learn skill writes the sections that follow. With no entered performance it prints
"learn 0 pieces, nothing to write" and exits 1. Nothing here contacts a social network.
"""
from __future__ import annotations

import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.lib import content, learn  # noqa: E402


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--write", action="store_true", help="replace the Data section of the playbook")
    parser.add_argument("--workspace", default="brands/me")
    args = parser.parse_args(argv)
    workspace = Path(args.workspace)
    summary = learn.summarise([content.load(path)[0] for path in content.list_objects(workspace)])
    if not summary["count"]:
        print("learn 0 pieces, nothing to write")
        return 1
    if args.write:
        playbook = workspace / "playbook.md"
        text = playbook.read_text(encoding="utf-8") if playbook.is_file() else "# Playbook\n"
        section = learn.playbook_markdown(summary, datetime.now(timezone.utc))
        playbook.write_text(learn.merge_data_section(text, section), encoding="utf-8")
    print("learn %d pieces, confidence %s" % (summary["count"], summary["confidence"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
