# Sources for the topic scout

Edit this list whenever you like: add, remove or reorder feeds, queries and keywords. A feed that fails is reported under "Failed sources" in the signals file and never stops the scout.

Run it with `python3 scripts/scout.py`. It writes `research/signals-<date>.md`: what is recent, newest first, with the pillars each item touches.

## Feeds

One feed per line, as `- name | url`. RSS and Atom both work.

- Nielsen Norman Group | https://www.nngroup.com/feed/rss/
- Smashing Magazine | https://www.smashingmagazine.com/feed/

## Hacker News

The front page is always read, and each query searches recent stories. A story needs at least `min_points` points.

- min_points: 80
- queries: product design, ai agents

## Keywords

Whole words or phrases, ignoring case, matched in the title and the summary. List the plural as well as the singular. The number is the pillar in `brand-profile.md`.

- pillar 1: [keyword], [keyword]
- pillar 2: [keyword], [keyword]
- pillar 3: [keyword], [keyword]
