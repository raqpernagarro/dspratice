import shutil
import tempfile
import unittest
from datetime import date
from pathlib import Path

from scripts.import_ds import import_series
from scripts.lib import content

FIX = Path(__file__).parent / "fixtures"


def make_source(tmp: Path) -> Path:
    src = tmp / "src"
    (src / "posts" / "01-brief-nobody-wrote").mkdir(parents=True)
    (src / "page" / "media").mkdir(parents=True)
    shutil.copy(FIX / "series-plan-excerpt.md", src / "series-plan.md")
    (src / "posts" / "01-brief-nobody-wrote" / "01-brief-nobody-wrote.png").write_bytes(b"png")
    (src / "posts" / "02-rules-ai-has-never-seen").mkdir()
    (src / "posts" / "02-rules-ai-has-never-seen" / "02-rules-ai-has-never-seen.pdf").write_bytes(b"pdf")
    (src / "page" / "media" / "01-brief-nobody-wrote.jpg").write_bytes(b"jpg")
    for n in range(1, 9):
        (src / "page" / "media" / f"02-rules-ai-has-never-seen-0{n}.jpg").write_bytes(b"jpg")
    (src / "posts" / "15-series-recap").mkdir()
    (src / "posts" / "15-series-recap" / "15-series-recap.mp4").write_bytes(b"mp4")
    for n in ["15-series-recap.mp4", "15-series-recap-poster.jpg"]:
        (src / "page" / "media" / n).write_bytes(b"x")
    return src


