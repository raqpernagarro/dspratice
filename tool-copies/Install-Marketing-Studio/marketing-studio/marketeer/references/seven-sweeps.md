# Seven sweeps: the editing pass

`edit` runs these seven sweeps over a saved piece, in this order, one concern at a time. A sweep improves how the piece says what it already says: it never changes the message, and it never adds a fact, a number, a name or a claim that the piece's sources do not carry. The rules behind each sweep are in `voice.md`, `content-rules.md` and `ai-tells.md`, and this file never loosens them; when a sweep and the voice card pull in different directions, the voice card wins. The before and after pairs are illustrative, written in the author's domain, and none states a fact or a figure as true.

## How to run them

- One sweep at a time, over every field the reader sees: the title, the body, the first comment, on long form the subtitle and the SEO fields, the on-image copy in a visual brief or an image prompt, and on a Reel the script. `edit` writes back the body only, through `scripts/set_body.py`, so a change to any other field, a flag or a `check.py` line on it included, is reported as a suggested change for the author to apply. Only when the author asks for that change does `edit` rebuild the piece with `new_post.py --force`, every field passed again, as its step 5 sets out.
- For every line a sweep changes, keep the line before, the line after and the reason, so the change summary can show them sweep by sweep.
- Flags first: when the piece carries `review_flags` from `brand-review`, those lines are the first changes, each made in the sweep it belongs to.
- The loop-back rule: after each sweep, re-read the piece against the sweeps already done. A cut in Prove it can leave a So what with nothing to stand on; a sharper verb in Specificity can break Voice. Fix that before the next sweep.

## 1. Clarity

Looks for: one idea per line; every "it", "this" and "they" pointing at one clear noun; no jargon the reader does not share (an acronym never spelt out, a tool the reader may not know, words only the author's team uses).

- Before: "It drifts because of that, and this causes problems with it later."
- After: "The agent drifts because nobody wrote the rule down. The drift shows up later, in a component nobody checked."

## 2. Voice

Looks for: the voice card in `voice.md` (how the author opens, her sentences, her words, how she ends, her tone) and its absence signals: a rhetorical question answered in the next line more than once, three parallel phrases used for rhythm, "Here's the thing" or "Let's dive in", a generic positive ending, a decorative emoji, a hashtag inside a sentence, a number without a source. Read the piece aloud: a line the author would not say to a colleague goes.

- Before: "We're thrilled to share a game-changing approach that will elevate your design system!"
- After: "A design system a machine can use has one thing most systems lack: a list of what does not exist."

## 3. So what

Looks for: every claim answers why the reader should care, in terms of their own work. A fact left on its own gets its consequence, joined with "which means" or with a sentence that says what changes for the reader.

- Before: "Give every semantic token a description."
- After: "Give every semantic token a line on when to use it, which means an agent choosing a colour reads the rule instead of guessing."

## 4. Prove it

Looks for: every number, name, award or quote carries its source, in its sentence, a footnote, the article's Sources section or the piece's `sources`. A claim with no source is removed: never softened into "about" or "some", and never given proof that was not there (an invented study, figure, client or quote). When the point still needs support, ask the author for the fact.

- Before: "Most teams already run their design governance in CI."
- After: the sentence is cut, because no source says so. The paragraph keeps what the author can stand behind: "A raw hex value outside the primitives file fails the build."

When the source exists, it goes in the same sentence, the way `series-2` in `swipe/` names its study and its authors.

## 5. Specificity

Looks for: concrete nouns and verbs instead of abstractions ("the token file", "the build fails", not "the governance layer", "drives alignment"); no round figure that feels made up ("thousands of teams", "hundreds of hours"); no new number, ever. Specific means more exact about what the piece already knows, never more detailed than its facts.

- Before: "Thousands of teams are shipping AI-generated components without proper governance."
- After: "The components AI builds for your team look right, and they ship."

## 6. Care

Looks for: the reader's real situation in their own work, named the way they would name it; one feeling, earned by a fact the piece states, never announced ("you will love this") or forced; no fear, no urgency for its own sake, no guilt, no manipulation ("your competitors are already ahead", "before it is too late").

- Before: "If your design system is not AI-ready, you are already falling behind, and your competitors know it."
- After: "Think of the last component that passed review and still felt wrong. Something in it was a decision nobody made."

## 7. Closing

Looks for: the last line is a concrete question the reader answers from their own work, or one action for this week; on event posts, thanks by name. Nothing stands between the reader and it: no gate ("Comment GUIDE"), no summary paragraph after it, no slogan. The link stays in the first comment on LinkedIn, where "Link in the comments." may follow the closing line, before the hashtags; on X it goes in the reply; on Instagram, "Link in bio" at most. Long form follows `longform.md`: an article closes on a direct question before its Sources section, and an essay puts its ask in the P.S.

- Before: "AI is changing everything, and the teams that adapt will win. Thoughts?"
- After: "Of the last ten components AI touched, how many did anyone check against the system?"

## The quick pass

After the seventh sweep, one fast read for four things:

- Weak intensifiers: very, really, extremely, incredibly, truly, actually, just. Cut them, or replace the pair with one exact word.
- Passive voice that hides who acted: "decisions were made" becomes "the agent decided", or "nobody decided".
- Nominalisations: "make a decision" becomes "decide"; "the implementation of tokens" becomes "implementing tokens".
- Sentences over 25 words: split them. Keep the rhythm `ai-tells.md` asks for, a long sentence that carries a mechanism next to a short one that lands it, with the long one under 25 words.

Then read `ai-tells.md` once more, top to bottom: the banned words in every form, the banned patterns, the structure tells the checker cannot see, and the replacements. `python3 scripts/check.py <id>` runs the deterministic half.
