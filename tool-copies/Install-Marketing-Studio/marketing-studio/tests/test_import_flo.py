import shutil
import tempfile
import unittest
from pathlib import Path

from scripts.import_flo import import_flo
from scripts.lib import content

FIX = Path(__file__).parent / "fixtures" / "flo"


class ImportFLO(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        src = self.tmp / "_share"
        shutil.copytree(FIX / "01-caring-more", src / "articles" / "01-caring-more")
        images = src / "articles" / "01-caring-more" / "images"
        images.mkdir(exist_ok=True)
        for n in ["t1-li-cover.png", "t1-li-1.png", "t1-li-promo.png", "t1-ss-preview.png", "t1-ss-1.png"]:
            (images / n).write_bytes(b"png")
        (src / "linkedin-toolkit" / "out").mkdir(parents=True)
        shutil.copy(FIX / "LINKEDIN-POST.md", src / "linkedin-toolkit" / "LINKEDIN-POST.md")
        (src / "linkedin-toolkit" / "out" / "LinkedIn-Leverage-Toolkit_carousel.pdf").write_bytes(b"pdf")
        self.src = src
        self.ws = self.tmp / "hugo"
        self.result = import_flo(src, self.ws, toolkit_posted=True, force=False)

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def meta(self, id):
        return content.load(content.object_path(self.ws, id))[0]

    def test_objects(self):
        self.assertEqual(
            sorted(self.result["created"]),
            ["flo-01-caring-more-article", "flo-01-caring-more-essay", "flo-01-caring-more-note",
             "flo-01-caring-more-promo", "flo-toolkit-carousel"],
        )
        for id in self.result["created"]:
            self.assertEqual(content.validate(self.meta(id)), [], id)

    def test_dates_and_surfaces(self):
        self.assertEqual(self.meta("flo-01-caring-more-article")["scheduled_date"], "2026-10-27T08:30:00+00:00")
        self.assertEqual(self.meta("flo-01-caring-more-essay")["scheduled_date"], "2026-10-29T09:00:00+00:00")
        self.assertEqual(self.meta("flo-01-caring-more-note")["scheduled_date"], "2026-10-29T09:30:00+00:00")
        self.assertEqual(self.meta("flo-01-caring-more-promo")["scheduled_date"], "2026-10-30T08:30:00+00:00")
        essay = self.meta("flo-01-caring-more-essay")
        self.assertEqual((essay["surface"], essay["format"]), ("substack", "essay"))
        article = self.meta("flo-01-caring-more-article")
        self.assertEqual((article["surface"], article["format"]), ("linkedin", "article"))
        self.assertEqual(self.meta("flo-01-caring-more-note")["parent"], "flo-01-caring-more-essay")
        self.assertEqual(self.meta("flo-01-caring-more-promo")["parent"], "flo-01-caring-more-article")

    def test_article_fields_and_assets(self):
        article = self.meta("flo-01-caring-more-article")
        self.assertEqual(article["seo_title"], "AI gives everyone the average: the KEEP framework")
        self.assertIn("assets/flo-01-caring-more-article/t1-li-cover.png", article["assets"])
        self.assertIn("assets/flo-01-caring-more-article/t1-li-1.png", article["assets"])
        self.assertTrue((self.ws / article["assets"][0]).exists())
        self.assertEqual(self.meta("flo-01-caring-more-promo")["assets"], ["assets/flo-01-caring-more-promo/t1-li-promo.png"])
        self.assertEqual(self.meta("flo-01-caring-more-promo")["first_comment"], "[article URL]")
        self.assertIn("assets/flo-01-caring-more-essay/t1-ss-preview.png", self.meta("flo-01-caring-more-essay")["assets"])

    def test_neutral_personal_campaign(self):
        meta, _ = content.load(self.ws / "campaigns" / "flo-2026-talks.md")
        self.assertEqual((meta["neutral"], meta["mode"], meta["priority"]), (True, "personal", 2))
        self.assertEqual((meta["start"], meta["end"]), ("2026-10-27", "2026-11-13"))
        self.assertEqual(self.meta("flo-01-caring-more-article")["pillar"], 4)
        self.assertEqual(self.meta("flo-01-caring-more-article")["mode"], "personal")
        self.assertEqual(self.meta("flo-01-caring-more-article")["campaign"], "flo-2026-talks")

    def test_toolkit_published(self):
        m = self.meta("flo-toolkit-carousel")
        self.assertEqual(m["status"], "published")
        self.assertIsNone(m.get("scheduled_date"))
        self.assertEqual(m["format"], "carousel-pdf")
        self.assertTrue(m["document_title"].startswith("LinkedIn Leverage Toolkit"))
        self.assertEqual(m["assets"], ["assets/flo-toolkit-carousel/LinkedIn-Leverage-Toolkit_carousel.pdf"])

    def test_force_keeps_trypost_link(self):
        path = content.object_path(self.ws, "flo-01-caring-more-essay")
        meta, body = content.load(path)
        meta["trypost"]["idea_id"] = "idea-1"
        meta["status"] = "approved"
        content.save(path, meta, body)
        result = import_flo(self.src, self.ws, toolkit_posted=True, force=True)
        self.assertIn("flo-01-caring-more-essay", result["overwrote"])
        after = self.meta("flo-01-caring-more-essay")
        self.assertEqual((after["trypost"]["idea_id"], after["status"]), ("idea-1", "approved"))

    def test_second_run_skips(self):
        again = import_flo(self.src, self.ws, toolkit_posted=False, force=False)
        self.assertEqual(again["created"], [])
        self.assertEqual(len(again["skipped"]), 5)
        self.assertEqual(self.meta("flo-toolkit-carousel")["status"], "published")


if __name__ == "__main__":
    unittest.main()
