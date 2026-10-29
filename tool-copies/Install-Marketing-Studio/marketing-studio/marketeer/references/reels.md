# Reels: the script, the caption and the brief

A Reel is a short vertical video on Instagram, in the same voice as everything else. `write-video-script` writes one from an idea or a post: a script, a caption and a visual brief, saved as one Content Object. Read this with `surfaces/instagram.md`, `hooks.md`, `ai-tells.md` and `kit.md`; if anything here seems to differ from `content-rules.md`, `content-rules.md` wins. Values marked [S] come from third-party guides cited in `docs/research/content-intelligence.md` §3 and are approximate.

## Limits

- 30 to 45 seconds.
- 9:16, at 1080×1920 [S]. Text on screen stays inside the safe zone [S].
- Two points at most: one idea, a hook, up to two points that carry it, a close.
- The caption: up to 2,200 characters, about 125 visible before the cut, up to 5 hashtags.

## The hook

- It lands in the first 3 seconds, spoken and on screen. The research puts the hook in the first 1 to 2 seconds [S], so the first words carry it.
- It never opens with "I". Open with "this", "you", a fact or a name, as these lines from `hooks.md` do: "Your AI-built settings page compiles and passes review." "A design system a machine can use has one thing most systems lack: a list of what does not exist."
- A fact in the hook carries its source, on screen and in the caption.
- The patterns in `hooks.md` work here. A Moment or an Admission starts on what happened, not on "I".

## Two points, full sentences

- Each point is one idea, said in a sentence or two. A third point is a second Reel.
- No stacked fragments: "No rules. No context. No chance." is a tell on screen as much as on the page (`ai-tells.md`). On-screen text may be shorter than the spoken line, but it reads as one phrase.
- Facts only from the source idea or post, each said no more strongly than its source says it.

## The script format

Fixed. Every script follows it, line for line:

```text
HOOK (0 to 3 s): <spoken line> | on screen: <text>
POINT 1 (3 to 20 s): <spoken line> | on screen: <text>
POINT 2 (20 to 38 s): <spoken line> | on screen: <text>
CLOSE (38 to 45 s): <spoken line> | on screen: <text>
SHOTS:
<one line per cut: framing, what is on screen, kit colours>
```

- The times are those of a 45-second Reel. A shorter Reel keeps the labels, the order and the hook's 0 to 3 s, and writes its real times on the other three lines.
- The close carries the closing line: a question the reader answers from their own work, or "Link in bio" when there is a link the author can put there.
- `SHOTS:` one line per cut, in order: the framing (The author to camera, chest up; her desk from above; a text card), what is on screen, and the kit colours (a petrol #1F434F or off-white #F7F9FB background, one lime #C0E50A accent, Figtree type). For example: "Cut 1, 0 to 3 s: The author to camera, chest up; the hook in off-white Figtree on a petrol band, one word in lime."
- Only the author on camera, or text cards: no stock footage, no generated people, and never black, yellow, pink, photographic gradients, glows or blur (`kit.md`).
- Then `CAPTION:`, which is the body of the Content Object. The caption is saved as the body, never inside `script`.

## The caption

- It mirrors the script: the same hook, the same points, the same close, written as a caption. No fact the script does not carry.
- Its first line is the spoken hook, written out, so the hook sits in its first 125 characters. This is the one exception to the Instagram rule in `hooks.md` and `surfaces/instagram.md`, where the caption's first line promises an angle the card does not give instead of repeating it: a Reel has no card, its hook is spoken and on screen in the first 3 seconds, and the caption mirrors the script, so it repeats the hook.
- Up to 5 hashtags, at the end, the campaign's Instagram tags included.
- The CTA is a question or "Link in bio". Never a giveaway gated behind a comment ("Comment REEL and I'll send it").
- No link, and never "link in the comments": `first_comment` stays empty.
- Every fact carries its source in the caption, because a Reel has no footnotes.

## Content Object fields

- `id`: the source's stem plus `-reel`, by the stem rule in `repurposing-matrix.md`, so `<idea-id>` and `<idea-id>-li` both give `<idea-id>-reel`; `parent` is the source idea or post. `surface: instagram`, `format: reel`.
- The body: the caption.
- `script`: the script, from the `HOOK` line to the last `SHOTS` line. Write it to a scratch file and pass `--script "$(cat <file>)"`, so its line breaks are kept, the way `write-social-post` passes a visual brief.
- `visual_brief`: the cuts, the on-screen text word for word, the kit colours, and whether each cut is the author on camera or a text card.
- `--date YYYY-MM-DD` sets `scheduled_date` to 12:30 Lisbon, as for every Instagram post. Instagram carries one post a day, so the day is one no other Instagram post holds, the `-ig` sibling's included (`write-video-script`, step 8).
- `tags_people` and `sources`, as on any Instagram post.
- In TryPost the script shows as a note on the draft, headed "Script:", after the visual brief and the image prompt. A TryPost note holds 2,000 characters at most (`docs/research/spike-trypost-api.md`); a 45-second script stays well under that.
- `check.py` reads the caption, not the script or the visual brief: check those two yourself for dashes, British spelling and banned words.
