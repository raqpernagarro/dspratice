#!/usr/bin/env python3
"""Mirror the Content Objects under brands/me into the local TryPost, and bring edits, approvals and
posted marks back. Every post it creates is a draft; it never schedules and never contacts a social network.
Ideas go to the idea board, in the column their status names (idea: the built-in Unassigned column, which is no
stage at all; approved: To Do; draft: In Progress). A card the author drags to another of those columns, or deletes,
comes back as a status change; trypost.synced_status records the status the card was last in step with, so a
status edited in the file is not undone by a pull and a dragged card is not dragged back by a push, and when
both moved to different places the idea is reported as a conflict and left alone. A post whose scheduled_date changed
since its last push (redate.py) is updated, and its draft takes the new date when that date is still ahead;
trypost.synced_scheduled_date records the date last pushed.

Each surface's new drafts go to a connected account of its own network when the author has connected one in TryPost (LinkedIn,
Instagram, X), otherwise to its manual channel, found through sync_plan.SURFACE_PLATFORMS (Viva Engage on the facebook
channel, Substack on the mastodon one; those two never use a real account). Every post is still created as a draft, and
an update never sends a status, so a draft on a connected account is never published by the sync. A piece whose
surface has no channel fails alone, printed as
`failed <id>: no manual channel for surface <surface> (see trypost/README.md)`, and the push goes on. A LinkedIn article
or a Substack essay is long form: an idea card in To Do, and an essay also gets one dated draft on the Substack channel
carrying its title, its subtitle and a pointer to the card, never its body (trypost.post_id records it,
trypost.draft_hash the text last sent). A Substack note is a draft on its channel.

Usage:
    python3 scripts/trypost_sync.py push [--dry-run]
    python3 scripts/trypost_sync.py pull [--dry-run] [--relink]
    python3 scripts/trypost_sync.py sync [--dry-run]
Options: --workspace brands/me  --env trypost/.env

A pull that brings back text the author edited in TryPost also appends the change, as a diff, to
<workspace>/edits.md, which the learn mode reads to see how her edits differ from the drafts.

A card or post missing from TryPost is never recreated by a plain sync: pull archives an idea whose card
is gone (The author deleted it) and only reports a missing post, or a long-form piece whose card or calendar draft
is gone. After a TryPost wipe, run `pull --relink` once before the first sync: it forgets the link of every
missing post and every missing idea card instead (an idea keeps its status and prints `relinked <id>`; so does
a long-form piece, which forgets its card, its reminder note and its calendar draft), so the next push
creates them again, each idea in the column its status names.
"""
from __future__ import annotations

import argparse
import difflib
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.lib import content, sync_plan  # noqa: E402
from scripts.lib.trypost_api import ApiError, TryPostClient, load_env  # noqa: E402

STAGES_NEEDED = ("To Do", "In Progress")  # Unassigned is the built-in no-stage column, never created


class NoChannel(LookupError):
    """A surface with no manual channel in TryPost: the piece fails with a pointer to the README step that adds one,
    and the push goes on with the others."""

    def __init__(self, surface: str):
        self.message = "no manual channel for surface %s (see trypost/README.md)" % surface
        super().__init__(self.message)


def _iso(now: datetime) -> str:
    return now.astimezone(content.LISBON).replace(microsecond=0).isoformat()


def _items(response) -> list:
    """Listings come back either as a bare list (idea stages) or wrapped in {data: [...]}."""
    return response if isinstance(response, list) else list(response.get("data", []))


