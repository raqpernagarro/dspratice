import io
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

from scripts import check, new_idea, new_post, review, score, set_body
from scripts.lib import content, sync_plan
from scripts.lib.trypost_api import TryPostClient
from scripts.trypost_sync import pull, push
from tests.fakes import FakeTryPost

NOW = "2026-10-22T10:00:00+01:00"
CAMPAIGN = "---\nslug: ds\nmode: nagarro\nneutral: false\nrequired_hashtags_linkedin: [\"#FluidicIntelligence\"]\n---\nBrief.\n"


def run(main, argv, stdin=None):
    """Run a CLI's main and return its exit code and the lines it printed; `stdin` replaces sys.stdin."""
    out = io.StringIO()
    with redirect_stdout(out):
        if stdin is None:
            code = main(argv)
        else:
            with patch("sys.stdin", io.StringIO(stdin)):
                code = main(argv)
    return code, out.getvalue().splitlines()


class Base(unittest.TestCase):
    def setUp(self):
        self.ws = Path(tempfile.mkdtemp()) / "hugo"
        (self.ws / "campaigns").mkdir(parents=True)
        (self.ws / "campaigns" / "ds.md").write_text(CAMPAIGN)

    def post_args(self, id, *extra):
        return [id, "--workspace", str(self.ws), "--title", "T", "--surface", "x", "--format", "text", "--mode", "personal", *extra]

    def idea_args(self, id, *extra):
        return [id, "--workspace", str(self.ws), "--title", "T", "--mode", "personal", *extra]


class NewObjects(Base):
    def test_idea_then_posts(self):
        path = new_idea.create(self.ws, "agents-read", "Agents only read what is written down", "personal", 1, "# Angles\n", sources=["https://x.io/a"], now=NOW)
        meta, body = content.load(path)
        self.assertEqual((meta["type"], meta["status"], meta["pillar"], meta["sources"]), ("idea", "idea", 1, ["https://x.io/a"]))
        li = new_post.create(self.ws, "agents-read-li", "T", "linkedin", "text", "personal", "Body.\n\n#A\n", pillar=1, parent="agents-read", date="2026-10-23", first_comment="Link: https://x.io/a", now=NOW)
        meta, body = content.load(li)
        self.assertEqual((meta["status"], meta["parent"], meta["scheduled_date"]), ("draft", "agents-read", "2026-10-23T08:30:00+01:00"))
        self.assertNotIn("visual_brief", meta)
        ig = new_post.create(self.ws, "agents-read-ig", "T", "instagram", "image", "personal", "Caption.\n", pillar=1, parent="agents-read", visual_brief="Petrol card, one lime word", image_prompt="Prompt", now=NOW)
        meta, _ = content.load(ig)
        self.assertEqual((meta["visual_brief"], meta["image_prompt"], meta["scheduled_date"]), ("Petrol card, one lime word", "Prompt", None))

    def test_refuses_existing_unless_forced_and_keeps_the_link(self):
        new_post.create(self.ws, "p", "T", "x", "text", "personal", "One.\n", now=NOW)
        with self.assertRaises(FileExistsError):
            new_post.create(self.ws, "p", "T", "x", "text", "personal", "Two.\n", now=NOW)
        meta, body = content.load(content.object_path(self.ws, "p"))
        meta["trypost"]["post_id"] = "abc"
        meta["status"] = "approved"  # a held status carries over; an in-review one goes back to draft (RewriteLeavesTheGate)
        content.save(content.object_path(self.ws, "p"), meta, body)
        new_post.create(self.ws, "p", "T", "x", "text", "personal", "Two.\n", force=True, now="2026-10-22T12:00:00+01:00")
        meta, body = content.load(content.object_path(self.ws, "p"))
        self.assertEqual((body, meta["trypost"]["post_id"], meta["status"], meta["created"]), ("Two.\n", "abc", "approved", NOW))

    def test_invalid_writes_nothing(self):
        with self.assertRaises(ValueError):
            new_post.create(self.ws, "bad", "T", "linkedin", "reel", "personal", "Body.\n", now=NOW)
        self.assertFalse(content.object_path(self.ws, "bad").exists())


