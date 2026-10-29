# Hooks: nine patterns in the author's voice

On the feed, the first line is the whole post: nobody reads the third line unless the first one earned it. A reframe is the author's strongest opener (`voice.md`), so try a Reframe first and reach for another pattern when the idea is really a moment, a number or a list. Every example below is taken or adapted from the author's own posts in `brands/me/swipe/` or from `voice.md`, and none adds a fact. A hook obeys `ai-tells.md` like every other line, and a number in a hook carries its source in the same sentence.

`ideation` writes 5 to 7 hooks per angle, each labelled with one of the nine names below, and marks one `★ Recommended` with a one-line reason.

## The nine patterns

### 1. Reframe

What it does: swaps the question the reader brought for a better one, which the post then answers.

- "The question isn't where we can apply AI. It's where AI creates the most value."
- "Most teams asking whether their design system is ready for AI are asking the wrong question. The right one is: how often does the agent make things up?"

Fails when: the new question is the old one reworded; the body never answers it; it collapses into "It's not X, it's Y" (`ai-tells.md`). Keep the `voice.md` shape: two full sentences, each with a real subject.

### 2. Question

What it does: asks something the reader can only answer by looking at their own work.

- "If a new tool connected to your design system today, with nobody around to explain it, what would it actually understand?"
- "Of the last ten components AI touched, how many did anyone check against the system?"

Fails when: the answer is a reflexive yes or no; the next line answers it; it is broad enough to open any post ("Is AI changing design?").

### 3. Moment

What it does: drops the reader into one specific thing that happened, and the point grows out of it.

- "'Build a settings page.' That's the prompt Noel Cunningham opens her article with."
- "A client asked me a question this year that I have not stopped thinking about: 'How do you solve QA when designers build components with AI?'"

Fails when: the moment is invented or padded with details the author did not give; it names or points to a client, colleague or project (`content-rules.md`, confidentiality); the scene takes three lines to reach the point.

### 4. Number with its source

What it does: leads with one figure and names where it comes from in the same sentence.

- "A 2025 USENIX Security study tested 16 code-generating models across 19,000 prompts: on average 19.6% of the packages they recommended did not exist."
- "In a 2025 USENIX Security study, 45% of the packages the models invented came back every time the prompt was repeated."

Fails when: the source is vague ("studies show" is banned) or missing; the number is rounded, stretched or moved to a context the source did not measure; an illustrative figure is not labelled as one. A number without a source is removed, not softened.

### 5. List preview

What it does: tells the reader how many things are coming and what they are about.

- "Readiness shows up in six places you can check in an afternoon."
- "Design system governance fits in one sentence: humans maintain four things, and machines derive everything else."

Fails when: the count is picked for rhythm (three is the usual suspect, `ai-tells.md`); the items are not separate, concrete things; the body delivers a different number.

### 6. Bold claim

What it does: states a strong position flatly, and the body proves it.

- "The most expensive AI mistake in product work is the one that passes review."
- "A design system a machine can use has one thing most systems lack: a list of what does not exist."

Fails when: the body cannot prove it; it leans on an absolute that `check.py` flags ("guaranteed", "100%", "#1"); it drifts into hype ("AI will replace", "game-changer").

### 7. Reader's pain

What it does: names a problem the reader has right now, in terms they recognise from their own work.

- "Your AI-built settings page compiles and passes review. It also looks like every other settings page on the internet."
- "The components AI builds for your team look right, and they ship. The problem shows up later, and it never shows up as a bug."

Fails when: it is generic ("If you're struggling with AI, this is for you"); it tells the reader how they feel; it blames them.

### 8. Before and after

What it does: shows how the work used to be done and how it has to be done now.

- "Design system governance was a committee. For AI-consumed systems it has to be a build step."
- "AI is generating more of our interfaces, and more of the decisions inside them. That moves the work from components to the rules behind them."

Fails when: the "before" is a straw man nobody holds; the "after" is announced and never shown; it needs a timeframe or result the author did not give (client figures stay disguised: "from weeks to hours", never the exact numbers).

### 9. Admission

What it does: The author owns something true about herself, or concedes a point against her own argument, and it leads somewhere useful.

- "I understand why teams write more documentation when AI output drifts off-brand. The reasoning is sound. It is still the wrong instinct."
- "For the past three weeks I've been posting about one idea from a few angles. Here's the short version."

Fails when: it is staged ("Honest confession:"); the author never said it (an admission is a fact about her and needs her); it goes nowhere; it admits something on behalf of a client or colleague.

## Per network

LinkedIn: about 210 characters show before "see more" on desktop and about 140 on mobile (`docs/research/content-intelligence.md` §3), so the first two lines carry the hook, and the first line works even if it is all that shows. Best patterns: Reframe, Moment, Number with its source, Reader's pain.

Instagram: about 125 characters of the caption show. The text on the image is the first hook; the caption's first line promises a different angle on it instead of repeating it. A Reel's caption is the exception: it opens on the spoken hook (`reels.md`, The caption). Best patterns: Reframe, List preview, Moment.

X: the first post stands alone, under 280 characters, with no "1/" or "Thread" label; it has to be worth reading if nobody opens the rest. Best patterns: Reframe, Bold claim, Question, Number with its source.

## Never

- A question answered in the next line, more than once in a piece.
- A Bold claim the body cannot prove.
- An Admission staged for effect, or one the author never made.
- "Here's the thing", "Let's dive in", "Happy to share", "Thrilled to announce".
- An emoji in the first line.
- A hook that could headline anyone else's post.

## Self-check

1. If someone else had written this line, would you stop scrolling for it?
2. Does it raise a question that the rest of the post answers?
3. Could it sit on top of another person's post unchanged? If so, make it specific to this one.