class _Remote:
    """What the push needs to know about TryPost's current state, read once per run."""

    def __init__(self, client: TryPostClient, dry_run: bool, report):
        self.client, self.dry_run, self.report = client, dry_run, report
        self.labels = {l["name"]: l["id"] for l in client.list_all("/api/labels")}
        self.stages = {s["name"]: s["id"] for s in _items(client.get("/api/idea-stages"))}
        self.channels = sync_plan.pick_channels(client.list_all("/api/social-accounts"))
        self.posts = {p["id"]: p for p in client.list_all("/api/posts")}
        self.ideas = {i["id"]: i for i in client.list_all("/api/ideas")}

    def ensure_labels(self, names) -> None:
        for name in sorted(set(names) - set(self.labels)):
            self.report("label %s" % name)
            if not self.dry_run:
                self.labels[name] = self.client.post("/api/labels", json={"name": name, "color": sync_plan.label_colour(name)})["id"]

    def ensure_stages(self) -> None:
        for name in STAGES_NEEDED:
            if name not in self.stages:
                self.report("stage %s" % name)
                if not self.dry_run:
                    self.stages[name] = self.client.post("/api/idea-stages", json={"name": name})["id"]

    def label_ids(self, names) -> list:
        return [self.labels[n] for n in names if n in self.labels]

    def account_for(self, surface: str) -> str | None:
        """The id of the channel a surface's new drafts go to (sync_plan.pick_channels); None when there is none."""
        return self.channels.get(surface)

    def stage_id(self, name: str) -> str | None:
        """The stage id for a column name; None for Unassigned, which is the board's no-stage column."""
        return None if name == "Unassigned" else self.stages.get(name)

    def column_status(self, card: dict) -> str | None:
        """The status the column a card sits in means, or None when it means nothing."""
        return sync_plan.status_for_column(card.get("idea_stage_id"), {id: name for name, id in self.stages.items()})

    def move_idea(self, idea_id: str, stage_id: str | None) -> None:
        """Put an idea first in a column (stage_id None is Unassigned). The endpoint takes the column's whole ordered list
        of idea ids, this one included, and refuses a list that is missing a card, so the order is built from the listing
        read at the start; the no-stage column is every card whose stage is null."""
        others = sorted(
            (i for i in self.ideas.values() if i.get("idea_stage_id") == stage_id and i["id"] != idea_id),
            key=lambda i: (i.get("position") or 0, str(i.get("created_at") or ""), i["id"]),
        )
        ordered = [idea_id] + [i["id"] for i in others]
        self.client.put("/api/ideas/%s/move" % idea_id, json={"idea_stage_id": stage_id, "idea_ids": ordered})
        for position, id in enumerate(ordered):
            self.ideas[id]["position"] = position
        self.ideas[idea_id]["idea_stage_id"] = stage_id


class _LabelIds:
    """Label name to id for the pull: read from TryPost the first time a post needs them, once per run.
    A name TryPost lacks is created with its colour, as the push does."""

    def __init__(self, client: TryPostClient):
        self.client = client
        self._ids: dict | None = None

    def resolve(self, names) -> list:
        if self._ids is None:
            self._ids = {l["name"]: l["id"] for l in self.client.list_all("/api/labels")}
        for name in names:
            if name not in self._ids:
                self._ids[name] = self.client.post("/api/labels", json={"name": name, "color": sync_plan.label_colour(name)})["id"]
        return [self._ids[name] for name in names]


class _IdeaBoard:
    """TryPost's idea cards and the names of its columns for the pull: read the first time an idea needs them, once per run."""

    def __init__(self, client: TryPostClient):
        self.client = client
        self._ideas: dict | None = None
        self._stages: dict | None = None

    def _load(self) -> None:
        if self._ideas is None:
            self._ideas = {i["id"]: i for i in self.client.list_all("/api/ideas")}
            self._stages = {s["id"]: s["name"] for s in _items(self.client.get("/api/idea-stages"))}

    def card(self, idea_id: str) -> dict | None:
        self._load()
        return self._ideas.get(idea_id)

    def column_status(self, card: dict) -> str | None:
        """The status the column a card sits in means (no stage is Unassigned), or None when it means nothing."""
        self._load()
        return sync_plan.status_for_column(card.get("idea_stage_id"), self._stages)


