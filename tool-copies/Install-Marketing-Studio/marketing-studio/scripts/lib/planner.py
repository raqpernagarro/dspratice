"""The weekly planner: what fills each network on each day of a week, and whether the week keeps the cadence rules.

Pure functions over Content Object dicts and dates; nothing here reads a file or the network.

The week runs Monday to Sunday. A slot is one network on one day. `build_week` fills the slots in six steps:
channel pieces that already have a date and saved ideas with a campaign that have one (both campaign slots when
they carry a campaign), children reserved for the other networks of a campaign slot, saved ideas without a campaign
that have a date, children of the child-only networks (Viva Engage on Tuesday and Thursday, from that day's LinkedIn
piece), pillar ideas to choose for whatever is still empty (each for the networks its pillar is written for), and the
long-form posts listed beside the grid.
`check_week` reports the cadence rules the plan or the pieces break; `plan_markdown` writes the plan out for reading.
"""
from __future__ import annotations

from datetime import date, timedelta

# The networks that get a post every day and take pillar slots.
NETWORKS = ("linkedin", "instagram", "x")
# Networks that only ever take a child, on the days listed: a repurpose of that day's LinkedIn piece (a campaign post, then a
# pillar piece, then a dated idea that lists LinkedIn). They never take a pillar slot, the week does not ask for them daily, and
# a campaign's children never land on them. Viva Engage is Nagarro's internal network: colleagues get the field notes behind
# the public posts, and the pillars stay public first.
CHILD_ONLY = {"viva": ("tuesday", "thursday")}
CHILD_SOURCE_NETWORK = "linkedin"
# Every network the grid shows, in column order, with its heading.
SLOT_NETWORKS = NETWORKS + tuple(CHILD_ONLY)
NETWORK_NAMES = {"linkedin": "LinkedIn", "instagram": "Instagram", "x": "X", "viva": "Viva Engage"}
WEEKDAYS = ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")
HEAVY_FORMATS = ("article", "carousel-pdf", "carousel")
# The networks each pillar is written for; an idea may only take a pillar that fits at least one network of its day.
PILLAR_NETWORKS = {1: ("linkedin", "x"), 2: ("linkedin",), 3: ("linkedin", "x"), 4: ("instagram", "linkedin")}
# About one pillar idea in five is reactive: it keeps its date and carries an evergreen fallback.
REACTIVE_EVERY = 5

# The slot kinds that count towards a pillar's share of a network's week; campaign and child slots are deliberate and exempt,
# a campaign slot filled by a saved idea with a campaign among them.
PILLAR_KINDS = ("idea", "reactive", "pillar-piece")
CAP_SHARE = 0.5
MONTHS = ("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December")


def week_days(monday: date) -> list[date]:
    """The seven days of the week that starts on `monday`."""
    return [monday + timedelta(days=offset) for offset in range(7)]


def _day(obj: dict) -> str:
    """The date part of the object's `scheduled_date`, in its own offset, or an empty string when it has none."""
    value = obj.get("scheduled_date")
    return value[:10] if isinstance(value, str) else ""


def _is_live_post(obj: dict) -> bool:
    return obj.get("type") == "post" and obj.get("status") != "archived"


def _is_article(obj: dict) -> bool:
    return obj.get("surface") == "linkedin" and obj.get("format") == "article"


def _is_channel_piece(obj: dict) -> bool:
    """A post that fills a slot: LinkedIn (but not an article), Instagram, X or Viva Engage."""
    return _is_live_post(obj) and obj.get("surface") in SLOT_NETWORKS and not _is_article(obj)


def _is_long_form(obj: dict) -> bool:
    """A post that is listed beside the grid: a LinkedIn article, or anything on Substack."""
    return _is_live_post(obj) and (_is_article(obj) or obj.get("surface") == "substack")


def _slot(day: str, network: str, kind: str, id: str | None = None, campaign: str | None = None, pillar: int | None = None,
          fmt: str | None = None, source_id: str | None = None) -> dict:
    return {"day": day, "network": network, "kind": kind, "id": id, "campaign": campaign, "pillar": pillar, "format": fmt, "source_id": source_id}


