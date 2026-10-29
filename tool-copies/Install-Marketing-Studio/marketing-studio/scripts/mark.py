#!/usr/bin/env python3
"""Mark a Content Object approved, draft or posted from the command line.

Usage:
    python3 scripts/mark.py <id> approved|draft|posted [--workspace brands/me]

A piece is refused approval, with exit 2 and `blocked <id>: <reasons>` on stderr, when
its recorded score fails the gate or its brand-review left a High flag; the file is not
changed. Marking a piece posted is never refused.

`draft` is for ideas only: an approved idea whose drafts have been written becomes `draft`,
which is In Progress on the TryPost Ideas board. Anything else (a post, or an idea that is
not approved) is refused with exit 2 and `blocked <id>: <reason>` on stderr.

The next `trypost_sync.py push` mirrors the change: a label on a post, a column on an idea.
"""
from __future__ import annotations

import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.lib import content  # noqa: E402

STATES = {"approved": "approved", "draft": "draft", "posted": "published"}


def mark(workspace: Path, id: str, state: str, now: datetime | None = None) -> str:
    if state not in STATES:
        raise SystemExit(2, "unknown state %r: use approved, draft or posted" % state)
    path = content.object_path(Path(workspace), id)
    if not path.exists():
        raise SystemExit(2, "no such piece: %s" % id)
    now = now or datetime.now(timezone.utc)
    stamp = now.astimezone(content.LISBON).replace(microsecond=0).isoformat()
    meta, body = content.load(path)
    if state == "approved":
        blockers = content.approval_blockers(meta)
        if blockers:
            raise SystemExit((2, "blocked %s: %s" % (id, "; ".join(blockers))))
    if state == "draft":
        if meta.get("type") != "idea":
            raise SystemExit((2, "blocked %s: only an idea is marked draft, and this is a %s" % (id, meta.get("type"))))
        if meta.get("status") != "approved":
            raise SystemExit((2, "blocked %s: only an approved idea is marked draft, and this one is %s" % (id, meta.get("status"))))
    meta["status"] = STATES[state]
    meta["updated"] = stamp
    if state == "posted":
        meta["posted_at"] = stamp
    content.save(path, meta, body)
    return meta["status"]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("id")
    parser.add_argument("state", choices=sorted(STATES))
    parser.add_argument("--workspace", default="brands/me")
    args = parser.parse_args(argv)
    try:
        status = mark(Path(args.workspace), args.id, args.state)
    except SystemExit as error:
        if isinstance(error.code, tuple):
            print(error.code[1], file=sys.stderr)
            return error.code[0]
        raise
    print("%s is now %s" % (args.id, status))
    return 0


if __name__ == "__main__":
    sys.exit(main())
