#!/usr/bin/env python3
"""Replace the body of a Content Object and leave everything else as it was.

Usage:
    python3 scripts/set_body.py <id> [--body-file PATH] [--remove-label NAME]...
        [--add-label NAME]... [--workspace brands/me]

The new body comes from --body-file, or from stdin when that is not given, and an
empty body is refused. The frontmatter is kept as it is, including the TryPost link,
the brand-review flags and the dates, except for `updated`, the extra labels in
`labels_extra` when asked, and the gate, when the body changes: an in-review post
goes back to draft, with or without a score, and loses any score, because the score
was given to the old body; a scored draft loses its score; an approved, scheduled
or published post keeps its status and its score. The same body moves nothing. Prints
"updated <id>"; exits 2 when the piece is missing, the body is empty or the result
is invalid, and then writes nothing.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.lib import content, objects  # noqa: E402


def replace(
    workspace: Path,
    id: str,
    body: str,
    now: str | None = None,
    remove_labels: list[str] = (),
    add_labels: list[str] = (),
) -> Path:
    """Swap the body, edit `labels_extra`, set `updated`, validate and save; nothing is written on a problem.

    A changed body sends an in-review post back to draft and drops a score (`objects.leave_gate`).
    """
    path = content.object_path(Path(workspace), id)
    if not path.is_file():
        raise FileNotFoundError("no such object: %s" % id)
    meta, old_body = content.load(path)
    if content.body_hash(body) != content.body_hash(old_body):
        objects.leave_gate(meta, meta)
    meta["updated"] = now or content.now_iso()
    if remove_labels or add_labels:
        labels = meta.get("labels_extra") or []
        if not isinstance(labels, list):
            raise ValueError("labels_extra: %r is not a list" % (labels,))
        labels = [label for label in labels if label not in remove_labels]
        for label in add_labels:
            if label not in labels:
                labels.append(label)
        meta["labels_extra"] = labels
    problems = content.validate(meta)
    if not body.strip():
        problems.append("empty body")
    if problems:
        raise ValueError("; ".join(problems))
    content.save(path, meta, body)
    return path


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("id")
    parser.add_argument("--body-file", help="read the new body from this file instead of stdin")
    parser.add_argument("--remove-label", action="append", default=[], metavar="NAME", help="drop an extra label; repeat for more")
    parser.add_argument("--add-label", action="append", default=[], metavar="NAME", help="add an extra label; repeat for more")
    parser.add_argument("--workspace", default="brands/me")
    args = parser.parse_args(argv)
    try:
        replace(
            Path(args.workspace), args.id, objects.read_body(args.body_file),
            remove_labels=args.remove_label, add_labels=args.add_label,
        )
    except (FileNotFoundError, ValueError) as error:
        print("%s: %s" % (args.id, error))
        return 2
    print("updated %s" % args.id)
    return 0


if __name__ == "__main__":
    sys.exit(main())
