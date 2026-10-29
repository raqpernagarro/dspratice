// tools/briefs.mjs
// =============================================================================
// The ten test briefs. Shared by tools/generate-briefs.mjs, which runs them
// through a live server, and test/brief-check.test.js, which fixtures the
// prompt checklist on them — one list, so the two never drift apart.
// =============================================================================
export const BRIEFS = [
  { tag: "finance-review",
    prompt: "A twelve-slide half-year financial review for the board of a mid-size logistics group. " +
      "Include revenue and margin by quarter with figures, a cost bridge, a table of the five largest " +
      "contracts, headcount and attrition, the outlook, and a close with the decisions we need." },
  { tag: "grave-operations",
    prompt: "An eight-slide operations update for a regional water utility on supply interruptions. " +
      "Cover the number and duration of outages with figures, the three root causes, the customer " +
      "complaints trend, what we are doing about it, and what we need from the board." },
  { tag: "culture",
    prompt: "A seven-slide culture and employer-brand deck about what it is like to work here. " +
      "Cover how we hire, how teams work day to day, what we invest in people, our offices, and a " +
      "closing invitation. Warm in tone, and make room for photography." },
  { tag: "architecture",
    prompt: "A nine-slide technical architecture review for engineering leadership on replacing a " +
      "monolith with services. Cover the current system, the target, the migration in four phases, " +
      "the data model, the risks, and the decision we are asking for." },
  { tag: "capability",
    prompt: "A ten-slide capability deck introducing our design and engineering practice to a new " +
      "client. Cover what we do, how we work, the team, three case studies with results, the " +
      "industries we know, and how to start." },
  { tag: "credentials",
    prompt: "A six-slide credentials deck: the awards and certifications we hold, the analyst " +
      "recognition, client logos by industry, two client quotes, and a short close." },
  { tag: "roadmap",
    prompt: "An eight-slide product roadmap for the next eighteen months, in four phases with dates " +
      "and milestones, the dependencies between them, what each phase unlocks for customers, the " +
      "resourcing it needs, and the risks to the schedule." },
  { tag: "decision",
    prompt: "A seven-slide decision paper comparing two options for our customer data platform: " +
      "build on the existing warehouse versus buy a managed CDP. Cover the criteria, a side-by-side " +
      "comparison, cost over three years, the risks of each, a recommendation, and next steps." },
  { tag: "research",
    prompt: "A nine-slide research readout from twenty customer interviews about why trials do not " +
      "convert. Cover the method, the four themes we found with how many people raised each, three " +
      "verbatim quotes from named participants, what surprised us, and what we recommend testing." },
  { tag: "exec-summary",
    prompt: "A three-slide executive summary of a cost reduction programme: where we are, the one " +
      "number that matters, and the decision requested." },
];

/* Four short, under-specified prompts — what people actually type. The ten
 * briefs above are detailed enough that the engine is rarely guessing; these
 * leave audience, figures and length to it, which is where invented numbers
 * and generic copy come from. Run with `--weak`, with and without the hook. */
export const WEAK_BRIEFS = [
  { tag: "weak-cloud-board", prompt: "Board update on our cloud cost programme." },
  { tag: "weak-retail-pitch", prompt: "Pitch to a retailer about personalisation." },
  { tag: "weak-onboarding", prompt: "Kick-off deck for the new graduate intake." },
  { tag: "weak-insurers-ai", prompt: "A deck about our AI offering for insurers." },
];

/* The two briefs `--refs <dir>` runs when no other set is chosen. They lean
 * on the attached material for every figure, so a number on a slide either
 * traces to the files or was invented. Written for the fixture in
 * .superpowers/sdd/2026-10-20-intelligence-layer/quality/refs (cloud costs). */
export const REF_BRIEFS = [
  { tag: "refs-cloud-board", prompt: "Board update on our cloud cost programme, from the attached notes and figures." },
  { tag: "refs-cloud-eng", prompt: "A short update for engineering leads on cloud spend and idle compute, using the attached data." },
];
