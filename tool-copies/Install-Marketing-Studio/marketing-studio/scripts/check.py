#!/usr/bin/env python3
"""Check Content Objects against the schema and the author's deterministic text rules.

Usage:
    python3 scripts/check.py <id> [<id> ...] [--workspace brands/me]
    python3 scripts/check.py --all [--workspace brands/me]

Prints "ok <id>" for a clean object and "<id>: <problem>" for each problem. With
--all the last line is "checked <n> objects, <m> with problems". The exit code is
1 when any object has a problem.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from evals.lib import checks  # noqa: E402
from scripts.lib import campaigns, content  # noqa: E402


def check_object(workspace: Path, meta: dict, body: str) -> list[str]:
    """Every problem with one object; an unknown campaign is the only problem reported."""
    campaign = None
    slug = meta.get("campaign")
    if slug:
        try:
            campaign = campaigns.load(workspace, slug)
        except FileNotFoundError as error:
            return [str(error)]
    return content.validate(meta, workspace) + checks.run_all(meta, body, campaign)


def _problems_for(workspace: Path, id: str) -> list[str]:
    path = content.object_path(workspace, id)
    if not path.is_file():
        return ["no such object"]
    meta, body = content.load(path)
    return check_object(workspace, meta, body)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("ids", nargs="*", metavar="id")
    parser.add_argument("--all", action="store_true", help="check every object in the workspace")
    parser.add_argument("--workspace", default="brands/me")
    args = parser.parse_args(argv)
    if args.all == bool(args.ids):
        parser.error("give object ids or --all, not both or neither")
    workspace = Path(args.workspace)
    ids = [path.stem for path in content.list_objects(workspace)] if args.all else args.ids
    with_problems = 0
    for id in ids:
        problems = _problems_for(workspace, id)
        with_problems += bool(problems)
        if problems:
            for problem in problems:
                print("%s: %s" % (id, problem))
        else:
            print("ok %s" % id)
    if args.all:
        print("checked %d objects, %d with problems" % (len(ids), with_problems))
    return 1 if with_problems else 0


if __name__ == "__main__":
    sys.exit(main())
