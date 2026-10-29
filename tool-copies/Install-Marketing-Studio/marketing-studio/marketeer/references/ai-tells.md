# AI tells: what never goes into a draft

Read this before drafting and again before saving. Each item makes a draft sound generated instead of written by the author. The sources are `content-rules.md` and `voice.md`; this file never loosens them. Most items are also enforced by `scripts/check.py` (last section); the structure tells are yours to catch.

## Banned words

`check.py` matches each word whole, in any case, in the body and the first comment. It matches the exact form only, so "unlocks" or "leveraging" slips past it; every form is banned all the same.

Hype (`content-rules.md`), with the plain replacement:

| Banned | Write instead |
|---|---|
| game-changer, game-changing | what changed, and for whom |
| unlock | "make possible", "let", or name the result |
| elevate | "improve", or say what got better |
| delve | "look at", "go into" |
| leverage | "use" |
| landscape | "how X works today" |
| crucial | "important", or the thing itself |
| pivotal | "decisive", or say what it decided |
| testament | "shows", "proof that" |
| showcase | "show" |
| quietly | cut it, or say what happened |
| vibrant | cut it, or give the concrete detail |
| robust | "reliable", or say what it survives |
| seamless | "smooth", or say which handover went away |
| thrilled | cut it and say what happened |
| humbled | cut it and thank the people by name |
| excited to announce | state the news in the first line |

Filler (carried over from Marketeer), with the plain word in brackets: comprehensive (full, or cut), holistic (whole, or cut), navigate (work through, handle), vital (important), furthermore and moreover (also, or cut), foster (build, encourage), facilitate (run, help), cutting-edge (new, or name it), utilize (use; "utilise" too), underscore (show), tapestry and realm (cut), embark (start), unleash (cut, and say the result), world-class (cut, and give the evidence).

Never-say (`voice.md`): honoured, happy to share, synergies, synergy, best-in-class, 10x, AI will replace, the future is here, screens. For "screens" write features, flows or products; "screen reader" is fine. The checker bans the word in every sense, so a literal "three screens deep" or "on small screens" is paraphrased too ("three steps deep", "on a phone"). `voice.md` also bans "journey" as a noun for a project, which the checker does not catch.

## Banned patterns

`check.py` looks for these in the body, with curly quotes straightened and the trailing hashtag lines set aside. Each label below is what it prints after "pattern:".

| Label | Before | After |
|---|---|---|
| it's not X, it's Y | "It's not a tooling problem, it's a context problem." | "The tool did what it was asked. Nobody wrote down what it needed to know." |
| here's the thing | "Here's the thing: agents don't read guidelines." | "Agents do not read guidelines the way people do." |
| let's dive in | "Let's dive in to what makes a system machine-readable." | "A design system a machine can use has a list of what does not exist." |
| hedge 'it's important to note', hedge 'it is important to note' | "It's important to note that tokens need descriptions." | "Every semantic token says when to use it." |
| hedge 'it's worth mentioning', hedge 'it is worth mentioning' | "It's worth mentioning that the index is generated." | "The index is generated from the code you already have." |
| hedge 'needless to say' | "Needless to say, the build should block raw hex." | "A raw hex value outside the primitives file fails the build." |
| hedge 'it goes without saying' | "It goes without saying that agents fill gaps." | "An agent fills every gap you left with a confident guess." |
| hedge 'in today's fast-paced world' | "In today's fast-paced world, AI writes our interfaces." | "AI is generating more of our interfaces, and more of the decisions inside them." |
| hedge 'when it comes to' | "When it comes to governance, meetings don't scale." | "Memory does not run on every commit. A build step does." |
| vague claim 'many companies' | "Many companies are rolling out AI assistants." | "Before choosing which assistant to roll out, ask what it would understand of your system today." |
| vague claim 'studies show' | "Studies show AI invents packages." | "A 2025 USENIX Security study found that on average 19.6% of the packages the models recommended did not exist." |
| vague claim 'leading brands' | "Leading brands already govern design in CI." | Cut it, or name the brand and cite where the fact comes from. |
| vague claim 'experts agree' | "Experts agree agents need structured data." | "An agent works with what it can reach: structured data, public pages and a limited budget for digging." |
| vague claim 'a lot of' | "A lot of teams skip the inventory." | "Most design systems have plenty of documentation and no inventory." |
| closer 'Thoughts?' | A last line that reads "Thoughts?" | "Of the last ten components AI touched, how many did anyone check against the system?" |
| closer 'Agree?' | A last line that reads "Agree?" | "List ten rules your team follows that nobody wrote down." |