class Check(Base):
    def test_check_object_and_cli(self):
        new_post.create(self.ws, "clean", "T", "linkedin", "text", "nagarro", "Body.\n\n#FluidicIntelligence #A\n", campaign="ds", now=NOW)
        new_post.create(self.ws, "dirty", "T", "linkedin", "text", "nagarro", "We leverage this.\n\n#A\n", campaign="ds", now=NOW)
        new_post.create(self.ws, "lost", "T", "linkedin", "text", "personal", "Body.\n", campaign="gone", now=NOW)
        out = io.StringIO()
        with redirect_stdout(out):
            code = check.main(["--workspace", str(self.ws), "clean", "dirty", "lost"])
        lines = out.getvalue().splitlines()
        self.assertEqual(code, 1)
        self.assertIn("ok clean", lines)
        self.assertIn("dirty: banned word: 'leverage'", lines)
        self.assertIn("dirty: missing required hashtag #FluidicIntelligence", lines)
        self.assertIn("lost: unknown campaign: gone", lines)
        out = io.StringIO()
        with redirect_stdout(out):
            self.assertEqual(check.main(["--workspace", str(self.ws), "clean"]), 0)


class Score(Base):
    def test_gate_moves_status_both_ways(self):
        new_post.create(self.ws, "p", "T", "linkedin", "text", "personal", "Body.\n", now=NOW)
        s, status = score.apply(self.ws, "p", "2026-10-22T11:00:00+01:00", hook=7, voice=8, value=7, fit=8, ready=9)
        self.assertEqual((s["total"], status), (39, "in-review"))
        s, status = score.apply(self.ws, "p", "2026-10-22T11:30:00+01:00", hook=4, voice=8, value=7, fit=8, ready=9)
        self.assertEqual((s["total"], status), (36, "draft"))
        meta, _ = content.load(content.object_path(self.ws, "p"))
        self.assertEqual((meta["status"], meta["score"]["hook"], meta["updated"]), ("draft", 4, "2026-10-22T11:30:00+01:00"))
        s, status = score.apply(self.ws, "p", "2026-10-22T11:45:00+01:00", hook=6, voice=8, value=7, fit=8, ready=9)
        self.assertEqual(status, "in-review")

    def test_cli_output(self):
        new_post.create(self.ws, "p", "T", "linkedin", "text", "personal", "Body.\n", now=NOW)
        out = io.StringIO()
        with redirect_stdout(out):
            code = score.main(["--workspace", str(self.ws), "p", "--hook", "7", "--voice", "8", "--value", "7", "--fit", "8", "--ready", "9"])
        self.assertEqual(code, 0)
        self.assertEqual(out.getvalue().splitlines(), ["score p 39/50 pass", "status p in-review"])


