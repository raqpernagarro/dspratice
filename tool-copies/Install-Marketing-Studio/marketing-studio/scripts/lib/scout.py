"""The topic scout: dated signals from RSS and Atom feeds and Hacker News, with provenance.

`sources.md` in the workspace lists the feeds, the Hacker News queries and the keywords
per pillar. `scout()` fetches every source, keeps what is recent, tags each signal with
the pillars its words touch, and reports the sources that failed by name.

Nothing here invents a link or a date: an item without a link is skipped, and an item
without a parseable date is dropped and counted. The only network use is a read-only GET
over HTTP or HTTPS with a timeout, through an injectable `fetch(url) -> bytes`.
"""
from __future__ import annotations

import html
import json
import re
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from functools import lru_cache
from pathlib import Path
from urllib.parse import quote

from scripts.lib.dates import LISBON

USER_AGENT = "Marketing-Studio scout"
TIMEOUT = 10
MAX_BYTES = 5000000
SUMMARY_LENGTH = 300
DEFAULT_MIN_POINTS = 50

HN_FRONT_PAGE = "https://hn.algolia.com/api/v1/search?tags=front_page"
HN_SEARCH = "https://hn.algolia.com/api/v1/search_by_date?query=%s&tags=story&numericFilters=points>=%d"
HN_ITEM = "https://news.ycombinator.com/item?id=%s"

NOT_A_FEED = "not an RSS or Atom feed"
NOT_HN = "not a Hacker News response"
UNDATED_NOTE = " undated items dropped"
HN_DATE_NOTE = "Hacker News dates are posting dates, not publication dates."

EM_DASH, EN_DASH = "\u2014", "\u2013"


# --- sources.md -------------------------------------------------------------------

def load_sources(path: Path) -> dict:
    """Parse `sources.md`: `## Feeds`, `## Hacker News` and `## Keywords`, each a bullet list.

    Lines outside a known section, and text that is not a bullet, are ignored so the file can
    carry notes. A feed line that is not `- name | https://url`, or a min_points that is not a whole number, raises ValueError.
    """
    feeds: list[dict] = []
    hacker_news = {"min_points": DEFAULT_MIN_POINTS, "queries": []}
    keywords: dict[int, list[str]] = {}
    section = ""
    for number, line in enumerate(Path(path).read_text(encoding="utf-8").splitlines(), start=1):
        stripped = line.strip()
        if stripped.startswith("#"):
            section = stripped.lstrip("#").strip().lower()
            continue
        if not stripped.startswith(("- ", "* ")):
            continue
        item = stripped[2:].strip()
        if section == "feeds":
            name, bar, url = (part.strip() for part in item.partition("|"))
            if not bar or not name or not _is_web(url):
                raise ValueError("%s line %d: a feed is `- name | https://url`, got %r" % (Path(path).name, number, item))
            feeds.append({"name": name, "url": url})
        elif section == "hacker news":
            key, _, value = (part.strip() for part in item.partition(":"))
            if key.lower() == "min_points":
                try:
                    hacker_news["min_points"] = int(value)
                except ValueError:
                    raise ValueError("%s line %d: min_points must be a whole number, got %r" % (Path(path).name, number, value))
            elif key.lower() == "queries":
                hacker_news["queries"] = [query.strip() for query in value.split(",") if query.strip()]
        elif section == "keywords":
            match = re.match(r"pillar\s+(\d+)\s*:\s*(.*)$", item, re.IGNORECASE)
            if match:
                keywords[int(match.group(1))] = [word.strip() for word in match.group(2).split(",") if word.strip()]
    return {"feeds": feeds, "hacker_news": hacker_news, "keywords": keywords}


# --- text and dates ---------------------------------------------------------------

_COMMENT = re.compile(r"<!--.*?-->", re.S)
_HIDDEN = re.compile(r"<(script|style)\b.*?</\1\s*>", re.S | re.I)
_BLOCK = re.compile(r"</?(?:p|div|br|li|ul|ol|h[1-6]|tr|td|blockquote|pre|section|article)\b[^>]*>", re.I)
_TAG = re.compile(r"</?[A-Za-z][^>]*>")


