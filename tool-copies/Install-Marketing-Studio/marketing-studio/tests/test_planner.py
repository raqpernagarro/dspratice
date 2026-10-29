import unittest
from datetime import date

from scripts.lib import planner

MON = date(2026, 10, 26)


def post(id, surface, day, fmt="text", campaign=None, pillar=1, parent=None, status="in-review"):
    return {"id": id, "type": "post", "status": status, "surface": surface, "format": fmt, "campaign": campaign, "pillar": pillar,
            "parent": parent, "scheduled_date": "%sT08:30:00+00:00" % day}


DS = {"slug": "ds", "surfaces": ["linkedin", "instagram", "x"], "priority": 1}
FLO = {"slug": "flo", "surfaces": ["linkedin", "substack"], "priority": 2, "neutral": True}
CAMPAIGNS = {"ds": DS, "flo": FLO}


def ds_week():
    objects = []
    for n, day in enumerate(["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30"]):
        objects.append(post("ds-%d" % n, "linkedin", day, fmt="carousel-pdf" if n == 1 else "image", campaign="ds", pillar=3))
        objects.append(post("ds-%d-ig" % n, "instagram", day, fmt="image", campaign="ds", pillar=3, parent="ds-%d" % n))
    objects.append(post("flo-art", "linkedin", "2026-10-27", fmt="article", campaign="flo", pillar=4))
    return objects


class BuildWeek(unittest.TestCase):
    def test_week_days(self):
        days = planner.week_days(MON)
        self.assertEqual((days[0], days[6], len(days)), (MON, date(2026, 11, 1), 7))

    def test_campaign_first_then_children_then_ideas(self):
        plan = planner.build_week(ds_week(), CAMPAIGNS, MON)
        slots = {(s["day"], s["network"]): s for s in plan["slots"]}
        self.assertEqual(len(slots), 23)  # 21 on the three daily networks, and Viva Engage on Tuesday and Thursday
        self.assertEqual(slots[("2026-10-26", "linkedin")]["kind"], "campaign")
        self.assertEqual(slots[("2026-10-26", "instagram")]["kind"], "campaign")
        self.assertEqual((slots[("2026-10-26", "x")]["kind"], slots[("2026-10-26", "x")]["source_id"]), ("child", "ds-0"))
        self.assertIn(slots[("2026-10-31", "linkedin")]["kind"], ("idea", "reactive"))
        ideas = plan["ideas"]
        # An idea covers only the networks its pillar is written for: Saturday takes pillar 1 on linkedin and x, then pillar 4 on instagram;
        # Sunday takes pillar 2 on linkedin, pillar 3 on x and pillar 4 on instagram.
        self.assertEqual([i["day"] for i in ideas], ["2026-10-31"] * 2 + ["2026-11-01"] * 3)
        self.assertEqual([(i["pillar"], i["networks"]) for i in ideas[:2]], [(1, ["linkedin", "x"]), (4, ["instagram"])])
        self.assertEqual(plan["long_form"], [{"day": "2026-10-27", "id": "flo-art"}])
        self.assertEqual(planner.check_week(plan, ds_week()), [])

    def test_empty_week_gets_sixteen_ideas_three_reactive(self):
        # Was seven ideas, one reactive: one idea per day covering all three networks. An idea now covers only the networks its pillar
        # is written for, so a day takes two ideas (pillar 1 or 3 on linkedin and x, then pillar 4 on instagram; or pillar 4 on
        # instagram and linkedin, then pillar 1 on x) or three when pillar 2, which is linkedin only, leads. Five days take two
        # and two days take three, 16 ideas; every fifth in day order is reactive, the 5th, 10th and 15th.
        plan = planner.build_week([], {}, MON)
        self.assertEqual(len(plan["ideas"]), 16)
        self.assertEqual([n for n, i in enumerate(plan["ideas"]) if i["reactive"]], [4, 9, 14])
        self.assertEqual(sorted({i["day"] for i in plan["ideas"]}), [d.isoformat() for d in planner.week_days(MON)])
        self.assertEqual(planner.check_week(plan, []), [])
        self.assertTrue(all(i["pillar"] in (1, 2, 3, 4) for i in plan["ideas"]))
        # No pillar above half of linkedin's week; x has two pillars to share seven slots, so four is the least one can hold.
        for network, most in (("linkedin", 3), ("x", 4)):
            held = [i["pillar"] for i in plan["ideas"] if network in i["networks"]]
            self.assertEqual(len(held), 7)
            self.assertLessEqual(max(held.count(p) for p in set(held)), most)
        # The rotation reaches every pillar on linkedin.
        self.assertEqual({i["pillar"] for i in plan["ideas"] if "linkedin" in i["networks"]}, {1, 2, 3, 4})

    def test_no_idea_lists_a_network_its_pillar_does_not(self):
        for objects, found in (([], {}), (ds_week(), CAMPAIGNS)):
            plan = planner.build_week(objects, found, MON)
            for idea in plan["ideas"]:
                self.assertTrue(set(idea["networks"]) <= set(planner.PILLAR_NETWORKS[idea["pillar"]]), idea)
            for slot in plan["slots"]:
                if slot["kind"] in ("idea", "reactive"):
                    self.assertIn(slot["network"], planner.PILLAR_NETWORKS[slot["pillar"]], slot)
            self.assertFalse([s for s in plan["slots"] if s["pillar"] == 2 and s["kind"] in ("idea", "reactive") and s["network"] != "linkedin"])
            covered = {(i["day"], n) for i in plan["ideas"] for n in i["networks"]}
            self.assertEqual(len(covered), sum(len(i["networks"]) for i in plan["ideas"]))
            self.assertEqual(covered, {(s["day"], s["network"]) for s in plan["slots"] if s["kind"] in ("idea", "reactive")})

    def test_pillar_network_fit(self):
        objects = ds_week()
        plan = planner.build_week(objects, CAMPAIGNS, MON)
        x_only = [i for i in plan["ideas"] if i["networks"] == ["x"]]
        self.assertTrue(all(i["pillar"] in (1, 3) for i in x_only))


