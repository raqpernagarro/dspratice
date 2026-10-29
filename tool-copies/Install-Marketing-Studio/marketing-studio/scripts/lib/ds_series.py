"""Parse the Design Systems series plan (series-plan.md) into SeriesPost records."""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import PurePosixPath

HEADER_RE = re.compile(r"^## (\d{2}) · (.+?) · (.+)$", re.M)
MENTION_RE = re.compile(r"@([A-Z][^\W\d_]+(?: [A-Z][^\W\d_]+)*)")
URL_RE = re.compile(r"https?://[^\s\])>]+")
FORMATS = [("Text only", "text"), ("Image", "image"), ("Carousel", "carousel-pdf"), ("Video", "video"), ("Poll", "poll")]


@dataclass
class SeriesPost:
    number: int
    slug: str
    format: str
    visual: str | None
    body: str
    first_comment: str
    document_title: str | None
    poll_options: list[str] = field(default_factory=list)
    tags_people: list[str] = field(default_factory=list)
    sources: list[str] = field(default_factory=list)


def _format_of(label: str) -> str:
    for prefix, value in FORMATS:
        if label.startswith(prefix):
            return value
    raise ValueError("unknown post format in header: %r" % label)


def _field(block: str, name: str) -> str | None:
    m = re.search(r"^\*\*%s[^*]*:\*\*(.*)$" % re.escape(name), block, re.M)
    return m.group(1).strip() if m else None


def _first_comment(block: str) -> str:
    lines = block.split("\n")
    for i, line in enumerate(lines):
        if line.startswith("**First comment:**"):
            parts = [line.split("**First comment:**", 1)[1].strip()]
            for following in lines[i + 1:]:
                if not following.strip() or following.startswith("---"):
                    break
                parts.append(following.strip())
            return "\n".join(p for p in parts if p)
    return ""


def _poll_options(block: str) -> list[str]:
    lines = block.split("\n")
    for i, line in enumerate(lines):
        if line.startswith("**Poll options**"):
            options = []
            for following in lines[i + 1:]:
                m = re.match(r"^\d+\.\s+(.+)$", following.strip())
                if not m:
                    break
                options.append(m.group(1).strip())
            return options
    return []


def _body(block: str) -> str:
    quoted = []
    for line in block.split("\n"):
        if line.startswith("> "):
            quoted.append(line[2:])
        elif line.startswith(">"):
            quoted.append(line[1:])
    return "\n".join(quoted).rstrip()


def _unique(items: list[str]) -> list[str]:
    seen: list[str] = []
    for item in items:
        if item not in seen:
            seen.append(item)
    return seen


def parse_series_plan(text: str) -> list[SeriesPost]:
    matches = list(HEADER_RE.finditer(text))
    posts = []
    for i, m in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        block = text[m.end():end].split("\n---", 1)[0]
        number, label = int(m.group(1)), m.group(3).strip()
        visual_raw = _field(block, "Visual") or "none"
        visual = visual_raw.split("`")[1] if "`" in visual_raw else None
        body = _body(block)
        if visual:
            slug = PurePosixPath(visual).parent.name
        else:
            words = re.findall(r"[a-z0-9]+", body.lower())[:3]
            slug = "%02d-%s" % (number, "-".join(words))
        first_comment = _first_comment(block)
        posts.append(SeriesPost(
            number=number,
            slug=slug,
            format=_format_of(label),
            visual=visual,
            body=body,
            first_comment=first_comment,
            document_title=_field(block, "Document title"),
            poll_options=_poll_options(block),
            tags_people=_unique(MENTION_RE.findall(body)),
            sources=_unique([u.rstrip(".,;:") for u in URL_RE.findall(first_comment)]),
        ))
    return posts
