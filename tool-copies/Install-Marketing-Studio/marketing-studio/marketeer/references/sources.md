# Sources: the scout, the signals and the seven-day rule

The topic scout reads the author's own list of sources, `brands/me/sources.md`, and writes what is recent into a dated signals file. `content-planner` runs it at the start of the Monday pass and hands the newest file to `ideation`; `research` reads it too. A signal is a pointer to a page, with the date its source gave; it is not a fact until someone reads the page. Read this with `planning.md` and `idea-scoring.md`; the code is `scripts/scout.py` and `scripts/lib/scout.py`.

## How sources.md is read

Three sections, each a bullet list. Headings are matched by name, ignoring case; any line that is not a bullet is a note and is ignored, so the author can write anything between the lists.

- `## Feeds`: one feed per line, `- <name> | <https url>`. RSS 2.0, RSS 1.0 and Atom all work. A feed line in any other shape stops the run: the scout prints `scout: sources.md line <n>: a feed is ...` and exits 2.
- `## Hacker News`: `- min_points: <n>` (a whole number; 50 when the line is missing) and `- queries: <query>, <query>`. A `min_points` that is not a whole number stops the run as a bad feed line does: the scout prints `scout: sources.md line <n>: min_points must be a whole number, got ...` and exits 2.
- `## Keywords`: `- pillar <n>: <word>, <phrase>, ...`. Whole words or phrases, ignoring case, matched in an item's title and the first 300 characters of its summary. Plurals are not inferred: list both forms.

The file is the author's. Never edit it unless she asks; a source she wants dropped, she deletes.

## Adding a feed

1. Find the site's feed address: often `/feed`, `/rss`, `/feed.xml` or `/atom.xml`, or the `<link rel="alternate">` in the page's head.
2. Add `- <name> | <url>` under `## Feeds`. The name is what the signals file shows in its Source column.
3. Run `python3 scripts/scout.py`. A feed that answers adds rows under its name. One that fails is listed under `## Failed sources` with its reason (`HTTP 404`, a timeout, `not an RSS or Atom feed`) and never stops the others.
4. Optionally add its subject's words under `## Keywords`, so its items carry a pillar.

## What the scout does

- Every source is a read-only GET over http or https with a 10 second timeout and a 5 MB cap. Nothing is posted anywhere, and no social network is contacted.
- Hacker News is read through its Algolia API: the front page always, then one search by date per query. A story needs at least `min_points` points in both. A story with no link of its own points to its Hacker News page.
- A Hacker News date is when the story was posted there, not when the page was written; the signals file says so under its heading. When a URL is both in a feed and on Hacker News, the feed's copy and date win.
- An item with no title or no http(s) link is skipped. An item with no date it can read is dropped and counted: `<name>: <n> undated items dropped` under Failed sources.
- Each signal is tagged with the pillars whose keywords appear in it, and the words that matched.

`python3 scripts/scout.py [--max-age 7]` prints `signals <path> <n> signals from <s> sources (<f> failed)`. It exits 0 when at least one source answered, 1 when every source failed, 2 when `sources.md` is missing or malformed.

## The signals file

`brands/me/research/signals-<YYYY-MM-DD>.md`, named by the Lisbon date of the run; a second run that day replaces it. The newest file is the last in name order (`ls brands/me/research/signals-*.md | tail -1`).

```markdown
# Signals, as of DD/MM/YYYY

Hacker News dates are posting dates, not publication dates.

| Published | Source | Title | Pillars | Why it matters |
|---|---|---|---|---|
| DD/MM/YYYY | <feed name, or Hacker News front page, or Hacker News: <query>> | [<title>](<url>) | <pillars> | <matched words> |

## Failed sources

- <name>: <reason>
```

Rows run newest first, one per URL. Pillars and Why it matters are empty when no keyword matched; the row is still a signal. An em or en dash in a title becomes a comma, or a hyphen between two digits.

## The seven-day rule

A signal older than seven days before the run is dropped (`--max-age` changes it, for one run). The same rule holds downstream:

- What counts as being said now is what was published in the last seven days: the signals file, and the `## What is being said` lines of a `research/<topic>.md` file.
- An idea earns timeliness only from a signal of the last seven days, or an event or a date in its week (`idea-scoring.md`).
- A fact has no age limit. A page from 2024 can carry a fact; it carries its date with it.
- A signals file older than seven days says nothing about this week: run the scout again before planning from it.

## From a signal to an idea

1. Pick a row whose pillar fits the slot, or whose title touches the topic.
2. Read the page. A title says what a page is about, never what it shows; a Hacker News row says people noticed it, not that it is true or new.
3. Take only what the page states, with its URL and the date the page gives. `research` writes these into `brands/me/research/<topic>.md`, under Facts the author can use, each with its source.
4. The idea names the fact under `## Facts and sources` with that URL, and passes the URL to `new_idea.py --source`.

Never a fact without its URL and date; never a claim the page attributes to someone else, presented as the page's own; never a number read in a search snippet or a title alone. What cannot be traced to a read page goes under `## Not usable` in the research file, and stays out of every idea.
