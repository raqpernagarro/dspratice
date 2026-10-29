import tempfile
import unittest
from pathlib import Path

from scripts.lib import content

GOOD = {
    "id": "ds-01",
    "type": "post",
    "title": "T",
    "status": "in-review",
    "brand": "hugo",
    "surface": "linkedin",
    "format": "image",
    "mode": "nagarro",
    "author": "hugo",
    "timezone": "Europe/Lisbon",
    "created": "2026-10-21T10:00:00+01:00",
    "updated": "2026-10-21T10:00:00+01:00",
}


class Validate(unittest.TestCase):
    def test_good(self):
        self.assertEqual(content.validate(GOOD), [])

    def test_missing_and_bad_enum(self):
        bad = dict(GOOD, surface="tiktok")
        del bad["mode"]
        problems = content.validate(bad)
        self.assertTrue(any("mode" in p for p in problems))
        self.assertTrue(any("surface" in p for p in problems))

    def test_format_must_match_surface(self):
        self.assertTrue(content.validate(dict(GOOD, format="reel")))

    def test_viva_is_a_surface_with_text_image_and_video(self):
        self.assertIn("viva", content.SURFACES)
        for fmt in ("text", "image", "video"):
            self.assertEqual(content.validate(dict(GOOD, surface="viva", format=fmt)), [], fmt)
        self.assertEqual(content.validate(dict(GOOD, surface="viva", format="carousel")),
                         ["format: 'carousel' is not valid for surface viva (allowed: text, image, video)"])

    def test_a_viva_piece_must_be_in_nagarro_mode(self):
        self.assertEqual(content.validate(dict(GOOD, surface="viva", format="text", mode="personal")),
                         ["mode: a viva piece is for Nagarro colleagues, so mode must be nagarro"])
        self.assertEqual(content.validate(dict(GOOD, surface="viva", format="text", mode="nagarro")), [])
        self.assertEqual(content.validate(dict(GOOD, surface="linkedin", format="text", mode="personal")), [])

    def test_a_viva_piece_never_carries_a_neutral_campaign(self):
        with tempfile.TemporaryDirectory() as d:
            ws = Path(d)
            (ws / "campaigns").mkdir()
            (ws / "campaigns" / "talks.md").write_text("---\nslug: talks\nneutral: true\n---\nBrief.\n")
            (ws / "campaigns" / "ds.md").write_text("---\nslug: ds\nneutral: false\n---\nBrief.\n")
            viva = dict(GOOD, surface="viva", format="text")
            self.assertEqual(content.validate(dict(viva, campaign="talks"), ws), ["campaign: a viva piece never carries a neutral campaign"])
            self.assertEqual(content.validate(dict(viva, campaign="ds"), ws), [])
            self.assertEqual(content.validate(dict(viva, campaign="gone"), ws), [])  # check.py reports the missing file
            self.assertEqual(content.validate(dict(viva, campaign="talks")), [])  # without the workspace no campaign is read
            self.assertEqual(content.validate(dict(GOOD, campaign="talks"), ws), [])  # a public piece may carry it

    def test_scheduled_date_needs_time_and_offset(self):
        self.assertEqual(content.validate(dict(GOOD, scheduled_date="2026-10-22T08:30:00+01:00")), [])
        self.assertEqual(content.validate(dict(GOOD, scheduled_date=None)), [])
        for bad in ["2026-10-22", "2026-10-22T08:30:00", "tomorrow", 20261022]:
            problems = content.validate(dict(GOOD, scheduled_date=bad))
            self.assertTrue(any("scheduled_date" in p for p in problems), bad)