class NewObjectsCli(Base):
    def test_created_exists_and_updated_lines(self):
        body_file = self.ws.parent / "body.md"
        body_file.write_text("One.\n")
        self.assertEqual(run(new_post.main, self.post_args("p", "--body-file", str(body_file))), (0, ["created p"]))
        self.assertEqual(run(new_post.main, self.post_args("p", "--body-file", str(body_file))), (2, ["exists p (use --force)"]))
        body_file.write_text("Two.\n")
        self.assertEqual(run(new_post.main, self.post_args("p", "--body-file", str(body_file), "--force")), (0, ["updated p"]))
        self.assertEqual(content.load(content.object_path(self.ws, "p"))[1], "Two.\n")

    def test_idea_cli_reads_the_body_from_stdin(self):
        self.assertEqual(run(new_idea.main, self.idea_args("i", "--pillar", "2", "--source", "https://x.io/a"), stdin="# Angles\n"), (0, ["created i"]))
        meta, body = content.load(content.object_path(self.ws, "i"))
        self.assertEqual((meta["type"], meta["pillar"], meta["sources"], body), ("idea", 2, ["https://x.io/a"], "# Angles\n"))
        self.assertEqual(run(new_idea.main, self.idea_args("i"), stdin="# Again\n"), (2, ["exists i (use --force)"]))
        self.assertEqual(run(new_idea.main, self.idea_args("i", "--force"), stdin="# Again\n"), (0, ["updated i"]))

    def test_invalid_object_prints_the_problem_and_writes_nothing(self):
        argv = ["bad", "--workspace", str(self.ws), "--title", "T", "--surface", "linkedin", "--format", "reel", "--mode", "personal"]
        code, lines = run(new_post.main, argv, stdin="Body.\n")
        self.assertEqual(code, 2)
        self.assertEqual(len(lines), 1)
        self.assertTrue(lines[0].startswith("bad: format: 'reel' is not valid for surface linkedin"), lines)
        self.assertFalse(content.object_path(self.ws, "bad").exists())

    def test_empty_body_is_refused_and_never_wipes_a_real_one(self):
        for blank in ("", "  \n\n"):
            with self.assertRaises(ValueError) as caught:
                new_post.create(self.ws, "e", "T", "x", "text", "personal", blank, now=NOW)
            self.assertEqual(str(caught.exception), "empty body")
            with self.assertRaises(ValueError):
                new_idea.create(self.ws, "e", "T", "personal", None, blank, now=NOW)
        self.assertEqual(run(new_post.main, self.post_args("e"), stdin=""), (2, ["e: empty body"]))
        self.assertEqual(run(new_idea.main, self.idea_args("e"), stdin="\n"), (2, ["e: empty body"]))
        self.assertFalse(content.object_path(self.ws, "e").exists())
        self.assertEqual(run(new_post.main, self.post_args("p"), stdin="Real.\n"), (0, ["created p"]))
        self.assertEqual(run(new_post.main, self.post_args("p", "--force"), stdin=""), (2, ["p: empty body"]))
        self.assertEqual(content.load(content.object_path(self.ws, "p"))[1], "Real.\n")


class NewIdeaForce(Base):
    def scored(self, path):
        meta, body = content.load(path)
        content.set_idea_score(meta, NOW, relevance=4, timeliness=3, proof=4, fit=4, difference=4)
        content.save(path, meta, body)

    def test_force_keeps_the_date_surfaces_reactive_flag_and_campaign_and_drops_the_score(self):
        path = new_idea.create(self.ws, "i", "T", "personal", 1, "# Angles\n", campaign="ds", surfaces=["linkedin", "x"], date="2026-10-31", reactive=True, now=NOW)
        self.scored(path)
        self.assertEqual(run(new_idea.main, self.idea_args("i", "--pillar", "3", "--force"), stdin="# Again\n"), (0, ["updated i"]))
        meta, body = content.load(path)
        self.assertEqual((meta["scheduled_date"], meta["surfaces"], meta["reactive"], meta["campaign"]), ("2026-10-31T08:30:00+00:00", ["linkedin", "x"], True, "ds"))
        self.assertEqual((meta["pillar"], meta["score"], body), (3, None, "# Again\n"))
        self.assertEqual(content.validate(meta), [])

    def test_a_flag_given_with_force_wins(self):
        path = new_idea.create(self.ws, "i", "T", "personal", 1, "# Angles\n", surfaces=["linkedin", "x"], date="2026-10-31", now=NOW)
        argv = self.idea_args("i", "--date", "2026-11-02", "--surfaces", "instagram", "--campaign", "ds", "--reactive", "--force")
        self.assertEqual(run(new_idea.main, argv, stdin="# Again\n"), (0, ["updated i"]))
        meta, _ = content.load(path)
        self.assertEqual((meta["scheduled_date"], meta["surfaces"], meta["reactive"], meta["campaign"]), ("2026-11-02T08:30:00+00:00", ["instagram"], True, "ds"))

    def test_force_on_an_undated_idea_leaves_it_undated_with_the_default_surfaces(self):
        path = new_idea.create(self.ws, "i", "T", "personal", 1, "# Angles\n", now=NOW)
        self.assertEqual(run(new_idea.main, self.idea_args("i", "--force"), stdin="# Again\n"), (0, ["updated i"]))
        meta, _ = content.load(path)
        self.assertEqual((meta.get("scheduled_date"), meta["surfaces"], meta.get("reactive"), meta["campaign"]), (None, ["linkedin", "instagram", "x"], None, None))


