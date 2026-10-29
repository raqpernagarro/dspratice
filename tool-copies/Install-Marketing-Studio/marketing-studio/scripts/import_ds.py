#!/usr/bin/env python3
"""Import the Design Systems LinkedIn series into the workspace as Content Objects.

One LinkedIn object per post, re-dated to weekdays from --start, plus an Instagram child
for every post that has media. Existing objects are skipped unless --force is given.

Usage:
    python3 scripts/import_ds.py --source "<DS Posts LinkedIn dir>" --workspace brands/me --start 2026-10-21 [--posted 01,02] [--force]
"""
from __future__ import annotations

import argparse
import re
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.lib import content, dates  # noqa: E402
from scripts.lib.ds_series import MENTION_RE, SeriesPost, parse_series_plan  # noqa: E402

CAMPAIGN = "ai-ready-design-systems"
CAMPAIGN_TITLE = "What AI changes for Design Systems"
PILLAR = 3
IG_FORMAT = {"carousel-pdf": "carousel", "image": "image", "video": "reel"}
HASHTAG_CAP_INSTAGRAM = 5


def _title(post: SeriesPost) -> str:
    first = post.body.split("\n", 1)[0].strip().strip('"')
    return first if len(first) <= 80 else first[:77].rstrip() + "..."


def _base_meta(id: str, post: SeriesPost, now: str) -> dict:
    meta = content.new_post_meta(id, _title(post), "linkedin", post.format, "nagarro", now)
    meta.update({
        "campaign": CAMPAIGN,
        "pillar": PILLAR,
        "first_comment": post.first_comment,
        "tags_people": list(post.tags_people),
        "sources": list(post.sources),
    })
    return meta


_copy = content.copy_asset


def instagram_caption(body: str, tags_people: list[str]) -> str:
    """LinkedIn text as a placeholder caption: no @, no 'in the comments' sentence, at most five hashtags."""
    text = MENTION_RE.sub(lambda m: m.group(0)[1:], body)
    paragraphs = []
    for paragraph in text.split("\n\n"):
        if paragraph.lstrip().startswith("#"):
            tags = [t for t in paragraph.split() if t.startswith("#")][:HASHTAG_CAP_INSTAGRAM]
            paragraph = " ".join(tags)
        else:
            sentences = re.split(r"(?<=[.!?])\s+", paragraph)
            sentences = [s for s in sentences if "in the comments" not in s.lower()]
            paragraph = " ".join(sentences).strip()
        if paragraph:
            paragraphs.append(paragraph)
    return "\n\n".join(paragraphs)


def _instagram_assets(source: Path, workspace: Path, post: SeriesPost, ig_id: str) -> list[str]:
    media = source / "page" / "media"
    if post.format == "carousel-pdf":
        files = sorted(media.glob("%s-[0-9][0-9].jpg" % post.slug))
        if not files:
            raise FileNotFoundError("missing carousel slides for %s in %s" % (ig_id, media))
    elif post.format == "image":
        files = [media / ("%s.jpg" % post.slug)]
    else:  # video -> reel
        files = [media / ("%s.mp4" % post.slug), media / ("%s-poster.jpg" % post.slug)]
    return [_copy(f, workspace, ig_id) for f in files]


def _arc_lines(text: str) -> list[str]:
    rows = re.findall(r"^\| (\d) \| (.+?) \| (.+?) \|$", text, re.M)
    if rows:
        return ["Week %s: %s. Source: %s." % (week, theme.strip(), src.strip()) for week, theme, src in rows]
    return ["Fifteen LinkedIn posts on what AI changes for design systems, one per weekday."]


def _write_campaign(workspace: Path, days: list[date], sources: list[str], text: str, force: bool) -> None:
    path = workspace / "campaigns" / ("%s.md" % CAMPAIGN)
    if path.exists() and not force:
        return
    meta = {
        "slug": CAMPAIGN,
        "title": CAMPAIGN_TITLE,
        "mode": "nagarro",
        "goal": "Support the AI-Ready Design Systems offering launch; drive readers to the offering page and articles",
        "start": days[0].isoformat(),
        "end": days[-1].isoformat(),
        "priority": 1,
        "neutral": False,
        "surfaces": ["linkedin", "instagram", "x"],
        "required_hashtags_linkedin": ["#FluidicIntelligence"],
        "tags_people": ["Noel Cunningham", "Nagarro"],
        "sources": sources,
        "cadence": {"linkedin": "weekdays"},
    }
    content.save(path, meta, "\n".join(_arc_lines(text)) + "\n")


