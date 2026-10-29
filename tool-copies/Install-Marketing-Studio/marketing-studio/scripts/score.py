#!/usr/bin/env python3
"""Record the score of a Content Object: a post is reviewed and gated, an idea is only ranked.

Usage:
    python3 scripts/score.py <post id> --hook N --voice N --value N --fit N --ready N [--workspace brands/me]
    python3 scripts/score.py <idea id> --relevance N --timeliness N --proof N --fit N --difference N [--workspace brands/me]

A post is scored on five dimensions, each a whole number from 1 to 10. A score that passes
the gate moves a draft to in-review; a score that fails moves an in-review object back to
draft. Any other status is left alone. Prints "score <id> <total>/50 pass|fail" and, when
the status changed, "status <id> <new>".

An idea is scored on five dimensions, each a whole number from 0 to 5. The score ranks the
idea for the planner and never changes its status. Prints "score <id> <total>/25 pass|fail",
pass when the total reaches IDEA_SCORE_PASS (15, in scripts/lib/content.py).

The flags must match the object: the post flags on an idea, or the idea flags on a post,
are an error.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.lib import content  # noqa: E402


def _load_valid(workspace: Path, id: str) -> tuple[Path, dict, str]:
    """Load the object and refuse one whose frontmatter is invalid."""
    path = content.object_path(Path(workspace), id)
    if not path.is_file():
        raise FileNotFoundError("no such object: %s" % id)
    meta, body = content.load(path)
    problems = content.validate(meta)
    if problems:
        raise ValueError("; ".join(problems))
    return path, meta, body


def apply(workspace: Path, id: str, now: str, **dims: int) -> tuple[dict, str | None]:
    """Score the post, apply the gate and save; return the score and the new status, or None when it stays."""
    path, meta, body = _load_valid(workspace, id)
    if meta.get("type") == "idea":
        raise ValueError("%s is an idea; score it with %s" % (id, ", ".join("--" + key for key in content.IDEA_SCORE_KEYS)))
    score = content.set_score(meta, now, **dims)
    passes = content.score_passes(score)
    new_status = None
    if passes and meta["status"] == "draft":
        new_status = "in-review"
    elif not passes and meta["status"] == "in-review":
        new_status = "draft"
    if new_status:
        meta["status"] = new_status
    content.save(path, meta, body)
    return score, new_status


def apply_idea(workspace: Path, id: str, now: str, **dims: int) -> dict:
    """Score the idea and save; its status is never touched. Return the score."""
    path, meta, body = _load_valid(workspace, id)
    if meta.get("type") != "idea":
        raise ValueError("%s is a post; score it with %s" % (id, ", ".join("--" + key for key in content.SCORE_KEYS)))
    score = content.set_idea_score(meta, now, **dims)
    content.save(path, meta, body)
    return score


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("id")
    flags = content.SCORE_KEYS + tuple(key for key in content.IDEA_SCORE_KEYS if key not in content.SCORE_KEYS)
    for key in flags:
        parser.add_argument("--" + key, type=int, default=None, help="%s, from 1 to 10 for a post or 0 to 5 for an idea" % key)
    parser.add_argument("--workspace", default="brands/me")
    args = parser.parse_args(argv)
    try:
        # The flags depend on what the object is, so read it before checking them.
        kind = _load_valid(Path(args.workspace), args.id)[1].get("type")
    except (FileNotFoundError, ValueError) as error:
        print("%s: %s" % (args.id, error))
        return 2
    wanted = content.IDEA_SCORE_KEYS if kind == "idea" else content.SCORE_KEYS
    missing = [key for key in wanted if getattr(args, key) is None]
    foreign = [key for key in flags if key not in wanted and getattr(args, key) is not None]
    if missing:
        parser.error("the following arguments are required for %s %s: %s" % ("an idea" if kind == "idea" else "a post", args.id, ", ".join("--" + key for key in missing)))
    if foreign:
        parser.error("%s is %s and does not take %s" % (args.id, "an idea" if kind == "idea" else "a post", ", ".join("--" + key for key in foreign)))
    dims = {key: getattr(args, key) for key in wanted}
    try:
        if kind == "idea":
            score = apply_idea(Path(args.workspace), args.id, content.now_iso(), **dims)
            verdict = "pass" if score["total"] >= content.IDEA_SCORE_PASS else "fail"
            print("score %s %d/%d %s" % (args.id, score["total"], 5 * len(content.IDEA_SCORE_KEYS), verdict))
            return 0
        score, new_status = apply(Path(args.workspace), args.id, content.now_iso(), **dims)
    except (FileNotFoundError, ValueError) as error:
        print("%s: %s" % (args.id, error))
        return 2
    print("score %s %d/%d %s" % (args.id, score["total"], 10 * len(content.SCORE_KEYS), "pass" if content.score_passes(score) else "fail"))
    if new_status:
        print("status %s %s" % (args.id, new_status))
    return 0


if __name__ == "__main__":
    sys.exit(main())