class CheckAllSummary(Base):
    def test_last_line_counts_objects_and_those_with_problems(self):
        new_post.create(self.ws, "clean", "T", "linkedin", "text", "personal", "Body.\n", now=NOW)
        code, lines = run(check.main, ["--all", "--workspace", str(self.ws)])
        self.assertEqual((code, lines), (0, ["ok clean", "checked 1 objects, 0 with problems"]))
        new_post.create(self.ws, "dirty", "T", "linkedin", "text", "personal", "We leverage this.\n", now=NOW)
        code, lines = run(check.main, ["--all", "--workspace", str(self.ws)])
        self.assertEqual(code, 1)
        self.assertIn("dirty: banned word: 'leverage'", lines)
        self.assertEqual(lines[-1], "checked 2 objects, 1 with problems")

    def test_named_ids_print_no_summary(self):
        new_post.create(self.ws, "clean", "T", "linkedin", "text", "personal", "Body.\n", now=NOW)
        self.assertEqual(run(check.main, ["--workspace", str(self.ws), "clean"]), (0, ["ok clean"]))


class ScoreFail(Base):
    def test_failing_score_on_a_draft_prints_no_status_line(self):
        new_post.create(self.ws, "p", "T", "linkedin", "text", "personal", "Body.\n", now=NOW)
        argv = ["p", "--workspace", str(self.ws), "--hook", "4", "--voice", "8", "--value", "7", "--fit", "8", "--ready", "9"]
        self.assertEqual(run(score.main, argv), (0, ["score p 36/50 fail"]))
        self.assertEqual(content.load(content.object_path(self.ws, "p"))[0]["status"], "draft")


class ReviewCli(Base):
    def test_flags_gate_and_clear(self):
        new_post.create(self.ws, "p", "T", "linkedin", "text", "personal", "Body.\n", now=NOW)
        out = io.StringIO()
        with redirect_stdout(out):
            code = review.main(["--workspace", str(self.ws), "p", "--high", "a number without a source, line 2", "--medium", "'leverage' in line 1"])
        self.assertEqual((code, out.getvalue().splitlines()), (0, ["review p high=1 medium=1 low=0 blocked"]))
        meta, _ = content.load(content.object_path(self.ws, "p"))
        self.assertEqual(meta["review_flags"], ["High: a number without a source, line 2", "Medium: 'leverage' in line 1"])
        out = io.StringIO()
        with redirect_stdout(out):
            code = review.main(["--workspace", str(self.ws), "p", "--low", "a style point"])
        self.assertEqual((code, out.getvalue().splitlines()), (0, ["review p high=0 medium=0 low=1 clear"]))
        out = io.StringIO()
        with redirect_stdout(out):
            code = review.main(["--workspace", str(self.ws), "p", "--clear"])
        self.assertEqual((code, out.getvalue().splitlines()), (0, ["review p cleared"]))
        self.assertNotIn("review", content.load(content.object_path(self.ws, "p"))[0])
        self.assertEqual(review.main(["--workspace", str(self.ws), "nope", "--clear"]), 2)

    def test_a_typed_severity_is_not_doubled(self):
        new_post.create(self.ws, "p", "T", "linkedin", "text", "personal", "Body.\n", now=NOW)
        code, lines = run(review.main, ["--workspace", str(self.ws), "p", "--high", "High: body line 1: x", "--medium", "medium:body line 2: y", "--low", "High: title: z"])
        self.assertEqual((code, lines), (0, ["review p high=1 medium=1 low=1 blocked"]))
        flags = content.load(content.object_path(self.ws, "p"))[0]["review_flags"]
        self.assertEqual(flags, ["High: body line 1: x", "Medium: body line 2: y", "Low: title: z"])


