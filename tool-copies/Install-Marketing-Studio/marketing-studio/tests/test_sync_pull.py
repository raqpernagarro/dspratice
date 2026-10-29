import shutil
import tempfile
import unittest
from pathlib import Path

from scripts.lib import content, sync_plan
from scripts.lib.trypost_api import TryPostClient
from scripts.trypost_sync import pull, push, sync
from tests.fakes import FakeTryPost
from tests.test_sync_push import NOW, obj


class Decide(unittest.TestCase):
    def remote(self, text, labels=()):
        return {"content": text, "labels": [{"id": n, "name": n} for n in labels], "updated_at": "2026-10-21T13:00:00+00:00"}

    def synced(self, body="Body\n", **over):
        m = obj("a", **over)
        m["trypost"]["synced_hash"] = content.body_hash(body)
        return m

    def test_remote_edit_pulls(self):
        d = sync_plan.decide_pull(self.synced(), "Body\n", self.remote("Edited\n"))
        self.assertEqual((d["body"], d["conflict"]), ("Edited\n", False))

    def test_local_edit_is_left_for_push(self):
        d = sync_plan.decide_pull(self.synced(), "Local\n", self.remote("Body\n"))
        self.assertEqual((d["body"], d["conflict"]), (None, False))

    def test_both_edited_is_conflict(self):
        d = sync_plan.decide_pull(self.synced(), "Local\n", self.remote("Remote\n"))
        self.assertTrue(d["conflict"])
        self.assertIsNone(d["body"])

    def test_whitespace_only_difference_is_not_a_change(self):
        d = sync_plan.decide_pull(self.synced(), "Body\n", self.remote("Body"))
        self.assertEqual((d["body"], d["conflict"]), (None, False))

    def test_labels_move_status_up_only(self):
        self.assertEqual(sync_plan.decide_pull(self.synced(), "Body\n", self.remote("Body\n", ["approved"]))["status"], "approved")
        self.assertEqual(sync_plan.decide_pull(self.synced(), "Body\n", self.remote("Body\n", ["posted"]))["status"], "published")
        self.assertIsNone(sync_plan.decide_pull(self.synced(status="published"), "Body\n", self.remote("Body\n", ["review"]))["status"])
        self.assertIsNone(sync_plan.decide_pull(self.synced(status="approved"), "Body\n", self.remote("Body\n", ["approved"]))["status"])
        self.assertIsNone(sync_plan.decide_pull(self.synced(status="draft"), "Body\n", self.remote("Body\n", ["approved"]))["status"])


