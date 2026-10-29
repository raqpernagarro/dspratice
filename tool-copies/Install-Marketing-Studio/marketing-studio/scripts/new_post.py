#!/usr/bin/env python3
"""Create a post Content Object from the command line.

Usage:
    python3 scripts/new_post.py <id> --title TITLE --surface linkedin|instagram|x|substack
        --format FORMAT --mode personal|nagarro
        [--pillar N] [--campaign SLUG] [--parent IDEA_ID] [--date YYYY-MM-DD]
        [--first-comment TEXT] [--source URL ...] [--tags-people NAME ...]
        [--visual-brief TEXT] [--image-prompt TEXT]
        [--seo-title TEXT] [--seo-description TEXT] [--subtitle TEXT] [--cover PATH]
        [--script TEXT] [--document-title TEXT]
        [--body-file PATH] [--force] [--workspace brands/me]

The body comes from --body-file, or from stdin when that is not given, and an
empty body is refused. The post starts as a draft, scheduled at the surface's
usual time (Lisbon) on --date. An existing post is left alone unless --force is
given; with --force it keeps its TryPost link, status, brand-review flags, posted
date and creation date, and the gate runs as on a new body, even when the body is
the same: an in-review post goes back to draft and loses any score, a scored draft
loses its score, and an approved, scheduled or published post keeps its status and
its score.
"""
from __future__ import annotations

import argparse
import datetime
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.lib import content, dates, objects  # noqa: E402


def _scheduled(date: str, surface: str) -> str | None:
    """The scheduled_date for a YYYY-MM-DD day at the surface's usual time; a surface without one is left to validation."""
    try:
        day = datetime.date.fromisoformat(date)
    except ValueError:
        raise ValueError("date: %r must be YYYY-MM-DD" % date) from None
    if surface not in dates.POST_TIMES:
        return None
    return dates.iso(dates.lisbon(day, dates.POST_TIMES[surface]))


def create(
    workspace: Path,
    id: str,
    title: str,
    surface: str,
    fmt: str,
    mode: str,
    body: str,
    pillar: int | None = None,
    campaign: str | None = None,
    parent: str | None = None,
    date: str | None = None,
    first_comment: str = "",
    sources: list[str] = (),
    tags_people: list[str] = (),
    visual_brief: str = "",
    image_prompt: str = "",
    seo_title: str = "",
    seo_description: str = "",
    subtitle: str = "",
    cover: str = "",
    script: str = "",
    document_title: str = "",
    force: bool = False,
    now: str | None = None,
) -> Path:
    now = now or content.now_iso()
    meta = content.new_post_meta(id, title, surface, fmt, mode, now)
    meta["status"] = "draft"
    meta["pillar"] = pillar
    meta["campaign"] = campaign
    if parent:
        meta["parent"] = parent
    if date:
        meta["scheduled_date"] = _scheduled(date, surface)
    meta["first_comment"] = first_comment
    meta["sources"] = list(sources)
    meta["tags_people"] = list(tags_people)
    if visual_brief:
        meta["visual_brief"] = visual_brief
    if image_prompt:
        meta["image_prompt"] = image_prompt
    for field, value in (
        ("seo_title", seo_title), ("seo_description", seo_description), ("subtitle", subtitle),
        ("cover", cover), ("script", script), ("document_title", document_title),
    ):
        if value:
            meta[field] = value
    return objects.write_new(Path(workspace), id, meta, body, force, now)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("id")
    parser.add_argument("--title", required=True, help="the post's title")
    parser.add_argument("--surface", required=True, choices=content.SURFACES)
    parser.add_argument("--format", required=True, dest="fmt", help="the format, which depends on the surface")
    parser.add_argument("--mode", required=True, choices=content.MODES)
    parser.add_argument("--pillar", type=int, help="the content pillar number")
    parser.add_argument("--campaign", help="the campaign slug")
    parser.add_argument("--parent", help="the id of the idea this post comes from")
    parser.add_argument("--date", help="the day to publish, as YYYY-MM-DD")
    parser.add_argument("--first-comment", default="", help="the text of the first comment")
    parser.add_argument("--source", action="append", default=[], help="a source URL; repeat for more")
    parser.add_argument("--tags-people", action="append", default=[], help="a person to tag; repeat for more")
    parser.add_argument("--visual-brief", default="", help="what the image or card should show")
    parser.add_argument("--image-prompt", default="", help="the prompt for generating the image")
    parser.add_argument("--seo-title", default="", help="the search title of a long-form piece")
    parser.add_argument("--seo-description", default="", help="the search description of a long-form piece")
    parser.add_argument("--subtitle", default="", help="the one-sentence subtitle of an essay")
    parser.add_argument("--cover", default="", help="the cover image, as a workspace-relative path")
    parser.add_argument("--script", default="", help="the script of a reel")
    parser.add_argument("--document-title", default="", help="the title shown on a carousel PDF")
    parser.add_argument("--body-file", help="read the body from this file instead of stdin")
    parser.add_argument("--force", action="store_true", help="overwrite an existing post")
    parser.add_argument("--workspace", default="brands/me")
    args = parser.parse_args(argv)
    workspace = Path(args.workspace)

    def build() -> Path:
        body = objects.read_body(args.body_file)
        return create(
            workspace, args.id, args.title, args.surface, args.fmt, args.mode, body,
            pillar=args.pillar, campaign=args.campaign, parent=args.parent, date=args.date,
            first_comment=args.first_comment, sources=args.source, tags_people=args.tags_people,
            visual_brief=args.visual_brief, image_prompt=args.image_prompt,
            seo_title=args.seo_title, seo_description=args.seo_description, subtitle=args.subtitle,
            cover=args.cover, script=args.script, document_title=args.document_title, force=args.force,
        )

    code, line = objects.attempt(workspace, args.id, build)
    print(line)
    return code


if __name__ == "__main__":
    sys.exit(main())