def push(workspace: Path, client: TryPostClient, dry_run: bool, now: datetime | None = None) -> list[str]:
    now = now or datetime.now(timezone.utc)
    workspace = Path(workspace)
    lines: list[str] = []

    def say(line: str) -> None:
        lines.append(("would " + line) if dry_run else line)

    objects = []
    ideas = []
    for path in content.list_objects(workspace):
        meta, body = content.load(path)
        if meta.get("type") == "post" and meta.get("status") != "archived":
            objects.append((path, meta, body))
        elif meta.get("type") == "idea" and meta.get("status") in sync_plan.STAGE_FOR:
            ideas.append((path, meta, body))  # archived and every other status stay off the board

    remote = _Remote(client, dry_run, say)
    needed = set(sync_plan.STATUS_LABELS.values())  # review, approved, posted: The author applies these in TryPost
    for _, meta, _ in objects:
        if sync_plan.is_channel_piece(meta):
            needed.update(sync_plan.labels_for(meta))
        if sync_plan.is_long_form(meta):
            needed.add("long-form")
        if sync_plan.has_calendar_draft(meta):
            needed.update(sync_plan.calendar_draft_labels(meta))
    for _, meta, _ in ideas:
        needed.update(sync_plan.idea_labels(meta))
    remote.ensure_labels(needed)
    remote.ensure_stages()

    channel_by_day: dict[str, list] = {}
    objects = _valid(objects, say)
    ideas = _valid(ideas, say)
    for path, meta, body in objects:
        if not sync_plan.is_channel_piece(meta):
            continue
        when = sync_plan.scheduled_datetime(meta)
        if when is not None:
            channel_by_day.setdefault(when.date().isoformat(), []).append(meta)
        try:
            _push_channel_piece(path, meta, body, remote, client, dry_run, now, say)
        except (ApiError, NoChannel, FileNotFoundError, KeyError, ValueError) as error:
            say("failed %s: %s" % (meta["id"], getattr(error, "message", None) or error))

    for path, meta, body in ideas:
        try:
            _push_idea(path, meta, body, remote, client, dry_run, now, say)
        except ApiError as error:
            say("failed %s: %s" % (meta["id"], error.message))

    for path, meta, body in objects:
        if not sync_plan.is_long_form(meta):
            continue
        try:
            _push_long_form(path, meta, body, remote, client, dry_run, now, say, channel_by_day)
        except (ApiError, NoChannel, KeyError, ValueError) as error:
            say("failed %s: %s" % (meta["id"], getattr(error, "message", None) or error))
    return lines


def _valid(items, say) -> list:
    """The (path, meta, body) items whose frontmatter is valid; each invalid one is reported as failed and left out."""
    valid = []
    for path, meta, body in items:
        problems = content.validate(meta)
        if problems:
            say("failed %s: %s" % (meta.get("id") or Path(path).stem, "; ".join(problems)))
        else:
            valid.append((path, meta, body))
    return valid


