import unittest

from scripts.lib import frontmatter as fm

SAMPLE_META = {
    "id": "ds-01-brief",
    "title": 'Build: a "settings" page',
    "tags": ["ai", "b2b"],
    "trypost": {"post_id": None, "synced_hash": "abc"},
    "score": None,
    "priority": 1,
    "neutral": False,
}
SAMPLE_BODY = "First line.\n\n---\n\nStill the body: yes.\n"


class Dump(unittest.TestCase):
    def test_round_trip(self):
        text = fm.dump(SAMPLE_META, SAMPLE_BODY)
        meta, body = fm.parse(text)
        self.assertEqual(meta, SAMPLE_META)
        self.assertEqual(body, SAMPLE_BODY)

    def test_starts_with_delimiters(self):
        text = fm.dump({"id": "x"}, "b")
        self.assertTrue(text.startswith("---\nid: x\n---\n"))

    def test_quotes_strings_that_need_it(self):
        self.assertIn('title: "a: b"', fm.dump({"title": "a: b"}, ""))
        self.assertIn("name: plain", fm.dump({"name": "plain"}, ""))

    def test_multiline_string_round_trips_as_escaped_quotes(self):
        value = "1. First: https://e.com/a\n2. Second \"quoted\" \\ back"
        text = fm.dump({"first_comment": value}, "")
        self.assertEqual(text.split("\n")[1], 'first_comment: "1. First: https://e.com/a\\n2. Second \\"quoted\\" \\\\ back"')
        self.assertEqual(fm.parse(text)[0]["first_comment"], value)

    def test_commas_and_brackets_inside_quoted_items_round_trip(self):
        meta = {"poll_options": ["Yes, always", "No", "It [depends]"], "trypost": {"k": "x, y", "n": None}, "title": "a, b: {c}"}
        parsed, _ = fm.parse(fm.dump(meta, ""))
        self.assertEqual(parsed, meta)

    def test_parse_never_uses_pyyaml(self):
        import sys
        import types

        fake_yaml = types.ModuleType("yaml")
        fake_yaml.safe_load = lambda text: {"scheduled_date": "WRONG"}
        saved = sys.modules.get("yaml")
        sys.modules["yaml"] = fake_yaml
        try:
            meta, _ = fm.parse("---\nscheduled_date: 2026-10-22T08:30:00+01:00\n---\n")
        finally:
            if saved is None:
                del sys.modules["yaml"]
            else:
                sys.modules["yaml"] = saved
        self.assertEqual(meta["scheduled_date"], "2026-10-22T08:30:00+01:00")

    def test_strings_that_look_like_other_types_stay_strings(self):
        for value in ["2026", "true", "null", "3.5"]:
            meta, _ = fm.parse(fm.dump({"v": value}, ""))
            self.assertEqual(meta["v"], value, value)


if __name__ == "__main__":
    unittest.main()
