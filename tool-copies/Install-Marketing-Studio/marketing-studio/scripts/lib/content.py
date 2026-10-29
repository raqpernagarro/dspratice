"""Content Object helpers: load, save, validate, hash and locate the files under brands/<brand>/content/."""
from __future__ import annotations

import hashlib
import shutil
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from scripts.lib import campaigns, frontmatter

TYPES = ["idea", "post"]
STATUSES = ["idea", "draft", "in-review", "approved", "scheduled", "published", "archived"]
# viva is Viva Engage, Nagarro's internal network: colleagues only, always a repurpose of a public piece.
SURFACES = ["linkedin", "instagram", "x", "substack", "viva"]
FORMATS = {
    "linkedin": ["text", "image", "carousel-pdf", "video", "poll", "article"],
    "instagram": ["image", "carousel", "reel", "story"],
    "x": ["text", "thread"],
    "substack": ["essay", "note"],
    "viva": ["text", "image", "video"],
}
MODES = ["personal", "nagarro"]
REQUIRED = ["id", "type", "title", "status", "brand", "surface", "format", "mode", "author", "timezone", "created", "updated"]
REQUIRED_IDEA = ["id", "type", "title", "status", "brand", "mode", "author", "timezone", "created", "updated"]

SCORE_KEYS = ("hook", "voice", "value", "fit", "ready")
SCORE_PASS_TOTAL = 35
SCORE_PASS_MIN = 5

# An idea is scored on five dimensions, each from 0 to 5, out of 25; 15 is its passing line, which score.py prints
# as pass or fail. It ranks the idea and gates nothing.
IDEA_SCORE_KEYS = ("relevance", "timeliness", "proof", "fit", "difference")
IDEA_SCORE_PASS = 15

SEVERITIES = ("High", "Medium", "Low")

LISBON = ZoneInfo("Europe/Lisbon")


def object_path(workspace: Path, id: str) -> Path:
    return Path(workspace) / "content" / ("%s.md" % id)


def list_objects(workspace: Path) -> list[Path]:
    folder = Path(workspace) / "content"
    if not folder.is_dir():
        return []
    return sorted(folder.glob("*.md"))


def load(path: Path) -> tuple[dict, str]:
    return frontmatter.parse(Path(path).read_text(encoding="utf-8"))


def save(path: Path, meta: dict, body: str) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(frontmatter.dump(meta, body), encoding="utf-8")


def body_hash(body: str) -> str:
    return hashlib.sha256(body.strip().encode("utf-8")).hexdigest()


def now_iso() -> str:
    return datetime.now(LISBON).replace(microsecond=0).isoformat()


CARRIED_OVER = ("trypost", "status", "posted_at", "created")


def carry_over(existing: dict, fresh: dict) -> dict:
    """When an importer overwrites an object, keep what only the running system knows about it."""
    for key in CARRIED_OVER:
        if key in existing:
            fresh[key] = existing[key]
    return fresh


def new_post_meta(id: str, title: str, surface: str, fmt: str, mode: str, now: str) -> dict:
    """The common skeleton of a `post` Content Object; importers add campaign, dates and media."""
    return {
        "id": id,
        "type": "post",
        "title": title,
        "status": "in-review",
        "brand": "me",
        "surface": surface,
        "format": fmt,
        "mode": mode,
        "campaign": None,
        "pillar": None,
        "author": "me",
        "timezone": "Europe/Lisbon",
        "scheduled_date": None,
        "first_comment": "",
        "tags_people": [],
        "sources": [],
        "assets": [],
        "trypost": {"post_id": None, "idea_id": None, "synced_at": None, "synced_hash": None},
        "posted_at": None,
        "score": None,
        "performance": None,
        "created": now,
        "updated": now,
    }


def new_idea_meta(id: str, title: str, mode: str, pillar: int | None, now: str, surfaces: list[str] | None = None) -> dict:
    """The skeleton of an `idea` Content Object: no surface or format yet, only the surfaces it could become."""
    return {
        "id": id,
        "type": "idea",
        "title": title,
        "status": "idea",
        "brand": "me",
        "mode": mode,
        "pillar": pillar,
        "campaign": None,
        "surfaces": list(surfaces) if surfaces is not None else ["linkedin", "instagram", "x"],
        "author": "me",
        "timezone": "Europe/Lisbon",
        "sources": [],
        "trypost": {"idea_id": None, "synced_at": None, "synced_hash": None},
        "score": None,
        "created": now,
        "updated": now,
    }


