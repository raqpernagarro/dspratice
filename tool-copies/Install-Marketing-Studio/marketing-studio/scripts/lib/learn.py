"""What the entered performance says: engagement rate, the summary by group, and the playbook's Data section.

Performance is typed in by the author through scripts/perf.py; nothing here contacts a social network.
"""
from __future__ import annotations

import re
from datetime import datetime

from scripts.lib import content

LOW_BELOW = 15
MEDIUM_BELOW = 30
LIST_SIZE = 5
GROUPS = (("pillar", "pillar"), ("network", "surface"), ("format", "format"), ("campaign", "campaign"))
TABLES = (("pillar", "By pillar"), ("network", "By network"), ("format", "By format"))

_DATA_HEADING = re.compile(r"## Data(,|\s|$)")


def _count(value: object) -> int:
    """A tally as a whole number; a missing or malformed one counts as 0."""
    return value if isinstance(value, int) and not isinstance(value, bool) else 0


def engagement_rate(performance: dict | None) -> float | None:
    """(reactions + comments + reposts + saves) / impressions * 100, to 2 decimals; None without impressions."""
    if not isinstance(performance, dict):
        return None
    impressions = _count(performance.get("impressions"))
    if impressions <= 0:
        return None
    engaged = sum(_count(performance.get(key)) for key in ("reactions", "comments", "reposts", "saves"))
    return round(engaged / impressions * 100, 2)


def _confidence(count: int) -> str:
    if count < LOW_BELOW:
        return "Low"
    return "Medium" if count < MEDIUM_BELOW else "High"


def _mean(rates: list[float]) -> float:
    return round(sum(rates) / len(rates), 2)


def summarise(objects) -> dict:
    """The published posts that have an engagement rate, taken from their frontmatter, summed up.

    Returns {"count": 0} when none qualifies. Otherwise the count, the baseline (mean rate), the mean rate
    and count per pillar, network (the surface), format and campaign, the ids of the best and worst
    pieces, the rate of every piece by id (so a list of ids can be shown with its rates), and a
    confidence level that grows with the number of pieces.
    """
    rated = []
    for meta in objects:
        if meta.get("type") != "post" or meta.get("status") != "published":
            continue
        rate = engagement_rate(meta.get("performance"))
        if rate is not None:
            rated.append((meta, rate))
    if not rated:
        return {"count": 0}
    by = {}
    for name, field in GROUPS:
        buckets: dict[str, list[float]] = {}
        for meta, rate in rated:
            value = meta.get(field)
            buckets.setdefault("none" if value in (None, "") else str(value), []).append(rate)
        by[name] = {key: {"count": len(rates), "rate": _mean(rates)} for key, rates in sorted(buckets.items())}
    best = sorted(rated, key=lambda pair: (-pair[1], str(pair[0].get("id"))))
    worst = sorted(rated, key=lambda pair: (pair[1], str(pair[0].get("id"))))
    return {
        "count": len(rated),
        "baseline": _mean([rate for _, rate in rated]),
        "by": by,
        "top": [meta["id"] for meta, _ in best[:LIST_SIZE]],
        "bottom": [meta["id"] for meta, _ in worst[:LIST_SIZE]],
        "rates": {meta["id"]: rate for meta, rate in rated},
        "confidence": _confidence(len(rated)),
    }


def _table(title: str, groups: dict) -> list[str]:
    lines = ["### %s" % title, "", "| Group | Pieces | Rate |", "| --- | --- | --- |"]
    for key, group in sorted(groups.items(), key=lambda item: (-item[1]["rate"], item[0])):
        lines.append("| %s | %d | %.2f%% |" % (key, group["count"], group["rate"]))
    return lines


def _ranked(label: str, ids: list[str], rates: dict) -> str:
    return "%s: %s" % (label, ", ".join("%s (%.2f%%)" % (id, rates[id]) if id in rates else id for id in ids))


def playbook_markdown(summary: dict, now: datetime) -> str:
    """The `## Data` section of the playbook; an empty string when there is nothing to report."""
    if not summary.get("count"):
        return ""
    if now.tzinfo is not None:
        now = now.astimezone(content.LISBON)
    lines = ["## Data, as of %s" % now.strftime("%d/%m/%Y"), ""]
    lines.append("Pieces: %d, baseline engagement rate: %.2f%%, confidence %s" % (summary["count"], summary["baseline"], summary["confidence"]))
    for name, title in TABLES:
        lines += ["", *_table(title, summary.get("by", {}).get(name, {}))]
    rates = summary.get("rates", {})
    lines += ["", _ranked("Top", summary.get("top", []), rates), _ranked("Bottom", summary.get("bottom", []), rates)]
    return "\n".join(lines) + "\n"


def merge_data_section(text: str, section: str) -> str:
    """Put `section` (a `## Data` block) into the playbook text, keeping everything else.

    An existing `## Data` section, from its heading to the next `## ` heading or the end of the file,
    is replaced. Without one the section goes after the first heading and its paragraph.
    """
    lines = text.splitlines()
    block = section.rstrip("\n").splitlines()
    start = next((i for i, line in enumerate(lines) if _DATA_HEADING.match(line)), None)
    if start is not None:
        end = next((i for i in range(start + 1, len(lines)) if lines[i].startswith("## ")), len(lines))
        before, after = lines[:start], lines[end:]
    else:
        at = next((i + 1 for i, line in enumerate(lines) if line.startswith("# ")), None)
        if at is None:
            at = 0
        else:
            while at < len(lines) and not lines[at].strip():
                at += 1
            while at < len(lines) and lines[at].strip() and not lines[at].startswith("#"):
                at += 1
        before, after = lines[:at], lines[at:]
        while after and not after[0].strip():
            after = after[1:]
    merged = before + ([""] if before and before[-1].strip() else []) + block + ([""] + after if after else [])
    return "\n".join(merged) + "\n"
