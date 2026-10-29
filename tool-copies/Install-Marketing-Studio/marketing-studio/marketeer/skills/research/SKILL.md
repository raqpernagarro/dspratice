---
name: research
description: Researches one topic on the open web for the author with WebSearch and WebFetch plus the newest scout signals file, verifies every date on the page it was read on, and writes brands/me/research/<topic-slug>.md with what is being said in the last seven days (one dated line per source with its URL), the facts the author can use (each with its source), 3 to 5 angles that each name a pillar and the fact they rest on, and the claims that are not usable. Use when the author asks to "research this", "what is being said about" a topic, to "find sources on" something, for "fresh angles" or "what happened this week in" a field. Not for planning the week or choosing dates (use content-planner), and not for writing an idea, a post or an article (use ideation, write-social-post or write-longform).
---

# research

Reads the open web on one topic the way a careful researcher would: the scout's newest signals first, then a few searches, then the two or three best pages read in full. Everything it keeps carries the URL it was read at and the date the page gives. It writes one file, `brands/me/research/<topic-slug>.md`, that `ideation` and `content-planner` can work from, and it invents nothing: a claim it could not trace to a page it read goes under Not usable. Paths are relative to the repository root.

## Inputs

In any order and wording (`design systems and AI agents` is enough):

- The topic, in a few words or a sentence. With none, ask the author for one with `AskUserQuestion`.
- A pillar from 1 to 4, when the author names one. Without one, the angles in step 6 each pick the pillar they fit.
- A mode: `personal` (the default) or `nagarro`. It changes only what the angles may propose (step 6), never what the research reads.
- A URL the author gives: read it first, in step 4, and treat it like any other page.

## Steps

1. Run `marketeer-context` (`/marketeer:marketeer-context`) with the pillar when one is named, the mode, and the topic as the task sentence. Work from its block: the four pillars and their readers (Audience, Pillar), the Hard rules and the Mode rules the angles must respect, and Facts available, so the research does not hunt for a fact the author already has.
2. Read the newest signals file and `marketeer/references/sources.md`:
   - `ls brands/me/research/signals-*.md | tail -1`, then read it in full. Note its `As of` date. When it is older than seven days, say so in one line in the conversation and offer `python3 scripts/scout.py` at the end. Carry on: its rows are still leads to read, but none of them is fresh.
   - Keep the rows whose title or matched words touch the topic, with their date, source and URL. Remember the note under the heading: a Hacker News date is a posting date.
   - Choose the file's slug: the topic in lowercase kebab case, letters, digits and hyphens only, at most 50 characters (`design-systems-and-ai-agents`). When `brands/me/research/<slug>.md` exists, read it: this run replaces it, and its facts may be carried over with their original source lines.