The "it's not X, it's Y" check also catches "this isn't X, that's Y" and "that is not just X, it is Y". "A lot of" is flagged in any sense, "a lot of time" included.

The closer rule: `check.py` flags "Thoughts?" or "Agree?" only when it is the whole last line, even with hashtags after it. `voice.md` goes further: the last line is a concrete question the reader answers from their own work, one action for this week, or, on an event post, thanks by name. Never a slogan, never a generic question.

A separate check, in the body and the first comment, bans a giveaway gated behind a comment. Before: "Comment GUIDE and I'll send you the checklist." After: "Link in the comments." It fires when "comment" is followed within 60 characters by a word in capitals of three letters or more, a quoted word, "and I'll", "to get", "to receive", "send you" or "DM you", so "reply to every comment about the API" trips it too. So does the author's own reply habit, "Leave a comment and I'll reply to every one": reword it as "I'll reply to every comment this week".

## Structure tells the checker cannot see

- Uniform sentence rhythm: every sentence the same mid length. Mix a long sentence that carries a mechanism with a short one that lands it, as the swipe posts do.
- Three parallel phrases used for rhythm. Keep a list of three only when there are exactly three real things.
- Stacked one-line fragments ("No rules. No context. No chance."). One idea per line is the author; a row of dramatic fragments is not. Write full sentences.
- A rhetorical question answered in the next line, more than once in a piece. Once is the limit; ask it, then let the body answer.
- A generic positive ending ("The future is bright for teams that adapt."). End on the closing line rule above.
- An emoji as decoration. Only functional ones (a flag, a pin, an arrow for a list), few, and none in the first line.
- A number without a source. Every number, client name, award or quote carries its source in the sentence, a footnote or `sources`. Remove the number if there is none; do not soften it.
- "In conclusion", or a last paragraph that restates the first.

## Replacements

From the humanizer skill, in British spelling.

| AI phrase | Plain phrase |
|---|---|
| in order to | to |
| due to the fact that | because |
| at this point in time | now |
| in the event that | if |
| has the ability to | can |
| serves as, stands as | is |
| boasts, features (meaning "has") | has |
| plays a key role in | say what it does |
| is a testament to | shows |
| additionally | also, or cut |
| not only X but also Y | say X, then say Y |
| could potentially, might arguably | may |
| the real question is, at its core | state the point |
| let's explore, here's what you need to know | state it |
| honestly?, let's be honest, real talk | cut |
| to be clear, don't get me wrong | cut, or state the claim directly |
| from X to Y (when X and Y are not a range) | name the things |
| align with | fit, match |
| enhance | improve |
| commitment to | say what was done |
| exciting times lie ahead | end on the last concrete fact |
| I hope this helps, let me know | cut |

## The deterministic twin

`python3 scripts/check.py <id>` runs the same lists over the saved Content Object, in this order: dashes; the banned words; the banned patterns, hedges, vague claims and closers; gated giveaways; British spelling, in every form of a word; bracketed placeholders; absolute and comparative claims, matched as whole words ("guaranteed", "guarantee" and "guarantees" outside "guarantee nothing", "guarantees nothing" and "no guarantee", "risk-free", "no risk", "100%", "#1", "best in the world", "always wins", "never fails", "proven to", "double your", "triple your", "unlike our competitors", "competitors can't", "beats every"); figures without a source cue in their sentence or a `Source:` label on their line ("open source" is never one), unless `sources` is filled or the body has a `## Sources` heading; the word count of a LinkedIn article (1,000 to 1,400) or a Substack essay (1,800 to 2,500); the mode and campaign rules; and the surface's links, hashtags and length. Each surface file's `## Checklist` gives the details. A draft is not done until it prints `ok <id>`: fix what it names, save again with `new_post.py ... --force`, and run it again.