class CheckWeek(unittest.TestCase):
    def test_reports_breaches(self):
        objects = [post("a", "linkedin", "2026-10-27", fmt="carousel-pdf", campaign="ds", pillar=3), post("art", "linkedin", "2026-10-27", fmt="article", pillar=4),
                   post("promo", "linkedin", "2026-10-27", fmt="image", pillar=4, parent="art")]
        plan = planner.build_week(objects, CAMPAIGNS, MON)
        problems = planner.check_week(plan, objects)
        self.assertIn("two heavy formats on linkedin on 2026-10-27", problems)
        self.assertIn("promo on its article's day: promo", problems)
        plan["slots"] = [s for s in plan["slots"] if not (s["day"] == "2026-10-28" and s["network"] == "x")]
        self.assertIn("no post on x on 2026-10-28", planner.check_week(plan, objects))

    def test_cap(self):
        plan = planner.build_week([], {}, MON)
        for idea in plan["ideas"]:
            idea["pillar"] = 1
        for slot in plan["slots"]:
            slot["pillar"] = 1
        self.assertTrue(any(p.startswith("pillar 1 holds") for p in planner.check_week(plan, [])))


class Markdown(unittest.TestCase):
    def test_table_and_lists(self):
        text = planner.plan_markdown(planner.build_week(ds_week(), CAMPAIGNS, MON), ds_week())
        self.assertTrue(text.startswith("# Week of 26 October 2026"))
        self.assertIn("| Day | LinkedIn | Instagram | X |", text)
        self.assertIn("## Ideas to choose", text)
        self.assertIn("## To repurpose", text)
        self.assertIn("child: ds-0", text)
        self.assertNotRegex(text, "[\u2014\u2013]")


