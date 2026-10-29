"""Parse the FLO article files (linkedin.md, substack.md) and the toolkit post (LINKEDIN-POST.md)."""
from __future__ import annotations

import re
from dataclasses import dataclass

HEADER_RE = re.compile(r"^\*\*(.+?):\*\*\s*(.*)$", re.M)
SECTION_MARKERS = ("\n## Promo post", "\n## Substack Note", "\n```yaml")


@dataclass
class Article:
    kind: str
    title: str
    subtitle: str | None
    seo_title: str
    seo_description: str
    cover: str | None
    body: str
    promo_post: str | None
    substack_note: str | None


def _normalise_cover(value: str | None) -> str | None:
    if not value:
        return None
    value = value.strip().strip("`").strip()
    if "/" not in value:
        value = "images/" + value
    if not re.search(r"\.(png|jpg|jpeg|webp)$", value, re.I):
        value += ".png"
    return value


def _section(rest: str, heading: str) -> str | None:
    """Text of a '## heading' section up to the next '---' rule or yaml block, or None."""
    m = re.search(r"^## %s\s*$" % re.escape(heading), rest, re.M)
    if not m:
        return None
    tail = rest[m.end():]
    cut = len(tail)
    for marker in ("\n---", "\n```yaml"):
        idx = tail.find(marker)
        if idx != -1:
            cut = min(cut, idx)
    return tail[:cut].strip() or None


def parse_article(text: str, kind: str) -> Article:
    head, rest = text.split("\n---\n", 1)
    fields = {label.strip().lower(): value.strip() for label, value in HEADER_RE.findall(head)}
    cover = next((v for k, v in fields.items() if "cover" in k or "preview" in k), None)
    cut = len(rest)
    for marker in SECTION_MARKERS:
        idx = rest.find(marker)
        if idx != -1:
            cut = min(cut, idx)
    body = re.sub(r"\n---\s*$", "", rest[:cut]).strip("\n") + "\n"
    return Article(
        kind=kind,
        title=fields.get("title", ""),
        subtitle=fields.get("subtitle"),
        seo_title=fields.get("seo title", ""),
        seo_description=fields.get("seo description", ""),
        cover=_normalise_cover(cover),
        body=body,
        promo_post=_section(rest, "Promo post"),
        substack_note=_section(rest, "Substack Note"),
    )


def parse_toolkit_post(text: str) -> tuple[str, str, str]:
    """(document_title, body, first_comment) of the toolkit carousel post file."""
    title_m = re.search(r"^Document title[^:]*:\s*(.+)$", text, re.M)
    document_title = title_m.group(1).strip() if title_m else ""
    parts = text.split("\n---\n")
    body = parts[1].strip() + "\n" if len(parts) > 1 else ""
    first_m = re.search(r"^\*\*First comment:\*\*\s*(.*)$", text, re.M)
    first_comment = first_m.group(1).strip() if first_m else ""
    return document_title, body, first_comment