def _is_score_value(value: object) -> bool:
    """A single score dimension: a whole number from 1 to 10 (a bool does not count)."""
    return isinstance(value, int) and not isinstance(value, bool) and 1 <= value <= 10


def set_score(meta: dict, now: str, **dims: int) -> dict:
    """Record the five review dimensions on `meta`, with their total, and return the score."""
    missing = [key for key in SCORE_KEYS if key not in dims]
    unexpected = sorted(key for key in dims if key not in SCORE_KEYS)
    if missing or unexpected:
        raise ValueError(
            "a score needs exactly %s (missing: %s; unexpected: %s)"
            % (", ".join(SCORE_KEYS), ", ".join(missing) or "none", ", ".join(unexpected) or "none")
        )
    for key in SCORE_KEYS:
        if not _is_score_value(dims[key]):
            raise ValueError("score %s must be a whole number from 1 to 10, got %r" % (key, dims[key]))
    score = {"total": sum(dims[key] for key in SCORE_KEYS)}
    for key in SCORE_KEYS:
        score[key] = dims[key]
    meta["score"] = score
    meta["updated"] = now
    return score


def score_passes(score: dict | None) -> bool:
    """The review gate: the total reaches SCORE_PASS_TOTAL and no dimension falls below SCORE_PASS_MIN."""
    if not isinstance(score, dict):
        return False
    values = [score.get(key) for key in ("total",) + SCORE_KEYS]
    if not all(isinstance(value, int) and not isinstance(value, bool) for value in values):
        return False
    return score["total"] >= SCORE_PASS_TOTAL and all(score[key] >= SCORE_PASS_MIN for key in SCORE_KEYS)


def _is_idea_score_value(value: object) -> bool:
    """A single idea-score dimension: a whole number from 0 to 5 (a bool does not count)."""
    return isinstance(value, int) and not isinstance(value, bool) and 0 <= value <= 5


def set_idea_score(meta: dict, now: str, **dims: int) -> dict:
    """Record the five idea dimensions on `meta`, with their total out of 25, and return the score."""
    missing = [key for key in IDEA_SCORE_KEYS if key not in dims]
    unexpected = sorted(key for key in dims if key not in IDEA_SCORE_KEYS)
    if missing or unexpected:
        raise ValueError(
            "an idea score needs exactly %s (missing: %s; unexpected: %s)"
            % (", ".join(IDEA_SCORE_KEYS), ", ".join(missing) or "none", ", ".join(unexpected) or "none")
        )
    for key in IDEA_SCORE_KEYS:
        if not _is_idea_score_value(dims[key]):
            raise ValueError("idea score %s must be a whole number from 0 to 5, got %r" % (key, dims[key]))
    score = {"total": sum(dims[key] for key in IDEA_SCORE_KEYS)}
    for key in IDEA_SCORE_KEYS:
        score[key] = dims[key]
    meta["score"] = score
    meta["updated"] = now
    return score


def _score_problems(score: object, keys: tuple = SCORE_KEYS, is_value=_is_score_value, span: str = "1 to 10") -> list[str]:
    """One message per problem with a non-null score, each starting with `score:`.

    The defaults check a post's score; an idea's is checked with IDEA_SCORE_KEYS, `_is_idea_score_value` and "0 to 5".
    """
    if not isinstance(score, dict):
        return ["score: %r must be a mapping of total and %s" % (score, ", ".join(keys))]
    problems = []
    expected = ("total",) + keys
    missing = [key for key in expected if key not in score]
    unexpected = sorted(str(key) for key in score if key not in expected)
    if missing:
        problems.append("score: missing %s" % ", ".join(missing))
    if unexpected:
        problems.append("score: unexpected %s" % ", ".join(unexpected))
    for key in keys:
        if key in score and not is_value(score[key]):
            problems.append("score: %s %r must be a whole number from %s" % (key, score[key], span))
    total = score.get("total")
    if "total" in score and (not isinstance(total, int) or isinstance(total, bool)):
        problems.append("score: total %r must be a whole number" % (total,))
    elif "total" in score and all(is_value(score.get(key)) for key in keys):
        expected_total = sum(score[key] for key in keys)
        if total != expected_total:
            problems.append("score: total %d does not equal the sum of the dimensions, %d" % (total, expected_total))
    return problems


