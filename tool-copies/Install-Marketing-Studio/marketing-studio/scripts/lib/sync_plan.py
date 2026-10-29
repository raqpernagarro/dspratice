"""Pure decision rules for the TryPost sync: what a Content Object looks like in TryPost and when it changes.
No HTTP here, so every rule is testable on plain dicts."""
from __future__ import annotations

import re

from datetime import datetime, timezone

from scripts.lib import dates

LABEL_COLOURS = {
    "campaign": "#1F434F",
    "pillar": "#A6BAC7",
    "mode": "#D9E4E9",
    "review": "#C4341A",
    "approved": "#1F8A4C",
    "posted": "#C0E50A",
    "needs-caption": "#E4EFBF",
    "long-form": "#F1F3EA",
    "blocked": "#C4341A",
    "reactive": "#E4EFBF",
}
STATUS_LABELS = {"in-review": "review", "approved": "approved", "scheduled": "approved", "published": "posted"}
# The TryPost platform each surface's manual channel carries. TryPost has no platform for Viva Engage or Substack, so viva
# borrows facebook (shown as "Viva Engage") and substack borrows mastodon (shown as "Substack"); the surface
# keeps its own name everywhere else. Nothing is ever scheduled, so the borrowed platform's publishing rules never apply.
SURFACE_PLATFORMS = {"linkedin": "linkedin", "instagram": "instagram", "x": "x", "viva": "facebook", "substack": "mastodon"}
# The surfaces whose own network can be connected for real. When the author connects that account in TryPost, its drafts go
# there instead of the manual placeholder; Instagram also accepts an account connected through Facebook. Viva Engage and
# Substack borrow a platform, so they only ever use their manual channel (a real Facebook or Mastodon account is never theirs).
CONNECTABLE_PLATFORMS = {"linkedin": ("linkedin",), "instagram": ("instagram", "instagram-facebook"), "x": ("x",)}


def pick_channels(accounts: list) -> dict:
    """The channel id each surface's new drafts go to, from TryPost's social accounts: a connected account of the
    surface's own network when there is one (connectable surfaces only), otherwise the manual-<platform> placeholder.
    A surface with neither is left out."""
    manual = {a["platform"]: a["id"] for a in accounts if str(a.get("username", "")).startswith("manual-")}
    chosen = {}
    for surface, platform in SURFACE_PLATFORMS.items():
        connected = [a for a in accounts
                     if a.get("platform") in CONNECTABLE_PLATFORMS.get(surface, ())
                     and a.get("status") == "connected"
                     and not str(a.get("username", "")).startswith("manual-")]
        if connected:
            chosen[surface] = connected[0]["id"]
        elif platform in manual:
            chosen[surface] = manual[platform]
    return chosen
# The surfaces whose posts go to their channel as drafts. On Substack that is the note; an essay is long form, like a LinkedIn
# article, and keeps an idea card (an essay also gets a calendar draft that points to the card, see calendar_draft_text).
CHANNEL_SURFACES = ("linkedin", "instagram", "x", "viva", "substack")
LONG_FORM_FORMATS = ("article", "essay")
LONG_FORM_NAMES = {"article": "LinkedIn article", "essay": "Substack essay"}
CALENDAR_DRAFT_FORMATS = ("essay",)
INSTAGRAM_TYPES = {"reel": "instagram_reel", "story": "instagram_story"}
CONTENT_TYPES = {"linkedin": "linkedin_post", "x": "x_post", "viva": "facebook_post", "substack": "mastodon_post"}
# An idea sits in the TryPost idea-board column its status names; any other status (published, archived, ...) stays off the board.
# "Unassigned" is the board's built-in column for an idea with no stage (null), not a stage that exists.
STAGE_FOR = {"idea": "Unassigned", "approved": "To Do", "draft": "In Progress"}
STATUS_FOR_STAGE = {stage: status for status, stage in STAGE_FOR.items()}
IDEA_BODY_EXCERPT = 400
IDEA_SCORE_OUT_OF = 25


def has_high_flags(meta: dict) -> bool:
    """True when the last brand-review recorded at least one High flag."""
    review = meta.get("review")
    high = review.get("high") if isinstance(review, dict) else None
    return isinstance(high, int) and not isinstance(high, bool) and high > 0


