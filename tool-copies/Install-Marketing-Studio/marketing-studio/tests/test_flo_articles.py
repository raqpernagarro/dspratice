import unittest
from pathlib import Path

from scripts.lib.flo_articles import parse_article, parse_toolkit_post

FIX = Path(__file__).parent / "fixtures" / "flo"


class ParseArticle(unittest.TestCase):
    def test_linkedin(self):
        a = parse_article((FIX / "01-caring-more" / "linkedin.md").read_text(), "linkedin")
        self.assertEqual(a.kind, "linkedin")
        self.assertEqual(a.title, "AI gives everyone the average. Four places where judgment matters")
        self.assertEqual(a.seo_title, "AI gives everyone the average: the KEEP framework")
        self.assertTrue(a.seo_description.startswith("AI tools hand everyone"))
        self.assertEqual(a.cover, "images/t1-li-cover.png")
        self.assertTrue(a.body.startswith("# AI gives everyone the average"))
        self.assertIn("## Sources", a.body)
        self.assertNotIn("## Promo post", a.body)
        self.assertNotIn("```yaml", a.body)
        self.assertTrue(a.promo_post and len(a.promo_post) > 100)
        self.assertIsNone(a.substack_note)

    def test_substack(self):
        a = parse_article((FIX / "01-caring-more" / "substack.md").read_text(), "substack")
        self.assertTrue(a.subtitle.startswith("My son's homework"))
        self.assertEqual(a.cover, "images/t1-ss-preview.png")
        self.assertIn("[^1]:", a.body)
        self.assertNotIn("## Substack Note", a.body)
        self.assertTrue(a.substack_note)
        self.assertIsNone(a.promo_post)

    def test_bare_cover_id_is_normalised(self):
        text = "**Title:** T\n**SEO title:** S\n**SEO description:** D\n**Cover image:** `t3-li-cover`\n\n---\n\n# T\n\nBody.\n"
        self.assertEqual(parse_article(text, "linkedin").cover, "images/t3-li-cover.png")

    def test_toolkit(self):
        title, body, first = parse_toolkit_post((FIX / "LINKEDIN-POST.md").read_text())
        self.assertTrue(title.startswith("LinkedIn Leverage Toolkit"))
        self.assertTrue(body.startswith("857,763 impressions"))
        self.assertTrue(body.rstrip().endswith("actually worked?"))
        self.assertIn("A4 version", first)


if __name__ == "__main__":
    unittest.main()