def _push_channel_piece(path, meta, body, remote, client, dry_run, now, say) -> None:
    state = meta["trypost"]
    label_ids = remote.label_ids(sync_plan.labels_for(meta))
    verb = "overdue" if sync_plan.is_overdue(meta, now) else "created"
    if not state.get("post_id"):
        if dry_run:
            say("%s %s" % (verb, meta["id"]))
            return
        account_id = remote.account_for(meta["surface"])
        if account_id is None:
            raise NoChannel(meta["surface"])
        for asset in meta.get("assets") or []:
            if not (Path(path).parents[1] / asset).exists():
                raise FileNotFoundError("missing asset %s" % asset)
        tokens = [client.upload(Path(path).parents[1] / asset) for asset in meta.get("assets") or []]
        post = client.post("/api/posts", json=sync_plan.build_create_payload(meta, body, account_id, label_ids, tokens, now))
        # Record the id before anything else can fail, so a retry never creates a second draft.
        state.update({"post_id": post["id"], "synced_at": _iso(now), "synced_hash": content.body_hash(sync_plan.comparable_text(meta, body)),
                      "synced_scheduled_date": meta.get("scheduled_date"), "notes_synced": False})
        remote.posts[post["id"]] = post
        content.save(path, meta, body)
        _create_notes(path, meta, body, client)
        say("%s %s" % (verb, meta["id"]))
        return

    post = remote.posts.get(state["post_id"])
    if post is None:
        say("missing in TryPost: %s" % meta["id"])
        return
    # Never overwrite what the author changed in TryPost: a text edit, or an approved/posted label the file lacks.
    remote_names = {l.get("name") for l in post.get("labels", [])}
    unpulled_labels = ({"approved", "posted"} & remote_names) - set(sync_plan.labels_for(meta))
    if content.body_hash(sync_plan.comparable_text(meta, sync_plan.remote_text(post))) != state.get("synced_hash") or unpulled_labels:
        say("conflict %s: TryPost has changes the file does not (pull first)" % meta["id"])
        return
    # synced_hash is the body's baseline for the three-way compare, so the date has its own: the scheduled_date last pushed.
    # A post pushed before that was recorded takes its date as the baseline when TryPost already holds it (or there is no
    # date to send), so the first push after the upgrade sends nothing; any other date counts as changed.
    when = meta.get("scheduled_date")
    adopted = "synced_scheduled_date" not in state and sync_plan.schedule_in_step(meta, post, now)
    if adopted:
        state["synced_scheduled_date"] = when
    remote_label_ids = {l["id"] for l in post.get("labels", [])}
    # A thread pushed before TryPost got it as replies is sent again in its split form.
    unsplit_thread = sync_plan.thread_parts(meta, body) is not None and not sync_plan.is_split_thread(post)
    changed = (content.body_hash(sync_plan.comparable_text(meta, body)) != state.get("synced_hash") or remote_label_ids != set(label_ids)
               or when != state.get("synced_scheduled_date") or unsplit_thread)
    needs_notes = not state.get("notes_synced", True)
    if not changed and not needs_notes:
        if adopted and not dry_run:
            content.save(path, meta, body)
        say("unchanged %s" % meta["id"])
        return
    if dry_run:
        say("updated %s" % meta["id"])
        return
    if changed:
        updated = client.put("/api/posts/%s" % state["post_id"], json=sync_plan.build_update_payload(meta, body, label_ids, now))
        remote.posts[state["post_id"]] = updated
        state.update({"synced_at": _iso(now), "synced_hash": content.body_hash(sync_plan.comparable_text(meta, body)), "synced_scheduled_date": when})
        content.save(path, meta, body)
    if needs_notes:
        _create_notes(path, meta, body, client)
    say("updated %s" % meta["id"])


def _create_notes(path, meta, body, client) -> None:
    """Write the first comment and poll options as notes, then mark them synced in the file."""
    for note in sync_plan.notes_for(meta):
        client.post("/api/posts/%s/notes" % meta["trypost"]["post_id"], json={"body": note})
    meta["trypost"]["notes_synced"] = True
    content.save(path, meta, body)