class ReviewGatesLongForm(Base):
    """An article, essay or note has no rubric score, so a clean review on a draft check.py passes moves it to in-review,
    and a High flag moves it back; every other post keeps the score gate."""

    def status(self, id):
        return content.load(content.object_path(self.ws, id))[0]["status"]

    def test_a_clean_review_on_a_clean_long_form_draft_moves_it_to_in_review_and_a_high_flag_back(self):
        new_post.create(self.ws, "n", "T", "substack", "note", "personal", "A note of one sentence.\n", now=NOW)
        self.assertEqual(run(review.main, ["--workspace", str(self.ws), "n", "--low", "a style point"]),
                         (0, ["review n high=0 medium=0 low=1 clear", "status n in-review"]))
        self.assertEqual(self.status("n"), "in-review")
        self.assertEqual(run(review.main, ["--workspace", str(self.ws), "n", "--medium", "a point"]), (0, ["review n high=0 medium=1 low=0 clear"]))
        self.assertEqual(run(review.main, ["--workspace", str(self.ws), "n", "--high", "body line 1: no source"]),
                         (0, ["review n high=1 medium=0 low=0 blocked", "status n draft"]))
        self.assertEqual(self.status("n"), "draft")
        self.assertEqual(run(review.main, ["--workspace", str(self.ws), "n", "--high", "body line 1: no source"]),
                         (0, ["review n high=1 medium=0 low=0 blocked"]))  # a draft stays a draft
        self.assertEqual(self.status("n"), "draft")

    def test_a_long_form_draft_with_a_check_problem_stays_a_draft(self):
        new_post.create(self.ws, "n", "T", "substack", "note", "personal", "We leverage this.\n", now=NOW)
        self.assertEqual(run(review.main, ["--workspace", str(self.ws), "n"]), (0, ["review n high=0 medium=0 low=0 clear"]))
        self.assertEqual(self.status("n"), "draft")
        new_post.create(self.ws, "a", "T", "linkedin", "article", "personal", "# T\n\nToo short for an article.\n", now=NOW)
        self.assertTrue(check.check_object(self.ws, *content.load(content.object_path(self.ws, "a"))))
        self.assertEqual(run(review.main, ["--workspace", str(self.ws), "a"]), (0, ["review a high=0 medium=0 low=0 clear"]))
        self.assertEqual(self.status("a"), "draft")

    def test_an_article_and_an_essay_that_pass_check_move_to_in_review(self):
        new_post.create(self.ws, "a", "T", "linkedin", "article", "personal", "# T\n\n" + "Plain words here. " * 400 + "\n", now=NOW)
        new_post.create(self.ws, "e", "T", "substack", "essay", "personal", "# T\n\n" + "Plain words here. " * 700 + "\n", subtitle="S.", now=NOW)
        for id in ("a", "e"):
            self.assertEqual(check.check_object(self.ws, *content.load(content.object_path(self.ws, id))), [], id)
            self.assertEqual(run(review.main, ["--workspace", str(self.ws), id])[1][-1], "status %s in-review" % id)
            self.assertEqual(self.status(id), "in-review")

    def test_posts_and_held_statuses_are_left_alone(self):
        new_post.create(self.ws, "p", "T", "linkedin", "text", "personal", "Body.\n", now=NOW)
        self.assertEqual(run(review.main, ["--workspace", str(self.ws), "p"]), (0, ["review p high=0 medium=0 low=0 clear"]))
        self.assertEqual(self.status("p"), "draft")  # a post reaches review through its score
        score.apply(self.ws, "p", NOW, hook=8, voice=8, value=7, fit=8, ready=9)
        self.assertEqual(run(review.main, ["--workspace", str(self.ws), "p", "--high", "x"]), (0, ["review p high=1 medium=0 low=0 blocked"]))
        self.assertEqual(self.status("p"), "in-review")
        path = new_post.create(self.ws, "n", "T", "substack", "note", "personal", "A note.\n", now=NOW)
        meta, body = content.load(path)
        meta["status"] = "approved"
        content.save(path, meta, body)
        self.assertEqual(run(review.main, ["--workspace", str(self.ws), "n", "--high", "x"]), (0, ["review n high=1 medium=0 low=0 blocked"]))
        self.assertEqual(self.status("n"), "approved")


