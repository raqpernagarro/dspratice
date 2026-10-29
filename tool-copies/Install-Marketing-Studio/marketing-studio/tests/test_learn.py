import contextlib
import io
import shutil
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

from scripts import learn as learn_cli
from scripts import perf
from scripts.lib import content, learn
from tests.test_sync_push import obj

NOW = datetime(2026, 10, 22, 9, 0, tzinfo=timezone.utc)


def performance(impressions, reactions=None, comments=None, reposts=None, saves=None, clicks=None):
    return {"impressions": impressions, "reactions": reactions, "comments": comments, "reposts": reposts,
            "saves": saves, "clicks": clicks, "entered_at": "2026-10-22T10:00:00+01:00"}


def published(id, impressions, engaged, **over):
    """A published post whose engagement rate is engaged / impressions * 100 (all of it in reactions)."""
    return obj(id, status="published", performance=performance(impressions, reactions=engaged), **over)


def three():
    return [
        published("a", 1000, 50),
        published("b", 2000, 50),
        published("c", 1000, 100, surface="instagram", format="reel", pillar=None, campaign=None),
        obj("d", status="draft", performance=performance(1000, reactions=900)),
        obj("e", status="published"),
    ]


class Rate(unittest.TestCase):
    def test_sums_reactions_comments_reposts_and_saves_over_impressions(self):
        rate = learn.engagement_rate(performance(1000, reactions=30, comments=10, reposts=5, saves=5, clicks=400))
        self.assertEqual(rate, 5.0)

    def test_none_counts_as_zero(self):
        self.assertEqual(learn.engagement_rate(performance(200, reactions=3)), 1.5)
        self.assertEqual(learn.engagement_rate(performance(200)), 0.0)

    def test_rounds_to_two_decimals(self):
        self.assertEqual(learn.engagement_rate(performance(3, reactions=1)), 33.33)

    def test_no_rate_without_performance_or_impressions(self):
        self.assertIsNone(learn.engagement_rate(None))
        self.assertIsNone(learn.engagement_rate(performance(0, reactions=4)))
        self.assertIsNone(learn.engagement_rate(performance(None, reactions=4)))
        self.assertIsNone(learn.engagement_rate({"reactions": 4}))


class Summarise(unittest.TestCase):
    def test_counts_only_published_posts_with_a_rate(self):
        summary = learn.summarise(three())
        self.assertEqual(summary["count"], 3)
        self.assertEqual(summary["baseline"], 5.83)
        self.assertEqual(summary["top"], ["c", "a", "b"])
        self.assertEqual(summary["bottom"], ["b", "a", "c"])
        self.assertEqual(summary["confidence"], "Low")

    def test_groups_by_pillar_network_format_and_campaign(self):
        by = learn.summarise(three())["by"]
        self.assertEqual(by["network"]["linkedin"], {"count": 2, "rate": 3.75})
        self.assertEqual(by["network"]["instagram"], {"count": 1, "rate": 10.0})
        self.assertEqual(by["pillar"]["3"], {"count": 2, "rate": 3.75})
        self.assertEqual(by["pillar"]["none"], {"count": 1, "rate": 10.0})
        self.assertEqual(by["format"]["image"]["count"], 2)
        self.assertEqual(by["format"]["reel"]["rate"], 10.0)
        self.assertEqual(by["campaign"]["ai-ready-design-systems"]["count"], 2)
        self.assertEqual(by["campaign"]["none"]["count"], 1)

    def test_nothing_entered_is_a_count_of_zero(self):
        self.assertEqual(learn.summarise([]), {"count": 0})
        self.assertEqual(learn.summarise([obj("d", status="draft", performance=performance(100, reactions=5)), obj("e", status="published")]), {"count": 0})
        self.assertEqual(learn.summarise([obj("i", type="idea", status="published", performance=performance(100, reactions=5))]), {"count": 0})

    def test_top_and_bottom_hold_up_to_five(self):
        pieces = [published("p%d" % n, 1000, n * 10) for n in range(1, 9)]
        summary = learn.summarise(pieces)
        self.assertEqual(summary["top"], ["p8", "p7", "p6", "p5", "p4"])
        self.assertEqual(summary["bottom"], ["p1", "p2", "p3", "p4", "p5"])

    def test_confidence_steps_at_fifteen_and_thirty(self):
        def level(n):
            return learn.summarise([published("p%d" % i, 1000, 10) for i in range(n)])["confidence"]
        self.assertEqual([level(14), level(15), level(29), level(30)], ["Low", "Medium", "Medium", "High"])


