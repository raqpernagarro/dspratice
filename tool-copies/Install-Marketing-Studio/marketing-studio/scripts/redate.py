#!/usr/bin/env python3
"""Move an idea or a post to another day, and change nothing else.

Usage:
    python3 scripts/redate.py <id> --date YYYY-MM-DD[THH:MM] [--workspace brands/me]

Only `scheduled_date` changes, and `updated` is set: the status, the score, the
brand-review flags, the TryPost link and every other field stay as they were. A day
alone keeps the time the piece already had, in Lisbon. With no date yet, a post takes
its surface's usual time, as new_post.py --date does, and an idea takes LinkedIn's time
(08:30), whatever its surfaces, as new_idea.py --date does. A day with a time sets that
time, in Lisbon. A published or archived piece is refused. Prints "redated <id> <scheduled_date>"; exits 2, writing
nothing, when the piece is missing or refused, the date is malformed or the result is
invalid.
"""
from __future__ import annotations

import argparse
import re
import sys
from datetime import date, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.lib import content, dates  # noqa: E402

REFUSED = ("published", "archived")
_DATE = re.compile(r"^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2}))?$")


def _time_of_day(meta: dict) -> str:
    """The time the piece keeps on its new day: its own, in Lisbon; with no date, a post's surface's usual time, an idea's LinkedIn's (08:30)."""
    current = meta.get("scheduled_date")
    if isinstance(current, str) and current:
        try:
            moment = datetime.fromisoformat(current)
        except ValueError:
            raise ValueError("scheduled_date: %r is not a date this script can read" % current) from None
        if moment.tzinfo is not None:
            moment = moment.astimezone(dates.LISBON)
        return moment.strftime("%H:%M")
    surface = "linkedin" if meta.get("type") == "idea" else meta.get("surface")
    if surface not in dates.POST_TIMES:
        raise ValueError("surface: %r has no usual time; give one as YYYY-MM-DDTHH:MM" % (surface,))
    return dates.POST_TIMES[surface]


def scheduled(meta: dict, value: str) -> str:
    """The new `scheduled_date` for `value` (YYYY-MM-DD or YYYY-MM-DDTHH:MM), as ISO 8601 in Lisbon."""
    match = _DATE.match(value.strip()) if isinstance(value, str) else None
    if not match:
        raise ValueError("date: %r must be YYYY-MM-DD or YYYY-MM-DDTHH:MM" % (value,))
    try:
        day = date.fromisoformat(match.group(1))
    except ValueError:
        raise ValueError("date: %r is not a real day" % value) from None
    if match.group(2) is None:
        hhmm = _time_of_day(meta)
    else:
        hour, minute = int(match.group(2)), int(match.group(3))
        if hour > 23 or minute > 59:
            raise ValueError("date: %r is not a real time" % value)
        hhmm = "%02d:%02d" % (hour, minute)
    return dates.iso(dates.lisbon(day, hhmm))


def redate(workspace: Path, id: str, value: str, now: str | None = None) -> str:
    """Set the piece's `scheduled_date` and `updated`, validate and save; return the new date. Nothing is written on a problem."""
    path = content.object_path(Path(workspace), id)
    if not path.is_file():
        raise FileNotFoundError("no such piece: %s" % id)
    meta, body = content.load(path)
    if meta.get("type") not in ("idea", "post"):
        raise ValueError("type: %r is neither an idea nor a post" % (meta.get("type"),))
    if meta.get("status") in REFUSED:
        raise ValueError("refused: the piece is %s" % meta["status"])
    meta["scheduled_date"] = scheduled(meta, value)
    meta["updated"] = now or content.now_iso()
    problems = content.validate(meta)
    if problems:
        raise ValueError("; ".join(problems))
    content.save(path, meta, body)
    return meta["scheduled_date"]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("id")
    parser.add_argument("--date", required=True, help="the new day, as YYYY-MM-DD, or a day and a time as YYYY-MM-DDTHH:MM (Lisbon)")
    parser.add_argument("--workspace", default="brands/me")
    args = parser.parse_args(argv)
    try:
        when = redate(Path(args.workspace), args.id, args.date)
    except FileNotFoundError as error:
        print(error, file=sys.stderr)
        return 2
    except ValueError as error:
        print("%s: %s" % (args.id, error), file=sys.stderr)
        return 2
    print("redated %s %s" % (args.id, when))
    return 0


if __name__ == "__main__":
    sys.exit(main())