class ImportDS(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.src = make_source(self.tmp)
        self.ws = self.tmp / "hugo"
        self.result = import_series(self.src, self.ws, date(2026, 10, 21), posted={1}, force=False)

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def meta(self, id):
        return content.load(content.object_path(self.ws, id))[0]

    def test_ids_created(self):
        self.assertEqual(
            sorted(self.result["created"]),
            sorted([
                "ds-01-brief-nobody-wrote", "ds-01-brief-nobody-wrote-ig",
                "ds-02-rules-ai-has-never-seen", "ds-02-rules-ai-has-never-seen-ig",
                "ds-05-a-question-for", "ds-09-people-paper-over",
                "ds-15-series-recap", "ds-15-series-recap-ig",
            ]),
        )

    def test_reel_child(self):
        ig = self.meta("ds-15-series-recap-ig")
        self.assertEqual(ig["format"], "reel")
        self.assertEqual(
            ig["assets"],
            ["assets/ds-15-series-recap-ig/15-series-recap.mp4", "assets/ds-15-series-recap-ig/15-series-recap-poster.jpg"],
        )

    def test_dates_follow_fixture_order_not_numbers(self):
        self.assertEqual(self.meta("ds-01-brief-nobody-wrote")["scheduled_date"], "2026-10-21T08:30:00+01:00")
        self.assertEqual(self.meta("ds-02-rules-ai-has-never-seen")["scheduled_date"], "2026-10-22T08:30:00+01:00")
        self.assertEqual(self.meta("ds-05-a-question-for")["scheduled_date"], "2026-10-23T08:30:00+01:00")
        self.assertEqual(self.meta("ds-01-brief-nobody-wrote-ig")["scheduled_date"], "2026-10-21T12:30:00+01:00")

    def test_statuses(self):
        self.assertEqual(self.meta("ds-01-brief-nobody-wrote")["status"], "published")
        self.assertIsNotNone(self.meta("ds-01-brief-nobody-wrote")["posted_at"])
        self.assertEqual(self.meta("ds-02-rules-ai-has-never-seen")["status"], "in-review")
        self.assertEqual(self.meta("ds-09-people-paper-over")["status"], "draft")
        self.assertEqual(self.meta("ds-09-people-paper-over")["parent"], "ds-05-a-question-for")

    def test_carousel_assets_and_meta(self):
        li = self.meta("ds-02-rules-ai-has-never-seen")
        ig = self.meta("ds-02-rules-ai-has-never-seen-ig")
        self.assertEqual(li["assets"], ["assets/ds-02-rules-ai-has-never-seen/02-rules-ai-has-never-seen.pdf"])
        self.assertEqual(li["document_title"], "Rules your team follows that AI has never seen")
        self.assertEqual(len(ig["assets"]), 8)
        self.assertEqual(ig["format"], "carousel")
        self.assertEqual(ig["parent"], li["id"])
        self.assertTrue((self.ws / ig["assets"][0]).exists())
        self.assertTrue((self.ws / li["assets"][0]).exists())

    def test_common_fields(self):
        li = self.meta("ds-02-rules-ai-has-never-seen")
        self.assertEqual((li["campaign"], li["pillar"], li["mode"], li["surface"], li["brand"], li["author"]),
                         ("ai-ready-design-systems", 3, "nagarro", "linkedin", "me", "me"))
        self.assertEqual(li["trypost"], {"post_id": None, "idea_id": None, "synced_at": None, "synced_hash": None})
        self.assertEqual(content.validate(li), [])
        self.assertEqual(self.meta("ds-05-a-question-for")["poll_options"][0], "Brand and visual consistency")

    def test_instagram_caption_rules(self):
        body = content.load(content.object_path(self.ws, "ds-01-brief-nobody-wrote-ig"))[1]
        self.assertNotIn("@Noel", body)
        self.assertIn("Noel Cunningham", body)
        self.assertNotIn("in the comments", body)
        self.assertIn("needs-caption", self.meta("ds-01-brief-nobody-wrote-ig")["labels_extra"])

    def test_poll_and_text_have_no_instagram_child(self):
        self.assertFalse(content.object_path(self.ws, "ds-05-a-question-for-ig").exists())
        self.assertFalse(content.object_path(self.ws, "ds-09-people-paper-over-ig").exists())

    def test_campaign_file(self):
        meta, body = content.load(self.ws / "campaigns" / "ai-ready-design-systems.md")
        self.assertEqual((meta["mode"], meta["neutral"], meta["priority"]), ("nagarro", False, 1))
        self.assertIn("https://www.nagarro.com/en/blog/designing-ai-ready-systems", meta["sources"])
        self.assertEqual((meta["start"], meta["end"]), ("2026-10-21", "2026-10-27"))
        self.assertTrue(body.strip())

    def test_force_keeps_trypost_link_status_and_created(self):
        path = content.object_path(self.ws, "ds-02-rules-ai-has-never-seen")
        meta, body = content.load(path)
        meta["trypost"].update({"post_id": "remote-1", "synced_hash": "h", "notes_synced": True})
        meta["status"], meta["posted_at"], meta["created"] = "published", "2026-10-22T08:30:00+01:00", "2026-01-01T00:00:00+00:00"
        content.save(path, meta, body)
        result = import_series(self.src, self.ws, date(2026, 10, 21), posted=set(), force=True)
        self.assertIn("ds-02-rules-ai-has-never-seen", result["overwrote"])
        self.assertEqual(result["created"], [])
        after = self.meta("ds-02-rules-ai-has-never-seen")
        self.assertEqual(after["trypost"]["post_id"], "remote-1")
        self.assertEqual(after["trypost"]["notes_synced"], True)
        self.assertEqual((after["status"], after["posted_at"], after["created"]), ("published", "2026-10-22T08:30:00+01:00", "2026-01-01T00:00:00+00:00"))

    def test_second_run_skips_without_force(self):
        again = import_series(self.src, self.ws, date(2026, 10, 21), posted=set(), force=False)
        self.assertEqual(again["created"], [])
        self.assertEqual(len(again["skipped"]), 8)
        self.assertEqual(self.meta("ds-01-brief-nobody-wrote")["status"], "published")


if __name__ == "__main__":
    unittest.main()