def _tag_labels(meta: dict) -> list[str]:
    """The campaign, pillar and mode labels a post and an idea share."""
    labels = []
    if meta.get("campaign"):
        labels.append("campaign:%s" % meta["campaign"])
    if meta.get("pillar") is not None:
        labels.append("pillar:%s" % meta["pillar"])
    if meta.get("mode"):
        labels.append("mode:%s" % meta["mode"])
    return labels


def labels_for(meta: dict) -> list[str]:
    labels = _tag_labels(meta)
    status_label = STATUS_LABELS.get(meta.get("status"))
    if status_label:
        labels.append(status_label)
    if has_high_flags(meta):
        labels.append("blocked")
    labels.extend(meta.get("labels_extra") or [])
    return labels


def label_colour(name: str) -> str:
    return LABEL_COLOURS.get(name.split(":", 1)[0], "#A6BAC7")


def content_type_for(meta: dict) -> str:
    """The TryPost content type of a piece's draft; it must match the platform of the channel SURFACE_PLATFORMS names."""
    surface = meta.get("surface")
    if surface == "instagram":
        return INSTAGRAM_TYPES.get(meta.get("format"), "instagram_feed")
    if surface in CONTENT_TYPES:
        return CONTENT_TYPES[surface]
    raise ValueError("no TryPost content type for surface %r" % surface)


def is_channel_piece(meta: dict) -> bool:
    """A post whose body goes to its surface's channel as a draft: not a LinkedIn article or a Substack essay."""
    return meta.get("type") == "post" and meta.get("surface") in CHANNEL_SURFACES and meta.get("format") not in LONG_FORM_FORMATS


def is_long_form(meta: dict) -> bool:
    """A LinkedIn article or a Substack essay: an idea card in To Do, never a post body."""
    return meta.get("type") == "post" and meta.get("format") in LONG_FORM_FORMATS


def has_calendar_draft(meta: dict) -> bool:
    """A long-form piece that also gets one dated draft on its surface's channel, so the calendar shows its day: an essay."""
    return is_long_form(meta) and meta.get("surface") in CHANNEL_SURFACES and meta.get("format") in CALENDAR_DRAFT_FORMATS


def calendar_draft_text(meta: dict) -> str:
    """An essay's calendar draft: its title, its subtitle and one line pointing to its idea card. Never the body, which runs
    past what a channel takes and belongs on Substack itself."""
    title = str(meta.get("title") or meta.get("id") or "").strip()
    parts = [title]
    subtitle = str(meta.get("subtitle") or "").strip()
    if subtitle:
        parts.append(subtitle)
    parts.append('The full text is in the Ideas card "%s".' % title)
    return "\n\n".join(parts) + "\n"


def calendar_draft_labels(meta: dict) -> list[str]:
    """The calendar draft's labels: campaign, pillar and mode, plus long-form. No status label, so it never goes stale."""
    return _tag_labels(meta) + ["long-form"]


def scheduled_datetime(meta: dict) -> datetime | None:
    value = meta.get("scheduled_date")
    return datetime.fromisoformat(value) if value else None


def is_overdue(meta: dict, now: datetime) -> bool:
    when = scheduled_datetime(meta)
    return when is not None and not dates.is_future(when, now)


THREAD_SEPARATOR = "\n\n---\n\n"


def thread_parts(meta: dict, body: str) -> list | None:
    """The posts of an X thread, in order, when the piece is one (format thread, posts split on lines that are exactly
    '---'); None for anything else. TryPost publishes a thread as the post's content followed by meta.thread_replies."""
    if meta.get("surface") != "x" or meta.get("format") != "thread":
        return None
    parts = [part.strip() for part in re.split(r"^---$", body, flags=re.MULTILINE) if part.strip()]
    return parts if len(parts) > 1 else None


def comparable_text(meta: dict, text: str) -> str:
    """The text a piece is hashed on: a thread rejoined with one separator, so the file and TryPost's split form compare
    equal; any other piece as it is."""
    parts = thread_parts(meta, text)
    return THREAD_SEPARATOR.join(parts) if parts else text


