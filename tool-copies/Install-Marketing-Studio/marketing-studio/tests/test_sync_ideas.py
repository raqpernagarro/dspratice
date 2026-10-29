import shutil
import tempfile
import unittest
from pathlib import Path

from scripts import trypost_sync
from scripts.lib import content, sync_plan
from scripts.lib.trypost_api import TryPostClient
from scripts.trypost_sync import pull, push, sync
from tests.fakes import FakeTryPost
from tests.test_sync_push import NOW, obj

CREATED = "2026-10-21T10:00:00+01:00"
NOW_LISBON = "2026-10-21T13:00:00+01:00"  # NOW in Europe/Lisbon, which is what pull writes into `updated`


def idea(id, **over):
    """An idea Content Object as new_idea_meta builds it, with the fields the board shows filled in."""
    title = over.pop("title", "Idea " + id)
    surfaces = over.pop("surfaces", ["linkedin", "x"])
    meta = content.new_idea_meta(id, title, "nagarro", 3, CREATED, surfaces)
    meta.update({"campaign": "ai-ready-design-systems", "scheduled_date": "2026-10-23T08:30:00+01:00"})
    meta.update(over)
    return meta


class Shapes(unittest.TestCase):
    def test_stage_for_status_and_its_inverse(self):
        self.assertEqual(sync_plan.STAGE_FOR, {"idea": "Unassigned", "approved": "To Do", "draft": "In Progress"})
        self.assertEqual(sync_plan.STATUS_FOR_STAGE, {"Unassigned": "idea", "To Do": "approved", "In Progress": "draft"})
        # Unassigned is TryPost's built-in no-stage column, so it is never created as a stage of its own
        self.assertEqual(trypost_sync.STAGES_NEEDED, ("To Do", "In Progress"))

    def test_a_column_means_a_status_and_no_stage_means_unassigned(self):
        names = {"a": "To Do", "b": "In Progress", "c": "Done"}
        self.assertEqual([sync_plan.status_for_column(s, names) for s in (None, "a", "b")], ["idea", "approved", "draft"])
        self.assertIsNone(sync_plan.status_for_column("c", names))
        self.assertIsNone(sync_plan.status_for_column("gone", names))

    def test_who_moved_is_read_against_the_status_last_synced(self):
        decide = sync_plan.decide_idea_stage  # (file status, status last synced, status the card's column means or None)
        self.assertEqual(decide("idea", "idea", "idea"), "in-sync")
        self.assertEqual(decide("approved", "idea", "idea"), "push")  # the file changed, the card did not
        self.assertEqual(decide("idea", "idea", "approved"), "pull")  # the card moved, the file did not
        self.assertEqual(decide("draft", "idea", "approved"), "conflict")  # both moved, to different places
        self.assertEqual(decide("approved", "idea", "approved"), "in-sync")  # both moved, to the same place
        self.assertEqual(decide("idea", "idea", None), "leave")  # a column that means nothing
        self.assertEqual(decide("approved", "idea", None), "push")
        # no baseline (a card pushed before it was recorded): the card's own column is the baseline, so the file wins
        self.assertEqual(decide("idea", None, "idea"), "in-sync")
        self.assertEqual(decide("approved", None, "idea"), "push")
        self.assertEqual(decide("idea", None, None), "push")

    def test_title_carries_the_date_the_networks_and_the_title(self):
        meta = idea("a", title="Why design systems fail", surfaces=["linkedin", "instagram", "x"])
        self.assertEqual(sync_plan.idea_title(meta), "23 Oct · linkedin+instagram+x · Why design systems fail")
        self.assertEqual(sync_plan.idea_title(idea("a", title="T", scheduled_date="2026-11-05T09:00:00+00:00", surfaces=["x"])), "5 Nov · x · T")
        self.assertEqual(sync_plan.idea_title(idea("a", title="T", scheduled_date=None)), "undated · linkedin+x · T")
        self.assertEqual(sync_plan.idea_title(idea("a", title="T", scheduled_date=None, surfaces=[])), "undated · any · T")

    def test_body_names_the_file_the_plan_the_pillar_and_the_score(self):
        meta = idea("a")
        content.set_idea_score(meta, CREATED, relevance=4, timeliness=3, proof=4, fit=4, difference=4)
        self.assertEqual(
            sync_plan.idea_body(meta, "# Angles\n\nFirst angle.\n"),
            "File: content/a.md\nPlanned: 2026-10-23 on linkedin, x\nPillar 3 · score 19/25\n\n# Angles\n\nFirst angle.",
        )
        self.assertEqual(
            sync_plan.idea_body(idea("a", scheduled_date=None), "Text\n"),
            "File: content/a.md\nPlanned: undated on linkedin, x\nPillar 3 · unscored\n\nText",
        )
        self.assertTrue(sync_plan.idea_body(idea("a", pillar=None), "Text\n").splitlines()[2].startswith("Pillar none · unscored"))

    def test_body_keeps_the_first_400_characters_of_the_text(self):
        body = sync_plan.idea_body(idea("a"), "x" * 300 + "y" * 300)
        self.assertEqual(body.split("\n\n", 1)[1], "x" * 300 + "y" * 100)

    def test_title_and_body_text_the_sync_builds_has_no_long_dashes(self):
        meta = idea("a")
        text = sync_plan.idea_title(meta) + sync_plan.idea_body(meta, "Text\n")
        for dash in (chr(0x2014), chr(0x2013)):  # the em and en dash
            self.assertNotIn(dash, text)

    def test_labels_are_campaign_pillar_mode_and_reactive(self):
        self.assertEqual(sync_plan.idea_labels(idea("a")), ["campaign:ai-ready-design-systems", "pillar:3", "mode:nagarro"])
        self.assertEqual(sync_plan.idea_labels(idea("a", reactive=True))[-1], "reactive")
        self.assertEqual(sync_plan.idea_labels(idea("a", campaign=None, pillar=None, reactive=False)), ["mode:nagarro"])
        self.assertEqual(sync_plan.label_colour("reactive"), "#E4EFBF")


