"""Deterministic text rules for the author's drafts.

All standard library. Each function takes text and returns a list of
human-readable problem strings; an empty list means the check passed. The rules
come from brands/me/content-rules.md and brands/me/voice.md, with the filler
words, hedges and vague claims of the earlier Marketeer harness folded in. The
schema check lives in scripts/lib/content.py and the locale is British English.
"""
from __future__ import annotations

import bisect
import re
from typing import Iterable

from scripts.lib import campaigns

# ---- Dashes -----------------------------------------------------------------

DASH_RE = re.compile(r"(?P<em>\u2014)|(?P<en>\u2013)")


def find_dashes(text: str) -> list[str]:
    """Flag every em dash and en dash, with its line number."""
    hits: list[str] = []
    for number, line in enumerate(text.split("\n"), start=1):
        for match in DASH_RE.finditer(line):
            hits.append(f"{match.lastgroup} dash on line {number}")
    return hits


# ---- Banned words and patterns ---------------------------------------------

BANNED_WORDS = [
    # Hype words (content-rules.md)
    "game-changer", "game-changing", "unlock", "elevate", "delve", "leverage",
    "landscape", "crucial", "pivotal", "testament", "showcase", "quietly",
    "vibrant", "robust", "seamless", "thrilled", "humbled", "excited to announce",
    # "I never say" (voice.md)
    "honoured", "happy to share", "synergies", "synergy", "best-in-class", "10x",
    "AI will replace", "the future is here", "screens",
    # Filler words carried over from Marketeer
    "comprehensive", "holistic", "navigate", "vital", "furthermore", "moreover",
    "foster", "facilitate", "cutting-edge", "utilize", "underscore", "tapestry",
    "realm", "embark", "unleash", "world-class",
]

_HEDGES = [
    "it's important to note", "it is important to note", "it's worth mentioning",
    "it is worth mentioning", "needless to say", "it goes without saying",
    "in today's fast-paced world", "when it comes to",
]
_VAGUE_CLAIMS = ["many companies", "studies show", "leading brands", "experts agree", "a lot of"]


_STRAIGHT_QUOTES = str.maketrans({"\u2018": "'", "\u2019": "'", "\u201c": '"', "\u201d": '"'})


def _straighten(text: str) -> str:
    """Turn curly quotes into straight ones, so pasted or autocorrected text still matches."""
    return text.translate(_STRAIGHT_QUOTES)


def _phrase(phrase: str) -> str:
    return r"\b" + re.escape(phrase) + r"\b"


_URL_RE = re.compile(r"https?://\S+")
# A quoted span opens after a non-word character onto a non-space and closes on a non-space before a non-word
# character, on one line, within 80 characters: so an inch mark (5" phone ... 6" tablet) never pairs into a span.
_QUOTED_RE = re.compile(r'(?<![\w"])"(?=[^\s"])[^"\n]{1,80}(?<=\S)"(?!\w)')


def _blank(text: str, *patterns: re.Pattern) -> str:
    """The text with every match of the patterns turned into spaces of the same length, so what is left keeps its place."""
    for pattern in patterns:
        text = pattern.sub(lambda match: " " * len(match.group()), text)
    return text


def _closer(word: str) -> str:
    """Match a closing line that is exactly the word, with nothing after it."""
    return r"^[ \t]*(?-i:" + re.escape(word) + r")[ \t]*$(?![\s\S]*\S)"


BANNED_PATTERNS = [
    ("it's not X, it's Y",
     r"\b(?:it's not|it is not|it isn't|this is not|this isn't|that's not|that is not|that isn't)"
     r"\s+(?:just\s+|only\s+|about\s+)?[^.,;\n]{1,60},\s*(?:it's|it is|that's|that is|this is)\b"),
    ("here's the thing", _phrase("here's the thing")),
    ("let's dive in", _phrase("let's dive in")),
    *[(f"hedge '{h}'", _phrase(h)) for h in _HEDGES],
    *[(f"vague claim '{c}'", _phrase(c)) for c in _VAGUE_CLAIMS],
    ("closer 'Thoughts?'", _closer("Thoughts?")),
    ("closer 'Agree?'", _closer("Agree?")),
]