def _push_idea(path, meta, body, remote, client, dry_run, now, say) -> None:
    """One idea on the board: a card in the column its status names, with the day, networks and plan in its text.
    The file wins for the card's text and labels; the column is the one thing the author moves on the board, which pull brings back."""
    state = meta.get("trypost")
    if not isinstance(state, dict):
        state = meta["trypost"] = {"idea_id": None, "synced_at": None, "synced_hash": None}
    status = meta["status"]
    title = sync_plan.idea_title(meta)
    text = sync_plan.idea_body(meta, body)
    digest = content.body_hash(title + "\n" + text)
    stage_id = remote.stage_id(sync_plan.STAGE_FOR[status])
    label_ids = remote.label_ids(sync_plan.idea_labels(meta))
    idea_id = state.get("idea_id")
    if not idea_id:
        if dry_run:
            say("idea %s %s" % (meta["id"], status))
            return
        created = client.post("/api/ideas", json={"title": title, "body": text, "idea_stage_id": stage_id, "label_ids": label_ids})
        # Record the id before anything else can fail, so a retry never creates a second card.
        state.update({"idea_id": created["id"], "synced_at": _iso(now), "synced_hash": digest, "synced_status": status})
        remote.ideas[created["id"]] = created
        content.save(path, meta, body)
        say("idea %s %s" % (meta["id"], status))
        return

    card = remote.ideas.get(idea_id)
    if card is None:
        say("missing in TryPost: %s" % meta["id"])  # never recreated here: pull archives the file, or forgets the link with --relink
        return
    verdict = sync_plan.decide_idea_stage(status, state.get("synced_status"), remote.column_status(card))
    if verdict == "conflict":
        say(_idea_conflict(meta, state, remote.column_status(card)))
        return
    text_changed = digest != state.get("synced_hash")
    labels_changed = {l["id"] for l in card.get("labels") or []} != set(label_ids)
    move = verdict == "push"  # only the file moved; a card the author dragged is for pull to adopt, never for push to undo
    changed = text_changed or labels_changed or move
    outcome = "idea %s %s" % (meta["id"], status) if changed else "unchanged %s" % meta["id"]
    if dry_run:
        say(outcome)
        return
    if text_changed or labels_changed:
        remote.ideas[idea_id] = client.put("/api/ideas/%s" % idea_id, json={"title": title, "body": text, "label_ids": label_ids})
        state.update({"synced_at": _iso(now), "synced_hash": digest})
        content.save(path, meta, body)
    if move:
        remote.move_idea(idea_id, stage_id)
        state["synced_status"] = status
        content.save(path, meta, body)
    elif verdict == "in-sync" and state.get("synced_status") != status:
        state["synced_status"] = status  # both sides ended up in the same place: record it as the baseline
        content.save(path, meta, body)
    say(outcome)


def _idea_conflict(meta: dict, state: dict, column_status: str | None) -> str:
    return "conflict %s: the file says %s, the board says %s, last in step as %s (make them agree, then sync)" % (
        meta["id"], meta["status"], column_status, state.get("synced_status") or "unknown",
    )


def _push_long_form(path, meta, body, remote, client, dry_run, now, say, channel_by_day) -> None:
    """A LinkedIn article or a Substack essay: an idea card in To Do (made once), a reminder note on a channel piece of the same
    day, and for an essay its calendar draft. Each is recorded in the file as soon as it exists, so a later failure never
    makes a second one."""
    state = meta["trypost"]
    idea = sync_plan.idea_for(meta, body)
    changed = False
    if not state.get("idea_id"):
        if not dry_run:
            created = client.post("/api/ideas", json={
                "title": idea["title"], "body": idea["body"],
                "idea_stage_id": remote.stages["To Do"], "label_ids": remote.label_ids(["long-form"]),
            })
            state.update({"idea_id": created["id"], "synced_at": _iso(now), "synced_hash": content.body_hash(body)})
            content.save(path, meta, body)
        say("idea %s" % meta["id"])
        changed = True
    if not dry_run and state.get("idea_id") and not state.get("reminder_note_id"):
        when = sync_plan.scheduled_datetime(meta)
        same_day = channel_by_day.get(when.date().isoformat(), []) if when else []
        target = next((m for m in same_day if m["trypost"].get("post_id")), None)
        if target is not None:
            note = client.post("/api/posts/%s/notes" % target["trypost"]["post_id"], json={"body": "Also today: %s" % idea["title"]})
            state["reminder_note_id"] = note["id"]
            content.save(path, meta, body)
            changed = True
    if sync_plan.has_calendar_draft(meta):
        line = _push_calendar_draft(path, meta, body, remote, client, dry_run, now)
        if line:
            say(line)
            changed = True
    if not changed and not dry_run:
        say("unchanged %s" % meta["id"])