class Edges(unittest.TestCase):
    def test_two_pieces_on_one_slot(self):
        objects = [post("b", "linkedin", "2026-10-26"), post("a", "linkedin", "2026-10-26")]
        plan = planner.build_week(objects, {}, MON)
        slot = [s for s in plan["slots"] if (s["day"], s["network"]) == ("2026-10-26", "linkedin")]
        self.assertEqual(len(plan["slots"]), 21)
        self.assertEqual(len(slot), 1)
        self.assertEqual((slot[0]["id"], slot[0]["also"]), ("a", ["b"]))
        self.assertIn("pillar-piece: a (also b)", planner.plan_markdown(plan, objects))

    def test_children_only_for_listed_surfaces(self):
        objects = [post("p", "linkedin", "2026-10-26", campaign="ds", pillar=3)]
        for campaign in ({"slug": "ds"}, {"slug": "ds", "surfaces": ["linkedin"]}, {"slug": "ds", "surfaces": ["linkedin", "substack"]}):
            plan = planner.build_week(objects, {"ds": campaign}, MON)
            self.assertEqual([s for s in plan["slots"] if s["kind"] == "child"], [])
        plan = planner.build_week(objects, {"ds": {"slug": "ds", "surfaces": ["linkedin", "x"]}}, MON)
        self.assertEqual([(s["network"], s["source_id"], s["pillar"]) for s in plan["slots"] if s["kind"] == "child"], [("x", "p", 3)])

    def test_pieces_that_do_not_fill_a_slot(self):
        objects = [post("old", "linkedin", "2026-10-26", status="archived"), post("next", "x", "2026-11-02"),
                   post("art", "linkedin", "2026-10-28", fmt="article"), post("sub", "substack", "2026-10-29", fmt="essay"),
                   post("gone", "substack", "2026-10-29", fmt="note", status="archived"), dict(post("idea", "x", "2026-10-26"), type="idea")]
        plan = planner.build_week(objects, {}, MON)
        self.assertEqual([s["kind"] for s in plan["slots"]].count("pillar-piece"), 0)
        self.assertEqual(plan["long_form"], [{"day": "2026-10-28", "id": "art"}, {"day": "2026-10-29", "id": "sub"}])

    def test_rotation_skips_a_pillar_at_the_cap(self):
        objects = [post("p%d" % n, "linkedin", day, pillar=1) for n, day in enumerate(["2026-10-26", "2026-10-27", "2026-10-28"])]
        plan = planner.build_week(objects, {}, MON)
        self.assertEqual([(i["day"], i["networks"]) for i in plan["ideas"][:2]], [("2026-10-26", ["x"]), ("2026-10-26", ["instagram"])])
        self.assertTrue(all(i["pillar"] != 1 for i in plan["ideas"] if "linkedin" in i["networks"]))
        self.assertEqual(planner.check_week(plan, objects), [])

    def test_a_single_pillar_slot_is_not_a_breach(self):
        objects = [post("c%d" % n, "linkedin", "2026-10-%d" % (26 + n), campaign="ds", pillar=3) for n in range(6)]
        plan = planner.build_week(objects, {"ds": {"slug": "ds", "surfaces": ["linkedin"]}}, MON)
        self.assertEqual(len([s for s in plan["slots"] if s["network"] == "linkedin" and s["kind"] == "idea"]), 1)
        self.assertEqual(planner.check_week(plan, objects), [])

    def test_the_cap_gives_way_where_a_network_has_too_few_pillars(self):
        plan = planner.build_week([], {}, MON)
        for slot in plan["slots"]:
            if slot["network"] != "linkedin":
                slot["pillar"] = 4 if slot["network"] == "instagram" else 1
        for slot in [s for s in plan["slots"] if s["network"] == "x"][:3]:
            slot["pillar"] = 3
        self.assertEqual([p for p in planner.check_week(plan, []) if "instagram" in p or " x" in p], [])
        [s for s in plan["slots"] if s["network"] == "x"][0]["pillar"] = 1
        self.assertIn("pillar 1 holds 5 of 7 pillar slots on x, the cap is 50%", planner.check_week(plan, []))

    def test_clashes_between_campaign_pieces_are_deliberate(self):
        objects = [post("a", "instagram", "2026-10-27", fmt="carousel", campaign="ds"), post("b", "instagram", "2026-10-27", fmt="carousel", campaign="ds")]
        self.assertEqual(planner.check_week(planner.build_week(objects, CAMPAIGNS, MON), objects), [])
        objects.append(post("c", "instagram", "2026-10-27", fmt="carousel"))
        self.assertIn("two heavy formats on instagram on 2026-10-27", planner.check_week(planner.build_week(objects, CAMPAIGNS, MON), objects))

    def test_empty_sections_say_none(self):
        text = planner.plan_markdown(planner.build_week([], {}, MON), [])
        self.assertEqual(text.count("None."), 2)
        self.assertIn("## Long-form", text)

    def test_a_campaign_piece_beats_a_pillar_piece_for_the_slot(self):
        objects = [post("a-pillar", "linkedin", "2026-10-26"), post("z-camp", "linkedin", "2026-10-26", campaign="ds", pillar=3)]
        plan = planner.build_week(objects, CAMPAIGNS, MON)
        slots = {(s["day"], s["network"]): s for s in plan["slots"]}
        slot = slots[("2026-10-26", "linkedin")]
        self.assertEqual((slot["id"], slot["kind"], slot["also"]), ("z-camp", "campaign", ["a-pillar"]))
        self.assertEqual([(slots[("2026-10-26", n)]["kind"], slots[("2026-10-26", n)]["source_id"]) for n in ("instagram", "x")], [("child", "z-camp")] * 2)

    def test_the_campaign_with_the_lower_priority_number_wins_the_slot(self):
        objects = [post("a-flo", "linkedin", "2026-10-26", campaign="flo"), post("z-ds", "linkedin", "2026-10-26", campaign="ds"), post("m-ds", "linkedin", "2026-10-26", campaign="ds")]
        slot = [s for s in planner.build_week(objects, CAMPAIGNS, MON)["slots"] if (s["day"], s["network"]) == ("2026-10-26", "linkedin")][0]
        self.assertEqual((slot["id"], slot["also"]), ("m-ds", ["z-ds", "a-flo"]))
        no_priority = {"ds": {"slug": "ds"}, "flo": {"slug": "flo", "priority": 2}}
        slot = [s for s in planner.build_week(objects, no_priority, MON)["slots"] if (s["day"], s["network"]) == ("2026-10-26", "linkedin")][0]
        self.assertEqual(slot["id"], "a-flo")