def find_banned_words(text: str) -> list[str]:
    """Flag each banned word or phrase found as a whole word, in any case.

    A URL is skipped, and so is a span inside double quotes (straight or curly) on one line, of at most 80 characters,
    opening after a space or punctuation (an inch mark never opens one): a proper name such as
    "LinkedIn Leverage Toolkit" in a Sources line is a name, not the author's word choice, even when the toolkit is his own.
    brand-review still reads it.
    """
    low = _blank(_straighten(text), _URL_RE, _QUOTED_RE).lower()
    return [f"banned word: '{w}'" for w in BANNED_WORDS if re.search(_phrase(w.lower()), low)]


def find_banned_patterns(text: str) -> list[str]:
    """Flag each banned rhetorical pattern, hedge, vague claim or closer once.

    Curly quotes are straightened first. A trailing hashtag block is set aside, so
    a closer such as 'Thoughts?' still counts as the last line when hashtags follow it.
    """
    body = _split_hashtag_block(_straighten(text))[0]
    flags = re.IGNORECASE | re.MULTILINE
    return [f"pattern: {label}" for label, regex in BANNED_PATTERNS if re.search(regex, body, flags)]


_GIVEAWAY_RE = re.compile(
    r"\bcomment\b[^\n]{0,60}?"
    r"(?:(?-i:\b[A-Z]{3,}\b)|(['\"])\w+\1|and I'll|and I will|to get|to receive|send you|dm you)",
    re.IGNORECASE,
)


def find_giveaways(text: str) -> list[str]:
    """Flag a giveaway gated behind a comment ("Comment GUIDE and I'll send it")."""
    return ["comment-gated giveaway"] if _GIVEAWAY_RE.search(_straighten(text)) else []


# ---- Links ------------------------------------------------------------------

_LINK_RE = re.compile(
    r"https?://\S+"
    r"|www\.\S+"
    r"|\b[\w-]+\.(?:com|org|net|io|ai|pt|dev|app|co\.uk)(?:/\S*)?\b"
)


def find_links(text: str) -> list[str]:
    """Flag every link in the body, with trailing punctuation stripped."""
    return [f"link in body: {m.group().rstrip('.,;:!?)')}" for m in _LINK_RE.finditer(text)]


# ---- Hashtags ---------------------------------------------------------------

# Viva Engage has no cap: its pieces need no hashtags, and the placement rule (tags at the end) still holds.
HASHTAG_CAPS = {"linkedin": 3, "instagram": 5, "x": 1}

_HASHTAG_RE = re.compile(r"#[A-Za-z]\w*")
_HASHTAG_LINE_RE = re.compile(r"^\s*(?:#[A-Za-z]\w*\s*)+$")


def _split_hashtag_block(text: str) -> tuple[str, str]:
    """Split a text into the body and its trailing block of hashtag-only lines."""
    lines = [line for line in text.split("\n") if line.strip()]
    start = len(lines)
    while start > 0 and _HASHTAG_LINE_RE.match(lines[start - 1]):
        start -= 1
    return "\n".join(lines[:start]), "\n".join(lines[start:])


def check_hashtags(surface: str, text: str, required: Iterable[str] = ()) -> list[str]:
    """Check hashtags sit at the end, stay under the network cap and include the required ones."""
    body, block = _split_hashtag_block(text)
    block_tags = _HASHTAG_RE.findall(block)
    present = {tag.lower() for tag in block_tags}
    problems = [f"hashtag inside the text: {tag}" for tag in _HASHTAG_RE.findall(body)]

    count = len(block_tags)
    if surface == "linkedin":
        count -= sum(1 for tag in required if tag.lower() in present)
    cap = HASHTAG_CAPS.get(surface)
    if cap is not None and count > cap:
        problems.append(f"{count} hashtags on {surface}, the cap is {cap}")

    problems += [f"missing required hashtag {tag}" for tag in required if tag.lower() not in present]
    return problems


# ---- British spelling -------------------------------------------------------

