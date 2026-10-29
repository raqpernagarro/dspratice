import shutil
import tempfile
import unittest
from pathlib import Path

from scripts.lib import content
from scripts.mark import mark
from tests.test_sync_push import NOW, obj


class Mark(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.ws = self.tmp / "hugo"
        content.save(content.object_path(self.ws, "a"), obj("a"), "B\n")

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def test_approved_then_posted(self):
        self.assertEqual(mark(self.ws, "a", "approved", now=NOW), "approved")
        self.assertEqual(content.load(content.object_path(self.ws, "a"))[0]["status"], "approved")
        self.assertEqual(mark(self.ws, "a", "posted", now=NOW), "published")
        m, body = content.load(content.object_path(self.ws, "a"))
        self.assertEqual(m["posted_at"], "2026-10-21T13:00:00+01:00")
        self.assertEqual(m["updated"], "2026-10-21T13:00:00+01:00")
        self.assertEqual(body, "B\n")

    def test_unknown(self):
        with self.assertRaises(SystemExit):
            mark(self.ws, "nope", "posted", now=NOW)
        with self.assertRaises(SystemExit):
            mark(self.ws, "a", "scheduled", now=NOW)


    def test_approved_refused_when_blocked(self):
        path = content.object_path(self.ws, "a")
        meta, body = content.load(path)
        content.set_review(meta, "2026-10-21T10:00:00+01:00", ["High: a number without a source"])
        content.save(path, meta, body)
        with self.assertRaises(SystemExit) as caught:
            mark(self.ws, "a", "approved", now=NOW)
        self.assertEqual(caught.exception.code[0], 2)
        self.assertEqual(caught.exception.code[1], "blocked a: 1 High flag from brand-review")
        self.assertEqual(content.load(path)[0]["status"], "in-review")
        self.assertEqual(mark(self.ws, "a", "posted", now=NOW), "published")

    def test_approved_refused_on_a_failing_score(self):
        path = content.object_path(self.ws, "a")
        meta, body = content.load(path)
        content.set_score(meta, "2026-10-21T10:00:00+01:00", hook=8, voice=8, value=8, fit=4, ready=8)
        meta["status"] = "draft"
        content.save(path, meta, body)
        with self.assertRaises(SystemExit) as caught:
            mark(self.ws, "a", "approved", now=NOW)
        self.assertEqual(caught.exception.code, (2, "blocked a: score 36/50 fails the gate"))
        self.assertEqual(content.load(path)[0]["status"], "draft")


class MarkDraft(unittest.TestCase):
    """`draft` moves an approved idea to In Progress once its drafts exist; nothing else may take it."""

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.ws = self.tmp / "hugo"
        idea = content.new_idea_meta("i", "An idea", "personal", 1, "2026-10-21T10:00:00+01:00")
        idea["status"] = "approved"
        content.save(content.object_path(self.ws, "i"), idea, "Idea body\n")
        content.save(content.object_path(self.ws, "a"), obj("a", status="approved"), "B\n")

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def test_an_approved_idea_becomes_draft(self):
        self.assertEqual(mark(self.ws, "i", "draft", now=NOW), "draft")
        meta, body = content.load(content.object_path(self.ws, "i"))
        self.assertEqual((meta["status"], meta["updated"], body), ("draft", "2026-10-21T13:00:00+01:00", "Idea body\n"))
        with self.assertRaises(SystemExit) as caught:
            mark(self.ws, "i", "draft", now=NOW)  # already draft: only an approved idea moves
        self.assertEqual(caught.exception.code, (2, "blocked i: only an approved idea is marked draft, and this one is draft"))

    def test_a_post_is_refused(self):
        with self.assertRaises(SystemExit) as caught:
            mark(self.ws, "a", "draft", now=NOW)
        self.assertEqual(caught.exception.code, (2, "blocked a: only an idea is marked draft, and this is a post"))
        self.assertEqual(content.load(content.object_path(self.ws, "a"))[0]["status"], "approved")


if __name__ == "__main__":
    unittest.main()