def _idea_score_problems(score: object) -> list[str]:
    """One message per problem with a non-null idea score, each starting with `score:`."""
    return _score_problems(score, IDEA_SCORE_KEYS, _is_idea_score_value, "0 to 5")


def _performance_problems(performance: object) -> list[str]:
    """One message per problem with a non-null `performance`, each starting with `performance:`.

    The values are counts the author types in, so each is a whole number of 0 or more, or None when the network did not show it;
    `entered_at` is the one text field, the moment she entered them.
    """
    if not isinstance(performance, dict):
        return ["performance: %r must be a mapping of counts" % (performance,)]
    problems = []
    for key, value in performance.items():
        if key == "entered_at":
            if not isinstance(value, str) or not value:
                problems.append("performance: entered_at %r must be a non-empty string" % (value,))
        elif value is not None and (not isinstance(value, int) or isinstance(value, bool) or value < 0):
            problems.append("performance: %s %r must be a whole number of 0 or more, or empty" % (key, value))
    return problems


def _flag_severity(flag: object) -> str | None:
    """The severity a review flag starts with ("High: ", "Medium: " or "Low: "), or None when it has none."""
    if isinstance(flag, str):
        for severity in SEVERITIES:
            if flag.startswith(severity + ": "):
                return severity
    return None


def set_review(meta: dict, now: str, flags: list[str]) -> dict:
    """Record a brand-review run on `meta`: the flags and their counts per severity. Returns the review.

    Each run replaces the whole flag set, so the flags are always the latest run's.
    """
    flags = list(flags)
    bad = [flag for flag in flags if _flag_severity(flag) is None]
    if bad:
        raise ValueError("a review flag must start with %s (got: %s)" % (", ".join(s + ": " for s in SEVERITIES), "; ".join(repr(flag) for flag in bad)))
    review = {severity.lower(): sum(1 for flag in flags if _flag_severity(flag) == severity) for severity in SEVERITIES}
    review["reviewed_at"] = now
    meta["review"] = review
    meta["review_flags"] = flags
    meta["updated"] = now
    return review


def clear_review(meta: dict, now: str) -> None:
    """Forget the brand-review result, so the piece reads as never reviewed."""
    meta.pop("review", None)
    meta.pop("review_flags", None)
    meta["updated"] = now


def approval_blockers(meta: dict) -> list[str]:
    """Why the piece may not be marked approved: a failing score, then High brand-review flags.

    A piece that was never scored or reviewed has no blockers; the gate only acts on what was recorded.
    An idea's score ranks it for the planner and never gates its approval, so only the post score is checked here.
    """
    blockers = []
    score = meta.get("score")
    if meta.get("type") != "idea" and score is not None and not score_passes(score):
        total = score.get("total") if isinstance(score, dict) else None
        blockers.append("score %s/%d fails the gate" % (total if isinstance(total, int) else "?", 10 * len(SCORE_KEYS)))
    review = meta.get("review")
    high = review.get("high") if isinstance(review, dict) else None
    if isinstance(high, int) and not isinstance(high, bool) and high > 0:
        blockers.append("%d High flag%s from brand-review" % (high, "" if high == 1 else "s"))
    return blockers


def _review_problems(review: object, flags: object) -> list[str]:
    """One message per problem with a non-null `review` or `review_flags`, each starting with `review:`."""
    problems = []
    if review is not None:
        if not isinstance(review, dict):
            problems.append("review: %r must be a mapping of high, medium, low and reviewed_at" % (review,))
        else:
            for severity in SEVERITIES:
                key = severity.lower()
                value = review.get(key)
                if not isinstance(value, int) or isinstance(value, bool) or value < 0:
                    problems.append("review: %s %r must be a whole number of 0 or more" % (key, value))
            stamp = review.get("reviewed_at")
            if not isinstance(stamp, str) or not stamp:
                problems.append("review: reviewed_at %r must be a non-empty string" % (stamp,))
    if flags is not None:
        if not isinstance(flags, list):
            problems.append("review: review_flags %r must be a list" % (flags,))
        else:
            for flag in flags:
                if _flag_severity(flag) is None:
                    problems.append("review: flag %r must start with %s" % (flag, ", ".join(s + ": " for s in SEVERITIES)))
    return problems