# Each American family is a stem and the endings it takes, with the British base it becomes,
# so every inflection is caught ("organizing", "realized", "behavioral"), not only the bare word.
# Words both spellings share are left out on purpose: program, license, while, learned and
# judgment are correct en-GB too, and "fulfilled", "enrolled", "labels" and "models" are British.
_IZE_STEMS = ("optimiz", "organiz", "analyz", "realiz", "recogniz", "prioritiz", "customiz",
              "standardiz", "visualiz", "maximiz", "minimiz", "summariz", "personaliz")


def _family(stem: str, british: str, endings: str = r"\w*") -> tuple[re.Pattern, str]:
    return re.compile(r"\b" + stem + r"(?P<rest>" + endings + r")\b", re.IGNORECASE), british


US_TO_GB = [
    *[_family(stem, stem[:-1] + "s") for stem in _IZE_STEMS],
    _family("behavior", "behaviour"),
    _family("color(?!ado)", "colour"),
    _family("favor", "favour"),
    _family("center", "centre"),
    _family("defense", "defence"),
    _family("catalog(?!ue)", "catalogue"),
    _family("gray", "grey"),
    _family("label", "labell", "ed|ing|er|ers"),
    _family("model", "modell", "ed|ing|er|ers"),
    _family("cancel", "cancell", "ed|ing"),
    _family("travel", "travell", "ed|ing|er|ers"),
    _family("fulfill", "fulfil", "s|ment|ments|"),
    _family("enroll", "enrol", "s|ment|ments|"),
    _family("skillful", "skilful", "ly|ness|"),
]


def _british(base: str, rest: str) -> str:
    """Join the British base and the word's ending: centre + ed is "centred", catalogue + ing is "cataloguing"."""
    if base.endswith("e") and rest[:1] in ("e", "i"):
        base = base[:-1]
    return base + rest


def find_american_spellings(text: str) -> list[str]:
    """Flag each American spelling once, in order of appearance, with its British form; the locale is British English.
    A URL is skipped: its address is spelt the way its site spells it."""
    text = _blank(text, _URL_RE)
    found = sorted(((match.start(), match.group().lower(), _british(british, match.group("rest").lower()))
                    for regex, british in US_TO_GB for match in regex.finditer(text)))
    seen: set[str] = set()
    problems = []
    for _, us, gb in found:
        if us not in seen:
            seen.add(us)
            problems.append(f"spelling: '{us}' -> use '{gb}'")
    return problems


# ---- Placeholders -----------------------------------------------------------

_PLACEHOLDER_RE = re.compile(r"\[[^\]\n]{1,60}\]")

# Substack's editor turns these into buttons and pull quotes, so they are not leftovers.
SUBSTACK_MARKERS = ("[SUBSCRIBE BUTTON]", "[SHARE BUTTON]", "[PULL QUOTE]")


def find_placeholders(text: str, allowed: Iterable[str] = ()) -> list[str]:
    """Flag bracketed placeholders such as [article link] left in the copy.

    Markdown links and images ([text](url), ![alt](path)), footnote references and
    definitions ([^1]) and the markers listed in `allowed` are not placeholders.
    """
    allowed = tuple(allowed)
    hits: list[str] = []
    for match in _PLACEHOLDER_RE.finditer(text):
        found = match.group()
        if found in allowed or found.startswith("[^") or text.startswith("(", match.end()):
            continue
        hits.append(f"placeholder: {found}")
    return hits


# ---- Per-surface character limits ------------------------------------------

SURFACE_CHAR_LIMITS = {"linkedin": 3000, "instagram": 2200, "x": 280, "viva": 3000}
THREAD_POSTS = (4, 8)


def split_thread(body: str) -> list[str]:
    """Split a thread on lines that are exactly '---', dropping empty parts."""
    parts = (part.strip() for part in re.split(r"^---$", body, flags=re.MULTILINE))
    return [part for part in parts if part]


def _check_thread(body: str, limit: int) -> list[str]:
    posts = split_thread(body)
    problems = [f"thread post {i} is {len(post)} characters, the limit is {limit}"
                for i, post in enumerate(posts, start=1) if len(post) > limit]
    low, high = THREAD_POSTS
    if not low <= len(posts) <= high:
        problems.append(f"thread has {len(posts)} posts, threads run {low} to {high}")
    return problems


