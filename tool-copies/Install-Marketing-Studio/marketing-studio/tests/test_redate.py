import io
import shutil
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

from scripts import redate
from scripts.lib import content
from tests.test_sync_push import obj

NOW = "2026-10-21T13:00:00+01:00"


class Redate(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.ws = self.tmp / "hugo"

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def save(self, meta, body="Body\n"):
        content.save(content.object_path(self.ws, meta["id"]), meta, body)

    def load(self, id):
        return content.load(content.object_path(self.ws, id))

    def test_a_post_keeps_its_time_its_status_and_its_score(self):
        score = {"total": 40, "hook": 8, "voice": 8, "value": 8, "fit": 8, "ready": 8}
        self.save(obj("p", status="approved", scheduled_date="2026-10-23T08:30:00+01:00", score=score,
                      trypost={"post_id": "77", "idea_id": None, "synced_at": None, "synced_hash": "h"}))
        before, _ = self.load("p")
        # A day alone keeps the post's own time, in Lisbon, across the change from summer to winter time.
        self.assertEqual(redate.redate(self.ws, "p", "2026-10-26", now=NOW), "2026-10-26T08:30:00+00:00")
        meta, body = self.load("p")
        self.assertEqual(meta["updated"], NOW)
        self.assertEqual({k: v for k, v in meta.items() if k not in ("scheduled_date", "updated")},
                         {k: v for k, v in before.items() if k not in ("scheduled_date", "updated")})
        self.assertEqual(body, "Body\n")
        # A day with a time sets the time.
        self.assertEqual(redate.redate(self.ws, "p", "2026-10-27T17:05", now=NOW), "2026-10-27T17:05:00+00:00")

    def test_an_idea_keeps_its_flags_and_an_undated_one_takes_the_linkedin_time(self):
        idea = content.new_idea_meta("i", "An idea", "personal", 4, "2026-10-21T10:00:00+01:00", ["instagram", "linkedin"])
        idea.update({"status": "approved", "reactive": True, "score": {"total": 17, "relevance": 4, "timeliness": 3, "proof": 4, "fit": 3, "difference": 3}})
        self.save(idea)
        self.assertEqual(redate.redate(self.ws, "i", "2026-11-02", now=NOW), "2026-11-02T08:30:00+00:00")
        meta, _ = self.load("i")
        self.assertEqual((meta["status"], meta["reactive"], meta["score"]["total"], meta["surfaces"]), ("approved", True, 17, ["instagram", "linkedin"]))
        out = io.StringIO()
        with redirect_stdout(out):
            self.assertEqual(redate.main(["i", "--date", "2026-11-09", "--workspace", str(self.ws)]), 0)
        self.assertEqual(out.getvalue(), "redated i 2026-11-09T08:30:00+00:00\n")

    def test_an_undated_post_takes_its_surface_time(self):
        self.save(obj("x1", surface="x", format="text", scheduled_date=None))
        self.assertEqual(redate.redate(self.ws, "x1", "2026-10-28", now=NOW), "2026-10-28T09:30:00+00:00")

    def test_refusals_write_nothing(self):
        self.save(obj("done", status="published", posted_at="2026-10-21T09:00:00+01:00"))
        self.save(obj("gone", status="archived"))
        for id in ("done", "gone"):
            before = content.object_path(self.ws, id).read_text(encoding="utf-8")
            err = io.StringIO()
            with redirect_stderr(err):
                self.assertEqual(redate.main([id, "--date", "2026-10-30", "--workspace", str(self.ws)]), 2)
            self.assertIn("refused", err.getvalue())
            self.assertEqual(content.object_path(self.ws, id).read_text(encoding="utf-8"), before)
        self.save(obj("p"))
        for bad in ("30/10/2026", "2026-02-30", "2026-10-30T25:00"):
            with self.assertRaises(ValueError):
                redate.redate(self.ws, "p", bad, now=NOW)
        with self.assertRaises(FileNotFoundError):
            redate.redate(self.ws, "nope", "2026-10-30", now=NOW)


if __name__ == "__main__":
    unittest.main()