def idea(id, day, surfaces=("linkedin", "instagram", "x"), pillar=1, status="idea", **extra):
    meta = {"id": id, "type": "idea", "status": status, "pillar": pillar, "campaign": None, "surfaces": list(surfaces), "scheduled_date": "%sT08:30:00+00:00" % day}
    meta.update(extra)
    return meta


class SavedIdeas(unittest.TestCase):
    def test_a_saved_idea_covers_its_surfaces_and_leaves_the_rest(self):
        objects = [idea("saved", "2026-10-31", surfaces=("linkedin", "x"), pillar=3)]
        plan = planner.build_week(objects, CAMPAIGNS, MON)
        slots = {(s["day"], s["network"]): s for s in plan["slots"]}
        for network in ("linkedin", "x"):
            slot = slots[("2026-10-31", network)]
            self.assertEqual((slot["kind"], slot["id"], slot["pillar"], slot["campaign"]), ("idea", "saved", 3, None))
        self.assertEqual(slots[("2026-10-31", "instagram")]["id"], None)
        saturday = [i for i in plan["ideas"] if i["day"] == "2026-10-31"]
        self.assertEqual([(i["networks"], i["pillar"]) for i in saturday], [(["instagram"], 4)])
        text = planner.plan_markdown(plan, objects)
        self.assertIn("| 2026-10-31 | idea: saved | idea: pillar 4 | idea: saved |", text)
        self.assertEqual(planner.check_week(plan, objects), [])

    def test_a_week_covered_by_saved_ideas_has_nothing_to_choose(self):
        objects = [idea("i%d" % n, d.isoformat(), pillar=1 + n % 4, reactive=(n == 4)) for n, d in enumerate(planner.week_days(MON))]
        plan = planner.build_week(objects, {}, MON)
        self.assertEqual(plan["ideas"], [])
        self.assertEqual(len(plan["slots"]), 23)  # the Tuesday and Thursday ideas list LinkedIn, so Viva Engage takes a child of each
        self.assertEqual({s["kind"] for s in plan["slots"] if s["day"] == "2026-10-30"}, {"reactive"})
        self.assertIn("| 2026-10-30 | reactive: i4 | reactive: i4 | reactive: i4 |", planner.plan_markdown(plan, objects))
        self.assertIn("None.", planner.plan_markdown(plan, objects))

    def test_only_ideas_still_in_play_with_a_day_in_the_week_count(self):
        objects = [idea("done", "2026-10-26", status="archived"), idea("out", "2026-11-02"), dict(idea("undated", "2026-10-26"), scheduled_date=None)]
        objects += [idea("approved", "2026-10-27", status="approved"), idea("draft", "2026-10-28", status="draft"), idea("pub", "2026-10-29", status="published")]
        plan = planner.build_week(objects, {}, MON)
        taken = {s["day"] for s in plan["slots"] if s["id"]}
        self.assertEqual(taken, {"2026-10-27", "2026-10-28"})

    def test_a_piece_or_child_keeps_its_slot_and_saved_ideas_share_by_id(self):
        objects = [post("p", "linkedin", "2026-10-26", campaign="ds", pillar=3), idea("b", "2026-10-26", surfaces=("linkedin", "x")), idea("a", "2026-10-26", surfaces=("x",))]
        plan = planner.build_week(objects, CAMPAIGNS, MON)
        slots = {(s["day"], s["network"]): s for s in plan["slots"]}
        self.assertEqual(slots[("2026-10-26", "linkedin")]["id"], "p")
        self.assertEqual(slots[("2026-10-26", "x")]["kind"], "child")
        self.assertEqual(slots[("2026-10-26", "instagram")]["kind"], "child")
        objects = [idea("b", "2026-10-26", surfaces=("x",)), idea("a", "2026-10-26", surfaces=("x",))]
        slot = [s for s in planner.build_week(objects, {}, MON)["slots"] if (s["day"], s["network"]) == ("2026-10-26", "x")][0]
        self.assertEqual((slot["id"], slot["also"]), ("a", ["b"]))

    def test_saved_ideas_count_towards_the_cap(self):
        objects = [idea("i%d" % n, d.isoformat(), surfaces=("linkedin",), pillar=1) for n, d in enumerate(planner.week_days(MON)[:3])]
        plan = planner.build_week(objects, {}, MON)
        self.assertEqual(planner.check_week(plan, objects), [])
        self.assertTrue(all(i["pillar"] != 1 for i in plan["ideas"] if "linkedin" in i["networks"]))
        objects += [idea("j", "2026-11-01", surfaces=("linkedin",), pillar=1)]
        problems = planner.check_week(planner.build_week(objects, {}, MON), objects)
        self.assertIn("pillar 1 holds 4 of 7 pillar slots on linkedin, the cap is 50%", problems)