def _push_calendar_draft(path, meta, body, remote, client, dry_run, now) -> str | None:
    """An essay's one dated draft on its surface's channel: the title, the subtitle and a pointer to the idea card, never the
    body (sync_plan.calendar_draft_text). Created once and recorded in trypost.post_id; later pushes carry a changed title,
    subtitle or date to it, unless its text was edited in TryPost, which is reported as a conflict naming the way out (undo
    the edit, or delete the draft and run pull --relink, so the next push makes it again) and left alone. Returns the line
    to report, or None when nothing changed."""
    state = meta["trypost"]
    text = sync_plan.calendar_draft_text(meta)
    digest = content.body_hash(text)
    when = meta.get("scheduled_date")
    if not state.get("post_id"):
        verb = "overdue" if sync_plan.is_overdue(meta, now) else "created"
        if dry_run:
            return "%s %s" % (verb, meta["id"])
        account_id = remote.account_for(meta["surface"])
        if account_id is None:
            raise NoChannel(meta["surface"])
        label_ids = remote.label_ids(sync_plan.calendar_draft_labels(meta))
        post = client.post("/api/posts", json=sync_plan.build_create_payload(meta, text, account_id, label_ids, [], now))
        state.update({"post_id": post["id"], "draft_hash": digest, "synced_scheduled_date": when})
        remote.posts[post["id"]] = post
        content.save(path, meta, body)
        return "%s %s" % (verb, meta["id"])
    post = remote.posts.get(state["post_id"])
    if post is None:
        return "missing in TryPost: %s" % meta["id"]
    if content.body_hash(post.get("content") or "") != state.get("draft_hash"):
        return "conflict %s: the calendar draft was edited in TryPost; undo the edit, or delete the draft and run pull --relink" % meta["id"]
    if digest == state.get("draft_hash") and when == state.get("synced_scheduled_date"):
        return None
    if dry_run:
        return "updated %s" % meta["id"]
    remote.posts[state["post_id"]] = client.put("/api/posts/%s" % state["post_id"], json=sync_plan.build_calendar_draft_update(meta, now))
    state.update({"draft_hash": digest, "synced_scheduled_date": when})
    content.save(path, meta, body)
    return "updated %s" % meta["id"]


def pull(workspace: Path, client: TryPostClient, dry_run: bool, relink: bool = False, now: datetime | None = None) -> list[str]:
    """Bring TryPost's edits, approvals and posted marks back into the files. Never overwrites a file both sides changed."""
    now = now or datetime.now(timezone.utc)
    workspace = Path(workspace)
    lines: list[str] = []

    def say(line: str) -> None:
        lines.append(("would " + line) if dry_run else line)

    remote_posts = {p["id"]: p for p in client.list_all("/api/posts")}
    label_ids = _LabelIds(client)
    board = _IdeaBoard(client)
    for path in content.list_objects(workspace):
        meta, body = content.load(path)
        state = meta.get("trypost") or {}
        if meta.get("type") == "idea":
            _pull_idea(path, meta, body, board, dry_run, now, say, relink)
            continue
        if sync_plan.is_long_form(meta):
            _pull_long_form(path, meta, body, board, remote_posts, dry_run, say, relink)
            continue
        if not (sync_plan.is_channel_piece(meta) and state.get("post_id")):
            continue
        problems = content.validate(meta)
        if problems:
            say("failed %s: %s" % (meta["id"], "; ".join(problems)))
            continue
        remote = remote_posts.get(state["post_id"])
        if remote is None:
            say("missing in TryPost: %s" % meta["id"])
            if relink and not dry_run:
                state.update({"post_id": None, "synced_at": None, "synced_hash": None})
                content.save(path, meta, body)
            continue
        decision = sync_plan.decide_pull(meta, body, remote)
        if decision["conflict"]:
            say("conflict %s: file %r | TryPost %r" % (meta["id"], body[:60], (remote.get("content") or "")[:60]))
            continue
        changes = []
        edit = None
        if decision["body"] is not None:
            edit = (body, decision["body"])
            body = decision["body"]
            state.update({"synced_hash": content.body_hash(body), "synced_at": _iso(now)})
            changes.append("pulled")
        if decision["status"]:
            meta["status"] = decision["status"]
            meta["updated"] = _iso(now)
            if decision["status"] == "published":
                meta["posted_at"] = _iso(now)
                changes.append("posted")
            else:
                changes.append("approved")
        if not changes and not decision["blocked"]:
            say("unchanged %s" % meta["id"])
            continue
        if changes and not dry_run:
            content.save(path, meta, body)
            if edit is not None:
                _log_edit(workspace, meta["id"], edit[0], edit[1], now)
        for change in changes:
            say("%s %s" % (change, meta["id"]))
        if decision["blocked"]:
            _refuse_approval(meta, decision["blocked"], remote, label_ids, client, dry_run, say)
    return lines