def copy_asset(src: Path, workspace: Path, id: str) -> str:
    """Copy one media file into workspace/assets/<id>/ and return its workspace-relative path."""
    src = Path(src)
    if not src.exists():
        raise FileNotFoundError("missing media for %s: %s" % (id, src))
    dest_dir = Path(workspace) / "assets" / id
    dest_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest_dir / src.name)
    return "assets/%s/%s" % (id, src.name)


def validate(meta: dict, workspace: Path | None = None) -> list[str]:
    """Return one message per problem; an empty list means the frontmatter is valid.

    With the workspace, the rules that read a campaign file run too: a viva piece never carries a neutral campaign
    (a campaign whose file is missing is skipped here; check.py reports it)."""
    problems = []
    is_idea = meta.get("type") == "idea"
    for field in REQUIRED_IDEA if is_idea else REQUIRED:
        if field not in meta or meta[field] in (None, ""):
            problems.append("missing field: %s" % field)
    checks = [("type", TYPES), ("status", STATUSES), ("surface", SURFACES), ("mode", MODES)]
    if is_idea:
        checks = [check for check in checks if check[0] != "surface"]
    for field, allowed in checks:
        value = meta.get(field)
        if value is not None and value not in allowed:
            problems.append("%s: %r is not one of %s" % (field, value, ", ".join(allowed)))
    surface, fmt = meta.get("surface"), meta.get("format")
    if not is_idea and surface in FORMATS and fmt is not None and fmt not in FORMATS[surface]:
        problems.append("format: %r is not valid for surface %s (allowed: %s)" % (fmt, surface, ", ".join(FORMATS[surface])))
    # Viva Engage is internal: a piece there speaks to colleagues, and an idea never starts there (it is a repurpose of a
    # public piece, which the planner reserves on its own).
    if not is_idea and surface == "viva" and meta.get("mode") not in (None, "", "nagarro"):
        problems.append("mode: a viva piece is for Nagarro colleagues, so mode must be nagarro")
    if workspace is not None and not is_idea and surface == "viva" and meta.get("campaign"):
        try:
            if campaigns.is_neutral(campaigns.load(workspace, meta["campaign"])):
                problems.append("campaign: a viva piece never carries a neutral campaign")
        except FileNotFoundError:
            pass
    surfaces = meta.get("surfaces")
    if surfaces is not None:
        if not isinstance(surfaces, list):
            problems.append("surfaces: %r is not a list" % (surfaces,))
        else:
            for entry in surfaces:
                if entry not in SURFACES:
                    problems.append("surfaces: %r is not one of %s" % (entry, ", ".join(SURFACES)))
            if is_idea and "viva" in surfaces:
                problems.append("surfaces: viva is a colleague surface, never an idea's network")
    if meta.get("score") is not None:
        problems.extend(_idea_score_problems(meta["score"]) if is_idea else _score_problems(meta["score"]))
    if "reactive" in meta and not isinstance(meta["reactive"], bool):
        problems.append("reactive: %r must be true or false" % (meta["reactive"],))
    if meta.get("performance") is not None:
        problems.extend(_performance_problems(meta["performance"]))
    problems.extend(_review_problems(meta.get("review"), meta.get("review_flags")))
    for field in ("scheduled_date", "posted_at"):
        value = meta.get(field)
        if value is None:
            continue
        try:
            parsed = datetime.fromisoformat(value) if isinstance(value, str) else None
        except ValueError:
            parsed = None
        if parsed is None or parsed.tzinfo is None:
            problems.append("%s: %r must be an ISO datetime with an offset, like 2026-10-22T08:30:00+01:00" % (field, value))
    return problems