LI_X = {"slug": "li-x", "surfaces": ["linkedin", "x"], "priority": 1}


def weekday_campaign_ideas(campaign):
    """Five pillar 3 ideas on LinkedIn, Monday to Friday, as content-planner campaign saves them with --campaign."""
    return [idea("c%d" % n, d.isoformat(), surfaces=("linkedin",), pillar=3, campaign=campaign) for n, d in enumerate(planner.week_days(MON)[:5])]


class CampaignIdeas(unittest.TestCase):
    def test_a_dated_idea_with_a_campaign_is_a_campaign_slot_and_reserves_children(self):
        objects = weekday_campaign_ideas("li-x")
        plan = planner.build_week(objects, {"li-x": LI_X}, MON)
        slots = {(s["day"], s["network"]): s for s in plan["slots"]}
        for n, d in enumerate(planner.week_days(MON)[:5]):
            day = d.isoformat()
            self.assertEqual((slots[(day, "linkedin")]["kind"], slots[(day, "linkedin")]["id"], slots[(day, "linkedin")]["campaign"]), ("campaign", "c%d" % n, "li-x"))
            self.assertEqual((slots[(day, "x")]["kind"], slots[(day, "x")]["source_id"], slots[(day, "x")]["pillar"]), ("child", "c%d" % n, 3))
            self.assertIsNone(slots[(day, "instagram")]["id"])  # the campaign does not list instagram: an idea to choose
        self.assertEqual(planner.check_week(plan, objects), [])
        self.assertFalse([i for i in plan["ideas"] if "linkedin" in i["networks"] and i["day"] <= "2026-10-30"])
        text = planner.plan_markdown(plan, objects)
        self.assertIn("| 2026-10-26 | campaign: c0 | idea: pillar 4 | child: c0 |", text)
        self.assertIn("- 2026-10-30 x: from c4", text)

    def test_the_same_ideas_without_a_campaign_count_towards_the_cap(self):
        objects = weekday_campaign_ideas(None)
        plan = planner.build_week(objects, {"li-x": LI_X}, MON)
        self.assertEqual({s["kind"] for s in plan["slots"] if s["id"] in {"c0", "c1", "c2", "c3", "c4"}}, {"idea"})
        # No campaign children; Viva Engage still repurposes the Tuesday and Thursday LinkedIn ideas.
        self.assertEqual([(s["network"], s["source_id"]) for s in plan["slots"] if s["kind"] == "child"], [("viva", "c1"), ("viva", "c3")])
        self.assertIn("pillar 3 holds 5 of 7 pillar slots on linkedin, the cap is 50%", planner.check_week(plan, objects))

    def test_a_surface_the_idea_lists_is_never_its_child(self):
        objects = [idea("c", "2026-10-26", surfaces=("linkedin", "x"), pillar=3, campaign="ds")]
        slots = {(s["day"], s["network"]): s for s in planner.build_week(objects, CAMPAIGNS, MON)["slots"]}
        self.assertEqual([(slots[("2026-10-26", n)]["kind"], slots[("2026-10-26", n)]["id"] or slots[("2026-10-26", n)]["source_id"]) for n in planner.NETWORKS],
                         [("campaign", "c"), ("child", "c"), ("campaign", "c")])
        # Without a surfaces list it stands for all three networks, so the campaign leaves it no child.
        objects = [dict(idea("c", "2026-10-26", pillar=3, campaign="ds"), surfaces=None)]
        slots = planner.build_week(objects, CAMPAIGNS, MON)["slots"]
        self.assertEqual([(s["kind"], s["id"]) for s in slots if s["day"] == "2026-10-26"], [("campaign", "c")] * 3)

    def test_a_campaign_idea_wins_slots_by_priority_like_a_campaign_post(self):
        objects = [post("a-pillar", "linkedin", "2026-10-26"), idea("plain", "2026-10-26", surfaces=("x",)),
                   idea("z-ds", "2026-10-26", surfaces=("linkedin", "x"), pillar=3, campaign="ds"), idea("a-flo", "2026-10-26", surfaces=("linkedin",), pillar=4, campaign="flo")]
        slots = {(s["day"], s["network"]): s for s in planner.build_week(objects, CAMPAIGNS, MON)["slots"]}
        linkedin, x = slots[("2026-10-26", "linkedin")], slots[("2026-10-26", "x")]
        # ds has priority 1, flo 2: the ds idea takes LinkedIn, the flo idea and the pillar piece are listed beside it.
        self.assertEqual((linkedin["kind"], linkedin["id"], linkedin["also"]), ("campaign", "z-ds", ["a-flo", "a-pillar"]))
        self.assertEqual((x["kind"], x["id"], x["also"]), ("campaign", "z-ds", ["plain"]))
        self.assertEqual(slots[("2026-10-26", "instagram")]["kind"], "child")

    def test_a_campaign_ideas_drafts_take_its_slots(self):
        objects = [idea("c", "2026-10-26", surfaces=("linkedin", "x"), pillar=3, campaign="ds", status="draft"),
                   post("c-li", "linkedin", "2026-10-26", campaign="ds", pillar=3, parent="c")]
        slots = {(s["day"], s["network"]): s for s in planner.build_week(objects, CAMPAIGNS, MON)["slots"]}
        self.assertEqual((slots[("2026-10-26", "linkedin")]["id"], slots[("2026-10-26", "linkedin")].get("also")), ("c-li", None))
        self.assertEqual((slots[("2026-10-26", "x")]["kind"], slots[("2026-10-26", "x")]["id"]), ("campaign", "c"))  # its X draft is not written yet
        self.assertEqual((slots[("2026-10-26", "instagram")]["kind"], slots[("2026-10-26", "instagram")]["source_id"]), ("child", "c-li"))