def check_char_limit(surface: str, fmt: str, body: str) -> list[str]:
    """Check the copy against the character limit of its surface and format."""
    limit = SURFACE_CHAR_LIMITS.get(surface)
    if limit is None or (surface == "linkedin" and fmt == "article"):
        return []
    if surface == "x" and fmt == "thread":
        return _check_thread(body, limit)
    length = len(body.strip())
    return [f"{surface} copy is {length} characters, the limit is {limit}"] if length > limit else []


# ---- Compliance prefilter (from brand-review) ------------------------------
# Deterministic prefilter for risky claim language. A hit is a check.py problem, so the
# list holds only phrases that make a claim wherever they stand. Each matches as whole
# words: "#10" is not "#1". Phrases that read harmlessly as often as not ("the only",
# "better than", "instantly") are left to brand-review, which judges them in context
# (see design doc): not legal sign-off.
CLAIM_FLAGS = [
    "risk-free", "no risk", "100%", "#1",
    "best in the world", "always wins", "never fails",
    "proven to", "double your", "triple your",
]
DISPARAGEMENT = ["unlike our competitors", "competitors can't", "beats every"]
# "guarantee", "guarantees" and "guaranteed" make a claim, except in a negation: "I guarantee
# nothing", "it guarantees nothing", "there is no guarantee". The message names the word as written.
_GUARANTEE_RE = re.compile(r"(?<!\w)(?<!\bno )guarantee[sd]?(?!\w)(?![ \t]+nothing\b)", re.IGNORECASE)


def _whole_words(phrase: str) -> re.Pattern:
    """Match the phrase with no letter, digit or underscore touching either end, in any case."""
    return re.compile(r"(?<!\w)" + re.escape(phrase) + r"(?!\w)", re.IGNORECASE)


_CLAIM_RES = [(phrase, _whole_words(phrase)) for phrase in CLAIM_FLAGS]
_DISPARAGEMENT_RES = [(phrase, _whole_words(phrase)) for phrase in DISPARAGEMENT]


def find_claim_flags(text: str) -> list[str]:
    """Flag each absolute or comparative claim phrase found as whole words, curly quotes straightened first."""
    text = _straighten(text)
    guarantees = dict.fromkeys(match.group().lower() for match in _GUARANTEE_RE.finditer(text))
    return ([f"unsubstantiated/absolute claim: '{word}'" for word in guarantees]
            + [f"unsubstantiated/absolute claim: '{phrase}'" for phrase, regex in _CLAIM_RES if regex.search(text)]
            + [f"comparative/disparaging claim: '{phrase}'" for phrase, regex in _DISPARAGEMENT_RES if regex.search(text)])


# ---- Numbers need a source --------------------------------------------------
# Every figure carries its source in its sentence, in a footnote or in the piece's
# `sources` field (content-rules.md). An idea writes one fact per line, ending with
# "Source: <where>", so a `Source:` anywhere on the figure's line counts for every
# figure on that line. Plain integers, years, times and sizes such
# as 1080x1350 are not figures; percentages, currency amounts, millions, billions,
# thousands and numbers with thousands separators are.

_FIGURE_RE = re.compile(
    r"[$\u20ac\u00a3]\s?\d(?:[\d,.]*\d)?(?:\s?(?:k|m|bn|million|billion)\b)?"
    r"|\d(?:[\d,.]*\d)?\s?%"
    r"|\b\d(?:[\d,.]*\d)?\s?(?:million|billion|thousand)\b"
    r"|\b\d{1,3}(?:,\d{3})+\b",
    re.IGNORECASE,
)
# A full stop after one of these does not end a sentence ("et al.", "Dr.", "p. 12"), whatever the case.
_ABBREVIATIONS = ("al", "e.g", "i.e", "Dr", "Mr", "Ms", "vs", "etc", "p", "pp", "U.S", "No")
_SENTENCE_END_RE = re.compile(
    r"(?:" + "".join(r"(?<!\b%s)" % re.escape(word) for word in _ABBREVIATIONS) + r"\.|[!?])(?=\s|$)|\n",
    re.IGNORECASE,
)
# A figure followed by one of these is a format measure ("900 to 1,500 characters"), not a claim.
# The first figure of a range ("1,000 to 1,400 words") is a measure too.
_MEASURE_UNIT_RE = re.compile(
    r"\s*(?:to\s+\d[\d,.]*\s*)?(?:characters?|words?|slides?|px|pixels|lines|posts|seconds)\b", re.IGNORECASE)
