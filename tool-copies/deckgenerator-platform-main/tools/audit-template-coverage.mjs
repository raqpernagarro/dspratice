#!/usr/bin/env node
// tools/audit-template-coverage.mjs
// =============================================================================
// How much of the template library can the engine actually reach?
//
// The complaint that started this work was that generated decks used the same
// handful of layouts. That is now a number rather than an impression: this runs
// four deliberately different decks — a consulting proposal, a capability deck,
// a financial review and a technical architecture review — through the real
// signature and scoring code, and reports what the engine offers and what it
// leads with.
//
// No model calls, so it is fast and repeatable. Run it after touching
// content-signature.js or template-scoring.js:
//
//   node tools/audit-template-coverage.mjs
//
// What to watch: "distinct leaders" should equal the slide count for every deck
// (a deck that repeats a layout is the original failure), and "never offered"
// should not be dominated by a role the decks genuinely contain.
// =============================================================================
import { outlineSignatures } from "../product/domain/content-signature.js";
import { shortlistFor } from "../product/domain/template-scoring.js";
import { allTemplates } from "../js/templates/index.js";

const DECKS = {
  "consulting proposal": [
    ["Modernising claims at Northwind", ["A proposal for 2026"]],
    ["Agenda", ["Today. The proposal. Rollout. Investment."]],
    ["Claims today", ["Settlement takes 14 days.", "38% need manual rework.", "£18.6m a year.", "26 FTE absorbing it."]],
    ["Manual handoffs are the bottleneck", ["Every claim crosses four systems by hand."]],
    ["Today versus the target state", ["Intake: paper vs capture.", "Triage: manual vs automated.", "Settlement: 14 days vs 3."]],
    ["Our approach", ["Digital intake", "Automated triage", "Assisted adjudication", "Continuous learning"]],
    ["Rollout", ["Q1 discovery", "Q2 pilot", "Q3 property", "Q4 production"]],
    ["What it delivers", ["70% faster", "£4.2m saved", "NPS up 22"]],
    ["The team", ["Elena Voss, CTO", "Marcus Reed, Director", "Priya Anand, Principal"]],
    ["Recognition", ["AWS Partner of the Year", "ISO 27001 certified", "HITRUST accredited"]],
    ["Investment", ["Discovery £180k", "Pilot £640k", "Rollout £1.4m"]],
    ["Let's talk", ["hugo@nagarro.com"]],
  ],
  "capability deck": [
    ["Design and engineering, end to end", ["One practice"]],
    ["What we do", ["Research", "Design", "Engineering", "Operations"]],
    ["The people you work with", ["Elena Voss, CTO", "Marcus Reed, Director"]],
    ["It starts in a room together", ["A collaborative workshop with your team at the whiteboard."]],
    ["The delivery centre", ["Engineers reviewing code on screens in the technical centre."]],
    ["\"We ship twice a day now.\"", ["Elena Voss, CTO"]],
    ["Certifications", ["ISO 27001", "AWS Partner of the Year", "HITRUST"]],
    ["How to start", ["A two-week discovery."]],
  ],
  "financial review": [
    ["FY26 half-year review", ["Results and outlook"]],
    ["Contents", ["Revenue. Margin. Cash. Outlook."]],
    ["Revenue", ["Group revenue £525m, up 18%.", "US up 23% to £337m.", "Commercial up 26%."]],
    ["Margin bridge", ["Gross margin 61%, up 3 points.", "Opex ratio down 2 points."]],
    ["Cash", ["Operating cash £91m.", "Free cash £64m.", "Net cash £212m."]],
    ["Segment performance", ["Enterprise £310m vs £268m", "Mid-market £140m vs £119m"]],
    ["Outlook", ["Q3 guidance raised.", "Full-year revenue £1.1bn."]],
    ["Thank you", ["Investor relations"]],
  ],
  /* A visual deck belongs in the sample. Without one, "gallery templates are
   * never offered" looked like a scoring defect for a while — it was really an
   * artefact of four text-led decks. Galleries win decisively when the content
   * is genuinely image-led, and the audit should be able to show that. */
  "culture / employer brand": [
    ["Life at Nagarro", ["Who we are"]],
    ["Our workplace in pictures", ["A look and feel of how we work across our offices."]],
    ["Behind the scenes", ["A photo essay of the team at work."]],
    ["What people say", ["\"The best team I have worked in.\" — Elena Voss, Principal Engineer"]],
    ["How we hire", ["A conversation, a working session, and a decision within a week."]],
    ["Come and see", ["careers@nagarro.com"]],
  ],

  "technical architecture": [
    ["Platform architecture review", ["Meridian Health"]],
    ["The current stack", ["Monolithic .NET application.", "Single SQL Server.", "Manual releases."]],
    ["\"We ship twice a year. Our competitors ship twice a day.\"", ["Elena Voss, CTO"]],
    ["Target architecture", ["Service mesh", "Event-driven integration", "Managed Kubernetes", "GitOps delivery"]],
    ["Migration sequence", ["Phase 1 strangler facade", "Phase 2 extract services", "Phase 3 retire monolith"]],
    ["Where we've done this", ["A national clinical records platform.", "Release cycle 6 months to 2 weeks."]],
    ["Next steps", ["A four-week architecture sprint."]],
  ],
};

const offered = new Set();
const chosenTop = new Set();
const byRole = new Map();
let slides = 0;

for (const [label, rows] of Object.entries(DECKS)) {
  const outline = rows.map(([title, bullets]) => ({ title, bullets }));
  const sigs = outlineSignatures(outline);
  const leading = new Set();
  const picks = [];
  for (const sig of sigs) {
    const list = shortlistFor(sig, { limit: 12, deckLength: outline.length, avoid: leading });
    if (list[0]) { leading.add(list[0].name); chosenTop.add(list[0].name); picks.push(list[0]); }
    for (const c of list) offered.add(c.name);
    slides++;
  }
  const roles = picks.map((p) => p.role);
  console.log(`${label.padEnd(24)} ${picks.length} slides · ${new Set(picks.map(p=>p.name)).size} distinct leaders · roles: ${[...new Set(roles)].join(", ")}`);
  for (const r of roles) byRole.set(r, (byRole.get(r) || 0) + 1);
}

console.log(`\nacross ${slides} slides:`);
console.log(`  templates offered anywhere : ${offered.size} / ${allTemplates.length} (${Math.round(offered.size/allTemplates.length*100)}%)`);
console.log(`  templates leading a list   : ${chosenTop.size}`);
console.log(`  roles led                  : ${[...byRole.entries()].sort((a,b)=>b[1]-a[1]).map(([r,n])=>`${r}:${n}`).join("  ")}`);

const neverOffered = allTemplates.filter((t) => !offered.has(t.name));
const roleGaps = new Map();
for (const t of neverOffered) roleGaps.set(t.role, (roleGaps.get(t.role) || 0) + 1);
console.log(`\n  never offered: ${neverOffered.length} — by role: ${[...roleGaps.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10).map(([r,n])=>`${r}:${n}`).join("  ")}`);