class VivaChildren(unittest.TestCase):
    """Viva Engage is a child network only: Tuesday and Thursday, repurposed from that day's LinkedIn piece."""

    def slots(self, objects, found=CAMPAIGNS):
        plan = planner.build_week(objects, found, MON)
        return plan, {(s["day"], s["network"]): s for s in plan["slots"]}

    def test_tuesday_and_thursday_children_and_23_slots_for_the_week_of_26_october(self):
        self.assertEqual(planner.CHILD_ONLY, {"viva": ("tuesday", "thursday")})
        plan, slots = self.slots(ds_week())
        viva = [s for s in plan["slots"] if s["network"] == "viva"]
        self.assertEqual([(s["day"], s["kind"], s["id"], s["source_id"], s["campaign"], s["pillar"]) for s in viva],
                         [("2026-10-27", "child", None, "ds-1", "ds", 3), ("2026-10-29", "child", None, "ds-3", "ds", 3)])
        self.assertEqual(len(plan["slots"]), 23)
        self.assertEqual(planner.check_week(plan, ds_week()), [])
        self.assertEqual([(s["day"], s["network"], s["source_id"]) for s in planner.to_repurpose(plan) if s["network"] == "viva"],
                         [("2026-10-27", "viva", "ds-1"), ("2026-10-29", "viva", "ds-3")])

    def test_never_a_pillar_slot_and_never_asked_for_daily(self):
        plan, _ = self.slots([], {})
        self.assertEqual([s for s in plan["slots"] if s["network"] == "viva"], [])  # no LinkedIn piece yet, only ideas to choose
        self.assertFalse([i for i in plan["ideas"] if "viva" in i["networks"]])
        self.assertEqual(planner.check_week(plan, []), [])
        self.assertEqual(len(plan["slots"]), 21)
        # A saved idea never takes Viva Engage, even when it lists it; a dated viva piece without a campaign is a child.
        objects = [idea("i", "2026-10-28", surfaces=("linkedin", "viva"), pillar=1), post("v", "viva", "2026-10-28", pillar=1, parent="i")]
        plan, slots = self.slots(objects, {})
        self.assertEqual((slots[("2026-10-28", "viva")]["kind"], slots[("2026-10-28", "viva")]["id"]), ("child", "v"))
        self.assertFalse([s for s in plan["slots"] if s["network"] == "viva" and s["kind"] in planner.PILLAR_KINDS])
        self.assertEqual(planner.to_repurpose(plan), [])
        self.assertEqual(planner.check_week(plan, objects), [])

    def test_the_source_is_a_campaign_post_then_a_pillar_piece_then_a_dated_idea(self):
        tuesday = "2026-10-27"
        piece, camp, saved = post("p-piece", "linkedin", tuesday), post("z-camp", "linkedin", tuesday, campaign="ds", pillar=3), idea("a-idea", tuesday)
        for objects, source in (([saved, piece, camp], "z-camp"), ([saved, piece], "p-piece"), ([saved], "a-idea")):
            _, slots = self.slots(objects)
            self.assertEqual((slots[(tuesday, "viva")]["kind"], slots[(tuesday, "viva")]["source_id"]), ("child", source), objects)
        # A dated idea that leaves LinkedIn out, or a LinkedIn article, is no source; nor is a Wednesday piece.
        _, slots = self.slots([idea("x-only", tuesday, surfaces=("x",)), post("art", "linkedin", tuesday, fmt="article"), post("wed", "linkedin", "2026-10-28")])
        self.assertNotIn((tuesday, "viva"), slots)
        self.assertNotIn(("2026-10-28", "viva"), slots)

    def test_a_written_viva_piece_takes_its_slot_and_leaves_nothing_to_repurpose(self):
        objects = ds_week() + [post("ds-1-viva", "viva", "2026-10-27", campaign="ds", pillar=3, parent="ds-1")]
        plan, slots = self.slots(objects)
        self.assertEqual((slots[("2026-10-27", "viva")]["kind"], slots[("2026-10-27", "viva")]["id"]), ("campaign", "ds-1-viva"))
        self.assertEqual([s["day"] for s in planner.to_repurpose(plan) if s["network"] == "viva"], ["2026-10-29"])
        self.assertEqual(len(plan["slots"]), 23)

    def test_the_grid_has_a_viva_engage_column(self):
        plan = planner.build_week(ds_week(), CAMPAIGNS, MON)
        text = planner.plan_markdown(plan, ds_week())
        self.assertIn("| Day | LinkedIn | Instagram | X | Viva Engage |\n|---|---|---|---|---|\n", text)
        self.assertIn("| 2026-10-27 | campaign: ds-1 | campaign: ds-1-ig | child: ds-1 | child: ds-1 |", text)
        self.assertIn("| 2026-10-26 | campaign: ds-0 | campaign: ds-0-ig | child: ds-0 |  |", text)
        self.assertIn("- 2026-10-27 viva: from ds-1", text)
        self.assertNotIn("no post", text)