class SetBody(Base):
    def test_replace_keeps_everything_else(self):
        new_post.create(self.ws, "p", "T", "linkedin", "text", "personal", "Body.\n", first_comment="Link: https://x.io/a", visual_brief="Petrol card", seo_title="S", now=NOW)
        path = content.object_path(self.ws, "p")
        meta, _ = content.load(path)
        meta["trypost"]["post_id"] = "abc"
        meta["labels_extra"] = ["needs-caption"]
        content.save(path, meta, "Body.\n")
        set_body.replace(self.ws, "p", "New body.\n", now="2026-10-22T12:00:00+01:00", remove_labels=["needs-caption"], add_labels=["edited"])
        meta, body = content.load(path)
        self.assertEqual((body, meta["trypost"]["post_id"], meta["first_comment"], meta["visual_brief"], meta["seo_title"], meta["labels_extra"], meta["created"], meta["updated"]),
                         ("New body.\n", "abc", "Link: https://x.io/a", "Petrol card", "S", ["edited"], NOW, "2026-10-22T12:00:00+01:00"))

    def test_cli_and_errors(self):
        new_post.create(self.ws, "p", "T", "linkedin", "text", "personal", "Body.\n", now=NOW)
        body_file = self.ws / "new.txt"
        body_file.write_text("New body.\n")
        out = io.StringIO()
        with redirect_stdout(out):
            code = set_body.main(["--workspace", str(self.ws), "p", "--body-file", str(body_file)])
        self.assertEqual((code, out.getvalue().splitlines()), (0, ["updated p"]))
        with self.assertRaises(FileNotFoundError):
            set_body.replace(self.ws, "nope", "x\n")


class RewriteLeavesTheGate(Base):
    """A new body takes an in-review post out of review, scored or not, and drops a score given to the old one."""
    LATER = "2026-10-22T12:00:00+01:00"
    FLAGS = ["Medium: body line 1: a vague line"]

    def scored(self, id, status="in-review"):
        """A post scored into in-review, linked to TryPost and reviewed, then set to `status`."""
        new_post.create(self.ws, id, "T", "linkedin", "text", "personal", "Body.\n", now=NOW)
        self.assertEqual(score.apply(self.ws, id, NOW, hook=8, voice=8, value=7, fit=8, ready=9)[1], "in-review")
        path = content.object_path(self.ws, id)
        meta, body = content.load(path)
        meta["trypost"]["post_id"] = "abc"
        content.set_review(meta, NOW, self.FLAGS)
        meta["status"] = status
        content.save(path, meta, body)
        return path

    def assertRewritten(self, path, status="draft", total=None):
        meta, body = content.load(path)
        score_total = meta["score"]["total"] if meta["score"] else None
        self.assertEqual((body, score_total, meta["status"], meta["trypost"]["post_id"], meta["created"]), ("Two.\n", total, status, "abc", NOW))
        self.assertEqual((meta["review_flags"], meta["review"]["medium"]), (self.FLAGS, 1))
        self.assertEqual(content.validate(meta), [])

    def test_force_rewrite_of_a_scored_in_review_post_returns_to_draft(self):
        path = self.scored("p")
        new_post.create(self.ws, "p", "T", "linkedin", "text", "personal", "Two.\n", force=True, now=self.LATER)
        self.assertRewritten(path)
        self.assertEqual(content.approval_blockers(content.load(path)[0]), [])

    def test_set_body_on_a_scored_in_review_post_returns_to_draft(self):
        path = self.scored("p")
        set_body.replace(self.ws, "p", "Two.\n", now=self.LATER)
        self.assertRewritten(path)

    def test_approved_and_published_posts_keep_their_status_and_score(self):
        # TryPost holds their label; taking the status away locally would block the sync (see the next test).
        approved, published = self.scored("a", "approved"), self.scored("b", "published")
        set_body.replace(self.ws, "a", "Two.\n", now=self.LATER)
        new_post.create(self.ws, "b", "T", "linkedin", "text", "personal", "Two.\n", force=True, now=self.LATER)
        self.assertRewritten(approved, status="approved", total=40)
        self.assertRewritten(published, status="published", total=40)

    def test_a_new_body_on_an_approved_post_still_pushes(self):
        when = datetime(2026, 10, 22, 11, 0, tzinfo=timezone.utc)
        fake = FakeTryPost()
        client = TryPostClient("http://x", "t", transport=fake.transport)
        new_post.create(self.ws, "p", "T", "linkedin", "text", "personal", "Body.\n", now=NOW)
        score.apply(self.ws, "p", NOW, hook=8, voice=8, value=7, fit=8, ready=9)
        self.assertIn("created p", push(self.ws, client, dry_run=False, now=when))
        post_id = content.load(content.object_path(self.ws, "p"))[0]["trypost"]["post_id"]
        fake.add_label_to_post(post_id, "approved")
        self.assertIn("approved p", pull(self.ws, client, dry_run=False, now=when))
        self.assertIn("updated p", push(self.ws, client, dry_run=False, now=when))
        set_body.replace(self.ws, "p", "Two.\n", now=self.LATER)
        report = push(self.ws, client, dry_run=False, now=when)
        self.assertIn("updated p", report)
        self.assertFalse(any(line.startswith("conflict") for line in report), report)
        meta, _ = content.load(content.object_path(self.ws, "p"))
        self.assertEqual((meta["status"], meta["score"]["total"]), ("approved", 40))
        self.assertEqual(fake.posts[post_id]["content"], "Two.\n")
        self.assertIn("approved", {label["name"] for label in fake.posts[post_id]["labels"]})

    def unscored_in_review(self, id):
        """A post in review with no score, as the import left the Instagram children waiting for a caption."""
        new_post.create(self.ws, id, "T", "instagram", "image", "personal", "The LinkedIn text.\n", now=NOW)
        path = content.object_path(self.ws, id)
        meta, body = content.load(path)
        meta["status"] = "in-review"
        meta["labels_extra"] = ["needs-caption"]
        content.save(path, meta, body)
        return path

    def test_set_body_on_an_unscored_in_review_post_returns_to_draft(self):
        path = self.unscored_in_review("p")
        set_body.replace(self.ws, "p", "The LinkedIn text.\n", now=self.LATER, add_labels=["edited"])
        self.assertEqual(content.load(path)[0]["status"], "in-review")  # the same body moves nothing
        set_body.replace(self.ws, "p", "The caption.\n", now=self.LATER, remove_labels=["needs-caption", "edited"])
        meta, body = content.load(path)
        self.assertEqual((body, meta["status"], meta["score"], meta["labels_extra"]), ("The caption.\n", "draft", None, []))
        self.assertNotIn("review", sync_plan.labels_for(meta))

    def test_force_rewrite_of_an_unscored_in_review_post_returns_to_draft(self):
        path = self.unscored_in_review("p")
        new_post.create(self.ws, "p", "T", "instagram", "image", "personal", "Two.\n", force=True, now=self.LATER)
        self.assertEqual((content.load(path)[0]["status"], content.load(path)[0]["score"]), ("draft", None))

    def test_the_same_body_keeps_the_score(self):
        path = self.scored("p")
        set_body.replace(self.ws, "p", "Body.\n", now=self.LATER, add_labels=["edited"])
        meta, _ = content.load(path)
        self.assertEqual((meta["score"]["total"], meta["status"], meta["labels_extra"]), (40, "in-review", ["edited"]))