class Pull(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.ws = self.tmp / "hugo"
        content.save(content.object_path(self.ws, "a"), obj("a"), "Body\n")
        self.fake = FakeTryPost()
        self.client = TryPostClient("http://x", "t", transport=self.fake.transport)
        push(self.ws, self.client, dry_run=False, now=NOW)
        self.pid = content.load(content.object_path(self.ws, "a"))[0]["trypost"]["post_id"]

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def load(self):
        return content.load(content.object_path(self.ws, "a"))

    def test_posted_label_round_trips(self):
        self.fake.add_label_to_post(self.pid, "posted")
        self.assertIn("posted a", pull(self.ws, self.client, dry_run=False, now=NOW))
        m, _ = self.load()
        self.assertEqual(m["status"], "published")
        self.assertIsNotNone(m["posted_at"])

    def test_approved_label_round_trips_and_push_then_swaps_review(self):
        self.fake.add_label_to_post(self.pid, "approved")
        self.assertIn("approved a", pull(self.ws, self.client, dry_run=False, now=NOW))
        self.assertEqual(self.load()[0]["status"], "approved")
        push(self.ws, self.client, dry_run=False, now=NOW)
        names = {l["name"] for l in self.fake.posts[self.pid]["labels"]}
        self.assertIn("approved", names)
        self.assertNotIn("review", names)

    def test_remote_edit_and_conflict(self):
        self.fake.posts[self.pid]["content"] = "Remote\n"
        self.assertIn("pulled a", pull(self.ws, self.client, dry_run=False, now=NOW))
        self.assertEqual(self.load()[1], "Remote\n")
        self.assertEqual(self.load()[0]["trypost"]["synced_hash"], content.body_hash("Remote\n"))
        m, _ = self.load()
        content.save(content.object_path(self.ws, "a"), m, "Local\n")
        self.fake.posts[self.pid]["content"] = "Remote2\n"
        report = pull(self.ws, self.client, dry_run=False, now=NOW)
        self.assertTrue(any(l.startswith("conflict a") and "Local" in l and "Remote2" in l for l in report), report)
        self.assertEqual(self.load()[1], "Local\n")

    def test_unchanged_and_dry_run(self):
        self.assertIn("unchanged a", pull(self.ws, self.client, dry_run=False, now=NOW))
        self.fake.add_label_to_post(self.pid, "posted")
        report = pull(self.ws, self.client, dry_run=True, now=NOW)
        self.assertIn("would posted a", report)
        self.assertEqual(self.load()[0]["status"], "in-review")

    def test_missing_remote(self):
        del self.fake.posts[self.pid]
        self.assertIn("missing in TryPost: a", pull(self.ws, self.client, dry_run=False, now=NOW))
        self.assertEqual(self.load()[0]["trypost"]["post_id"], self.pid)
        pull(self.ws, self.client, dry_run=False, relink=True, now=NOW)
        self.assertIsNone(self.load()[0]["trypost"]["post_id"])
        self.assertIn("created a", push(self.ws, self.client, dry_run=False, now=NOW))

    def test_push_refuses_to_overwrite_a_remote_edit(self):
        self.fake.posts[self.pid]["content"] = "Remote\n"
        m, _ = self.load()
        content.save(content.object_path(self.ws, "a"), m, "Local\n")
        report = push(self.ws, self.client, dry_run=False, now=NOW)
        self.assertTrue(any(l.startswith("conflict a") and "pull first" in l for l in report), report)
        self.assertEqual(self.fake.posts[self.pid]["content"], "Remote\n")
        self.assertEqual(self.load()[1], "Local\n")

    def test_push_refuses_to_strip_a_label_added_in_trypost(self):
        self.fake.add_label_to_post(self.pid, "approved")
        m, body = self.load()
        m["status"] = "in-review"
        content.save(content.object_path(self.ws, "a"), m, body)
        report = push(self.ws, self.client, dry_run=False, now=NOW)
        self.assertTrue(any(l.startswith("conflict a") for l in report), report)
        self.assertIn("approved", {l["name"] for l in self.fake.posts[self.pid]["labels"]})

    def test_sync_keeps_remote_text_when_both_sides_changed(self):
        self.fake.posts[self.pid]["content"] = "Remote\n"
        m, _ = self.load()
        content.save(content.object_path(self.ws, "a"), m, "Local\n")
        report = sync(self.ws, self.client, dry_run=False, now=NOW)
        self.assertEqual(sum(1 for l in report if l.startswith("conflict a")), 2)
        self.assertFalse(any(l.startswith("updated a") for l in report), report)
        self.assertEqual(self.fake.posts[self.pid]["content"], "Remote\n")

    def test_sync_is_pull_then_push(self):
        self.fake.add_label_to_post(self.pid, "posted")
        report = sync(self.ws, self.client, dry_run=False, now=NOW)
        self.assertIn("posted a", report)
        self.assertEqual(self.load()[0]["status"], "published")
        self.assertIn("posted", {l["name"] for l in self.fake.posts[self.pid]["labels"]})


class LongFormRelink(unittest.TestCase):
    """After a TryPost wipe, pull --relink forgets a long-form piece's card, reminder note and calendar draft, so the next push
    makes them again; without --relink they are only reported."""

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.ws = self.tmp / "hugo"
        content.save(content.object_path(self.ws, "a"), obj("a"), "Body\n")
        content.save(content.object_path(self.ws, "art"), obj("art", format="article", seo_description="Desc"), "# Article\n")
        content.save(content.object_path(self.ws, "ess"), obj("ess", surface="substack", format="essay", title="Essay", subtitle="Sub.",
                                                             first_comment=""), "# Essay\n")
        self.fake = FakeTryPost()
        self.client = TryPostClient("http://x", "t", transport=self.fake.transport)
        push(self.ws, self.client, dry_run=False, now=NOW)

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def state(self, id):
        return content.load(content.object_path(self.ws, id))[0]["trypost"]

    def test_a_present_card_and_draft_say_nothing(self):
        self.assertEqual(pull(self.ws, self.client, dry_run=False, now=NOW), ["unchanged a"])
        self.assertEqual(pull(self.ws, self.client, dry_run=False, relink=True, now=NOW), ["unchanged a"])

    def test_a_missing_card_is_reported_and_kept_without_relink(self):
        before = self.state("art")
        self.fake.delete_idea(before["idea_id"])
        self.assertIn("missing in TryPost: art", pull(self.ws, self.client, dry_run=False, now=NOW))
        self.assertEqual(self.state("art"), before)

    def test_relink_after_a_wipe_brings_the_cards_and_the_calendar_draft_back(self):
        for id in ("art", "ess"):
            self.assertIsNotNone(self.state(id)["reminder_note_id"])
        self.assertIsNotNone(self.state("ess")["post_id"])
        self.fake.ideas.clear()
        self.fake.posts.clear()
        self.fake.notes.clear()
        before = {id: self.state(id) for id in ("art", "ess")}
        self.assertEqual(pull(self.ws, self.client, dry_run=True, relink=True, now=NOW),
                         ["would missing in TryPost: a", "would relinked art", "would relinked ess"])
        self.assertEqual({id: self.state(id) for id in ("art", "ess")}, before)
        self.assertEqual(pull(self.ws, self.client, dry_run=False, relink=True, now=NOW), ["missing in TryPost: a", "relinked art", "relinked ess"])
        for id in ("art", "ess"):
            state = self.state(id)
            self.assertEqual((state["idea_id"], state["reminder_note_id"]), (None, None), id)
        self.assertEqual((self.state("ess")["post_id"], self.state("ess")["draft_hash"]), (None, None))
        report = push(self.ws, self.client, dry_run=False, now=NOW)
        self.assertTrue({"created a", "idea art", "idea ess", "created ess"} <= set(report), report)
        for id in ("art", "ess"):
            state = self.state(id)
            self.assertIn(state["idea_id"], self.fake.ideas)
            self.assertIsNotNone(state["reminder_note_id"])
        self.assertEqual(self.fake.posts[self.state("ess")["post_id"]]["content"], 'Essay\n\nSub.\n\nThe full text is in the Ideas card "Essay".\n')
        self.assertEqual(pull(self.ws, self.client, dry_run=False, relink=True, now=NOW), ["unchanged a"])
        self.assertEqual(sorted(push(self.ws, self.client, dry_run=False, now=NOW)), ["unchanged a", "unchanged art", "unchanged ess"])

    def test_relink_forgets_only_what_is_gone(self):
        ess = self.state("ess")
        del self.fake.posts[ess["post_id"]]
        self.assertEqual(pull(self.ws, self.client, dry_run=False, relink=True, now=NOW), ["unchanged a", "relinked ess"])
        state = self.state("ess")
        self.assertEqual((state["idea_id"], state["reminder_note_id"], state["post_id"]), (ess["idea_id"], ess["reminder_note_id"], None))
        self.assertIsNotNone(self.state("art")["idea_id"])
        self.assertIn("created ess", push(self.ws, self.client, dry_run=False, now=NOW))
        self.assertEqual(len([i for i in self.fake.ideas.values() if "Essay" in i["title"]]), 1)

    def test_an_archived_long_form_piece_is_left_alone(self):
        meta, body = content.load(content.object_path(self.ws, "art"))
        meta["status"] = "archived"
        content.save(content.object_path(self.ws, "art"), meta, body)
        self.fake.ideas.clear()
        self.assertEqual(pull(self.ws, self.client, dry_run=False, relink=True, now=NOW), ["unchanged a", "relinked ess"])
        self.assertIsNotNone(self.state("art")["idea_id"])


class Blocked(Pull):
    def test_approved_label_is_refused_when_blocked(self):
        meta = obj("b")
        content.set_review(meta, "2026-10-21T10:00:00+01:00", ["High: a number without a source"])
        content.save(content.object_path(self.ws, "b"), meta, "Body B\n")
        push(self.ws, self.client, False, now=NOW)
        post_id = content.load(content.object_path(self.ws, "b"))[0]["trypost"]["post_id"]
        self.fake.add_label_to_post(post_id, "approved")
        lines = pull(self.ws, self.client, False, now=NOW)
        self.assertIn("blocked b: 1 High flag from brand-review", lines)
        self.assertEqual(content.load(content.object_path(self.ws, "b"))[0]["status"], "in-review")
        names = {l["name"] for l in self.fake.posts[post_id]["labels"]}
        self.assertNotIn("approved", names)
        self.assertIn("blocked", names)
        self.assertTrue(any(n["body"] == "Blocked: 1 High flag from brand-review" for n in self.fake.notes[post_id]))

    def test_posted_label_still_applies(self):
        meta = obj("c")
        content.set_review(meta, "2026-10-21T10:00:00+01:00", ["High: a number without a source"])
        content.save(content.object_path(self.ws, "c"), meta, "Body C\n")
        push(self.ws, self.client, False, now=NOW)
        post_id = content.load(content.object_path(self.ws, "c"))[0]["trypost"]["post_id"]
        self.fake.add_label_to_post(post_id, "posted")
        pull(self.ws, self.client, False, now=NOW)
        self.assertEqual(content.load(content.object_path(self.ws, "c"))[0]["status"], "published")

    def blocked_post(self, id="d"):
        meta = obj(id)
        content.set_review(meta, "2026-10-21T10:00:00+01:00", ["High: a number without a source"])
        content.save(content.object_path(self.ws, id), meta, "Body D\n")
        push(self.ws, self.client, False, now=NOW)
        post_id = content.load(content.object_path(self.ws, id))[0]["trypost"]["post_id"]
        self.fake.add_label_to_post(post_id, "approved")
        return post_id

    def test_dry_run_reports_the_refusal_and_writes_nothing(self):
        post_id = self.blocked_post()
        notes_before = len(self.fake.notes.get(post_id, []))
        lines = pull(self.ws, self.client, True, now=NOW)
        self.assertIn("would blocked d: 1 High flag from brand-review", lines)
        self.assertIn("approved", {l["name"] for l in self.fake.posts[post_id]["labels"]})
        self.assertEqual(len(self.fake.notes.get(post_id, [])), notes_before)

    def test_a_second_pull_is_quiet_and_the_label_is_created_once(self):
        post_id = self.blocked_post()
        pull(self.ws, self.client, False, now=NOW)
        self.assertIn("unchanged d", pull(self.ws, self.client, False, now=NOW))
        self.assertEqual([l["name"] for l in self.fake.labels.values()].count("blocked"), 1)
        self.assertEqual(sum(1 for n in self.fake.notes[post_id] if n["body"].startswith("Blocked:")), 1)

    def test_a_failing_score_blocks_too(self):
        meta = obj("e")
        content.set_score(meta, "2026-10-21T10:00:00+01:00", hook=4, voice=4, value=4, fit=4, ready=4)
        remote = {"content": "Body\n", "labels": [{"id": "x", "name": "approved"}]}
        meta["trypost"]["synced_hash"] = content.body_hash("Body\n")
        decision = sync_plan.decide_pull(meta, "Body\n", remote)
        self.assertIsNone(decision["status"])
        self.assertEqual(len(decision["blocked"]), 1)
        self.assertTrue(decision["blocked"][0].startswith("score "))


class EditsLog(unittest.TestCase):
    """A remote edit that is pulled is also kept, as a diff, in edits.md next to the content folder."""

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.ws = self.tmp / "hugo"
        content.save(content.object_path(self.ws, "a"), obj("a"), "Body\n")
        self.fake = FakeTryPost()
        self.client = TryPostClient("http://x", "t", transport=self.fake.transport)
        push(self.ws, self.client, dry_run=False, now=NOW)
        self.pid = content.load(content.object_path(self.ws, "a"))[0]["trypost"]["post_id"]
        self.log = self.ws / "edits.md"

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def test_a_pulled_edit_is_logged_as_a_diff(self):
        self.fake.posts[self.pid]["content"] = "Edited\n"
        self.assertIn("pulled a", pull(self.ws, self.client, dry_run=False, now=NOW))
        text = self.log.read_text(encoding="utf-8")
        self.assertTrue(text.startswith("# Edits made in TryPost\n"), text)
        self.assertEqual(text.count("# Edits made in TryPost"), 1)
        self.assertIn("\n## 2026-10-21T13:00:00+01:00 a\n", text)
        self.assertIn("```diff\n--- file\n+++ trypost\n", text)
        lines = text.splitlines()
        self.assertIn("-Body", lines)
        self.assertIn("+Edited", lines)
        self.assertTrue(text.endswith("```\n\n"), repr(text))

    def test_a_second_edit_appends_a_second_block(self):
        self.fake.posts[self.pid]["content"] = "Edited\n"
        pull(self.ws, self.client, dry_run=False, now=NOW)
        self.fake.posts[self.pid]["content"] = "Edited again\n"
        pull(self.ws, self.client, dry_run=False, now=NOW)
        text = self.log.read_text(encoding="utf-8")
        self.assertEqual(text.count("```diff"), 2)
        self.assertEqual(text.count("# Edits made in TryPost"), 1)
        self.assertTrue(text.rstrip().endswith("```"))
        self.assertIn("-Edited", text.splitlines())
        self.assertIn("+Edited again", text.splitlines())

    def test_a_body_with_a_code_fence_still_logs_inside_one_fence(self):
        self.fake.posts[self.pid]["content"] = "Body\n```\ncode\n```\n"
        pull(self.ws, self.client, dry_run=False, now=NOW)
        text = self.log.read_text(encoding="utf-8")
        self.assertIn("````diff\n", text)
        self.assertTrue(text.endswith("````\n\n"), repr(text))

    def test_a_dry_run_writes_no_log(self):
        self.fake.posts[self.pid]["content"] = "Edited\n"
        self.assertIn("would pulled a", pull(self.ws, self.client, dry_run=True, now=NOW))
        self.assertFalse(self.log.exists())

    def test_a_label_only_pull_writes_no_log(self):
        self.fake.add_label_to_post(self.pid, "posted")
        pull(self.ws, self.client, dry_run=False, now=NOW)
        self.assertFalse(self.log.exists())

    def test_a_conflict_writes_no_log(self):
        self.fake.posts[self.pid]["content"] = "Remote\n"
        meta, _ = content.load(content.object_path(self.ws, "a"))
        content.save(content.object_path(self.ws, "a"), meta, "Local\n")
        pull(self.ws, self.client, dry_run=False, now=NOW)
        self.assertFalse(self.log.exists())


if __name__ == "__main__":
    unittest.main()