def _over_cap(network: str, count: int, total: int) -> bool:
    """Whether one pillar holding `count` of a network's `total` pillar slots is above the cap.

    The cap is half the slots. It gives way where the pillars written for the network cannot be spread that thin: Instagram
    has one pillar and X two, so the least any pillar can hold is the total divided by those pillars, rounded up. That also
    covers a lone slot, which cannot be split at all.
    """
    writers = max(1, sum(1 for networks in PILLAR_NETWORKS.values() if network in networks))
    return count > max(total * CAP_SHARE, -(-total // writers))


def _is_saved_idea(obj: dict) -> bool:
    """An idea file that is still in play: it keeps its day and surfaces until it becomes pieces or is dropped."""
    return obj.get("type") == "idea" and obj.get("status") in ("idea", "approved", "draft")


def _is_campaign_idea(obj: dict) -> bool:
    """A saved idea with a campaign: on its day it fills a campaign slot, as a campaign post does."""
    return _is_saved_idea(obj) and bool(obj.get("campaign"))


def _idea_networks(idea: dict) -> list[str]:
    """The networks a saved idea fills: those its `surfaces` lists, or all three when it has no list, as a new idea does."""
    listed = idea.get("surfaces")
    return [network for network in NETWORKS if listed is None or network in listed]


def _priority(campaigns: dict[str, dict], piece: dict) -> float:
    """The priority of the piece's campaign, 1 being first; a piece without a campaign, or a campaign without one, comes last."""
    value = (campaigns.get(piece.get("campaign")) or {}).get("priority")
    return value if isinstance(value, (int, float)) and not isinstance(value, bool) else float("inf")


def _child_source(objects: list[dict], campaigns: dict[str, dict], day: str) -> dict | None:
    """What a child-only network repurposes on `day`: the day's LinkedIn piece, a campaign post first, then a pillar piece, then
    a dated idea that lists LinkedIn; among equals the lower campaign priority, then the lower id. None when the day has none."""
    candidates = [o for o in objects if _day(o) == day and (
        (_is_channel_piece(o) and o.get("surface") == CHILD_SOURCE_NETWORK)
        or (_is_saved_idea(o) and CHILD_SOURCE_NETWORK in _idea_networks(o)))]

    def rank(obj: dict) -> tuple:
        tier = 2 if obj.get("type") == "idea" else (0 if obj.get("campaign") else 1)
        return (tier, _priority(campaigns, obj), str(obj.get("id")))

    return min(candidates, key=rank) if candidates else None


def to_repurpose(plan: dict) -> list[dict]:
    """The child slots still to write: those no piece holds yet, each with the id it is repurposed from."""
    return [slot for slot in plan["slots"] if slot["kind"] == "child" and not slot["id"]]


def build_week(objects: list[dict], campaigns: dict[str, dict], monday: date) -> dict:
    """Lay out the week that starts on `monday`.

    Returns {"monday": iso, "slots": [...], "ideas": [...], "long_form": [...]}; slots are in day then network order.
    "ideas" holds the pillar ideas still to choose, so a network a saved idea already covers is not in it.
    """
    days = [d.isoformat() for d in week_days(monday)]
    in_week = set(days)
    slots: dict = {}

    # 1. Dated channel pieces fill their slot, and a dated saved idea with a campaign fills each of its surfaces as a campaign
    # slot, exempt from the cap like a campaign post. When two share one, a campaign beats no campaign, then the campaign with
    # the lower priority number wins, then a piece beats an idea (so an idea's drafts take its slots), then the lower id. A
    # piece that loses is listed under "also", and so is an idea that loses to an idea; an idea that loses to a piece drops out.
    # A dated piece on a child-only network is a campaign slot when it has a campaign and a child otherwise, never a pillar slot.
    idea_ids = {o.get("id") for o in objects if _is_saved_idea(o)}
    claims = [(o, o["surface"]) for o in objects if _is_channel_piece(o) and _day(o) in in_week]
    claims += [(o, n) for o in objects if _is_campaign_idea(o) and _day(o) in in_week for n in _idea_networks(o)]

    def order(claim: tuple) -> tuple:
        obj = claim[0]
        return (not obj.get("campaign"), _priority(campaigns, obj), obj.get("type") == "idea", str(obj.get("id")))

    for obj, network in sorted(claims, key=order):
        key = (_day(obj), network)
        is_idea = obj.get("type") == "idea"
        if key in slots:
            if not is_idea or slots[key]["id"] in idea_ids:
                slots[key].setdefault("also", []).append(obj.get("id"))
        elif network in CHILD_ONLY:
            kind = "campaign" if obj.get("campaign") else "child"
            slots[key] = _slot(key[0], network, kind, obj.get("id"), obj.get("campaign"), obj.get("pillar"), obj.get("format"),
                               None if kind == "campaign" else obj.get("parent"))
        else:
            kind = "campaign" if obj.get("campaign") else "pillar-piece"
            slots[key] = _slot(key[0], network, kind, obj.get("id"), obj.get("campaign"), obj.get("pillar"), None if is_idea else obj.get("format"))

    # 2. A campaign slot reserves a child slot on each other network its campaign lists, when that slot is still empty. A
    # surface a campaign idea lists is already filled in step 1, by the idea or by what beat it, so it is never a child.
    for day in days:
        for network in NETWORKS:
            source = slots.get((day, network))
            if source is None or source["kind"] != "campaign":
                continue
            listed = (campaigns.get(source["campaign"]) or {}).get("surfaces") or []
            for other in NETWORKS:
                if other != network and other in listed and (day, other) not in slots:
                    slots[(day, other)] = _slot(day, other, "child", None, source["campaign"], source["pillar"], None, source["id"])

    # 3. A saved idea without a campaign, with a date, fills each of its surfaces that is still empty, so it is not asked for
    # again; its slots count towards the cap. Without a surfaces list it stands for all three networks, as a new idea does.
    # Where another idea holds the slot it is listed under "also"; where a piece or a child holds it, it drops out.
    for idea in sorted((o for o in objects if _is_saved_idea(o) and not _is_campaign_idea(o) and _day(o) in in_week), key=lambda o: str(o.get("id"))):
        for network in _idea_networks(idea):
            key = (_day(idea), network)
            if key not in slots:
                kind = "reactive" if idea.get("reactive") is True else "idea"
                slots[key] = _slot(key[0], network, kind, idea.get("id"), idea.get("campaign"), idea.get("pillar"))
            elif slots[key]["id"] in idea_ids:
                slots[key].setdefault("also", []).append(idea.get("id"))

    # 4. A child-only network takes a child on each of its days that is still empty, repurposed from that day's LinkedIn piece
    # (see _child_source). A day whose LinkedIn slot is only a pillar idea to choose has no piece yet, so it gets no slot.
    for network, weekdays in CHILD_ONLY.items():
        for day in days:
            if WEEKDAYS[date.fromisoformat(day).weekday()] not in weekdays or (day, network) in slots:
                continue
            source = _child_source(objects, campaigns, day)
            if source is not None:
                slots[(day, network)] = _slot(day, network, "child", None, source.get("campaign"), source.get("pillar"), None, source.get("id"))

    # 5. What is still empty becomes pillar ideas to choose. The cap is judged against each network's final number of pillar
    # slots, so count what the week holds before handing any pillar out.
    empty = {day: [n for n in NETWORKS if (day, n) not in slots] for day in days}
    total = {n: 0 for n in NETWORKS}
    used: dict = {n: {} for n in NETWORKS}
    for (day, network), slot in slots.items():
        if slot["kind"] in PILLAR_KINDS and network in total:
            total[network] += 1
            if slot["pillar"] is not None:
                used[network][slot["pillar"]] = used[network].get(slot["pillar"], 0) + 1
    for day in days:
        for network in empty[day]:
            total[network] += 1

    # An idea covers only the empty networks its pillar is written for; what is left on the day gets further ideas. The rotation
    # moves on once per day, after the day's first idea: the others only fill the day's gaps, and moving it for them would hand
    # Instagram's one pillar the turn after every first idea and starve the rest.
    pillars = sorted(PILLAR_NETWORKS)
    cursor = 0
    ideas = []
    for day in days:
        remaining = empty[day]
        first = True
        while remaining:
            order = [pillars[(cursor + step) % len(pillars)] for step in range(len(pillars))]
            fitting = [p for p in order if any(n in PILLAR_NETWORKS[p] for n in remaining)]
            open_ones = [p for p in fitting if not any(_over_cap(n, used[n].get(p, 0) + 1, total[n]) for n in remaining if n in PILLAR_NETWORKS[p])]
            # When every pillar is blocked, the first that fits by network is taken and check_week reports the breach.
            pillar = (open_ones or fitting or order)[0]
            networks = [n for n in remaining if n in PILLAR_NETWORKS[pillar]] or list(remaining)
            if first:
                cursor = (pillars.index(pillar) + 1) % len(pillars)
                first = False
            remaining = [n for n in remaining if n not in networks]
            reactive = (len(ideas) + 1) % REACTIVE_EVERY == 0
            ideas.append({"day": day, "networks": sorted(networks), "pillar": pillar, "reactive": reactive})
            for network in networks:
                used[network][pillar] = used[network].get(pillar, 0) + 1
                slots[(day, network)] = _slot(day, network, "reactive" if reactive else "idea", None, None, pillar)

    # 6. Long-form posts of the week.
    long_form = sorted(
        ({"day": _day(o), "id": o.get("id")} for o in objects if _is_long_form(o) and _day(o) in in_week),
        key=lambda entry: (entry["day"], str(entry["id"])),
    )
    ordered = [slots[(day, network)] for day in days for network in SLOT_NETWORKS if (day, network) in slots]
    return {"monday": monday.isoformat(), "slots": ordered, "ideas": ideas, "long_form": long_form}


def check_week(plan: dict, objects: list[dict]) -> list[str]:
    """One message per breach of the cadence rules, in rule order; an empty list means the week is clean."""
    days = [d.isoformat() for d in week_days(date.fromisoformat(plan["monday"]))]
    in_week = set(days)
    slots = plan["slots"]
    problems = []

    # Every network gets a post every day; a child-only network is not asked for one.
    filled = {(s["day"], s["network"]) for s in slots}
    for day in days:
        for network in NETWORKS:
            if (day, network) not in filled:
                problems.append("no post on %s on %s" % (network, day))

    # Among pillar slots, no pillar above its cap's share of a network's week.
    for network in NETWORKS:
        pillar_slots = [s for s in slots if s["network"] == network and s["kind"] in PILLAR_KINDS]
        counts: dict = {}
        for slot in pillar_slots:
            if slot["pillar"] is not None:
                counts[slot["pillar"]] = counts.get(slot["pillar"], 0) + 1
        for pillar in sorted(counts):
            if _over_cap(network, counts[pillar], len(pillar_slots)):
                problems.append("pillar %s holds %d of %d pillar slots on %s, the cap is 50%%" % (pillar, counts[pillar], len(pillar_slots), network))

    # No two heavy formats on one day and network. A clash between campaign pieces only is deliberate, so it is not reported.
    heavy: dict = {}
    for obj in objects:
        if _is_live_post(obj) and obj.get("surface") in NETWORKS and _day(obj) in in_week and obj.get("format") in HEAVY_FORMATS:
            heavy.setdefault((_day(obj), obj["surface"]), []).append(obj)
    for day in days:
        for network in NETWORKS:
            group = heavy.get((day, network), [])
            if len(group) >= 2 and not all(o.get("campaign") for o in group):
                problems.append("two heavy formats on %s on %s" % (network, day))

    # An article's promo never goes out on the article's own day.
    by_id = {o.get("id"): o for o in objects if o.get("id")}
    for obj in sorted((o for o in objects if _is_live_post(o) and _day(o) in in_week), key=lambda o: str(o.get("id"))):
        parent = by_id.get(obj.get("parent"))
        if parent is not None and parent.get("format") == "article" and _day(parent) == _day(obj):
            problems.append("promo on its article's day: %s" % obj.get("id"))
    return problems


def _cell(slot: dict | None, network: str = "linkedin") -> str:
    """One grid cell. An empty slot reads "no post", except on a child-only network, which is empty on most days by design."""
    if slot is None:
        return "" if network in CHILD_ONLY else "no post"
    if slot["kind"] in ("idea", "reactive") and not slot["id"]:
        text = "%s: pillar %s" % (slot["kind"], slot["pillar"])
    else:
        text = "%s: %s" % (slot["kind"], slot["id"] or slot["source_id"])
    if slot.get("also"):
        text += " (also %s)" % ", ".join(str(i) for i in slot["also"])
    return text


def _long_date(iso_day: str) -> str:
    """26 October 2026, in English whatever the machine's locale."""
    parsed = date.fromisoformat(iso_day)
    return "%d %s %d" % (parsed.day, MONTHS[parsed.month - 1], parsed.year)


def plan_markdown(plan: dict, objects: list[dict]) -> str:
    """The plan as Markdown: the grid, then the ideas to choose, the pieces to repurpose and the long-form posts.

    `objects` is accepted to match `check_week`; the plan already carries everything the page shows.
    """
    days = [d.isoformat() for d in week_days(date.fromisoformat(plan["monday"]))]
    by_slot = {(s["day"], s["network"]): s for s in plan["slots"]}
    lines = ["# Week of %s" % _long_date(plan["monday"]), "",
             "| Day | %s |" % " | ".join(NETWORK_NAMES[network] for network in SLOT_NETWORKS),
             "|---|%s" % ("---|" * len(SLOT_NETWORKS))]
    for day in days:
        lines.append("| %s | %s |" % (day, " | ".join(_cell(by_slot.get((day, network)), network) for network in SLOT_NETWORKS)))

    lines += ["", "## Ideas to choose", ""]
    for idea in plan["ideas"]:
        lines.append("- %s: pillar %s on %s%s" % (idea["day"], idea["pillar"], ", ".join(idea["networks"]), ", reactive" if idea["reactive"] else ""))
    if not plan["ideas"]:
        lines.append("None.")

    lines += ["", "## To repurpose", ""]
    children = to_repurpose(plan)
    for slot in children:
        lines.append("- %s %s: from %s" % (slot["day"], slot["network"], slot["source_id"]))
    if not children:
        lines.append("None.")

    lines += ["", "## Long-form", ""]
    for entry in plan["long_form"]:
        lines.append("- %s: %s" % (entry["day"], entry["id"]))
    if not plan["long_form"]:
        lines.append("None.")
    return "\n".join(lines) + "\n"