def import_series(source: Path, workspace: Path, start: date, posted: set, force: bool) -> dict:
    source, workspace = Path(source), Path(workspace)
    text = (source / "series-plan.md").read_text(encoding="utf-8")
    posts = parse_series_plan(text)
    days = dates.weekdays_from(start, len(posts))
    now = content.now_iso()
    by_number = {p.number: "ds-" + p.slug for p in posts}
    created, skipped, overwrote, all_sources = [], [], [], []

    def write(id: str, meta: dict, body: str) -> bool:
        path = content.object_path(workspace, id)
        if path.exists():
            if not force:
                skipped.append(id)
                return False
            content.carry_over(content.load(path)[0], meta)
            content.save(path, meta, body)
            overwrote.append(id)
            return True
        content.save(path, meta, body)
        created.append(id)
        return True

    for post, day in zip(posts, days):
        li_id = "ds-" + post.slug
        for url in post.sources:
            if url not in all_sources:
                all_sources.append(url)
        meta = _base_meta(li_id, post, now)
        meta["scheduled_date"] = dates.iso(dates.lisbon(day, dates.POST_TIMES["linkedin"]))
        if post.document_title:
            meta["document_title"] = post.document_title
        if post.poll_options:
            meta["poll_options"] = list(post.poll_options)
        if post.number == 9 and 5 in by_number:
            meta["parent"] = by_number[5]
            meta["status"] = "draft"
        if post.number in posted:
            meta["status"] = "published"
            meta["posted_at"] = meta["scheduled_date"]
        if not content.object_path(workspace, li_id).exists() or force:
            if post.visual:
                meta["assets"] = [_copy(source / post.visual, workspace, li_id)]
        write(li_id, meta, post.body + "\n")

        if post.format in IG_FORMAT:
            ig_id = li_id + "-ig"
            ig = _base_meta(ig_id, post, now)
            ig.update({
                "surface": "instagram",
                "format": IG_FORMAT[post.format],
                "parent": li_id,
                "scheduled_date": dates.iso(dates.lisbon(day, dates.POST_TIMES["instagram"])),
                "first_comment": "",
                "labels_extra": ["needs-caption"],
            })
            if not content.object_path(workspace, ig_id).exists() or force:
                ig["assets"] = _instagram_assets(source, workspace, post, ig_id)
            write(ig_id, ig, instagram_caption(post.body, post.tags_people) + "\n")

    _write_campaign(workspace, days, all_sources, text, force)
    return {"created": created, "skipped": skipped, "overwrote": overwrote}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--source", required=True, help="the 'DS Posts LinkedIn' folder")
    parser.add_argument("--workspace", default="brands/me")
    parser.add_argument("--start", required=True, help="first posting day, YYYY-MM-DD")
    parser.add_argument("--posted", default=None, help="comma-separated post numbers already published, e.g. 01,02")
    parser.add_argument("--force", action="store_true", help="overwrite existing objects")
    args = parser.parse_args(argv)
    if args.posted is not None:
        posted = {int(n) for n in args.posted.split(",") if n.strip()}
    elif sys.stdin.isatty():
        answer = input("Has post 01 already been published? [y/N] ").strip().lower()
        posted = {1} if answer.startswith("y") else set()
    else:
        posted = set()
    result = import_series(Path(args.source), Path(args.workspace), date.fromisoformat(args.start), posted, args.force)
    for id in result["created"]:
        print("created", id)
    for id in result["overwrote"]:
        print("overwrote", id)
    for id in result["skipped"]:
        print("skipped", id)
    print("%d created, %d overwrote, %d skipped" % (len(result["created"]), len(result["overwrote"]), len(result["skipped"])))
    return 0


if __name__ == "__main__":
    sys.exit(main())