class Markdown(unittest.TestCase):
    def test_section_reads_as_the_data_block_of_the_playbook(self):
        text = learn.playbook_markdown(learn.summarise(three()), NOW)
        self.assertTrue(text.startswith("## Data, as of 22/10/2026\n"), text)
        self.assertIn("Pieces: 3, baseline engagement rate: 5.83%, confidence Low", text)
        self.assertIn("| Group | Pieces | Rate |", text)
        self.assertIn("| linkedin | 2 | 3.75% |", text)
        self.assertIn("| instagram | 1 | 10.00% |", text)
        self.assertIn("Top: c (10.00%), a (5.00%), b (2.50%)", text)
        self.assertIn("Bottom: b (2.50%), a (5.00%), c (10.00%)", text)
        self.assertTrue(text.endswith("\n"))

    def test_the_date_is_the_lisbon_date(self):
        late = datetime(2026, 7, 31, 23, 30, tzinfo=timezone.utc)
        self.assertTrue(learn.playbook_markdown(learn.summarise(three()), late).startswith("## Data, as of 01/08/2026"))

    def test_a_summary_without_per_piece_rates_lists_the_ids_alone(self):
        summary = {"count": 1, "baseline": 5.0, "confidence": "Low", "by": {}, "top": ["a"], "bottom": ["a"]}
        text = learn.playbook_markdown(summary, NOW)
        self.assertIn("Top: a\n", text)
        self.assertIn("Bottom: a\n", text)

    def test_no_data_is_an_empty_string(self):
        self.assertEqual(learn.playbook_markdown({"count": 0}, NOW), "")

    def test_no_em_or_en_dash(self):
        text = learn.playbook_markdown(learn.summarise(three()), NOW)
        self.assertNotIn(chr(0x2014), text)
        self.assertNotIn(chr(0x2013), text)


class Merge(unittest.TestCase):
    SECTION = "## Data, as of 22/10/2026\n\nPieces: 3\n"

    def test_replaces_the_data_section_and_keeps_the_rest(self):
        text = "# Playbook\n\nIntro.\n\n## Data, as of 01/01/2026\n\nold\n\n### By pillar\n\nold table\n\n## Do More\n\n- thing\n"
        merged = learn.merge_data_section(text, self.SECTION)
        self.assertEqual(merged, "# Playbook\n\nIntro.\n\n## Data, as of 22/10/2026\n\nPieces: 3\n\n## Do More\n\n- thing\n")

    def test_replaces_a_data_section_that_ends_the_file(self):
        merged = learn.merge_data_section("# Playbook\n\n## Data, as of 01/01/2026\n\nold\n", self.SECTION)
        self.assertEqual(merged, "# Playbook\n\n## Data, as of 22/10/2026\n\nPieces: 3\n")

    def test_inserts_after_the_first_heading_and_its_paragraph(self):
        text = "# Playbook\n\nFilled by learn.\n\n## Do More\n\n- thing\n"
        merged = learn.merge_data_section(text, self.SECTION)
        self.assertEqual(merged, "# Playbook\n\nFilled by learn.\n\n## Data, as of 22/10/2026\n\nPieces: 3\n\n## Do More\n\n- thing\n")

    def test_inserts_into_a_heading_and_a_note_only_playbook(self):
        text = "# Playbook: what works for Hugo\n\nFilled by the `learn` mode, from entered performance. Empty until then.\n"
        merged = learn.merge_data_section(text, self.SECTION)
        self.assertTrue(merged.startswith(text.rstrip("\n") + "\n\n## Data, as of 22/10/2026\n"))
        self.assertTrue(merged.endswith("Pieces: 3\n"))

    def test_a_heading_without_a_paragraph_is_followed_directly_by_the_section(self):
        merged = learn.merge_data_section("# Playbook\n\n## Do More\n\n- thing\n", self.SECTION)
        self.assertEqual(merged, "# Playbook\n\n## Data, as of 22/10/2026\n\nPieces: 3\n\n## Do More\n\n- thing\n")

    def test_a_file_with_no_heading_gets_the_section_first(self):
        self.assertEqual(learn.merge_data_section("loose text\n", self.SECTION), "## Data, as of 22/10/2026\n\nPieces: 3\n\nloose text\n")

    def test_running_twice_changes_nothing(self):
        text = "# Playbook\n\nIntro.\n\n## Do More\n\n- thing\n"
        once = learn.merge_data_section(text, self.SECTION)
        self.assertEqual(learn.merge_data_section(once, self.SECTION), once)

    def test_a_heading_that_only_starts_with_data_is_not_the_section(self):
        text = "# Playbook\n\nIntro.\n\n## Database notes\n\nkeep\n"
        merged = learn.merge_data_section(text, self.SECTION)
        self.assertIn("## Database notes\n\nkeep\n", merged)
        self.assertIn("## Data, as of 22/10/2026", merged)


