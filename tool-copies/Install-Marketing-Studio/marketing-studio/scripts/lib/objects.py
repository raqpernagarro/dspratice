"""Steps shared by the new_idea and new_post CLIs: read a body and write an object safely."""
from __future__ import annotations

import sys
from pathlib import Path
from typing import Callable

from scripts.lib import content


def read_body(body_file: str | None) -> str:
    """Read the body from a file, or from stdin when no file is given."""
    if body_file:
        try:
            return Path(body_file).read_text(encoding="utf-8")
        except OSError as error:
            raise ValueError("cannot read the body file: %s" % error) from error
    if sys.stdin.isatty():
        raise ValueError("no body: pass --body-file or pipe the body on stdin")
    return sys.stdin.read()


# The status a passing score puts a post in; a new body takes it out of it.
GATED_STATUSES = ("in-review",)
# Statuses TryPost holds with a label the author gave (approved, posted): a new body keeps them and the score,
# because taking the status away locally would leave TryPost's label unpulled and block the sync.
HELD_STATUSES = ("approved", "scheduled", "published")
REVIEW_KEYS = ("review", "review_flags")


def leave_gate(previous: dict, meta: dict) -> dict:
    """An in-review post goes back to draft on a new body, and a post that carried a score loses it.

    The score was given to the old body, so it no longer stands, and a piece in review, scored or
    not (an imported Instagram child waiting for its caption is in review with no score), must be
    read again before it is offered for approval. A scored draft loses its score and stays a draft.
    An approved, scheduled or published post keeps its status and its score, also when `--force`
    rebuilds it, because TryPost holds its label: The author is told her approval was given to the old
    text. The callers decide what a new body is: `set_body.py` only when the body changed,
    `new_post.py --force` on every rebuild. `previous` is the object before the change and may be
    `meta`.
    """
    if previous.get("type") != "post":
        return meta
    score = previous.get("score")
    if meta.get("status") in HELD_STATUSES:
        if score is not None:
            meta["score"] = score
        return meta
    if score is not None:
        meta["score"] = None
    if meta.get("status") in GATED_STATUSES:
        meta["status"] = "draft"
    return meta


def write_new(workspace: Path, id: str, meta: dict, body: str, force: bool, now: str) -> Path:
    """Validate and write a new object; an existing file needs `force`, and then keeps what the system knows.

    With `force`, the TryPost link, status, posted date, creation date and brand-review flags carry over,
    and `leave_gate` decides the rest: an in-review post back to draft, a score dropped, or both kept
    on an approved one. An empty body is a problem like any other, so it never reaches the disk, `force` or not.
    """
    path = content.object_path(workspace, id)
    if path.exists():
        if not force:
            raise FileExistsError(id)
        existing, _ = content.load(path)
        meta = content.carry_over(existing, meta)
        meta.update({key: existing[key] for key in REVIEW_KEYS if key in existing})
        meta = leave_gate(existing, meta)
    problems = content.validate(meta, workspace)
    if not body.strip():
        problems.append("empty body")
    if problems:
        raise ValueError("; ".join(problems))
    content.save(path, meta, body)
    return path


def attempt(workspace: Path, id: str, create: Callable[[], Path]) -> tuple[int, str]:
    """Run `create` and return the exit code and the one line the CLI prints."""
    existed = content.object_path(workspace, id).exists()
    try:
        create()
    except FileExistsError:
        return 2, "exists %s (use --force)" % id
    except ValueError as error:
        return 2, "%s: %s" % (id, error)
    return 0, "%s %s" % ("updated" if existed else "created", id)
