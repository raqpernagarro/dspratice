#!/usr/bin/env python3
"""Import the FLO 2026 articles, Substack essays, promo posts, notes and the toolkit carousel.

Usage:
    python3 scripts/import_flo.py --source "<_share dir>" --workspace brands/me [--toolkit-posted] [--force]
"""
from __future__ import annotations

import argparse
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.lib import content, dates  # noqa: E402
from scripts.lib.flo_articles import parse_article, parse_toolkit_post  # noqa: E402

CAMPAIGN = "flo-2026-talks"
CAMPAIGN_TITLE = "FLO 2026 talks, repurposed"
CAMPAIGN_START, CAMPAIGN_END = date(2026, 10, 27), date(2026, 11, 13)
# topic number -> (article day, essay day, promo day); the note goes out with the essay
TOPIC_SCHEDULE = {
    1: (date(2026, 10, 27), date(2026, 10, 29), date(2026, 10, 30)),
    2: (date(2026, 11, 4), date(2026, 11, 5), date(2026, 11, 7)),
    3: (date(2026, 11, 10), date(2026, 11, 12), date(2026, 11, 13)),
}
TOPIC_PILLAR = {1: 4, 2: 1, 3: None}
TIMES = {"article": "08:30", "essay": "09:00", "note": "09:30", "promo": "08:30"}
TOOLKIT_PDF = Path("linkedin-toolkit") / "out" / "LinkedIn-Leverage-Toolkit_carousel.pdf"


def _meta(id: str, title: str, surface: str, fmt: str, now: str, pillar, day: date | None, when: str) -> dict:
    meta = content.new_post_meta(id, title, surface, fmt, "personal", now)
    meta["campaign"] = CAMPAIGN
    meta["pillar"] = pillar
    if day is not None:
        meta["scheduled_date"] = dates.iso(dates.lisbon(day, TIMES[when]))
    return meta


def import_flo(source: Path, workspace: Path, toolkit_posted: bool, force: bool) -> dict:
    source, workspace = Path(source), Path(workspace)
    now = content.now_iso()
    created, skipped, overwrote = [], [], []

    def write(id: str, meta: dict, body: str, assets=None) -> None:
        path = content.object_path(workspace, id)
        if path.exists() and not force:
            skipped.append(id)
            return
        if assets:
            meta["assets"] = [content.copy_asset(src, workspace, id) for src in assets]
        if path.exists():
            content.carry_over(content.load(path)[0], meta)
            content.save(path, meta, body)
            overwrote.append(id)
            return
        content.save(path, meta, body)
        created.append(id)

    for topic_dir in sorted(p for p in (source / "articles").glob("[0-9][0-9]-*") if p.is_dir()):
        number, slug = int(topic_dir.name[:2]), topic_dir.name
        if number not in TOPIC_SCHEDULE:
            raise ValueError("no schedule for topic %s" % topic_dir.name)
        article_day, essay_day, promo_day = TOPIC_SCHEDULE[number]
        pillar, prefix, images = TOPIC_PILLAR[number], "t%d" % number, topic_dir / "images"
        li = parse_article((topic_dir / "linkedin.md").read_text(encoding="utf-8"), "linkedin")
        ss = parse_article((topic_dir / "substack.md").read_text(encoding="utf-8"), "substack")

        article_id, promo_id = "flo-%s-article" % slug, "flo-%s-promo" % slug
        essay_id, note_id = "flo-%s-essay" % slug, "flo-%s-note" % slug

        meta = _meta(article_id, li.title, "linkedin", "article", now, pillar, article_day, "article")
        meta.update({"seo_title": li.seo_title, "seo_description": li.seo_description, "cover": li.cover})
        li_images = [p for p in sorted(images.glob("%s-li-*.png" % prefix)) if not p.name.endswith("-promo.png")]
        write(article_id, meta, li.body, li_images)

        meta = _meta(promo_id, "Promo: %s" % li.title, "linkedin", "image", now, pillar, promo_day, "promo")
        meta.update({"parent": article_id, "first_comment": "[article URL]"})
        write(promo_id, meta, (li.promo_post or "") + "\n", [images / ("%s-li-promo.png" % prefix)])

        meta = _meta(essay_id, ss.title, "substack", "essay", now, pillar, essay_day, "essay")
        meta.update({"subtitle": ss.subtitle, "seo_title": ss.seo_title, "seo_description": ss.seo_description, "cover": ss.cover})
        write(essay_id, meta, ss.body, sorted(images.glob("%s-ss-*.png" % prefix)))

        meta = _meta(note_id, "Note: %s" % ss.title, "substack", "note", now, pillar, essay_day, "note")
        meta["parent"] = essay_id
        write(note_id, meta, (ss.substack_note or "") + "\n")

    document_title, body, first_comment = parse_toolkit_post((source / "linkedin-toolkit" / "LINKEDIN-POST.md").read_text(encoding="utf-8"))
    meta = _meta("flo-toolkit-carousel", document_title, "linkedin", "carousel-pdf", now, None, None, "promo")
    meta.update({"document_title": document_title, "first_comment": first_comment})
    if toolkit_posted:
        meta.update({"status": "published", "posted_at": now})
    write("flo-toolkit-carousel", meta, body, [source / TOOLKIT_PDF])

    campaign_path = workspace / "campaigns" / ("%s.md" % CAMPAIGN)
    if not campaign_path.exists() or force:
        content.save(campaign_path, {
            "slug": CAMPAIGN,
            "title": CAMPAIGN_TITLE,
            "mode": "personal",
            "goal": "Turn the three FLO 2026 talks into neutral long-form pieces: one LinkedIn article and one Substack essay per topic, one topic a week",
            "start": CAMPAIGN_START.isoformat(),
            "end": CAMPAIGN_END.isoformat(),
            "priority": 2,
            "neutral": True,
            "surfaces": ["linkedin", "substack"],
            "tags_people": [],
            "sources": [],
            "cadence": {"linkedin": "tuesday", "substack": "thursday"},
        }, "Three topics: caring more (pillar 4), design for context (pillar 1) and LinkedIn authority (no pillar). "
           "Every piece is neutral: it never mentions Nagarro, FLO, a talk, slides or the room, and client stories are fully disguised. "
           "The LinkedIn article goes out on Tuesday, the Substack essay and its note on Thursday, and the promo post three days after the article.\n")

    return {"created": created, "skipped": skipped, "overwrote": overwrote}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--source", required=True, help="the Flo-2026-Presentations/_share folder")
    parser.add_argument("--workspace", default="brands/me")
    parser.add_argument("--toolkit-posted", action="store_const", const=True, default=None, help="the toolkit carousel is already published")
    parser.add_argument("--force", action="store_true", help="overwrite existing objects")
    args = parser.parse_args(argv)
    toolkit_posted = args.toolkit_posted
    if toolkit_posted is None:
        if sys.stdin.isatty():
            toolkit_posted = input("Has the toolkit carousel already been published? [y/N] ").strip().lower().startswith("y")
        else:
            toolkit_posted = False
    result = import_flo(Path(args.source), Path(args.workspace), toolkit_posted, args.force)
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