_SOURCES_HEADING_RE = re.compile(r"^ {0,3}##[ \t]+sources[ \t]*:?[ \t]*$", re.IGNORECASE | re.MULTILINE)
# "open source" is a kind of software, never where a fact comes from.
_SOURCE_CUE_RE = re.compile(
    r"\b(?:(?<!\bopen )(?<!\bopen-)source|according|stud(?:y|ies)|report|survey|found\b)|http|www\.|\[\^", re.IGNORECASE)
# "open source:", "data source:" and "the source:" name a thing, not where a fact comes from.
_SOURCE_LABEL_RE = re.compile(r"(?<!\bopen )(?<!\bopen-)(?<!\bdata )(?<!\bthe )\bsources?[ \t]*:", re.IGNORECASE)


def has_sources_section(body: str) -> bool:
    """True when the body has a `## Sources` heading (any case, optional trailing colon), where articles list their sources."""
    return bool(_SOURCES_HEADING_RE.search(body))


def find_unsourced_numbers(text: str, has_sources: bool) -> list[str]:
    """Flag each figure whose sentence has no source cue, unless the piece lists its sources.

    A sentence ends at . ! or ? followed by whitespace or the end of the text, or at a
    newline, so a decimal such as 19.6% is never split. A full stop after an
    abbreviation such as "et al." or "Dr." does not end it either. A `Source:` label
    anywhere on the figure's line is its cue too, as in an idea's
    "-> <fact>. Source: <where>"; a source on another line never is. A figure followed by
    a format unit (characters, words, slides, px, pixels, lines, posts, seconds) is a
    measure of the piece, not a claim, and is left alone.
    """
    if has_sources:
        return []
    ends = [match.end() for match in _SENTENCE_END_RE.finditer(text)]
    problems = []
    for match in _FIGURE_RE.finditer(text):
        if _MEASURE_UNIT_RE.match(text, match.end()):
            continue
        line_start = text.rfind("\n", 0, match.start()) + 1
        line_end = text.find("\n", match.end())
        if _SOURCE_LABEL_RE.search(text[line_start : line_end if line_end != -1 else len(text)]):
            continue
        before = bisect.bisect_right(ends, match.start())
        after = bisect.bisect_left(ends, match.end())
        sentence = text[ends[before - 1] if before else 0 : ends[after] if after < len(ends) else len(text)]
        if not _SOURCE_CUE_RE.search(sentence):
            problems.append(f"number without a source: '{match.group().strip()}'")
    return problems


# ---- Mode rules -------------------------------------------------------------
# A neutral campaign never names Nagarro, FLO or the talks the piece came from.
# A personal piece may mention Nagarro as a fact, but never promotes its offering.

NEUTRAL_PATTERNS = [
    re.compile(r"\bNagarro\b"),
    re.compile(r"\bFLO\b"),
    re.compile(r"\b(?:my|the|a|this|that|our|his|her) talks?\b", re.IGNORECASE),
    re.compile(r"\bkeynote\b", re.IGNORECASE),
    re.compile(r"\bslides?\b", re.IGNORECASE),
    re.compile(r"\bthe room\b", re.IGNORECASE),
]

PROMOTION_PATTERNS = [
    re.compile(r"AI-Ready Design Systems"),
    re.compile(r"AI Readiness Diagnostic"),
    re.compile(r"nagarro\.com/en/services", re.IGNORECASE),
    re.compile(r"#FluidicIntelligence", re.IGNORECASE),
    re.compile(r"\bNagarro (?:offers|can help|helps you|provides|delivers)\b", re.IGNORECASE),
    re.compile(r"\b(?:our|Nagarro's) (?:offering|services?|diagnostic)\b", re.IGNORECASE),
]


