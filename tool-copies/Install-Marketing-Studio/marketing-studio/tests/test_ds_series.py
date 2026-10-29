import unittest
from pathlib import Path

from scripts.lib.ds_series import parse_series_plan

TEXT = (Path(__file__).parent / "fixtures" / "series-plan-excerpt.md").read_text()


class Parse(unittest.TestCase):
    def setUp(self):
        self.posts = {p.number: p for p in parse_series_plan(TEXT)}

    def test_count_and_numbers(self):
        self.assertEqual(sorted(self.posts), [1, 2, 5, 9, 15])

    def test_image_post(self):
        p = self.posts[1]
        self.assertEqual((p.format, p.slug), ("image", "01-brief-nobody-wrote"))
        self.assertTrue(p.body.startswith('"Build a settings page."'))
        self.assertIn("#FluidicIntelligence", p.body.splitlines()[-1])
        self.assertEqual(p.tags_people, ["Noel Cunningham"])
        self.assertEqual(p.sources, ["https://www.nagarro.com/en/blog/designing-ai-ready-systems"])
        self.assertEqual(p.first_comment, "Noel's full article: https://www.nagarro.com/en/blog/designing-ai-ready-systems")

    def test_carousel_has_document_title(self):
        self.assertEqual(self.posts[2].document_title, "Rules your team follows that AI has never seen")
        self.assertEqual(self.posts[2].visual, "posts/02-rules-ai-has-never-seen/02-rules-ai-has-never-seen.pdf")
        self.assertEqual(self.posts[2].format, "carousel-pdf")

    def test_poll_options(self):
        self.assertEqual(self.posts[5].format, "poll")
        self.assertIsNone(self.posts[5].visual)
        self.assertEqual(self.posts[5].slug, "05-a-question-for")
        self.assertEqual(
            self.posts[5].poll_options,
            ["Brand and visual consistency", "Wrong component for the job", "Accessibility", "We don't check it yet"],
        )

    def test_text_only_keeps_placeholders(self):
        self.assertEqual(self.posts[9].format, "text")
        self.assertEqual(self.posts[9].slug, "09-people-paper-over")
        self.assertIn("[X]%", self.posts[9].body)
        self.assertEqual(self.posts[9].document_title, None)

    def test_recap_tags_and_numbered_first_comment(self):
        self.assertEqual(self.posts[15].format, "video")
        self.assertEqual(self.posts[15].tags_people, ["Nagarro", "Noel Cunningham", "Carlos Sousa"])
        self.assertEqual(len(self.posts[15].sources), 4)  # the fifth link is a [public URL] placeholder
        self.assertTrue(self.posts[15].first_comment.startswith("1. Most design systems"))


if __name__ == "__main__":
    unittest.main()