class SaveLoad(unittest.TestCase):
    def test_round_trip_and_listing(self):
        with tempfile.TemporaryDirectory() as d:
            ws = Path(d)
            p = content.object_path(ws, "ds-01")
            content.save(p, GOOD, "Body\n")
            self.assertEqual(content.load(p), (GOOD, "Body\n"))
            self.assertEqual(content.list_objects(ws), [p])

    def test_body_hash_ignores_trailing_whitespace(self):
        self.assertEqual(content.body_hash("a\n"), content.body_hash("a\n\n  "))

    def test_now_iso_is_lisbon_with_offset(self):
        value = content.now_iso()
        self.assertRegex(value, r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$")


class Ideas(unittest.TestCase):
    def test_new_idea_validates_without_surface(self):
        meta = content.new_idea_meta("agents-read-what-is-written", "Agents only read what is written down", "personal", 1, "2026-10-22T10:00:00+01:00")
        self.assertEqual(content.validate(meta), [])
        self.assertEqual(meta["type"], "idea")
        self.assertEqual(meta["status"], "idea")
        self.assertEqual(meta["surfaces"], ["linkedin", "instagram", "x"])
        self.assertNotIn("surface", meta)

    def test_idea_surfaces_are_checked(self):
        meta = content.new_idea_meta("i", "T", "personal", 1, "2026-10-22T10:00:00+01:00", surfaces=["linkedin", "tiktok"])
        self.assertTrue(any("surfaces" in p for p in content.validate(meta)))

    def test_an_idea_never_lists_viva(self):
        meta = content.new_idea_meta("i", "T", "nagarro", 1, "2026-10-22T10:00:00+01:00", surfaces=["linkedin", "viva"])
        self.assertEqual(content.validate(meta), ["surfaces: viva is a colleague surface, never an idea's network"])


class Scores(unittest.TestCase):
    def test_set_score_and_gate(self):
        meta = dict(GOOD)
        score = content.set_score(meta, "2026-10-22T11:00:00+01:00", hook=7, voice=8, value=7, fit=8, ready=9)
        self.assertEqual(score, {"total": 39, "hook": 7, "voice": 8, "value": 7, "fit": 8, "ready": 9})
        self.assertEqual(meta["updated"], "2026-10-22T11:00:00+01:00")
        self.assertEqual(content.validate(meta), [])
        self.assertTrue(content.score_passes(score))
        self.assertFalse(content.score_passes({"total": 36, "hook": 4, "voice": 8, "value": 8, "fit": 8, "ready": 8}))
        self.assertFalse(content.score_passes({"total": 34, "hook": 7, "voice": 7, "value": 7, "fit": 7, "ready": 6}))
        self.assertFalse(content.score_passes(None))

    def test_bad_scores_rejected(self):
        with self.assertRaises(ValueError):
            content.set_score(dict(GOOD), "2026-10-22T11:00:00+01:00", hook=11, voice=8, value=7, fit=8, ready=9)
        with self.assertRaises(ValueError):
            content.set_score(dict(GOOD), "2026-10-22T11:00:00+01:00", hook=7, voice=8, value=7, fit=8)
        self.assertTrue(content.validate(dict(GOOD, score={"total": 40, "hook": 7, "voice": 8, "value": 7, "fit": 8, "ready": 9})))
        self.assertTrue(content.validate(dict(GOOD, score="high")))


class ApprovalGate(unittest.TestCase):
    NOW = "2026-10-22T10:00:00+01:00"

    def test_blockers(self):
        self.assertEqual(content.approval_blockers(dict(GOOD)), [])
        scored = dict(GOOD, score={"total": 30, "hook": 6, "voice": 6, "value": 6, "fit": 6, "ready": 6})
        self.assertEqual(content.approval_blockers(scored), ["score 30/50 fails the gate"])
        reviewed = dict(GOOD, review={"high": 2, "medium": 0, "low": 1, "reviewed_at": self.NOW})
        self.assertEqual(content.approval_blockers(reviewed), ["2 High flags from brand-review"])
        one = dict(GOOD, review={"high": 1, "medium": 0, "low": 0, "reviewed_at": self.NOW})
        self.assertEqual(content.approval_blockers(one), ["1 High flag from brand-review"])
        clear = dict(GOOD, review={"high": 0, "medium": 3, "low": 0, "reviewed_at": self.NOW})
        self.assertEqual(content.approval_blockers(clear), [])

    def test_set_and_clear_review(self):
        meta = dict(GOOD)
        review = content.set_review(meta, self.NOW, ["High: a number without a source, line 4", "Medium: 'leverage' in line 2"])
        self.assertEqual(review, {"high": 1, "medium": 1, "low": 0, "reviewed_at": self.NOW})
        self.assertEqual(meta["review_flags"], ["High: a number without a source, line 4", "Medium: 'leverage' in line 2"])
        self.assertEqual(meta["updated"], self.NOW)
        self.assertEqual(content.validate(meta), [])
        content.clear_review(meta, "2026-10-22T11:00:00+01:00")
        self.assertNotIn("review", meta)
        self.assertNotIn("review_flags", meta)
        with self.assertRaises(ValueError):
            content.set_review(dict(GOOD), self.NOW, ["Urgent: no severity prefix"])
        self.assertTrue(any(p.startswith("review:") for p in content.validate(dict(GOOD, review={"high": -1}))))


class IdeaScores(unittest.TestCase):
    def test_idea_score_shape(self):
        meta = content.new_idea_meta("i", "T", "personal", 1, "2026-10-22T10:00:00+01:00")
        score = content.set_idea_score(meta, "2026-10-22T10:00:00+01:00", relevance=5, timeliness=3, proof=4, fit=4, difference=2)
        self.assertEqual(score, {"total": 18, "relevance": 5, "timeliness": 3, "proof": 4, "fit": 4, "difference": 2})
        self.assertEqual(content.validate(meta), [])
        with self.assertRaises(ValueError):
            content.set_idea_score(meta, "2026-10-22T10:00:00+01:00", relevance=6, timeliness=3, proof=4, fit=4, difference=2)
        self.assertTrue(content.validate(dict(meta, score={"total": 39, "hook": 7, "voice": 8, "value": 7, "fit": 8, "ready": 9})))
        meta["reactive"] = "yes"
        self.assertTrue(any("reactive" in p for p in content.validate(meta)))

    def test_idea_score_does_not_gate_approval(self):
        meta = content.new_idea_meta("i", "T", "personal", 1, "2026-10-22T10:00:00+01:00")
        content.set_idea_score(meta, "2026-10-22T10:00:00+01:00", relevance=2, timeliness=2, proof=2, fit=2, difference=2)
        self.assertEqual(content.approval_blockers(meta), [])

    def test_performance_shape(self):
        self.assertEqual(content.validate(dict(GOOD, performance={"impressions": 1200, "reactions": 40, "comments": 5, "reposts": 2, "saves": None, "clicks": 10, "entered_at": "2026-10-22T10:00:00+01:00"})), [])
        self.assertTrue(content.validate(dict(GOOD, performance={"impressions": -1})))
        self.assertTrue(content.validate(dict(GOOD, performance="lots")))


if __name__ == "__main__":
    unittest.main()
