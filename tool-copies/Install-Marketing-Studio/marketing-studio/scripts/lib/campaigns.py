"""Campaign files: brands/<brand>/campaigns/<slug>.md, frontmatter plus a free-text brief.

A campaign carries the mode its pieces default to, whether they must stay neutral
and, per surface, the hashtags every piece has to include. The required hashtags
live in one flat key per surface (required_hashtags_linkedin), never a nested dict,
because the frontmatter parser reads only scalars, inline lists and one-level dicts.
"""
from __future__ import annotations

from pathlib import Path

from scripts.lib import frontmatter


def _folder(workspace: Path) -> Path:
    return Path(workspace) / "campaigns"


def load(workspace: Path, slug: str) -> dict:
    """Return the campaign's frontmatter plus its brief under the key "brief"."""
    path = _folder(workspace) / ("%s.md" % slug)
    if not path.is_file():
        raise FileNotFoundError("unknown campaign: %s" % slug)
    meta, body = frontmatter.parse(path.read_text(encoding="utf-8"))
    return {**meta, "brief": body}


def required_hashtags(campaign: dict, surface: str) -> list[str]:
    """Return the hashtags the campaign requires on a surface, or an empty list."""
    return list(campaign.get("required_hashtags_%s" % surface) or [])


def is_neutral(campaign: dict | None) -> bool:
    """Say whether the campaign's pieces must never mention Nagarro, FLO or a talk."""
    return bool(campaign and campaign.get("neutral"))


def list_slugs(workspace: Path) -> list[str]:
    """Return the slugs of the workspace's campaigns, sorted."""
    folder = _folder(workspace)
    if not folder.is_dir():
        return []
    return sorted(path.stem for path in folder.glob("*.md"))