class Board(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.ws = self.tmp / "hugo"
        self.fake = FakeTryPost()
        self.client = TryPostClient("http://x", "t", transport=self.fake.transport)
        self.save(idea("i1", title="First angle"), "# Angles\n\nFirst.\n")
        self.save(idea("i2", title="Second angle", status="approved", surfaces=["linkedin"], reactive=True), "Second.\n")
        self.save(idea("i3", title="Third angle", status="draft", scheduled_date=None, campaign=None), "Third.\n")

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def save(self, meta, body="Body\n"):
        content.save(content.object_path(self.ws, meta["id"]), meta, body)

    def load(self, id):
        return content.load(content.object_path(self.ws, id))

    def edit(self, id, **changes):
        meta, body = self.load(id)
        meta.update(changes)
        self.save(meta, body)

    def card(self, id):
        return self.fake.ideas[self.load(id)[0]["trypost"]["idea_id"]]

    def stage_of(self, id):
        stage_id = self.card(id)["idea_stage_id"]
        return "Unassigned" if stage_id is None else self.fake.idea_stages[stage_id]["name"]

    def stage_id(self, name):
        """The id of a stage; None for Unassigned, which is the no-stage column."""
        if name == "Unassigned":
            return None
        return next(s["id"] for s in self.fake.idea_stages.values() if s["name"] == name)

    def writes_since(self, mark, prefix="/api/ideas"):
        """The requests since `mark` that wrote to TryPost under `prefix` (the idea endpoints by default)."""
        return [r for r in self.fake.requests[mark:] if r[0] != "GET" and r[1].startswith(prefix)]

    def push(self, dry_run=False):
        return push(self.ws, self.client, dry_run=dry_run, now=NOW)

    def pull(self, dry_run=False, relink=False):
        return pull(self.ws, self.client, dry_run=dry_run, relink=relink, now=NOW)


class Push(Board):
    def test_first_push_creates_each_idea_in_the_stage_its_status_names(self):
        report = self.push()
        self.assertEqual([l for l in report if l.startswith("idea ")], ["idea i1 idea", "idea i2 approved", "idea i3 draft"])
        self.assertEqual((self.stage_of("i1"), self.stage_of("i2"), self.stage_of("i3")), ("Unassigned", "To Do", "In Progress"))
        first = self.card("i1")
        self.assertIsNone(first["idea_stage_id"], "an idea sits in the built-in Unassigned column, which is no stage at all")
        self.assertEqual(first["title"], "23 Oct · linkedin+x · First angle")
        self.assertEqual(first["body"], "File: content/i1.md\nPlanned: 2026-10-23 on linkedin, x\nPillar 3 · unscored\n\n# Angles\n\nFirst.")
        self.assertEqual(sorted(l["name"] for l in first["labels"]), ["campaign:ai-ready-design-systems", "mode:nagarro", "pillar:3"])
        self.assertIn("reactive", [l["name"] for l in self.card("i2")["labels"]])
        self.assertEqual(self.card("i3")["title"], "undated · linkedin+x · Third angle")
        colours = {l["name"]: l["color"] for l in self.fake.labels.values()}
        self.assertEqual(colours["reactive"], "#E4EFBF")

    def test_first_push_records_the_id_and_the_hash_of_what_it_sent(self):
        self.push()
        state = self.load("i1")[0]["trypost"]
        self.assertEqual(state["idea_id"], self.card("i1")["id"])
        self.assertEqual(state["synced_at"], "2026-10-21T13:00:00+01:00")
        sent = self.card("i1")
        self.assertEqual(state["synced_hash"], content.body_hash(sent["title"] + "\n" + sent["body"]))
        self.assertEqual(state["synced_status"], "idea")
        self.assertEqual([self.load(i)[0]["trypost"]["synced_status"] for i in ("i2", "i3")], ["approved", "draft"])

    def test_an_idea_is_not_a_post_and_no_request_carries_a_status(self):
        self.push()
        self.assertEqual(self.fake.posts, {})
        self.assertFalse(any(r[2] and "status" in r[2] for r in self.fake.requests), "ideas carry no status in TryPost")
        creates = [r[2] for r in self.fake.requests if r[0] == "POST" and r[1] == "/api/ideas"]
        self.assertEqual(sorted(creates[0]), ["body", "idea_stage_id", "label_ids", "title"])
        self.assertIsNone(creates[0]["idea_stage_id"])  # the key is sent, as null, for an idea
        self.assertEqual([c["idea_stage_id"] for c in creates[1:]], [self.stage_id("To Do"), self.stage_id("In Progress")])

    def test_no_stage_named_unassigned_is_ever_created(self):
        self.push()
        self.edit("i2", status="idea")
        self.push()
        self.assertNotIn("Unassigned", [s["name"] for s in self.fake.idea_stages.values()])
        self.assertEqual([r for r in self.fake.requests if r[:2] == ("POST", "/api/idea-stages")], [])

    def test_a_second_push_changes_nothing(self):
        self.push()
        mark = len(self.fake.requests)
        second = self.push()
        self.assertEqual(second, ["unchanged i1", "unchanged i2", "unchanged i3"])
        self.assertEqual(self.writes_since(mark, ""), [])
        self.assertEqual(len([r for r in self.fake.requests[mark:] if r[:2] == ("GET", "/api/ideas")]), 1, "the listing is read once per run")

    def test_approving_the_file_moves_the_card_to_to_do(self):
        self.push()
        manual = self.client.post("/api/ideas", json={"title": "Added by hand", "idea_stage_id": self.stage_id("To Do")})
        mark = len(self.fake.requests)
        self.edit("i1", status="approved")
        report = self.push()
        self.assertEqual(report, ["idea i1 approved", "unchanged i2", "unchanged i3"])
        self.assertEqual(self.stage_of("i1"), "To Do")
        writes = self.writes_since(mark)
        self.assertEqual([w[:2] for w in writes], [("PUT", "/api/ideas/%s/move" % self.card("i1")["id"])])
        payload = writes[0][2]
        self.assertEqual(payload["idea_stage_id"], self.stage_id("To Do"))
        # the real endpoint wants the whole ordered column, this card first, and refuses a stale one
        self.assertEqual(payload["idea_ids"], [self.card("i1")["id"], self.card("i2")["id"], manual["id"]])
        self.assertEqual(self.card("i1")["position"], 0)
        self.assertEqual(self.load("i1")[0]["trypost"]["synced_status"], "approved")
        self.assertEqual(self.push(), ["unchanged i1", "unchanged i2", "unchanged i3"])

    def test_sending_a_card_back_to_idea_moves_it_to_the_no_stage_column(self):
        self.push()
        manual = self.client.post("/api/ideas", json={"title": "Added by hand", "idea_stage_id": None})
        mark = len(self.fake.requests)
        self.edit("i2", status="idea")
        self.assertEqual(self.push(), ["unchanged i1", "idea i2 idea", "unchanged i3"])
        self.assertEqual(self.stage_of("i2"), "Unassigned")
        writes = self.writes_since(mark)
        self.assertEqual([w[:2] for w in writes], [("PUT", "/api/ideas/%s/move" % self.card("i2")["id"])])
        self.assertIn("idea_stage_id", writes[0][2])
        self.assertIsNone(writes[0][2]["idea_stage_id"])
        # the null column is every idea with no stage, this card first, and the endpoint refuses a list without all of them
        self.assertEqual(writes[0][2]["idea_ids"], [self.card("i2")["id"], self.card("i1")["id"], manual["id"]])
        self.assertEqual(self.load("i2")[0]["trypost"]["synced_status"], "idea")
        self.assertEqual(self.push(), ["unchanged i1", "unchanged i2", "unchanged i3"])

    def test_a_changed_title_or_label_is_put_without_a_move(self):
        self.push()
        mark = len(self.fake.requests)
        before = self.load("i1")[0]["trypost"]["synced_hash"]
        self.edit("i1", title="A sharper title", pillar=2)
        report = self.push()
        self.assertEqual([l for l in report if not l.startswith("unchanged")], ["label pillar:2", "idea i1 idea"])
        writes = self.writes_since(mark)
        self.assertEqual([w[:2] for w in writes], [("PUT", "/api/ideas/%s" % self.card("i1")["id"])])
        self.assertEqual(sorted(writes[0][2]), ["body", "label_ids", "title"])
        self.assertEqual(self.card("i1")["title"], "23 Oct · linkedin+x · A sharper title")
        self.assertIn("Pillar 2", self.card("i1")["body"])
        self.assertEqual(sorted(l["name"] for l in self.card("i1")["labels"]), ["campaign:ai-ready-design-systems", "mode:nagarro", "pillar:2"])
        self.assertNotEqual(self.load("i1")[0]["trypost"]["synced_hash"], before)
        self.assertEqual(self.push()[0], "unchanged i1")

    def test_a_changed_body_is_put(self):
        self.push()
        meta, _ = self.load("i2")
        self.save(meta, "Second, reworked.\n")
        self.assertEqual(self.push(), ["unchanged i1", "idea i2 approved", "unchanged i3"])
        self.assertTrue(self.card("i2")["body"].endswith("Second, reworked."))
        self.assertEqual(self.stage_of("i2"), "To Do")

    def test_text_and_stage_changes_together_do_both(self):
        self.push()
        mark = len(self.fake.requests)
        self.edit("i1", title="Retitled", status="draft")
        self.assertEqual(self.push()[0], "idea i1 draft")
        self.assertEqual([w[0] + " " + w[1].rsplit("/", 1)[-1] for w in self.writes_since(mark)], ["PUT " + self.card("i1")["id"], "PUT move"])
        self.assertEqual(self.stage_of("i1"), "In Progress")
        self.assertEqual(self.card("i1")["title"], "23 Oct · linkedin+x · Retitled")

    def test_ideas_with_other_statuses_are_not_pushed(self):
        for id, status in (("p", "published"), ("r", "in-review"), ("s", "scheduled")):
            self.save(idea(id, status=status))
        report = self.push()
        self.assertEqual([l for l in report if l.startswith("idea ")], ["idea i1 idea", "idea i2 approved", "idea i3 draft"])
        self.assertEqual(len(self.fake.ideas), 3)
        self.assertIsNone(self.load("p")[0]["trypost"]["idea_id"])

    def test_an_archived_idea_is_never_pushed(self):
        self.edit("i1", status="archived")
        report = self.push()
        self.assertEqual([l for l in report if l.startswith(("idea i1", "unchanged i1", "failed i1"))], [])
        self.assertEqual(len(self.fake.ideas), 2)
        self.assertIsNone(self.load("i1")[0]["trypost"]["idea_id"])

    def test_an_invalid_idea_fails_alone(self):
        self.edit("i1", scheduled_date="2026-10-24")
        report = self.push()
        self.assertTrue(any(l.startswith("failed i1:") and "scheduled_date" in l for l in report), report)
        self.assertIn("idea i2 approved", report)
        self.assertEqual(len(self.fake.ideas), 2)

    def test_a_failed_move_is_reported_and_the_run_goes_on(self):
        self.push()
        self.edit("i1", status="approved")
        self.edit("i3", title="Third, retitled")

        def flaky(method, url, headers, body):
            if method == "PUT" and url.endswith("/move"):
                return 500, b'{"message": "Server Error"}'
            return self.fake.transport(method, url, headers, body)

        report = push(self.ws, TryPostClient("http://x", "t", transport=flaky), dry_run=False, now=NOW)
        self.assertTrue(any(l.startswith("failed i1:") for l in report), report)
        self.assertIn("idea i3 draft", report)
        self.assertEqual(self.stage_of("i1"), "Unassigned")
        self.assertEqual(self.push()[0], "idea i1 approved")  # the next run finishes the move

    def test_a_missing_stage_is_created_and_used(self):
        gone = self.stage_id("To Do")
        del self.fake.idea_stages[gone]
        report = self.push()
        self.assertIn("stage To Do", report)
        self.assertEqual(self.stage_of("i2"), "To Do")
        self.assertNotEqual(self.card("i2")["idea_stage_id"], gone)
        self.assertEqual(self.stage_of("i1"), "Unassigned")

    def test_ideas_come_after_the_channel_pieces_and_before_long_form(self):
        self.save(obj("a"), "Body A\n")
        self.save(obj("art", format="article", seo_description="Desc"), "# Article\n")
        report = self.push()
        order = [report.index(line) for line in ("created a", "idea i1 idea", "idea art")]
        self.assertEqual(order, sorted(order), report)

    def test_a_listing_longer_than_a_page_is_read_in_full(self):
        for n in range(17):
            self.save(idea("more%02d" % n))
        self.push()
        mark = len(self.fake.requests)
        second = self.push()
        self.assertTrue(all(l.startswith("unchanged") for l in second), second)
        self.assertEqual(len(second), 20)
        self.assertEqual(self.writes_since(mark), [])

    def test_a_push_after_a_deletion_says_so_and_does_not_recreate(self):
        self.push()
        self.fake.delete_idea(self.card("i1")["id"])
        report = self.push()
        self.assertIn("missing in TryPost: i1", report)
        self.assertEqual(len(self.fake.ideas), 2)
        self.assertEqual(self.load("i1")[0]["status"], "idea")  # only pull archives


class PushDryRun(Board):
    def test_a_first_dry_run_writes_nothing(self):
        report = self.push(dry_run=True)
        self.assertTrue(all(l.startswith("would ") for l in report), report)
        self.assertIn("would idea i1 idea", report)
        self.assertIn("would idea i2 approved", report)
        self.assertEqual(self.fake.ideas, {})
        self.assertEqual(self.fake.labels, {})
        self.assertIsNone(self.load("i1")[0]["trypost"]["idea_id"])
        self.assertEqual([r for r in self.fake.requests if r[0] != "GET"], [])

    def test_a_dry_run_after_a_change_names_it_and_writes_nothing(self):
        self.push()
        self.edit("i1", status="approved")
        mark = len(self.fake.requests)
        report = self.push(dry_run=True)
        self.assertEqual(report, ["would idea i1 approved", "would unchanged i2", "would unchanged i3"])
        self.assertEqual(self.writes_since(mark), [])
        self.assertEqual(self.stage_of("i1"), "Unassigned")


class Pull(Board):
    def setUp(self):
        super().setUp()
        self.push()

    def test_a_card_moved_to_a_column_sets_the_status_that_column_means(self):
        self.fake.move_idea(self.card("i1")["id"], "To Do")
        self.assertEqual(self.pull(), ["idea i1 approved"])
        meta = self.load("i1")[0]
        self.assertEqual((meta["status"], meta["updated"]), ("approved", NOW_LISBON))
        self.fake.move_idea(self.card("i1")["id"], "In Progress")
        self.assertEqual(self.pull(), ["idea i1 draft"])
        self.fake.move_idea(self.card("i1")["id"], "Unassigned")
        self.assertEqual(self.pull(), ["idea i1 idea"])
        self.assertEqual(self.load("i1")[0]["status"], "idea")

    def test_a_card_with_no_stage_counts_as_unassigned(self):
        self.card("i2")["idea_stage_id"] = None
        self.assertEqual(self.pull(), ["idea i2 idea"])

    def test_a_column_that_maps_to_no_status_changes_nothing(self):
        later = {"id": "later-stage", "name": "Later", "position": 3}
        self.fake.idea_stages[later["id"]] = later
        self.card("i1")["idea_stage_id"] = later["id"]
        self.assertEqual(self.pull(), [])
        self.assertEqual(self.load("i1")[0]["status"], "idea")

    def test_nothing_else_flows_back(self):
        card = self.card("i1")
        card["title"] = "Retitled on the board"
        card["body"] = "Rewritten on the board"
        before = self.load("i1")
        self.assertEqual(self.pull(), [])
        self.assertEqual(self.load("i1"), before)

    def test_a_deleted_card_archives_the_file(self):
        self.fake.delete_idea(self.card("i1")["id"])
        self.assertEqual(self.pull(), ["archived i1"])
        meta, body = self.load("i1")
        self.assertEqual((meta["status"], meta["updated"]), ("archived", NOW_LISBON))
        self.assertEqual(body, "# Angles\n\nFirst.\n")
        self.assertEqual(self.pull(), [])  # settled: an archived idea is not looked at again

    def test_a_deleted_card_is_never_recreated(self):
        self.fake.delete_idea(self.card("i1")["id"])
        mark = len(self.fake.requests)
        lines = sync(self.ws, self.client, dry_run=False, now=NOW)
        self.assertIn("archived i1", lines)
        self.assertEqual(self.push(), ["unchanged i2", "unchanged i3"])
        self.assertEqual(len(self.fake.ideas), 2)
        self.assertEqual([r for r in self.writes_since(mark) if r[:2] == ("POST", "/api/ideas")], [])

    def test_an_archived_file_stays_archived_while_its_card_remains(self):
        self.edit("i1", status="archived")
        self.fake.move_idea(self.card("i1")["id"], "To Do")
        self.assertEqual(self.pull(), [])
        self.assertEqual(self.load("i1")[0]["status"], "archived")
        self.assertEqual(self.push(), ["unchanged i2", "unchanged i3"])

    def test_the_listing_and_the_stages_are_read_once_for_all_ideas(self):
        mark = len(self.fake.requests)
        self.pull()
        reads = [r[:2] for r in self.fake.requests[mark:]]
        self.assertEqual(reads.count(("GET", "/api/ideas")), 1)
        self.assertEqual(reads.count(("GET", "/api/idea-stages")), 1)

    def test_a_workspace_without_ideas_does_not_read_the_board(self):
        shutil.rmtree(self.ws / "content")
        mark = len(self.fake.requests)
        self.pull()
        self.assertNotIn("/api/ideas", [r[1] for r in self.fake.requests[mark:]])

    def test_dry_run_reports_and_writes_nothing(self):
        self.fake.move_idea(self.card("i1")["id"], "To Do")
        self.fake.delete_idea(self.card("i3")["id"])
        before = [self.load(i) for i in ("i1", "i2", "i3")]
        self.assertEqual(self.pull(dry_run=True), ["would idea i1 approved", "would archived i3"])
        self.assertEqual([self.load(i) for i in ("i1", "i2", "i3")], before)

    def test_a_wipe_without_relink_archives_every_idea_and_recreates_none(self):
        self.fake.ideas.clear()
        self.assertEqual(self.pull(), ["archived i1", "archived i2", "archived i3"])
        self.assertEqual([self.load(i)[0]["status"] for i in ("i1", "i2", "i3")], ["archived"] * 3)
        self.assertEqual([l for l in self.push() if l.startswith("idea ")], [])
        self.assertEqual(self.fake.ideas, {})

    def test_relink_after_a_wipe_forgets_each_missing_card_and_the_next_push_creates_it_again(self):
        self.fake.ideas.clear()
        self.fake.labels.clear()
        self.assertEqual(self.pull(relink=True), ["relinked i1", "relinked i2", "relinked i3"])
        for id, status in (("i1", "idea"), ("i2", "approved"), ("i3", "draft")):
            meta = self.load(id)[0]
            self.assertEqual((meta["status"], meta["trypost"]["idea_id"], meta["trypost"]["synced_status"]), (status, None, None))
        report = self.push()
        self.assertEqual([l for l in report if l.startswith("idea ")], ["idea i1 idea", "idea i2 approved", "idea i3 draft"])
        self.assertEqual([self.stage_of(i) for i in ("i1", "i2", "i3")], ["Unassigned", "To Do", "In Progress"])
        self.assertEqual([self.load(i)[0]["trypost"]["synced_status"] for i in ("i1", "i2", "i3")], ["idea", "approved", "draft"])
        self.assertEqual(self.pull(), [])
        self.assertEqual(self.push(), ["unchanged i1", "unchanged i2", "unchanged i3"])

    def test_relink_leaves_a_card_that_is_still_there_and_a_dry_run_writes_nothing(self):
        self.fake.delete_idea(self.card("i1")["id"])
        before = [self.load(i) for i in ("i1", "i2", "i3")]
        self.assertEqual(self.pull(dry_run=True, relink=True), ["would relinked i1"])
        self.assertEqual([self.load(i) for i in ("i1", "i2", "i3")], before)
        self.assertEqual(self.pull(relink=True), ["relinked i1"])
        self.assertEqual([self.load(i) for i in ("i2", "i3")], before[1:])
        self.assertEqual(self.load("i1")[0]["status"], "idea")

    def test_sync_pulls_the_move_before_it_pushes(self):
        self.fake.move_idea(self.card("i1")["id"], "To Do")
        lines = sync(self.ws, self.client, dry_run=False, now=NOW)
        self.assertEqual(lines[0], "idea i1 approved")
        self.assertIn("unchanged i1", lines)
        self.assertEqual(self.stage_of("i1"), "To Do")


class Baseline(Board):
    """Pull and push both read a change against trypost.synced_status, the status the card was last known to mean,
    so a file edit is not undone by the next pull and a dragged card is not dragged back by the next push."""

    def setUp(self):
        super().setUp()
        self.push()

    def status_of(self, id):
        return self.load(id)[0]["status"]

    def synced_status(self, id):
        return self.load(id)[0]["trypost"]["synced_status"]

    def test_a_status_edited_in_the_file_survives_the_next_sync_and_moves_the_card(self):
        self.edit("i1", status="approved")  # what mark.py does
        mark = len(self.fake.requests)
        lines = sync(self.ws, self.client, dry_run=False, now=NOW)
        self.assertEqual(lines, ["idea i1 approved", "unchanged i2", "unchanged i3"])  # the pull said nothing about i1
        self.assertEqual((self.status_of("i1"), self.stage_of("i1"), self.synced_status("i1")), ("approved", "To Do", "approved"))
        self.assertEqual(len(self.writes_since(mark)), 1)
        self.assertEqual(sync(self.ws, self.client, dry_run=False, now=NOW), ["unchanged i1", "unchanged i2", "unchanged i3"])

    def test_a_card_dragged_on_the_board_is_adopted_and_not_dragged_back(self):
        self.fake.move_idea(self.card("i1")["id"], "To Do")
        mark = len(self.fake.requests)
        lines = sync(self.ws, self.client, dry_run=False, now=NOW)
        self.assertEqual(lines, ["idea i1 approved", "unchanged i1", "unchanged i2", "unchanged i3"])
        self.assertEqual((self.status_of("i1"), self.stage_of("i1"), self.synced_status("i1")), ("approved", "To Do", "approved"))
        self.assertEqual(self.writes_since(mark), [])

    def test_a_plain_push_leaves_a_dragged_card_where_hugo_put_it(self):
        self.fake.move_idea(self.card("i1")["id"], "In Progress")
        mark = len(self.fake.requests)
        self.assertEqual(self.push(), ["unchanged i1", "unchanged i2", "unchanged i3"])
        self.assertEqual(self.writes_since(mark), [])
        self.assertEqual(self.stage_of("i1"), "In Progress")
        self.assertEqual((self.status_of("i1"), self.synced_status("i1")), ("idea", "idea"))  # the pull has not run yet

    def test_a_card_dragged_to_a_column_that_means_nothing_stays_there(self):
        self.fake.move_idea(self.card("i1")["id"], "Done")
        mark = len(self.fake.requests)
        for _ in range(2):
            self.assertEqual(sync(self.ws, self.client, dry_run=False, now=NOW), ["unchanged i1", "unchanged i2", "unchanged i3"])
        self.assertEqual(self.writes_since(mark), [])
        self.assertEqual((self.stage_of("i1"), self.status_of("i1")), ("Done", "idea"))

    def test_a_file_edit_wins_over_a_card_left_in_a_column_that_means_nothing(self):
        self.fake.move_idea(self.card("i1")["id"], "Done")
        self.edit("i1", status="approved")
        self.assertEqual(sync(self.ws, self.client, dry_run=False, now=NOW)[0], "idea i1 approved")
        self.assertEqual(self.stage_of("i1"), "To Do")

    def test_a_text_change_is_pushed_while_a_dragged_card_waits_for_the_pull(self):
        self.fake.move_idea(self.card("i1")["id"], "To Do")
        self.edit("i1", title="Retitled")
        mark = len(self.fake.requests)
        self.assertEqual(self.push()[0], "idea i1 idea")
        self.assertEqual([w[:2] for w in self.writes_since(mark)], [("PUT", "/api/ideas/%s" % self.card("i1")["id"])])
        self.assertEqual(self.stage_of("i1"), "To Do")
        self.assertEqual(self.pull(), ["idea i1 approved"])

    def test_both_sides_moved_is_a_conflict_and_nothing_is_touched(self):
        self.edit("i1", status="draft")
        self.fake.move_idea(self.card("i1")["id"], "To Do")
        self.edit("i1", title="Retitled too")
        before = self.load("i1")
        mark = len(self.fake.requests)
        lines = sync(self.ws, self.client, dry_run=False, now=NOW)
        conflicts = [l for l in lines if l.startswith("conflict i1")]
        self.assertEqual(len(conflicts), 2, lines)  # the pull says it and so does the push, as posts do
        self.assertIn("draft", conflicts[0])
        self.assertIn("approved", conflicts[0])
        self.assertEqual(self.load("i1"), before)
        self.assertEqual(self.writes_since(mark), [])
        self.assertEqual(self.stage_of("i1"), "To Do")
        self.assertEqual(self.card("i1")["title"], "23 Oct · linkedin+x · First angle")  # not even the text went through

    def test_a_conflict_ends_once_the_file_agrees_with_the_card(self):
        self.edit("i1", status="draft")
        self.fake.move_idea(self.card("i1")["id"], "To Do")
        self.assertTrue(any(l.startswith("conflict i1") for l in sync(self.ws, self.client, dry_run=False, now=NOW)))
        self.edit("i1", status="approved")
        self.assertEqual(sync(self.ws, self.client, dry_run=False, now=NOW), ["unchanged i1", "unchanged i2", "unchanged i3"])
        self.assertEqual(self.synced_status("i1"), "approved")

    def test_both_sides_moving_to_the_same_place_is_no_conflict(self):
        self.edit("i1", status="approved")
        self.fake.move_idea(self.card("i1")["id"], "To Do")
        mark = len(self.fake.requests)
        self.assertEqual(sync(self.ws, self.client, dry_run=False, now=NOW), ["unchanged i1", "unchanged i2", "unchanged i3"])
        self.assertEqual(self.synced_status("i1"), "approved")
        self.assertEqual(self.writes_since(mark), [])
        self.fake.move_idea(self.card("i1")["id"], "In Progress")  # and the baseline is good for the next drag
        self.assertEqual(self.pull(), ["idea i1 draft"])

    def test_a_card_pushed_before_the_baseline_existed_gets_one_without_a_move(self):
        meta, body = self.load("i1")
        del meta["trypost"]["synced_status"]
        self.save(meta, body)
        mark = len(self.fake.requests)
        self.assertEqual(self.push(), ["unchanged i1", "unchanged i2", "unchanged i3"])
        self.assertEqual(self.synced_status("i1"), "idea")
        self.assertEqual(self.writes_since(mark), [])

    def test_a_dry_run_reports_a_conflict_and_a_dragged_card_and_writes_nothing(self):
        self.edit("i1", status="draft")
        self.fake.move_idea(self.card("i1")["id"], "To Do")
        self.fake.move_idea(self.card("i3")["id"], "Unassigned")
        before = [self.load(i) for i in ("i1", "i2", "i3")]
        mark = len(self.fake.requests)
        pulled = self.pull(dry_run=True)
        self.assertTrue(pulled[0].startswith("would conflict i1"), pulled)
        self.assertEqual(pulled[1:], ["would idea i3 idea"])
        self.assertTrue(self.push(dry_run=True)[0].startswith("would conflict i1"))
        self.assertEqual([self.load(i) for i in ("i1", "i2", "i3")], before)
        self.assertEqual(self.writes_since(mark, ""), [])


if __name__ == "__main__":
    unittest.main()
