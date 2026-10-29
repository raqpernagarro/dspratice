// product/domain/voice.js
// =============================================================================
// The Nagarro voice, as text the prompts read from. One source: the story, the
// outline and the voice-edit steps all call voiceRules(register) and
// HOOK_TASTE, and js/voice-lint.js checks the same rules deterministically.
// People read the same content in docs/VOICE.md.
// =============================================================================

/** `register` in code. The first is the default. */
export const TONES = ["thought", "board", "client", "people"];

const TONE_ROWS = {
  thought:
    "Tone: thought leadership (default; general, external, unknown audience). The blog voice: first-person plural, an observation or scene, a reframe, a principle.",
  board:
    "Tone: executive / board (board, executive committee, investors). The same voice, tighter: the hook is the tension in one or two lines, then figures and decisions; no scene longer than two sentences.",
  client:
    "Tone: client pitch (client, prospect, partner). Their pain as a scene, the question they are asking, then us and the proof.",
  people:
    "Tone: people / culture (employees, candidates, internal celebration). Warm and rhythmic, \"you\" and \"we\"; light humour allowed.",
};

const WRITE_LIKE_THIS = [
  "Open on tension or a concrete moment: \"AI-generated UI can look right and still feel wrong.\" / \"When requirements live in code, test cases and people's heads, testing can feel like working in the dark.\"",
  "A short punch after a setup: \"Change is no longer occasional. It is structural.\"",
  "Name the problem, then its concrete symptoms: \"Engineering makes a change. Manufacturing finds out too late. Operations works around it.\"",
  "Two-line principles that land the point: \"Monitoring tells you what an agent did. Governance decides what it may do next.\"",
  "Grounded, engineering verbs: engineer, re-engineer, operationalise, orchestrate, govern, built for production.",
  "Claims tied to a client and a number, from the sources only.",
  "\"You/your\" for the audience's problem, \"we\" for capability and proof.",
  "People and moments where the brief has them (who saw it, who it affected).",
  "Calm, inviting closings: a conversation, a diagnostic, a next step.",
];

const NOT_LIKE_THIS = [
  "Truisms: \"In today's rapidly evolving digital landscape...\"",
  "Hype words, never used: unlock, unleash, revolutionise, revolutionize, supercharge, harness the power of, cutting-edge, game-changing, best-in-class, tectonic shift, on the cusp, in today's rapidly evolving, seamless, leverage (as a verb).",
  "Stacked abstract benefits: \"accelerates interoperability and drives impact\".",
  "Exclamation marks: never use an exclamation mark. No self-praise superlatives (\"leading\").",
  "The site's own tics, rationed per deck: at most one \"X, not Y\" contrast and one featured triad; never \"three\" or \"3\" in more than one title.",
];

/** Prompt-ready voice rules for a tone; an unknown tone falls back to `thought`. */
export function voiceRules(register = "thought") {
  const tone = TONE_ROWS[register] ? register : "thought";
  return [
    "Write in the Nagarro voice.",
    "",
    "Write like this:",
    ...WRITE_LIKE_THIS.map((l) => `- ${l}`),
    "",
    "Not like this:",
    ...NOT_LIKE_THIS.map((l) => `- ${l}`),
    "",
    TONE_ROWS[tone],
  ].join("\n");
}

/** Taste rules for the opening hook of a deck. */
export const HOOK_TASTE = [
  "A hook opens with one of: a tension, a real moment, a striking number, a question or paradox, or an illustrative scene framed as hypothetical (\"Picture this...\", \"Consider a...\").",
  "Never bad taste, a childish joke, melodrama, or an exclamation mark.",
  "No jokes at all in the board and client tones.",
].join("\n");