def remote_text(remote: dict) -> str:
    """A TryPost post's text as the file would hold it: the content, then each thread reply, joined with the separator."""
    replies = (remote.get("meta") or {}).get("thread_replies") or []
    texts = [str(r if isinstance(r, str) else (r or {}).get("text") or "").strip() for r in replies]
    texts = [text for text in texts if text]
    body = remote.get("content") or ""
    return THREAD_SEPARATOR.join([body.strip()] + texts) if texts else body


def is_split_thread(remote: dict) -> bool:
    return bool((remote.get("meta") or {}).get("thread_replies"))


def build_create_payload(meta: dict, body: str, account_id: str, label_ids: list, upload_tokens: list, now: datetime) -> dict:
    parts = thread_parts(meta, body)
    payload = {
        "status": "draft",
        "content": parts[0] if parts else body,
        "social_account_id": account_id,
        "content_type": content_type_for(meta),
        "label_ids": list(label_ids),
    }
    when = scheduled_datetime(meta)
    if when is not None and dates.is_future(when, now):
        payload["scheduled_at"] = meta["scheduled_date"]
    if meta.get("document_title"):
        payload["meta"] = {"document_title": meta["document_title"]}
    if parts:
        payload.setdefault("meta", {})["thread_replies"] = parts[1:]
    if upload_tokens:
        payload["media"] = [{"upload_token": token} for token in upload_tokens]
    return payload


def schedule_in_step(meta: dict, remote: dict, now: datetime) -> bool:
    """True when a push has no date to send the post's draft: the file has none, or one already past (only a future date
    is sent), or TryPost holds it already. TryPost echoes scheduled_at in UTC with no offset, like "2026-10-23 07:30:00"."""
    when = scheduled_datetime(meta)
    if when is None or not dates.is_future(when, now):
        return True
    try:
        held = datetime.fromisoformat(str(remote.get("scheduled_at") or "").replace("Z", "+00:00"))
    except ValueError:
        return False
    return (held if held.tzinfo else held.replace(tzinfo=timezone.utc)) == when


def build_update_payload(meta: dict, body: str, label_ids: list, now: datetime) -> dict:
    parts = thread_parts(meta, body)
    payload = {"content": parts[0] if parts else body, "label_ids": list(label_ids)}
    if meta.get("surface") == "x":
        # Always sent on X, so a thread that became a single post loses its old replies.
        payload["meta"] = {"thread_replies": parts[1:] if parts else []}
    when = scheduled_datetime(meta)
    if when is not None and dates.is_future(when, now):
        payload["scheduled_at"] = meta["scheduled_date"]
    return payload


def build_calendar_draft_update(meta: dict, now: datetime) -> dict:
    """The update for an essay's calendar draft: its text and, when still ahead, its date. Its labels are left as they are."""
    payload = {"content": calendar_draft_text(meta)}
    when = scheduled_datetime(meta)
    if when is not None and dates.is_future(when, now):
        payload["scheduled_at"] = meta["scheduled_date"]
    return payload


def notes_for(meta: dict) -> list[str]:
    notes = []
    first_comment = (meta.get("first_comment") or "").strip()
    if first_comment:
        notes.append("First comment:\n" + first_comment)
    visual_brief = (meta.get("visual_brief") or "").strip()
    if visual_brief:
        notes.append("Visual brief:\n" + visual_brief)
    image_prompt = (meta.get("image_prompt") or "").strip()
    if image_prompt:
        notes.append("Image prompt:\n" + image_prompt)
    script = (meta.get("script") or "").strip()
    if script:
        notes.append("Script:\n" + script)
    options = meta.get("poll_options") or []
    if options:
        notes.append("Poll options:\n" + "\n".join("%d. %s" % (i + 1, option) for i, option in enumerate(options)))
    return notes


