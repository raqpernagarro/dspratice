# The Nagarro voice

Distilled from nagarro.com (home, company, careers, services, case studies,
blogs) and LinkedIn posts. The prompts read the same rules from
`product/domain/voice.js`; `js/voice-lint.js` checks copy against them.

## Write like this

- Open on tension or a concrete moment: "AI-generated UI can look right and
  still feel wrong." / "When requirements live in code, test cases and people's
  heads, testing can feel like working in the dark."
- A short punch after a setup: "Change is no longer occasional. It is
  structural."
- Name the problem, then its concrete symptoms: "Engineering makes a change.
  Manufacturing finds out too late. Operations works around it."
- Two-line principles that land the point: "Monitoring tells you what an agent
  did. Governance decides what it may do next."
- Grounded, engineering verbs: engineer, re-engineer, operationalise,
  orchestrate, govern, built for production.
- Claims tied to a client and a number, from the sources only.
- "You/your" for the audience's problem, "we" for capability and proof.
- People and moments where the brief has them (who saw it, who it affected).
- Calm, inviting closings: a conversation, a diagnostic, a next step.

## Not like this

- Truisms: "In today's rapidly evolving digital landscape..."
- Hype: unlock, unleash, revolutionise, supercharge, harness the power of,
  cutting-edge, game-changing, best-in-class, tectonic shift, on the cusp,
  seamless, leverage (as a verb).
- Stacked abstract benefits: "accelerates interoperability and drives impact".
- Exclamation marks; self-praise superlatives ("leading").
- The site's own tics, rationed per deck: at most **one** "X, not Y" contrast
  and **one** featured triad; never "three" in more than one title.

## Tones

The same voice adjusted to the room, picked from the understood audience
(default = thought leadership). The code calls this `register`.

| Tone | When | How it sounds |
|---|---|---|
| Thought leadership (default) | general, external, unknown | The blog voice: first-person plural, an observation or scene, a reframe, a principle |
| Executive / board | board, executive committee, investors | Same voice, tighter: hook = the tension in one or two lines, then figures and decisions; no scenes longer than two sentences |
| Client pitch | client, prospect, partner | The manufacturing LinkedIn post: their pain as a scene, the question they are asking, then us and the proof |
| People / culture | employees, candidates, internal celebration | The Flo post: warm, rhythmic, "you" and "we", light humour allowed |

## Hooks

Open with tension, a real moment, a striking number, a question or paradox, or
an illustrative scene framed as hypothetical ("Picture this...", "Consider
a..."). Never bad taste, a childish joke, melodrama or an exclamation mark. No
jokes in the board and client tones.