def _pull_idea(path, meta, body, board, dry_run, now, say, relink: bool = False) -> None:
    """Bring back the two things the author does to an idea card: delete it (the file is archived and never recreated) or drag it
    to another column (the file takes the status that column means). The move is read against trypost.synced_status: a file
    edited since the last sync is left for push to carry to the card, and when file and card both moved to different places
    the idea is a conflict and nothing is written. Archived files and statuses off the board are left alone, and a column
    that means no status, or any change to a card's text, flows back as nothing.

    With `relink` (after a TryPost wipe) a missing card is not a deletion: the file forgets the card (idea_id, synced_at,
    synced_hash and synced_status go to null), keeps its status, and the next push creates the card again in the column
    that status names."""
    state = meta.get("trypost")
    idea_id = state.get("idea_id") if isinstance(state, dict) else None
    if not idea_id or meta.get("status") not in sync_plan.STAGE_FOR:
        return
    card = board.card(idea_id)
    if card is None and relink:
        if not dry_run:
            state.update({"idea_id": None, "synced_at": None, "synced_hash": None, "synced_status": None})
            content.save(path, meta, body)
        say("relinked %s" % meta["id"])
        return
    if card is None:
        status, line = "archived", "archived %s" % meta["id"]
    else:
        column_status = board.column_status(card)
        verdict = sync_plan.decide_idea_stage(meta["status"], state.get("synced_status"), column_status)
        if verdict == "conflict":
            say(_idea_conflict(meta, state, column_status))
            return
        if verdict == "in-sync" and state.get("synced_status") != meta["status"] and not dry_run:
            state["synced_status"] = meta["status"]  # both sides ended up in the same place: record it as the baseline
            content.save(path, meta, body)
        if verdict != "pull":
            return
        status, line = column_status, "idea %s %s" % (meta["id"], column_status)
        if not dry_run:
            state["synced_status"] = status
    if not dry_run:
        meta["status"] = status
        meta["updated"] = _iso(now)
        content.save(path, meta, body)
    say(line)


