#!/usr/bin/env python3
"""Lay out a week of posts and check it against the cadence rules.

Usage:
    python3 scripts/plan.py [--monday YYYY-MM-DD] [--write] [--workspace brands/me]

The week runs Monday to Sunday and starts on --monday, which must be a Monday; by
default it is the first Monday after today, in Lisbon time. The plan fills every
network on every day: dated pieces keep their slot, a saved idea with a campaign
and a date takes a campaign slot on its surfaces (exempt from the pillar cap, as a
campaign post is), a campaign slot reserves a child slot on the other networks its
campaign lists, and a saved idea with a date and no campaign covers its surfaces.
On Tuesday and Thursday the Viva Engage column takes a child repurposed from the
day's LinkedIn piece; Viva Engage never takes a pillar slot and is not asked for
every day. What is still empty becomes pillar ideas to choose, each for the
networks its pillar is written for, so a day can take two or three. Long-form posts
of the week are listed beside the grid.

Prints the plan as Markdown, then one `problem: <text>` line for each cadence rule
the week breaks, then `plan <monday>: <n> slots, <m> ideas to choose, <k> to
repurpose`. Exits 1 when there are problems, 2 for a bad --monday, otherwise 0.
With --write the Markdown is also saved as <workspace>/plans/<monday>.md.
"""
from __future__ import annotations

import argparse
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.lib import campaigns, content, dates, planner  # noqa: E402


def next_monday(today: date) -> date:
    """The first Monday strictly after `today`."""
    return today + timedelta(days=7 - today.weekday())


def _load(workspace: Path) -> tuple[list[dict], dict[str, dict]]:
    """Every Content Object's frontmatter, and every campaign by slug."""
    objects = [content.load(path)[0] for path in content.list_objects(workspace)]
    found = {slug: campaigns.load(workspace, slug) for slug in campaigns.list_slugs(workspace)}
    return objects, found


def _week(workspace: Path, monday: date) -> tuple[dict, str, list[dict]]:
    objects, found = _load(Path(workspace))
    plan = planner.build_week(objects, found, monday)
    return plan, planner.plan_markdown(plan, objects), objects


def build(workspace: Path, monday: date) -> tuple[dict, str]:
    """The plan for the week starting on `monday`, and the Markdown that shows it."""
    plan, markdown, _ = _week(workspace, monday)
    return plan, markdown


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--monday", help="the first day of the week, as YYYY-MM-DD; default: the next Monday")
    parser.add_argument("--write", action="store_true", help="save the plan as plans/<monday>.md in the workspace")
    parser.add_argument("--workspace", default="brands/me")
    args = parser.parse_args(argv)
    workspace = Path(args.workspace)

    if args.monday is None:
        monday = next_monday(datetime.now(dates.LISBON).date())
    else:
        try:
            monday = date.fromisoformat(args.monday)
        except ValueError:
            print("--monday %r must be YYYY-MM-DD" % args.monday, file=sys.stderr)
            return 2
        if monday.weekday() != 0:
            print("--monday %s is a %s, not a Monday" % (args.monday, monday.strftime("%A")), file=sys.stderr)
            return 2

    plan, markdown, objects = _week(workspace, monday)
    problems = planner.check_week(plan, objects)
    if args.write:
        folder = workspace / "plans"
        folder.mkdir(parents=True, exist_ok=True)
        (folder / ("%s.md" % monday.isoformat())).write_text(markdown, encoding="utf-8")

    print(markdown, end="")
    for problem in problems:
        print("problem: %s" % problem)
    children = len(planner.to_repurpose(plan))
    print("plan %s: %d slots, %d ideas to choose, %d to repurpose" % (monday.isoformat(), len(plan["slots"]), len(plan["ideas"]), children))
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