class LongFormFields(Base):
    def test_new_post_long_form_fields(self):
        path = new_post.create(self.ws, "art", "T", "linkedin", "article", "personal", "# T\n\nBody.\n", seo_title="SEO", seo_description="Desc", cover="images/art-cover.png", now=NOW)
        meta, _ = content.load(path)
        self.assertEqual((meta["seo_title"], meta["seo_description"], meta["cover"]), ("SEO", "Desc", "images/art-cover.png"))
        self.assertNotIn("subtitle", meta)
        essay = new_post.create(self.ws, "ess", "T", "substack", "essay", "personal", "Body.\n", subtitle="One sentence.", now=NOW)
        self.assertEqual(content.load(essay)[0]["subtitle"], "One sentence.")
        reel = new_post.create(self.ws, "r", "T", "instagram", "reel", "personal", "Caption.\n", script="HOOK (0 to 3 s): a line\nPOINT 1: a line", now=NOW)
        self.assertEqual(content.load(reel)[0]["script"], "HOOK (0 to 3 s): a line\nPOINT 1: a line")


class IdeaScoreCli(Base):
    def test_idea_mode(self):
        new_idea.create(self.ws, "i", "T", "personal", 1, "# Angles\n", now=NOW)
        out = io.StringIO()
        with redirect_stdout(out):
            code = score.main(["--workspace", str(self.ws), "i", "--relevance", "5", "--timeliness", "3", "--proof", "4", "--fit", "4", "--difference", "2"])
        self.assertEqual((code, out.getvalue().splitlines()), (0, ["score i 18/25 pass"]))
        self.assertEqual(content.load(content.object_path(self.ws, "i"))[0]["status"], "idea")

    def test_idea_mode_prints_pass_or_fail_against_the_pass_mark(self):
        new_idea.create(self.ws, "i", "T", "personal", 1, "# Angles\n", now=NOW)
        for difference, line in ((3, "score i %d/25 pass" % content.IDEA_SCORE_PASS), (2, "score i %d/25 fail" % (content.IDEA_SCORE_PASS - 1))):
            out = io.StringIO()
            with redirect_stdout(out):
                code = score.main(["--workspace", str(self.ws), "i", "--relevance", "3", "--timeliness", "3", "--proof", "3", "--fit", "3", "--difference", str(difference)])
            self.assertEqual((code, out.getvalue().splitlines()), (0, [line]))
        self.assertEqual(content.load(content.object_path(self.ws, "i"))[0]["status"], "idea")  # a fail changes no status

    def test_flags_must_match_the_object(self):
        new_idea.create(self.ws, "i", "T", "personal", 1, "# Angles\n", now=NOW)
        new_post.create(self.ws, "p", "T", "x", "text", "personal", "Body.\n", now=NOW)
        idea_flags = ["--relevance", "5", "--timeliness", "3", "--proof", "4", "--fit", "4", "--difference", "2"]
        post_flags = ["--hook", "7", "--voice", "8", "--value", "7", "--fit", "8", "--ready", "9"]
        for argv in (["i", *post_flags], ["p", *idea_flags], ["i", "--relevance", "5"]):
            with self.assertRaises(SystemExit) as raised, redirect_stderr(io.StringIO()):
                score.main(["--workspace", str(self.ws), *argv])
            self.assertEqual(raised.exception.code, 2)
        self.assertIsNone(content.load(content.object_path(self.ws, "i"))[0]["score"])
        self.assertIsNone(content.load(content.object_path(self.ws, "p"))[0]["score"])


