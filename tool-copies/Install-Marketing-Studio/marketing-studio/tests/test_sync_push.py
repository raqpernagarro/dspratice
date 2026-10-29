import shutil
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest import mock

from scripts import redate
from scripts.lib import content, sync_plan
from scripts.lib.trypost_api import TryPostClient
from scripts.trypost_sync import push
from tests.fakes import FakeTryPost

NOW = datetime(2026, 10, 21, 12, 0, tzinfo=timezone.utc)


def obj(id, **over):
    m = {
        "id": id, "type": "post", "title": id, "status": "in-review", "brand": "hugo", "surface": "linkedin",
        "format": "image", "mode": "nagarro", "campaign": "ai-ready-design-systems", "pillar": 3, "author": "hugo",
        "timezone": "Europe/Lisbon", "scheduled_date": "2026-10-23T08:30:00+01:00",
        "first_comment": "Link: https://e.com", "tags_people": [], "sources": [], "assets": [],
        "trypost": {"post_id": None, "idea_id": None, "synced_at": None, "synced_hash": None},
        "posted_at": None, "score": None, "performance": None,
        "created": "2026-10-21T10:00:00+01:00", "updated": "2026-10-21T10:00:00+01:00",
    }
    m.update(over)
    return m


class Plan(unittest.TestCase):
    def test_labels(self):
        self.assertEqual(sync_plan.labels_for(obj("a")), ["campaign:ai-ready-design-systems", "pillar:3", "mode:nagarro", "review"])
        self.assertIn("posted", sync_plan.labels_for(obj("a", status="published")))
        self.assertIn("approved", sync_plan.labels_for(obj("a", status="scheduled")))
        self.assertIn("needs-caption", sync_plan.labels_for(obj("a", labels_extra=["needs-caption"])))
        self.assertNotIn("pillar:None", sync_plan.labels_for(obj("a", pillar=None)))

    def test_content_types_and_classification(self):
        self.assertEqual(sync_plan.content_type_for(obj("a")), "linkedin_post")
        self.assertEqual(sync_plan.content_type_for(obj("a", surface="instagram", format="reel")), "instagram_reel")
        self.assertEqual(sync_plan.content_type_for(obj("a", surface="instagram", format="carousel")), "instagram_feed")
        self.assertEqual(sync_plan.content_type_for(obj("a", surface="x", format="text")), "x_post")
        self.assertTrue(sync_plan.is_channel_piece(obj("a")))
        self.assertFalse(sync_plan.is_channel_piece(obj("a", format="article")))
        self.assertFalse(sync_plan.is_channel_piece(obj("a", surface="substack", format="essay")))
        self.assertTrue(sync_plan.is_long_form(obj("a", surface="substack", format="essay")))
        self.assertFalse(sync_plan.is_long_form(obj("a")))

    def test_viva_and_substack_borrow_a_platform_and_its_content_type(self):
        self.assertEqual(sync_plan.SURFACE_PLATFORMS, {"linkedin": "linkedin", "instagram": "instagram", "x": "x", "viva": "facebook", "substack": "mastodon"})
        self.assertEqual(sync_plan.content_type_for(obj("v", surface="viva", format="text")), "facebook_post")
        self.assertEqual(sync_plan.content_type_for(obj("v", surface="viva", format="image")), "facebook_post")
        self.assertEqual(sync_plan.content_type_for(obj("n", surface="substack", format="note")), "mastodon_post")
        # Each content type belongs to the platform its surface borrows, so no piece can reach another network's channel.
        for surface, platform in sync_plan.SURFACE_PLATFORMS.items():
            fmt = {"instagram": "image", "substack": "note"}.get(surface, "text")
            self.assertTrue(sync_plan.content_type_for(obj("p", surface=surface, format=fmt)).startswith(platform + "_"), surface)
        # A note is a draft on the Substack channel; an essay stays long form, with a calendar draft beside its card.
        self.assertTrue(sync_plan.is_channel_piece(obj("n", surface="substack", format="note")))
        self.assertFalse(sync_plan.is_long_form(obj("n", surface="substack", format="note")))
        self.assertTrue(sync_plan.is_channel_piece(obj("v", surface="viva", format="video")))
        self.assertTrue(sync_plan.has_calendar_draft(obj("e", surface="substack", format="essay")))
        self.assertFalse(sync_plan.has_calendar_draft(obj("art", format="article")))
        self.assertFalse(sync_plan.has_calendar_draft(obj("n", surface="substack", format="note")))

    def test_an_essays_calendar_draft_is_its_title_subtitle_and_a_pointer(self):
        essay = obj("e", surface="substack", format="essay", title="Caring more", subtitle="One sentence.")
        self.assertEqual(sync_plan.calendar_draft_text(essay), 'Caring more\n\nOne sentence.\n\nThe full text is in the Ideas card "Caring more".\n')
        self.assertEqual(sync_plan.calendar_draft_text(dict(essay, subtitle=None)), 'Caring more\n\nThe full text is in the Ideas card "Caring more".\n')
        self.assertEqual(sync_plan.calendar_draft_labels(essay), ["campaign:ai-ready-design-systems", "pillar:3", "mode:nagarro", "long-form"])
        self.assertEqual(sync_plan.build_calendar_draft_update(essay, NOW), {"content": sync_plan.calendar_draft_text(essay), "scheduled_at": "2026-10-23T08:30:00+01:00"})
        self.assertEqual(sync_plan.build_calendar_draft_update(dict(essay, scheduled_date="2026-10-20T09:00:00+01:00"), NOW), {"content": sync_plan.calendar_draft_text(essay)})

    def test_payload_never_scheduled_and_drops_past_dates(self):
        p = sync_plan.build_create_payload(obj("a", scheduled_date="2026-10-21T08:30:00+01:00"), "b", "acc", [], [], NOW)
        self.assertEqual(p["status"], "draft")
        self.assertNotIn("scheduled_at", p)
        p2 = sync_plan.build_create_payload(obj("a", format="carousel-pdf", document_title="T"), "b", "acc", ["l1"], ["u1"], NOW)
        self.assertEqual(p2["scheduled_at"], "2026-10-23T08:30:00+01:00")
        self.assertEqual(p2["meta"], {"document_title": "T"})
        self.assertEqual(p2["media"], [{"upload_token": "u1"}])
        self.assertEqual(p2["content_type"], "linkedin_post")
        self.assertEqual(p2["label_ids"], ["l1"])
        self.assertEqual(p2["content"], "b")
        self.assertNotIn("scheduled_at", sync_plan.build_create_payload(obj("a", scheduled_date=None), "b", "acc", [], [], NOW))

    def test_notes_and_idea(self):
        self.assertEqual(sync_plan.notes_for(obj("a")), ["First comment:\nLink: https://e.com"])
        self.assertEqual(sync_plan.notes_for(obj("a", first_comment="", format="poll", poll_options=["A", "B"])), ["Poll options:\n1. A\n2. B"])
        idea = sync_plan.idea_for(obj("art", format="article", title="Why", seo_description="Desc"))
        self.assertEqual(idea["title"], "23 Oct · LinkedIn article · Why")
        self.assertEqual(idea["body"], "File: content/art.md\nPublish: 2026-10-23\n\nDesc")
        self.assertTrue(sync_plan.idea_for(obj("e", surface="substack", format="essay"))["title"].startswith("23 Oct · Substack essay"))