def _matches(patterns: list, text: str) -> list[str]:
    """Return every match of every pattern, in order of appearance, curly quotes straightened first."""
    text = _straighten(text)
    found = [match for regex in patterns for match in regex.finditer(text)]
    return [match.group() for match in sorted(found, key=lambda match: match.start())]


def check_neutral(text: str) -> list[str]:
    """Flag each mention of Nagarro, FLO, a talk, slides, a keynote or the room."""
    return [f"neutral piece mentions '{hit}'" for hit in _matches(NEUTRAL_PATTERNS, text)]


def check_personal_promotion(text: str) -> list[str]:
    """Flag each promotion of a Nagarro offering, its pages or its campaign hashtag."""
    return [f"personal piece promotes '{hit}'" for hit in _matches(PROMOTION_PATTERNS, text)]


# ---- Long-form word counts --------------------------------------------------

WORD_COUNTS = {"article": (1000, 1400), "essay": (1800, 2500)}
_BRACKET_MARKER_RE = re.compile(r"\[[^\]\n]+\]")


def count_words(body: str) -> int:
    """Count whitespace-separated words, skipping images, footnote definitions and button markers."""
    words = 0
    for line in body.split("\n"):
        line = line.strip()
        if line.startswith("![") or line.startswith("[^") or _BRACKET_MARKER_RE.fullmatch(line):
            continue
        words += len(line.split())
    return words


def check_word_count(fmt: str | None, body: str) -> list[str]:
    """Check a LinkedIn article or a Substack essay against its word range; other formats pass."""
    limits = WORD_COUNTS.get(fmt or "")
    if limits is None:
        return []
    low, high = limits
    words = count_words(body)
    if low <= words <= high:
        return []
    return [f"{fmt} is {words:,} words, {fmt}s run {low:,} to {high:,}"]


# ---- Putting the rules together --------------------------------------------

NETWORKS = ("linkedin", "instagram", "x", "viva")
# Networks inside Nagarro: a link in the body is fine there (internal pages too), and no campaign hashtag is required.
INTERNAL_NETWORKS = ("viva",)


def run_all(meta: dict, body: str, campaign: dict | None = None) -> list[str]:
    """Run every rule that applies to a Content Object and return all the problems.

    The prose rules always run. The neutral rule runs for a neutral campaign, the
    promotion rule for a personal piece. Link, hashtag and length rules run for
    posts only, and the link and hashtag rules skip articles. On an internal
    network (Viva Engage) links stay in the body and no campaign hashtag is
    required. An idea has no surface or format, so it gets the prose, neutral and
    promotion rules alone.
    """
    title = meta.get("title") or ""
    first_comment = meta.get("first_comment") or ""
    all_text = title + "\n" + body + "\n" + first_comment
    prose = body + "\n" + first_comment
    is_post = meta.get("type") == "post"
    surface, fmt = meta.get("surface"), meta.get("format")

    problems = [
        *find_dashes(all_text),
        *find_banned_words(prose),
        *find_banned_patterns(body),
        *find_giveaways(prose),
        *find_american_spellings(prose),
        *find_placeholders(prose, SUBSTACK_MARKERS if surface == "substack" else ()),
        *find_claim_flags(prose),
        *find_unsourced_numbers(prose, bool(meta.get("sources")) or has_sources_section(body)),
        *(check_word_count(fmt, body) if is_post else []),
    ]
    if campaigns.is_neutral(campaign):
        problems += check_neutral(all_text)
    if meta.get("mode") == "personal":
        problems += check_personal_promotion(all_text)

    if is_post:
        if surface in NETWORKS and fmt != "article":
            internal = surface in INTERNAL_NETWORKS
            required = campaigns.required_hashtags(campaign, surface) if campaign and not internal else ()
            if not internal:
                problems += find_links(body)
            problems += check_hashtags(surface, body, required)
        problems += check_char_limit(surface, fmt, body)
    return problems