class PlanCli(Base):
    def test_plan_prints_and_writes(self):
        from scripts import plan
        new_post.create(self.ws, "ds-1", "T", "linkedin", "image", "nagarro", "Body.\n", campaign="ds", pillar=3, date="2026-10-26", now=NOW)
        out = io.StringIO()
        with redirect_stdout(out):
            code = plan.main(["--workspace", str(self.ws), "--monday", "2026-10-26", "--write"])
        lines = out.getvalue().splitlines()
        self.assertEqual(code, 0)
        # 16 ideas, not 7: an idea covers only the networks its pillar is written for, so a day takes two or three.
        self.assertEqual(lines[-1], "plan 2026-10-26: 21 slots, 16 ideas to choose, 0 to repurpose")
        self.assertTrue((self.ws / "plans" / "2026-10-26.md").exists())

    def test_saved_ideas_are_not_asked_for_again(self):
        from scripts import plan
        for n in range(7):
            new_idea.create(self.ws, "i%d" % n, "T", "personal", 1 + n % 4, "# Angles\n", date="2026-10-%d" % (26 + n) if n < 6 else "2026-11-01", now=NOW)
        code, lines = run(plan.main, ["--workspace", str(self.ws), "--monday", "2026-10-26"])
        # The Tuesday and Thursday ideas list LinkedIn, so Viva Engage takes a child of each: 23 slots, 2 to repurpose.
        self.assertEqual((code, lines[-1]), (0, "plan 2026-10-26: 23 slots, 0 ideas to choose, 2 to repurpose"))
        self.assertTrue(any(line.startswith("| 2026-10-26 | idea: i0 | idea: i0 | idea: i0 |") for line in lines))
        self.assertTrue(any(line.startswith("| 2026-10-27 | idea: i1 | idea: i1 | idea: i1 | child: i1 |") for line in lines))

    def test_new_idea_date_surfaces_reactive(self):
        path = new_idea.create(self.ws, "i", "T", "personal", 1, "# Angles\n", date="2026-10-31", surfaces=["linkedin", "x"], reactive=True, now=NOW)
        meta, _ = content.load(path)
        self.assertEqual((meta["scheduled_date"], meta["surfaces"], meta["reactive"]), ("2026-10-31T08:30:00+00:00", ["linkedin", "x"], True))
        self.assertEqual(content.validate(meta), [])