def _pull_long_form(path, meta, body, board, remote_posts, dry_run, say, relink: bool = False) -> None:
    """A long-form piece brings nothing back (its card and its calendar draft are written from the file), so pull only notices
    what is gone. A missing card or calendar draft is reported; with `relink` (after a TryPost wipe) the file forgets it instead
    (the card's idea_id and its reminder note, the draft's post_id) and `relinked <id>` is printed, so the next push makes it
    again."""
    state = meta.get("trypost")
    if not isinstance(state, dict) or meta.get("status") == "archived":
        return  # push leaves an archived piece alone, so there is nothing to make again
    card_gone = bool(state.get("idea_id")) and board.card(state["idea_id"]) is None
    draft_gone = bool(state.get("post_id")) and state["post_id"] not in remote_posts
    if not (card_gone or draft_gone):
        return
    if not relink:
        say("missing in TryPost: %s" % meta["id"])
        return
    if not dry_run:
        if card_gone:
            state.update({"idea_id": None, "synced_at": None, "synced_hash": None, "reminder_note_id": None})
        if draft_gone:
            state.update({"post_id": None, "draft_hash": None, "synced_scheduled_date": None})
        content.save(path, meta, body)
    say("relinked %s" % meta["id"])


def _log_edit(workspace: Path, id: str, old: str, new: str, now: datetime) -> None:
    """Append what the author changed in TryPost to edits.md: a heading with the time and id, then the diff in a fence."""
    diff = "\n".join(difflib.unified_diff(old.splitlines(), new.splitlines(), fromfile="file", tofile="trypost", lineterm="", n=3))
    if not diff:
        return
    fence = "```"
    while fence in diff:
        fence += "`"
    log = workspace / "edits.md"
    fresh = not log.exists()
    with log.open("a", encoding="utf-8") as handle:
        if fresh:
            handle.write("# Edits made in TryPost\n\n")
        handle.write("## %s %s\n\n%sdiff\n%s\n%s\n\n" % (_iso(now), id, fence, diff, fence))


def _refuse_approval(meta, reasons, remote, label_ids, client, dry_run, say) -> None:
    """The author put the approved label on a piece the gate still blocks: say why, take the label off in TryPost and
    reset the labels through labels_for (which drops approved and adds blocked only when a High flag
    stands; a failing score alone leaves no blocked label), and leave the file's status as it is."""
    reason = "; ".join(reasons)
    say("blocked %s: %s" % (meta["id"], reason))
    if dry_run:
        return
    try:
        # The note first: if the label update then fails, the next pull sees the approved label again and retries.
        client.post("/api/posts/%s/notes" % remote["id"], json={"body": "Blocked: " + reason})
        client.put("/api/posts/%s" % remote["id"], json={"label_ids": label_ids.resolve(sync_plan.labels_for(meta))})
    except ApiError as error:
        say("failed %s: %s" % (meta["id"], error.message))


def sync(workspace: Path, client: TryPostClient, dry_run: bool, relink: bool = False, now: datetime | None = None) -> list[str]:
    return pull(workspace, client, dry_run, relink=relink, now=now) + push(workspace, client, dry_run, now=now)


def _client_from_env(env_path: Path) -> TryPostClient:
    env = load_env(env_path)
    missing = [k for k in ("TRYPOST_URL", "TRYPOST_API_KEY") if not env.get(k)]
    if missing:
        raise SystemExit("missing %s in %s" % (", ".join(missing), env_path))
    return TryPostClient(env["TRYPOST_URL"], env["TRYPOST_API_KEY"])


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("command", choices=["push", "pull", "sync"])
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--relink", action="store_true", help="pull: forget the post ids and idea card ids (long-form cards and calendar drafts too) that no longer exist in TryPost, so the next push creates them again (after a wipe)")
    parser.add_argument("--workspace", default="brands/me")
    parser.add_argument("--env", default="trypost/.env")
    args = parser.parse_args(argv)
    client = _client_from_env(Path(args.env))
    if args.command == "push":
        lines = push(Path(args.workspace), client, args.dry_run)
    elif args.command == "pull":
        lines = pull(Path(args.workspace), client, args.dry_run, relink=args.relink)
    else:
        lines = sync(Path(args.workspace), client, args.dry_run, relink=args.relink)
    for line in lines:
        print(line)
    return 1 if any(l.startswith("failed") or l.startswith("conflict") for l in lines) else 0


if __name__ == "__main__":
    sys.exit(main())