def _text(raw) -> str:
    """Tags stripped, entities decoded, whitespace collapsed."""
    if not raw:
        return ""
    text = _COMMENT.sub("", str(raw))
    text = _HIDDEN.sub(" ", text)
    text = _BLOCK.sub(" ", text)
    text = _TAG.sub("", text)
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def _plain(raw) -> str:
    """Entities decoded and whitespace collapsed, tags kept: a title may name an element, like <dialog>."""
    return re.sub(r"\s+", " ", html.unescape(str(raw or ""))).strip()


def _summary(raw) -> str:
    return _text(raw)[:SUMMARY_LENGTH].rstrip()


def _is_web(url) -> bool:
    return isinstance(url, str) and url.lower().startswith(("http://", "https://"))


def _aware(moment: datetime) -> datetime:
    return moment if moment.tzinfo else moment.replace(tzinfo=timezone.utc)


def _parse_iso(value: str):
    value = re.sub(r"[zZ]$", "+00:00", value)
    # Python 3.9 reads only 3 or 6 fractional digits, and an offset only with a colon.
    value = re.sub(r"\.(\d+)", lambda match: "." + (match.group(1) + "000000")[:6], value, count=1)
    value = re.sub(r"([+-]\d{2})(\d{2})$", r"\1:\2", value)
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def parse_date(text) -> str | None:
    """An RFC 2822 (RSS) or ISO 8601 (Atom, Algolia) date as ISO 8601 with an offset, else None.

    A date with no offset is read as UTC.
    """
    value = text.strip() if isinstance(text, str) else ""
    if not value:
        return None
    if re.match(r"\d{4}-\d{2}-\d{2}", value):
        moment = _parse_iso(value)
    else:
        try:
            moment = parsedate_to_datetime(value)
        except (TypeError, ValueError, IndexError, OverflowError):
            moment = None
    if moment is None:
        return None
    return _aware(moment).replace(microsecond=0).isoformat()


# --- parsing ----------------------------------------------------------------------

def _local(tag) -> str:
    return tag.rsplit("}", 1)[-1] if isinstance(tag, str) else ""


def _child(element, *names: str) -> str:
    for child in element:
        if _local(child.tag) in names:
            text = "".join(child.itertext())
            if text.strip():
                return text
    return ""


def _link(element) -> str:
    """The item page: an Atom `href` (the alternate link) or an RSS link text."""
    fallback = ""
    for child in element:
        if _local(child.tag) != "link":
            continue
        href = (child.get("href") or "").strip()
        if href:
            if child.get("rel", "alternate") == "alternate":
                return href
            fallback = fallback or href
        elif (child.text or "").strip():
            return child.text.strip()
    return fallback


def _date(element) -> str | None:
    for name in ("pubDate", "published", "updated", "date"):
        parsed = parse_date(_child(element, name))
        if parsed:
            return parsed
    return None


def parse_feed(text: str, source: str) -> list[dict]:
    """The items of an RSS 2.0 (or RSS 1.0) feed or the entries of an Atom feed.

    Raises ValueError when the text is not such a feed. An item with no title or no http(s)
    link is skipped; an item with no parseable date is kept with `published` None so the
    caller can count it.
    """
    if "<!ENTITY" in text:
        raise ValueError("%s: it declares entities" % NOT_A_FEED)
    try:
        root = ET.fromstring(text)
    except ET.ParseError:
        raise ValueError(NOT_A_FEED)
    if _local(root.tag) not in ("rss", "feed", "RDF"):
        raise ValueError(NOT_A_FEED)
    signals = []
    for element in root.iter():
        if _local(element.tag) not in ("item", "entry"):
            continue
        title = _plain(_child(element, "title"))
        url = _link(element)
        if not title or not _is_web(url):
            continue
        signals.append({
            "title": title,
            "url": url,
            "source": source,
            "published": _date(element),
            "summary": _summary(_child(element, "description", "summary", "content", "encoded")),
        })
    return signals