class CampaignIdeasCli(unittest.TestCase):
    def test_five_pillar_3_ideas_with_a_campaign_print_no_problem_and_reserve_the_x_children(self):
        import io
        import shutil
        import tempfile
        from contextlib import redirect_stdout
        from pathlib import Path

        from scripts import new_idea, plan

        ws = Path(tempfile.mkdtemp()) / "hugo"
        self.addCleanup(shutil.rmtree, ws.parent)
        (ws / "campaigns").mkdir(parents=True)
        (ws / "campaigns" / "li-x.md").write_text("---\nslug: li-x\nmode: personal\npriority: 1\nsurfaces: [linkedin, x]\n---\nBrief.\n")
        for n, d in enumerate(planner.week_days(MON)[:5]):
            new_idea.create(ws, "c%d" % n, "T", "personal", 3, "# Angles\n", campaign="li-x", surfaces=["linkedin"], date=d.isoformat(), now="2026-10-22T10:00:00+01:00")
        out = io.StringIO()
        with redirect_stdout(out):
            code = plan.main(["--workspace", str(ws), "--monday", MON.isoformat()])
        lines = out.getvalue().splitlines()
        self.assertEqual(code, 0)
        self.assertEqual([line for line in lines if line.startswith("problem:")], [])
        expected = []
        for n, d in enumerate(planner.week_days(MON)[:5]):
            expected.append("- %s x: from c%d" % (d.isoformat(), n))
            if n in (1, 3):  # Tuesday and Thursday: Viva Engage repurposes the day's LinkedIn idea too
                expected.append("- %s viva: from c%d" % (d.isoformat(), n))
        self.assertEqual([line for line in lines if line.startswith("- ") and ": from " in line], expected)
        self.assertTrue(lines[-1].startswith("plan 2026-10-26: 23 slots, ") and lines[-1].endswith(", 7 to repurpose"), lines[-1])