def decide_pull(meta: dict, body: str, remote: dict) -> dict:
    """Three-way compare of a synced post: the body at the last sync, the file now, TryPost now.
    Returns {"body": text to write or None, "status": new status or None, "conflict": bool, "blocked": [reasons]}.
    "blocked" is filled, and "status" left None, when TryPost carries the approved label on a piece that is
    not yet approved but whose approval blockers (a failing score, High brand-review flags) still stand."""
    from scripts.lib.content import approval_blockers, body_hash  # local import: content imports nothing from here, avoid a cycle at module load

    remote_body = remote_text(remote)
    synced = (meta.get("trypost") or {}).get("synced_hash")
    remote_changed = body_hash(comparable_text(meta, remote_body)) != synced
    file_changed = body_hash(comparable_text(meta, body)) != synced
    decision = {"body": None, "status": None, "conflict": False, "blocked": []}
    if remote_changed and file_changed:
        decision["conflict"] = True
    elif remote_changed:
        decision["body"] = remote_body.rstrip("\n") + "\n"
    names = {label.get("name") for label in remote.get("labels", [])}
    current = meta.get("status")
    if "posted" in names and current != "published":
        decision["status"] = "published"
    elif "approved" in names and current in ("in-review", "draft"):
        blockers = approval_blockers(meta)
        if blockers:
            decision["blocked"] = blockers
        elif current == "in-review":
            decision["status"] = "approved"
    return decision


def _day(when: datetime | None) -> str:
    """A date as the board shows it, like '5 Nov' with no leading zero, or 'undated'."""
    return when.strftime("%d %b").lstrip("0") if when else "undated"


def idea_for(meta: dict, body: str = "") -> dict:
    kind = LONG_FORM_NAMES.get(meta.get("format"), "Long form")
    when = scheduled_datetime(meta)
    day = _day(when)
    publish = when.date().isoformat() if when else "undated"
    summary = (meta.get("seo_description") or body.strip()[:200]).strip()
    return {
        "title": "%s · %s · %s" % (day, kind, meta.get("title", meta.get("id"))),
        "body": "File: content/%s.md\nPublish: %s\n\n%s" % (meta["id"], publish, summary),
    }


def status_for_column(stage_id: str | None, names: dict) -> str | None:
    """The status a card's column means, or None for a column that means nothing (Done, or one the author made).
    `names` maps stage ids to stage names. A card with no stage sits in the board's built-in Unassigned column."""
    name = names.get(stage_id) if stage_id else "Unassigned"
    return STATUS_FOR_STAGE.get(name)


def decide_idea_stage(file_status: str, synced_status: str | None, column_status: str | None) -> str:
    """Who moved an idea, read against the status it had when the file and the card were last in step.
    Returns "in-sync" (file and column agree), "push" (only the file moved: move the card), "pull" (only the card moved:
    take its status), "conflict" (both moved, to different places) or "leave" (the card sits in a column that means nothing
    and the file did not move). With no baseline the card's own column is the baseline, so the file wins."""
    if column_status == file_status:
        return "in-sync"
    baseline = synced_status if synced_status is not None else column_status
    file_moved = file_status != baseline
    card_moved = column_status is not None and column_status != baseline
    if file_moved and card_moved:
        return "conflict"
    if file_moved:
        return "push"
    return "pull" if card_moved else "leave"


def idea_labels(meta: dict) -> list[str]:
    """The labels an idea card carries: campaign, pillar and mode, plus reactive for a slot kept for what happens that week."""
    labels = _tag_labels(meta)
    if meta.get("reactive"):
        labels.append("reactive")
    return labels


def idea_title(meta: dict) -> str:
    """The card's title, '<d Mon> · <networks> · <title>': TryPost ideas have no date field, so the day is part of the title."""
    networks = "+".join(meta.get("surfaces") or []) or "any"
    return "%s · %s · %s" % (_day(scheduled_datetime(meta)), networks, meta.get("title") or meta.get("id"))


def idea_body(meta: dict, body: str = "") -> str:
    """The card's text: which file it is, the plan, the pillar and score, then the start of the idea's own text."""
    when = scheduled_datetime(meta)
    surfaces = ", ".join(meta.get("surfaces") or []) or "any network"
    score = meta.get("score")
    total = score.get("total") if isinstance(score, dict) else None
    rating = "score %s/%d" % (total, IDEA_SCORE_OUT_OF) if total is not None else "unscored"
    pillar = "none" if meta.get("pillar") is None else meta["pillar"]
    head = "File: content/%s.md\nPlanned: %s on %s\nPillar %s · %s" % (
        meta["id"], when.date().isoformat() if when else "undated", surfaces, pillar, rating,
    )
    excerpt = body.strip()[:IDEA_BODY_EXCERPT].rstrip()
    return "%s\n\n%s" % (head, excerpt) if excerpt else head