def parse_hn(data: dict, source: str = "Hacker News") -> list[dict]:
    """The stories of an Algolia `hits` response; a story with no link points to its HN page."""
    signals = []
    for hit in data.get("hits") or []:
        if not isinstance(hit, dict):
            continue
        title = _plain(hit.get("title") or hit.get("story_title"))
        url = hit.get("url")
        url = url.strip() if isinstance(url, str) else ""
        if not _is_web(url) and hit.get("objectID"):
            url = HN_ITEM % hit["objectID"]
        if not title or not _is_web(url):
            continue
        signals.append({
            "title": title,
            "url": url,
            "source": source,
            "published": parse_date(hit.get("created_at")),
            "summary": _summary(hit.get("story_text")),
            "points": hit.get("points"),
        })
    return signals


# --- pillars ----------------------------------------------------------------------

@lru_cache(maxsize=None)
def _word(keyword: str):
    parts = keyword.split()
    if not parts:
        return None
    return re.compile(r"\b%s\b" % r"\s+".join(re.escape(part) for part in parts), re.IGNORECASE)


def _matches(signal: dict, keywords: dict) -> dict:
    haystack = "%s %s" % (signal.get("title", ""), signal.get("summary", ""))
    found = {}
    for pillar in sorted(keywords):
        hits = []
        for keyword in keywords[pillar]:
            pattern = _word(keyword)
            if pattern is not None and pattern.search(haystack) and keyword not in hits:
                hits.append(keyword)
        if hits:
            found[pillar] = hits
    return found


def match_pillars(signal: dict, keywords: dict) -> list[int]:
    """The pillars whose keywords appear, whole word and ignoring case, in the title or summary."""
    return sorted(_matches(signal, keywords))


# --- fetching and scouting --------------------------------------------------------

def fetch_url(url: str) -> bytes:
    """GET `url` with a 10 second timeout; only http and https are ever contacted."""
    if not _is_web(url):
        raise ValueError("not an http or https URL")
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
        return response.read(MAX_BYTES)


def _decode(data: bytes) -> str:
    head = data[:200].decode("ascii", "ignore")
    declared = re.search(r"encoding\s*=\s*[\"']([\w.-]+)[\"']", head)
    for codec in ([declared.group(1)] if declared else []) + ["utf-8-sig"]:
        try:
            return data.decode(codec)
        except (LookupError, UnicodeDecodeError):
            continue
    return data.decode("utf-8", "replace")


def _reason(error: Exception) -> str:
    if isinstance(error, urllib.error.HTTPError):
        return "HTTP %d" % error.code
    if isinstance(error, urllib.error.URLError):
        return str(error.reason) or "unreachable"
    return str(error) or type(error).__name__


def _requests(sources: dict) -> list[tuple[str, str, str]]:
    """Every source as (name, url, kind), in the order they are fetched."""
    requests = [(feed["name"], feed["url"], "feed") for feed in sources.get("feeds", [])]
    hn = sources.get("hacker_news") or {"min_points": DEFAULT_MIN_POINTS, "queries": []}
    requests.append(("Hacker News front page", HN_FRONT_PAGE, "hn"))
    for query in hn.get("queries", []):
        requests.append(("Hacker News: %s" % query, HN_SEARCH % (quote(query), hn.get("min_points", DEFAULT_MIN_POINTS)), "hn"))
    return requests


def source_count(sources: dict) -> int:
    """How many sources `scout` fetches: every feed, the front page and one search per query."""
    return len(_requests(sources))


def failed_count(failures: list) -> int:
    """The failures that are sources which did not answer, not notes about dropped items."""
    return sum(1 for line in failures if not line.endswith(UNDATED_NOTE))


def _parse(kind: str, data: bytes, name: str) -> list[dict]:
    if kind == "feed":
        return parse_feed(_decode(data), name)
    try:
        payload = json.loads(data.decode("utf-8"))
    except ValueError:
        raise ValueError(NOT_HN)
    if not isinstance(payload, dict) or not isinstance(payload.get("hits"), list):
        raise ValueError(NOT_HN)
    return parse_hn(payload, name)


