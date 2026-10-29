#!/usr/bin/env python3
"""Create an idea Content Object from the command line.

Usage:
    python3 scripts/new_idea.py <id> --title TITLE --mode personal|nagarro
        [--pillar N] [--campaign SLUG] [--source URL ...] [--surface NAME ...]
        [--surfaces NAME,NAME] [--date YYYY-MM-DD] [--reactive]
        [--body-file PATH] [--force] [--workspace brands/me]

The body comes from --body-file, or from stdin when that is not given, and an
empty body is refused. An existing idea is left alone unless --force is given;
with --force it keeps its TryPost link, status, posted date and creation date,
and its slot on the plan: its date, surfaces, reactive flag and campaign stay
unless --date, --surfaces or --surface, --reactive or --campaign is given, and a
flag given wins. The score is dropped, so score the idea again. No flag clears a
date, the reactive flag or a campaign: move a date with scripts/redate.py.

--date gives the idea a day on the plan: it is stored as the usual LinkedIn
posting time (Lisbon) on that day. --reactive marks an idea that keeps its date
and needs an evergreen fallback. --surfaces takes the networks as one
comma-separated list and replaces the default three; --surface adds to it.
"""
from __future__ import annotations

import argparse
import datetime
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.lib import content, dates, objects  # noqa: E402


def _scheduled(value: str) -> str:
    """The scheduled_date for a YYYY-MM-DD day, at the usual LinkedIn posting time in Lisbon."""
    try:
        day = datetime.date.fromisoformat(value)
    except ValueError:
        raise ValueError("date: %r must be YYYY-MM-DD" % value) from None
    return dates.iso(dates.lisbon(day, dates.POST_TIMES["linkedin"]))


def _surface_list(listed: str | None, repeated: list[str] | None) -> list[str] | None:
    """The surfaces asked for: the comma-separated list first, then each --surface, without repeats; None when neither was given."""
    names = [name.strip() for name in (listed or "").split(",") if name.strip()] + list(repeated or [])
    return list(dict.fromkeys(names)) or None


def create(
    workspace: Path,
    id: str,
    title: str,
    mode: str,
    pillar: int | None,
    body: str,
    campaign: str | None = None,
    sources: list[str] = (),
    surfaces: list[str] | None = None,
    force: bool = False,
    now: str | None = None,
    date: str | None = None,
    reactive: bool = False,
) -> Path:
    now = now or content.now_iso()
    meta = content.new_idea_meta(id, title, mode, pillar, now, surfaces)
    meta["campaign"] = campaign
    meta["sources"] = list(sources)
    if date:
        meta["scheduled_date"] = _scheduled(date)
    if reactive:
        meta["reactive"] = True
    if force:
        _keep_slot(content.object_path(Path(workspace), id), meta, date=date, surfaces=surfaces, reactive=reactive, campaign=campaign)
    return objects.write_new(Path(workspace), id, meta, body, force, now)


def _keep_slot(path: Path, meta: dict, **given) -> None:
    """On --force, the idea being saved again keeps its slot on the plan: each of scheduled_date, surfaces, reactive and
    campaign that the existing idea has and whose flag was not given. The score is not carried, so it is dropped."""
    if not path.exists():
        return
    existing, _ = content.load(path)
    if existing.get("type") != "idea":
        return
    for key, flag in (("scheduled_date", "date"), ("surfaces", "surfaces"), ("reactive", "reactive"), ("campaign", "campaign")):
        if not given[flag] and key in existing:
            meta[key] = existing[key]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("id")
    parser.add_argument("--title", required=True, help="the idea's title")
    parser.add_argument("--mode", required=True, choices=content.MODES)
    parser.add_argument("--pillar", type=int, help="the content pillar number")
    parser.add_argument("--campaign", help="the campaign slug")
    parser.add_argument("--source", action="append", default=[], help="a source URL; repeat for more")
    parser.add_argument("--surface", action="append", choices=content.SURFACES, help="a surface the idea could become; repeat for more")
    parser.add_argument("--surfaces", help="the surfaces the idea could become, comma-separated, like linkedin,x; replaces the default three")
    parser.add_argument("--date", help="the day on the plan, as YYYY-MM-DD")
    parser.add_argument("--reactive", action="store_true", help="the idea keeps its date and needs an evergreen fallback")
    parser.add_argument("--body-file", help="read the body from this file instead of stdin")
    parser.add_argument("--force", action="store_true", help="overwrite an existing idea")
    parser.add_argument("--workspace", default="brands/me")
    args = parser.parse_args(argv)
    workspace = Path(args.workspace)

    def build() -> Path:
        body = objects.read_body(args.body_file)
        surfaces = _surface_list(args.surfaces, args.surface)
        return create(workspace, args.id, args.title, args.mode, args.pillar, body, campaign=args.campaign, sources=args.source, surfaces=surfaces, force=args.force, date=args.date, reactive=args.reactive)

    code, line = objects.attempt(workspace, args.id, build)
    print(line)
    return code


if __name__ == "__main__":
    sys.exit(main())