3. Search with WebSearch, three to five queries:
   1. the topic as the author said it;
   2. the topic plus the current year ("2026" in 2026);
   3. a contrary view: the topic plus "criticism", "limits", "fails" or "overrated";
   4. a practitioner source: the topic plus "case study", "in practice", "lessons" or "what we learned";
   5. optionally, the subject of the strongest signal from step 2.

   From the results, pick the pages to read. Prefer, in this order: a primary source (the maker's own announcement or documentation, a study, a dataset), a practitioner's account of their own work, a named publication, then everything else. Prefer the last seven days for what is being said; any date will do for a fact. Never pick a page on linkedin.com, instagram.com, x.com, twitter.com or a substack.com address: the system never contacts those networks. WebSearch may answer with a summary of its results as well as the links: the summary, like a snippet, is never a fact, and a claim in it that names no page has no URL. A result you will not read may still go under Not usable when its snippet or the summary makes a claim worth naming.
4. Read the two or three best pages from the searches, plus up to three signals from step 2 that touch the topic, with WebFetch. A page that cannot be fetched does not count: note it for Not usable and try the next best result or the next signal, up to five attempts for each. Pages on Medium, the Design Systems Collective's among them, answered HTTP 403 in the run of 21 October 2026; try them, but expect to move on. Ask WebFetch for the page's publication date (or its last-updated date, labelled as such), its author or publisher, its title, and every number, name and claim on the topic, quoted exactly. For each page note:
   - the URL as fetched, and the date the page shows. A date from a search result, a feed or Hacker News is not a page date: when the page shows none, write `undated on the page`;
   - what the page itself says, in a sentence of your own;
   - each fact: a number, a name, a date, a finding, a release, with the page's own words for it, and whom the page attributes it to when it is not the page's own claim;
   - when the fetch fails (an error, a paywall, a page with no text), the reason. Never fill a failed page from memory or from its snippet.

   WebFetch answers through a model that summarises the page, so its quotes are not yet the page's words. Before a quote, a number or a date goes in the file, fetch the page again and ask for the exact sentence that holds it, with the sentence before and after, and the date line as printed. Use only what comes back verbatim; a figure that does not come back goes under Not usable.
5. Write the file with the Write tool, `brands/me/research/<slug>.md`, in the shape of the template below. Check each line against step 4's notes before it goes in: a URL that was not fetched, a date that is not the page's, or a number that is not on the page does not go in.
6. Write 3 to 5 angles under `## Angles for the author`. An angle is a position the author could argue, in one sentence, not a topic. Each one names the pillar it fits (by its definition in the context block), the reader it is for, and the fact or facts it rests on, by number: only facts that back the angle's own claim, read against its wording, never a fact that merely shares its page or topic. It respects the Mode rules: in `personal` mode it never promotes a Nagarro offering; in either mode it never compares Nagarro with another firm. An angle that needs a fact the file does not hold says `needs a fact from the author: <what>`, and comes last.
7. Probe the file for dashes, and fix every hit until the probe prints `0 0`:
   ```bash
   python3 -c "import sys; t=open(sys.argv[1],encoding='utf-8').read(); print(t.count(chr(8212)), t.count(chr(8211)))" brands/me/research/<slug>.md
   ```
8. Show the result: the path, how many sources made each section, the pages that could not be read, the angles in one line each. Then offer one next step: "Turn angle <n> into an idea with `/marketeer:ideation pillar <n>, angle: <the angle>`, with fact <k> and its URL?" When the signals file was older than seven days, offer `python3 scripts/scout.py` as well.

### The template

```markdown
# <topic, as the author said it>

As of DD/MM/YYYY

## What is being said

- DD/MM/YYYY, <publisher or author>, "<title>": <what the page says, one sentence in your words>. <URL>

## Facts the author can use

1. <the fact, as the page states it>. Source: <publisher or author>, "<title>", DD/MM/YYYY | undated on the page, <URL>

## Angles for the author

1. <the angle in one sentence>. Pillar <n>, for <the reader>. Rests on fact <k>[ and <k>].

## Not usable

- <the claim>: <why: no source on the page; a search snippet only; the page could not be fetched (<reason>); a Hacker News posting date only; attributed to someone the page does not name>. <URL when there is one>
```

- `As of` is the day of the run, in Lisbon. Every other date in the file is a date read on a page.
- `## What is being said`: one line per page read in step 4 whose own date is within seven days of the run, newest first. A page older than that, or undated, can still give facts, but not a line here. When none qualifies, write `Nothing dated in the last seven days.`
- `## Facts the author can use`: numbered, so the angles can point at them. Every fact line carries its own source in full (publisher or author, title, the page's date, URL), even when the line above cites the same page: never "as fact 1" or "same URL", because `ideation` takes a research fact as cited only when its own line holds the URL and the date. Each fact is said no more strongly than the page says it, keeps the page's hedges ("about", "in a survey of"), and names whom the page credits when the claim is not its own. A claim the page credits to a study, a survey, a researcher or a source it does not name is not a fact, however exact its figure: it goes under Not usable with that reason, and a named person's view on the same line can stay as a fact. Quoted words go in double quotes, exactly as the page spells them; a quote that holds a dash ends before the dash.
- `## Not usable`: every claim met in the run that could not be traced to a page read, and every page that could not be read, with the reason. A signal that could not be read is named by its title and "from the signals file", never with the feed's date. When there is none, `None.`
- Every heading appears, in this order, spelt exactly so.

## Outputs

- `brands/me/research/<slug>.md`, with the four sections, dated sources and a dash probe of `0 0`.
- The summary in the conversation and the offer of `ideation`.
- Nothing else in the repository changes: no idea, post, plan or signals file is written.

## Rules

- Never a link, a date or a number that was not read on the page it is attributed to. A search snippet, the summary WebSearch writes, a feed date, a Hacker News date or memory is never a page's date or a page's fact.
- Seven-day freshness for `## What is being said`, judged by the page's own date. Any date for a fact, and the fact carries its date.
- One topic per run, three to five searches, two or three pages from the searches plus up to three signals read in full. More reading is not better research; better pages are.
- A claim the page attributes to someone else stays attributed. A vendor's claim about its own product is the vendor's claim, said as such.
- No fact about a client, a colleague or a Nagarro project goes in the file unless a public page states it, and then only as that page states it.
- British English in every word the skill writes; quoted words stay as the page spells them. No em or en dashes anywhere: a dash in a title becomes a comma.
- When a page cannot be fetched, the file says so under Not usable. Never guess what it said.

## Boundaries

- Reads the open web with WebSearch and WebFetch only, and never contacts LinkedIn, Instagram, X or Substack, through any address. No other network call, no TryPost.
- Does not run the scout: `content-planner` does, or the author. It only offers it.
- Does not write ideas: `ideation` does, from an angle the author picks. Does not plan dates: `content-planner` does. Does not draft: `write-social-post` and `write-longform` do.
- Writes one file, `brands/me/research/<slug>.md`, and edits no other file in `brands/me/`.

## Related

- `marketeer/references/sources.md`: how the signals file is made, the Hacker News date rule, the seven-day rule, and how a signal becomes an idea.
- `marketeer/references/idea-scoring.md`: timeliness and difference read this skill's file.
- `marketeer-context`: step 1. `ideation`: the next step, from one angle and its fact. `content-planner`: runs the scout and reads the research files when it plans the week.
- `scripts/scout.py`: writes `brands/me/research/signals-<YYYY-MM-DD>.md`.