def scout(sources: dict, fetch=None, now: datetime | None = None, max_age_days: int = 7) -> tuple[list[dict], list[str]]:
    """Fetch every source and return (signals, failures).

    Signals are newest first, unique by URL, no older than `max_age_days` before `now`, dated,
    and carry `pillars` and the `matched` keywords. Hacker News stories under `min_points` are
    dropped as well. A failure is "<name>: <reason>", plus "<name>: <n> undated items dropped"
    when a source had undated items.

    A Hacker News date is when the story was posted, not when the page was written. So when a URL
    is in a feed and on Hacker News, the feed copy wins whatever the dates; among copies of the same
    kind the newest wins. This is settled before the age check, so an old article that was only
    resubmitted to Hacker News stays old.
    """
    fetch = fetch or fetch_url
    now = _aware(now or datetime.now(timezone.utc))
    hn = sources.get("hacker_news") or {}
    min_points = hn.get("min_points", DEFAULT_MIN_POINTS)
    collected: list[tuple[dict, str]] = []
    failures: list[str] = []
    for name, url, kind in _requests(sources):
        try:
            found = _parse(kind, fetch(url), name)
        except Exception as error:  # a source that fails is reported, never fatal
            failures.append("%s: %s" % (name, _reason(error)))
            continue
        dated = [signal for signal in found if signal["published"]]
        if len(dated) < len(found):
            failures.append("%s: %d%s" % (name, len(found) - len(dated), UNDATED_NOTE))
        if kind == "hn":
            dated = [signal for signal in dated if (signal.get("points") or 0) >= min_points]
        collected.extend((signal, kind) for signal in dated)
    collected.sort(key=lambda pair: datetime.fromisoformat(pair[0]["published"]), reverse=True)
    winner: dict[str, int] = {}
    for position, (signal, kind) in enumerate(collected):
        key = signal["url"].strip()
        if key not in winner or (kind == "feed" and collected[winner[key]][1] == "hn"):
            winner[key] = position
    cutoff = now - timedelta(days=max_age_days)
    keywords = sources.get("keywords", {})
    signals: list[dict] = []
    for position, (signal, _) in enumerate(collected):
        if winner[signal["url"].strip()] != position or datetime.fromisoformat(signal["published"]) < cutoff:
            continue
        found = _matches(signal, keywords)
        signals.append(dict(signal, pillars=sorted(found), matched=[word for pillar in sorted(found) for word in found[pillar]]))
    return signals, failures


# --- markdown ---------------------------------------------------------------------

def _clean(text) -> str:
    """No em or en dash survives: between digits a hyphen, elsewhere a comma."""
    text = re.sub(r"(?<=\d)\s*%s\s*(?=\d)" % EN_DASH, "-", str(text))
    text = re.sub(r"\s*[%s%s]\s*" % (EM_DASH, EN_DASH), ", ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return re.sub(r"^,\s*|,\s*$", "", text)


def _cell(text) -> str:
    return _clean(text).replace("|", "\\|")


def _link_target(url: str) -> str:
    for char, code in ((EM_DASH, "%E2%80%94"), (EN_DASH, "%E2%80%93"), ("(", "%28"), (")", "%29"), (" ", "%20")):
        url = url.replace(char, code)
    return url


def _day(moment: datetime) -> str:
    return _aware(moment).astimezone(LISBON).strftime("%d/%m/%Y")


def signals_filename(now: datetime) -> str:
    """`signals-YYYY-MM-DD.md`, the day being the Lisbon date of `now`."""
    return "signals-%s.md" % _aware(now).astimezone(LISBON).strftime("%Y-%m-%d")


def signals_markdown(signals: list[dict], failures: list[str], now: datetime) -> str:
    lines = [
        "# Signals, as of %s" % _day(now),
        "",
        HN_DATE_NOTE,
        "",
        "| Published | Source | Title | Pillars | Why it matters |",
        "|---|---|---|---|---|",
    ]
    for signal in signals:
        title = _cell(signal["title"]).replace("[", "\\[").replace("]", "\\]").replace("<", "\\<")
        lines.append("| %s | %s | [%s](%s) | %s | %s |" % (
            _day(datetime.fromisoformat(signal["published"])),
            _cell(signal["source"]),
            title,
            _link_target(signal["url"]),
            ", ".join(str(pillar) for pillar in signal.get("pillars", [])),
            _cell(", ".join(signal.get("matched", []))),
        ))
    lines += ["", "## Failed sources", ""]
    lines += ["- %s" % _clean(line) for line in failures] or ["None."]
    return "\n".join(lines) + "\n"