class Workspace(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.ws = self.tmp / "hugo"
        for meta in three():
            content.save(content.object_path(self.ws, meta["id"]), meta, "Body\n")
        (self.ws / "playbook.md").write_text("# Playbook\n\nIntro.\n\n## Do More\n\n- thing\n", encoding="utf-8")

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def run_learn(self, *args):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = learn_cli.main(["--workspace", str(self.ws)] + list(args))
        return code, out.getvalue(), err.getvalue()

    def test_prints_the_count_and_confidence_and_writes_nothing_by_default(self):
        before = (self.ws / "playbook.md").read_text(encoding="utf-8")
        code, out, _ = self.run_learn()
        self.assertEqual((code, out), (0, "learn 3 pieces, confidence Low\n"))
        self.assertEqual((self.ws / "playbook.md").read_text(encoding="utf-8"), before)

    def test_write_puts_the_data_section_after_the_intro_and_keeps_the_rest(self):
        code, out, _ = self.run_learn("--write")
        self.assertEqual((code, out), (0, "learn 3 pieces, confidence Low\n"))
        text = (self.ws / "playbook.md").read_text(encoding="utf-8")
        self.assertTrue(text.startswith("# Playbook\n\nIntro.\n\n## Data, as of "))
        self.assertIn("confidence Low", text)
        self.assertTrue(text.endswith("\n\n## Do More\n\n- thing\n"))
        self.run_learn("--write")
        self.assertEqual((self.ws / "playbook.md").read_text(encoding="utf-8"), text)
        self.assertEqual(text.count("## Data, as of"), 1)

    def test_write_creates_the_playbook_when_there_is_none(self):
        (self.ws / "playbook.md").unlink()
        self.assertEqual(self.run_learn("--write")[0], 0)
        self.assertTrue((self.ws / "playbook.md").read_text(encoding="utf-8").startswith("# Playbook"))

    def test_no_data_prints_nothing_to_write_and_exits_1(self):
        for meta in three():
            path = content.object_path(self.ws, meta["id"])
            m, body = content.load(path)
            m["performance"] = None
            content.save(path, m, body)
        before = (self.ws / "playbook.md").read_text(encoding="utf-8")
        code, out, _ = self.run_learn("--write")
        self.assertEqual((code, out), (1, "learn 0 pieces, nothing to write\n"))
        self.assertEqual((self.ws / "playbook.md").read_text(encoding="utf-8"), before)


class Perf(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.ws = self.tmp / "hugo"
        content.save(content.object_path(self.ws, "a"), obj("a", status="published"), "Body\n")

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def run_perf(self, *args):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            try:
                code = perf.main(list(args) + ["--workspace", str(self.ws)])
            except SystemExit as stop:
                code = stop.code
        return code, out.getvalue(), err.getvalue()

    def test_writes_the_numbers_the_others_none_and_the_entry_time(self):
        code, out, _ = self.run_perf("a", "--impressions", "1200", "--reactions", "40", "--saves", "3")
        self.assertEqual((code, out), (0, "performance a entered\n"))
        meta, body = content.load(content.object_path(self.ws, "a"))
        stored = meta["performance"]
        self.assertEqual({k: v for k, v in stored.items() if k != "entered_at"},
                         {"impressions": 1200, "reactions": 40, "comments": None, "reposts": None, "saves": 3, "clicks": None})
        self.assertTrue(stored["entered_at"].endswith("+01:00") or stored["entered_at"].endswith("+00:00"))
        self.assertEqual(meta["updated"], stored["entered_at"])
        self.assertEqual(body, "Body\n")
        self.assertEqual(content.validate(meta), [])

    def test_enter_is_a_function_too(self):
        stored = perf.enter(self.ws, "a", 500, now="2026-10-22T10:00:00+01:00", clicks=7)
        self.assertEqual(stored, {"impressions": 500, "reactions": None, "comments": None, "reposts": None,
                                  "saves": None, "clicks": 7, "entered_at": "2026-10-22T10:00:00+01:00"})
        self.assertEqual(content.load(content.object_path(self.ws, "a"))[0]["updated"], "2026-10-22T10:00:00+01:00")

    def test_entering_again_replaces_the_numbers(self):
        self.run_perf("a", "--impressions", "100", "--reactions", "9")
        self.run_perf("a", "--impressions", "200")
        stored = content.load(content.object_path(self.ws, "a"))[0]["performance"]
        self.assertEqual((stored["impressions"], stored["reactions"]), (200, None))

    def test_a_published_post_gets_no_warning(self):
        self.assertEqual(self.run_perf("a", "--impressions", "10"), (0, "performance a entered\n", ""))

    def test_a_piece_learn_does_not_count_is_warned_about_and_still_saved(self):
        content.save(content.object_path(self.ws, "d"), obj("d", status="in-review"), "Body\n")
        code, out, err = self.run_perf("d", "--impressions", "10")
        self.assertEqual((code, out, err), (0, "performance d entered\n", "perf: d is in-review, learn counts published posts only\n"))
        self.assertEqual(content.load(content.object_path(self.ws, "d"))[0]["performance"]["impressions"], 10)

    def test_a_missing_piece_exits_2(self):
        code, out, err = self.run_perf("nope", "--impressions", "10")
        self.assertEqual((code, out), (2, ""))
        self.assertIn("nope", err)

    def test_impressions_are_required(self):
        self.assertEqual(self.run_perf("a", "--reactions", "4")[0], 2)
        self.assertIsNone(content.load(content.object_path(self.ws, "a"))[0]["performance"])

    def test_a_negative_number_is_refused(self):
        self.assertEqual(self.run_perf("a", "--impressions", "-5")[0], 2)
        self.assertIsNone(content.load(content.object_path(self.ws, "a"))[0]["performance"])


if __name__ == "__main__":
    unittest.main()