class Push(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.ws = self.tmp / "hugo"
        (self.ws / "assets" / "a").mkdir(parents=True)
        (self.ws / "assets" / "a" / "a.png").write_bytes(b"png")
        content.save(content.object_path(self.ws, "a"), obj("a", assets=["assets/a/a.png"]), "Body A\n")
        content.save(content.object_path(self.ws, "old"), obj("old", scheduled_date="2026-10-20T08:30:00+01:00"), "Old\n")
        content.save(content.object_path(self.ws, "art"), obj("art", format="article", scheduled_date="2026-10-23T08:30:00+01:00", seo_description="Desc"), "# Article\n")
        content.save(content.object_path(self.ws, "bad"), obj("bad", assets=["assets/a/missing.png"]), "Bad\n")
        (self.ws / "assets" / "a" / "reject.png").write_bytes(b"png")
        content.save(content.object_path(self.ws, "rej"), obj("rej", assets=["assets/a/reject.png"]), "Rej\n")
        self.fake = FakeTryPost()
        self.client = TryPostClient("http://x", "t", transport=self.fake.transport)

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def test_first_push_creates_everything(self):
        report = push(self.ws, self.client, dry_run=False, now=NOW)
        self.assertIn("created a", report)
        self.assertIn("overdue old", report)
        self.assertIn("idea art", report)
        self.assertTrue(any(l.startswith("failed bad:") for l in report))
        self.assertTrue(any(l.startswith("failed rej:") and "file of type" in l for l in report))
        self.assertIsNone(content.load(content.object_path(self.ws, "rej"))[0]["trypost"]["post_id"])
        a = content.load(content.object_path(self.ws, "a"))[0]
        self.assertIsNotNone(a["trypost"]["post_id"])
        self.assertEqual(a["trypost"]["synced_hash"], content.body_hash("Body A\n"))
        self.assertIsNotNone(a["trypost"]["synced_at"])
        post = self.fake.posts[a["trypost"]["post_id"]]
        self.assertEqual(post["status"], "draft")
        self.assertEqual(len(post["media"]), 1)
        self.assertEqual(post["scheduled_at"], "2026-10-23 07:30:00")
        self.assertEqual([n["body"] for n in self.fake.notes[post["id"]]][0], "First comment:\nLink: https://e.com")
        self.assertTrue(any(n["body"].startswith("Also today:") for n in self.fake.notes[post["id"]]))
        self.assertTrue({l["name"] for l in self.fake.labels.values()} >= {"campaign:ai-ready-design-systems", "pillar:3", "mode:nagarro", "review", "long-form"})
        # the status labels always exist, so Hugo can apply approved or posted in TryPost before any piece has that status
        self.assertTrue({l["name"] for l in self.fake.labels.values()} >= {"review", "approved", "posted"})
        self.assertFalse(any(r[2] and r[2].get("status") in ("scheduled", "publishing") for r in self.fake.requests))
        old = content.load(content.object_path(self.ws, "old"))[0]
        self.assertIsNone(self.fake.posts[old["trypost"]["post_id"]]["scheduled_at"])
        art = content.load(content.object_path(self.ws, "art"))[0]
        self.assertIn(art["trypost"]["idea_id"], self.fake.ideas)
        self.assertEqual(self.fake.ideas[art["trypost"]["idea_id"]]["labels"][0]["name"], "long-form")
        self.assertIsNotNone(art["trypost"].get("reminder_note_id"))

    def test_second_push_is_unchanged_then_updates_after_edit(self):
        push(self.ws, self.client, dry_run=False, now=NOW)
        second = push(self.ws, self.client, dry_run=False, now=NOW)
        self.assertIn("unchanged a", second)
        self.assertIn("unchanged art", second)
        note_count = len(self.fake.notes[content.load(content.object_path(self.ws, "a"))[0]["trypost"]["post_id"]])
        meta, _ = content.load(content.object_path(self.ws, "a"))
        content.save(content.object_path(self.ws, "a"), meta, "Body A2\n")
        third = push(self.ws, self.client, dry_run=False, now=NOW)
        self.assertIn("updated a", third)
        self.assertEqual(self.fake.posts[meta["trypost"]["post_id"]]["content"], "Body A2\n")
        self.assertEqual(len(self.fake.notes[meta["trypost"]["post_id"]]), note_count)

    def test_a_redated_post_is_updated_with_its_new_date(self):
        push(self.ws, self.client, dry_run=False, now=NOW)
        redate.redate(self.ws, "a", "2026-10-24")
        self.assertIn("updated a", push(self.ws, self.client, dry_run=False, now=NOW))
        meta = content.load(content.object_path(self.ws, "a"))[0]
        post = self.fake.posts[meta["trypost"]["post_id"]]
        self.assertEqual((post["scheduled_at"], post["status"]), ("2026-10-24 07:30:00", "draft"))
        self.assertEqual(meta["trypost"]["synced_scheduled_date"], "2026-10-24T08:30:00+01:00")
        self.assertFalse(any(r[2] and r[2].get("status") in ("scheduled", "publishing") for r in self.fake.requests))
        self.assertIn("unchanged a", push(self.ws, self.client, dry_run=False, now=NOW))

    def test_a_post_pushed_before_its_date_was_recorded(self):
        push(self.ws, self.client, dry_run=False, now=NOW)
        for id in ("a", "old"):  # as files pushed before synced_scheduled_date existed; old's draft has no date, its day passed
            meta, body = content.load(content.object_path(self.ws, id))
            del meta["trypost"]["synced_scheduled_date"]
            content.save(content.object_path(self.ws, id), meta, body)
        puts = [r for r in self.fake.requests if r[0] == "PUT"]
        report = push(self.ws, self.client, dry_run=False, now=NOW)
        self.assertTrue({"unchanged a", "unchanged old"} <= set(report), report)
        self.assertEqual([r for r in self.fake.requests if r[0] == "PUT"], puts)
        self.assertEqual(content.load(content.object_path(self.ws, "a"))[0]["trypost"]["synced_scheduled_date"], "2026-10-23T08:30:00+01:00")
        # Moved before the upgrade: TryPost still holds the old day, so the date counts as changed.
        meta, body = content.load(content.object_path(self.ws, "a"))
        del meta["trypost"]["synced_scheduled_date"]
        meta["scheduled_date"] = "2026-10-25T08:30:00+00:00"
        content.save(content.object_path(self.ws, "a"), meta, body)
        self.assertIn("updated a", push(self.ws, self.client, dry_run=False, now=NOW))
        self.assertEqual(self.fake.posts[meta["trypost"]["post_id"]]["scheduled_at"], "2026-10-25 08:30:00")

    def test_status_change_updates_labels(self):
        push(self.ws, self.client, dry_run=False, now=NOW)
        meta, body = content.load(content.object_path(self.ws, "a"))
        meta["status"] = "approved"
        content.save(content.object_path(self.ws, "a"), meta, body)
        self.assertIn("updated a", push(self.ws, self.client, dry_run=False, now=NOW))
        names = {l["name"] for l in self.fake.posts[meta["trypost"]["post_id"]]["labels"]}
        self.assertIn("approved", names)
        self.assertNotIn("review", names)

    def test_note_failure_keeps_post_id_and_never_duplicates(self):
        self.fake.fail_next_note = True
        report = push(self.ws, self.client, dry_run=False, now=NOW)
        self.assertTrue(any(l.startswith("failed a:") for l in report), report)
        meta = content.load(content.object_path(self.ws, "a"))[0]
        self.assertIsNotNone(meta["trypost"]["post_id"])
        self.assertFalse(meta["trypost"].get("notes_synced"))
        drafts_before = len(self.fake.posts)
        second = push(self.ws, self.client, dry_run=False, now=NOW)
        self.assertEqual(len(self.fake.posts), drafts_before)
        self.assertIn("updated a", second)
        meta = content.load(content.object_path(self.ws, "a"))[0]
        self.assertTrue(meta["trypost"]["notes_synced"])
        self.assertEqual(len(self.fake.notes[meta["trypost"]["post_id"]]), 2)  # first comment + the "Also today" reminder

    def test_invalid_piece_fails_alone_and_the_run_continues(self):
        content.save(content.object_path(self.ws, "naive"), obj("naive", scheduled_date="2026-10-22"), "N\n")
        report = push(self.ws, self.client, dry_run=False, now=NOW)
        self.assertTrue(any(l.startswith("failed naive:") and "scheduled_date" in l for l in report), report)
        self.assertIn("created a", report)
        self.assertIsNone(content.load(content.object_path(self.ws, "naive"))[0]["trypost"]["post_id"])

    def test_dry_run_writes_nothing(self):
        report = push(self.ws, self.client, dry_run=True, now=NOW)
        self.assertTrue(all(l.startswith("would ") for l in report), report)
        self.assertEqual(self.fake.posts, {})
        self.assertEqual(self.fake.labels, {})
        self.assertIsNone(content.load(content.object_path(self.ws, "a"))[0]["trypost"]["post_id"])



class SliceOnePieces(Push):
    def test_visual_brief_and_prompt_become_notes(self):
        notes = sync_plan.notes_for(obj("a", visual_brief="Petrol card", image_prompt="Prompt text"))
        self.assertEqual(notes, ["First comment:\nLink: https://e.com", "Visual brief:\nPetrol card", "Image prompt:\nPrompt text"])

    def test_idea_objects_go_to_the_board_not_the_posts_and_drafts_carry_no_status_label(self):
        content.save(content.object_path(self.ws, "idea"), content.new_idea_meta("idea", "T", "personal", 1, "2026-10-22T10:00:00+01:00"), "# Angles\n")
        content.save(content.object_path(self.ws, "d"), obj("d", status="draft", campaign=None, pillar=1, mode="personal", first_comment=""), "Draft\n")
        lines = push(self.ws, self.client, False, now=NOW)
        self.assertIn("idea idea idea", lines)  # the idea board, by status (tests/test_sync_ideas.py covers it); never a post
        self.assertFalse(any(p["content"] == "# Angles\n" for p in self.fake.posts.values()))
        self.assertIn("created d", lines)
        post = next(p for p in self.fake.posts.values() if p["content"] == "Draft\n")
        self.assertEqual(sorted(l["name"] for l in post["labels"]), ["mode:personal", "pillar:1"])
        self.assertEqual(post["status"], "draft")

    def test_x_thread_pushes_as_a_post_and_its_replies(self):
        body = "One.\n\n---\n\nTwo.\n\n---\n\nThree.\n\n---\n\nFour.\n"
        content.save(content.object_path(self.ws, "t"), obj("t", surface="x", format="thread", first_comment="Reply: https://e.com"), body)
        push(self.ws, self.client, False, now=NOW)
        post = next(p for p in self.fake.posts.values() if p["content"] == "One.")
        self.assertEqual(post["content_type"], "x_post")
        self.assertEqual(post["meta"]["thread_replies"], ["Two.", "Three.", "Four."])


ESSAY_BODY = "# Caring more\n\n" + "A long paragraph of the essay itself. " * 400 + "\n"


class VivaAndSubstack(unittest.TestCase):
    """Viva Engage pieces go to the facebook channel, Substack notes and essay calendar drafts to the mastodon one."""

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.ws = self.tmp / "hugo"
        self.save(obj("v", surface="viva", format="text", scheduled_date="2026-10-27T10:00:00+00:00", first_comment=""), "For colleagues: https://intranet.example/x\n")
        self.save(obj("n", surface="substack", format="note", campaign="flo-2026-talks", pillar=4, mode="personal",
                      scheduled_date="2026-10-29T09:30:00+00:00", first_comment=""), "A note of three sentences.\n")
        self.save(obj("e", surface="substack", format="essay", campaign="flo-2026-talks", pillar=4, mode="personal", status="draft",
                      title="Caring more", subtitle="One sentence.", scheduled_date="2026-10-29T09:00:00+00:00", first_comment=""), ESSAY_BODY)
        self.fake = FakeTryPost()
        self.client = TryPostClient("http://x", "t", transport=self.fake.transport)

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def save(self, meta, body):
        content.save(content.object_path(self.ws, meta["id"]), meta, body)

    def load(self, id):
        return content.load(content.object_path(self.ws, id))

    def post_of(self, id):
        return self.fake.posts[self.load(id)[0]["trypost"]["post_id"]]

    def account(self, post):
        return self.fake.accounts[post["social_account"]["id"]]

    def test_a_viva_piece_lands_on_the_facebook_channel(self):
        report = push(self.ws, self.client, dry_run=False, now=NOW)
        self.assertIn("created v", report)
        post = self.post_of("v")
        self.assertEqual((post["platform"], post["content_type"], post["status"]), ("facebook", "facebook_post", "draft"))
        self.assertEqual(self.account(post)["display_name"], "Viva Engage (manual)")
        self.assertEqual((post["content"], post["scheduled_at"]), ("For colleagues: https://intranet.example/x\n", "2026-10-27 10:00:00"))
        self.assertFalse([p for p in self.fake.posts.values() if p["platform"] in ("linkedin", "instagram", "x")])

    def test_a_note_lands_on_the_mastodon_channel_with_its_text_and_no_card(self):
        report = push(self.ws, self.client, dry_run=False, now=NOW)
        self.assertIn("created n", report)
        post = self.post_of("n")
        self.assertEqual((post["platform"], post["content_type"], post["content"]), ("mastodon", "mastodon_post", "A note of three sentences.\n"))
        self.assertEqual(self.account(post)["display_name"], "Substack (manual)")
        self.assertIsNone(self.load("n")[0]["trypost"]["idea_id"])
        self.assertFalse(any("A note" in (i["title"] + i["body"]) for i in self.fake.ideas.values()))
        self.assertIn("unchanged n", push(self.ws, self.client, dry_run=False, now=NOW))

    def test_an_essay_keeps_its_card_and_gains_one_calendar_draft_without_its_body(self):
        report = push(self.ws, self.client, dry_run=False, now=NOW)
        self.assertIn("idea e", report)
        self.assertIn("created e", report)
        meta = self.load("e")[0]
        card = self.fake.ideas[meta["trypost"]["idea_id"]]
        self.assertEqual(card["title"], "29 Oct · Substack essay · Caring more")
        self.assertEqual([l["name"] for l in card["labels"]], ["long-form"])
        draft = self.fake.posts[meta["trypost"]["post_id"]]
        self.assertEqual(draft["content"], 'Caring more\n\nOne sentence.\n\nThe full text is in the Ideas card "Caring more".\n')
        self.assertNotIn("A long paragraph", draft["content"])
        self.assertEqual((draft["platform"], draft["content_type"], draft["status"], draft["scheduled_at"]), ("mastodon", "mastodon_post", "draft", "2026-10-29 09:00:00"))
        self.assertEqual(sorted(l["name"] for l in draft["labels"]), ["campaign:flo-2026-talks", "long-form", "mode:personal", "pillar:4"])
        self.assertEqual(draft["media"], [])
        self.assertEqual(meta["trypost"]["draft_hash"], content.body_hash(draft["content"]))
        # The note shares the essay's day, so the essay's reminder lands on the note's draft.
        self.assertEqual([n["body"] for n in self.fake.notes[self.post_of("n")["id"]]], ["Also today: 29 Oct · Substack essay · Caring more"])
        self.assertFalse(any(r[2] and r[2].get("status") in ("scheduled", "publishing") for r in self.fake.requests))
        posts = len(self.fake.posts)
        self.assertIn("unchanged e", push(self.ws, self.client, dry_run=False, now=NOW))
        self.assertEqual(len(self.fake.posts), posts)

    def test_a_redated_or_retitled_essay_updates_its_draft_and_an_edit_in_trypost_is_left_alone(self):
        push(self.ws, self.client, dry_run=False, now=NOW)
        redate.redate(self.ws, "e", "2026-10-30")
        meta, body = self.load("e")
        meta["subtitle"] = "Another sentence."
        self.save(meta, body)
        self.assertIn("updated e", push(self.ws, self.client, dry_run=False, now=NOW))
        draft = self.post_of("e")
        self.assertEqual((draft["scheduled_at"], draft["status"]), ("2026-10-30 09:00:00", "draft"))
        self.assertIn("Another sentence.", draft["content"])
        self.assertIn("unchanged e", push(self.ws, self.client, dry_run=False, now=NOW))
        draft["content"] = "Hugo's own words\n"
        meta, body = self.load("e")
        meta["subtitle"] = "A third sentence."
        self.save(meta, body)
        report = push(self.ws, self.client, dry_run=False, now=NOW)
        self.assertIn("conflict e: the calendar draft was edited in TryPost; undo the edit, or delete the draft and run pull --relink", report)
        self.assertEqual(draft["content"], "Hugo's own words\n")

    def test_dry_run_names_the_drafts_and_writes_nothing(self):
        report = push(self.ws, self.client, dry_run=True, now=NOW)
        self.assertTrue({"would created v", "would created n", "would idea e", "would created e"} <= set(report), report)
        self.assertEqual((self.fake.posts, self.fake.ideas), ({}, {}))
        self.assertIsNone(self.load("e")[0]["trypost"]["post_id"])

    def test_a_surface_without_its_channel_fails_alone(self):
        for id, account in list(self.fake.accounts.items()):
            if account["platform"] in ("facebook", "mastodon"):
                del self.fake.accounts[id]
        self.save(obj("l", surface="linkedin", format="text"), "A LinkedIn post.\n")
        report = push(self.ws, self.client, dry_run=False, now=NOW)
        self.assertIn("created l", report)  # the run goes on past the pieces with no channel
        self.assertIn("failed v: no manual channel for surface viva (see trypost/README.md)", report)
        self.assertIn("failed n: no manual channel for surface substack (see trypost/README.md)", report)
        self.assertIn("idea e", report)  # the card is made and kept; only the calendar draft fails
        self.assertIn("failed e: no manual channel for surface substack (see trypost/README.md)", report)
        meta = self.load("e")[0]
        self.assertIsNotNone(meta["trypost"]["idea_id"])
        self.assertIsNone(meta["trypost"]["post_id"])

    def test_a_piece_with_no_content_type_fails_alone_and_the_run_goes_on(self):
        types = {k: v for k, v in sync_plan.CONTENT_TYPES.items() if k != "viva"}
        with mock.patch.object(sync_plan, "CONTENT_TYPES", types):
            report = push(self.ws, self.client, dry_run=False, now=NOW)
        self.assertIn("failed v: no TryPost content type for surface 'viva'", report)
        self.assertIn("created n", report)
        self.assertIsNone(self.load("v")[0]["trypost"]["post_id"])


class GateLabels(unittest.TestCase):
    def test_blocked_label_and_script_note(self):
        review = {"high": 1, "medium": 0, "low": 0, "reviewed_at": "2026-10-22T10:00:00+01:00"}
        self.assertIn("blocked", sync_plan.labels_for(obj("a", review=review)))
        self.assertNotIn("blocked", sync_plan.labels_for(obj("a", review=dict(review, high=0, medium=2))))
        self.assertEqual(sync_plan.label_colour("blocked"), "#C4341A")
        self.assertEqual(sync_plan.notes_for(obj("a", first_comment="", script="HOOK: a line"))[-1], "Script:\nHOOK: a line")


if __name__ == "__main__":
    unittest.main()


class ConnectedChannels(unittest.TestCase):
    """A surface whose own network Hugo connected sends its new drafts to that account; borrowed platforms never do."""

    def accounts(self, *extra):
        manual = [{"id": "m-" + p, "platform": p, "username": "manual-" + p, "status": "disconnected"}
                  for p in ("linkedin", "instagram", "x", "facebook", "mastodon")]
        return manual + list(extra)

    def test_a_connected_x_account_takes_the_x_drafts(self):
        channels = sync_plan.pick_channels(self.accounts({"id": "real-x", "platform": "x", "username": "author-handle", "status": "connected"}))
        self.assertEqual(channels["x"], "real-x")
        self.assertEqual(channels["linkedin"], "m-linkedin")

    def test_a_disconnected_real_account_falls_back_to_the_placeholder(self):
        channels = sync_plan.pick_channels(self.accounts({"id": "real-x", "platform": "x", "username": "author-handle", "status": "disconnected"}))
        self.assertEqual(channels["x"], "m-x")

    def test_borrowed_platforms_never_take_a_real_account(self):
        channels = sync_plan.pick_channels(self.accounts(
            {"id": "real-fb", "platform": "facebook", "username": "somepage", "status": "connected"},
            {"id": "real-md", "platform": "mastodon", "username": "someone", "status": "connected"}))
        self.assertEqual(channels["viva"], "m-facebook")
        self.assertEqual(channels["substack"], "m-mastodon")

    def test_instagram_through_facebook_counts_as_instagram(self):
        channels = sync_plan.pick_channels(self.accounts({"id": "real-ig", "platform": "instagram-facebook", "username": "hugo", "status": "connected"}))
        self.assertEqual(channels["instagram"], "real-ig")

    def test_no_channel_at_all_leaves_the_surface_out(self):
        self.assertEqual(sync_plan.pick_channels([]), {})

    def test_a_push_creates_the_x_draft_on_the_connected_account(self):
        tmp = Path(tempfile.mkdtemp())
        try:
            ws = tmp / "hugo"
            meta = obj("p-x", surface="x", format="text", scheduled_date="2026-10-27T09:30:00+00:00", first_comment="")
            content.save(content.object_path(ws, "p-x"), meta, "A short post for X.\n")
            fake = FakeTryPost()
            fake.accounts["real-x"] = {"id": "real-x", "platform": "x", "display_name": "Hugo França",
                                       "username": "author-handle", "status": "connected", "timezone": "Europe/Lisbon"}
            client = TryPostClient("http://x", "t", transport=fake.transport)
            report = push(ws, client, dry_run=False, now=NOW)
            self.assertIn("created p-x", report)
            post = fake.posts[content.load(content.object_path(ws, "p-x"))[0]["trypost"]["post_id"]]
            self.assertEqual(post["social_account"]["id"], "real-x")
            self.assertEqual(post["status"], "draft")
        finally:
            shutil.rmtree(tmp)


THREAD = "First post of the thread.\n\n---\n\nSecond post.\n\n---\n\nThird post.\n"


class XThreads(unittest.TestCase):
    """An X thread goes to TryPost as its first post plus meta.thread_replies, and compares equal in that form."""

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.ws = self.tmp / "hugo"
        meta = obj("t", surface="x", format="thread", scheduled_date="2026-10-27T09:30:00+00:00", first_comment="")
        content.save(content.object_path(self.ws, "t"), meta, THREAD)
        self.fake = FakeTryPost()
        self.client = TryPostClient("http://x", "t", transport=self.fake.transport)

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def post(self):
        return self.fake.posts[content.load(content.object_path(self.ws, "t"))[0]["trypost"]["post_id"]]

    def test_the_thread_is_created_as_a_post_and_its_replies(self):
        push(self.ws, self.client, dry_run=False, now=NOW)
        post = self.post()
        self.assertEqual(post["content"], "First post of the thread.")
        self.assertEqual(post["meta"]["thread_replies"], ["Second post.", "Third post."])

    def test_a_second_push_finds_the_thread_unchanged(self):
        push(self.ws, self.client, dry_run=False, now=NOW)
        self.assertIn("unchanged t", push(self.ws, self.client, dry_run=False, now=NOW))

    def test_a_thread_pushed_whole_is_split_on_the_next_push(self):
        push(self.ws, self.client, dry_run=False, now=NOW)
        post = self.post()
        post["content"], post["meta"] = THREAD.strip(), {}
        report = push(self.ws, self.client, dry_run=False, now=NOW)
        self.assertIn("updated t", report)
        self.assertEqual(self.post()["meta"]["thread_replies"], ["Second post.", "Third post."])

    def test_pull_reads_the_split_thread_back_as_the_file_holds_it(self):
        push(self.ws, self.client, dry_run=False, now=NOW)
        meta, body = content.load(content.object_path(self.ws, "t"))
        decision = sync_plan.decide_pull(meta, body, self.post())
        self.assertIsNone(decision["body"])
        self.assertFalse(decision["conflict"])

    def test_a_reply_edited_in_trypost_comes_back_into_the_file(self):
        push(self.ws, self.client, dry_run=False, now=NOW)
        post = self.post()
        post["meta"]["thread_replies"] = ["Second post, edited.", "Third post."]
        meta, body = content.load(content.object_path(self.ws, "t"))
        decision = sync_plan.decide_pull(meta, body, post)
        self.assertEqual(decision["body"], "First post of the thread.\n\n---\n\nSecond post, edited.\n\n---\n\nThird post.\n")

    def test_a_plain_x_post_sends_no_replies_and_clears_old_ones_on_update(self):
        meta = obj("p", surface="x", format="text")
        self.assertNotIn("meta", sync_plan.build_create_payload(meta, "One post.\n", "acc", [], [], NOW))
        self.assertEqual(sync_plan.build_update_payload(meta, "One post.\n", [], NOW)["meta"], {"thread_replies": []})
