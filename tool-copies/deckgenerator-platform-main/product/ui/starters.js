// product/ui/starters.js
// =============================================================================
// The home page's first message and prompt starters.
//
// - The first message: what a good prompt covers, as twelve numbered points
//   (six essentials, six optional), shown as the assistant's opening message.
//   "Start from this list" puts them in the box as headings to fill in.
// - STARTERS: pills of two or three words above the composer. Clicking one
//   puts its full prompt in the box. The guide reuses the first three.
// - HOW_IT_GOES: what happens after Generate, figures, pictures and the look.
//   The guide shows them as tabs (product/ui/guide.js).
//
// Text is set with textContent only. Filling the box goes through
// execCommand("insertText") where the browser has it, so Ctrl+Z brings back
// what was there before; otherwise the value is set and an input event fired.
// =============================================================================
import { NAGARRO_LOGO } from "/js/logo.js";

export const STARTERS = [
  {
    id: "board",
    title: "Board update",
    prompt:
      "A ten-minute update for the board on the Q3 delivery programme, about 8 slides. The board is worried about the two projects running late, so open on that. Cover what slipped and why, what we changed in how we staff and review work, and the decision we need from them: approve moving six engineers from the internal tools team for one quarter. Calm and factual, not defensive. They should leave knowing the plan is under control and what they are approving.",
  },
  {
    id: "pitch",
    title: "Client pitch",
    prompt:
      "A pitch for the operations director of a mid-sized manufacturer whose engineering changes reach the shop floor too late. Open on their problem: a change made in engineering that manufacturing only hears about days later. Show how we connect design and production data, point to one comparable client project, and end by proposing a two-week diagnostic of their change process. Practical and confident, not salesy. Around 10 slides.",
  },
  {
    id: "culture",
    title: "Culture deck",
    prompt:
      "A deck for new joiners and candidates about how we work at Nagarro. Warm and direct, written to \"you\". Cover how teams are formed, how we learn from each other, how we look after people through a hard project, and what the first ninety days look like. End with who to talk to if you want to know more. Use the library photos of colleagues. You decide the length.",
  },
  {
    id: "status",
    title: "Project status",
    prompt:
      "A monthly status update for the client's steering committee on our platform migration, about 6 slides. Cover what we delivered this month, what is next, the two open risks and how we are handling them, and one decision we need: sign-off on the test environment by the end of the month. Keep the figures exactly as I attach them. Plain and factual.",
  },
  {
    id: "workshop",
    title: "Workshop kick-off",
    prompt:
      "Opening slides for a half-day discovery workshop with a retail client's e-commerce and marketing leads. Set out why we are here, the agenda, how we will work during the day, and what they will have at the end: a shortlist of three use cases for personalisation, each with an owner. Open with a question that makes them think about their own customers. Energetic but practical. About 7 slides.",
  },
  {
    id: "case",
    title: "Case study",
    prompt:
      "A short case study of a project we delivered, for use in pitches to insurers. Generic, not for one client. Tell it as a story: the client's problem, what we built and how we worked together, and the result in their words. Use only the figures and the quote in the notes I attach, word for word. End with what a similar project could look like for the reader. About 5 slides.",
  },
];

export const BRIEF_POINTS = {
  essentials: [
    ["Topic and key messages", "what the deck must say. Bullets or pasted notes are fine."],
    ["Audience and purpose", "who will be in the room and what they care about, and what the deck is for: a pitch, a talk, a status update, a workshop."],
    ["What they should do", "the decision, the next step or the feeling you want them to leave with."],
    ["Rough slide count", "or \"you decide\"."],
    ["Client or host", "their name, or \"generic\" if the deck is not for a specific client."],
    ["Anything word for word", "quotes, figures or legal text that must not change."],
  ],
  optional: [
    ["Opening", "should it start with a hook: a story, a striking fact or a question?"],
    ["Tone and angle", "inspiring, technical, sales-led, balanced. And anything to avoid."],
    ["Must-have slides", "a real quote, a company introduction, a team slide, a case study, a closing call to action."],
    ["Takeaways", "what the audience should remember afterwards."],
    ["Your material", "notes, reports, spreadsheets, screenshots or photos. You can attach them in the questions after Generate."],
    ["Sources", "anything you want used or cited."],
  ],
};

/** What happens, figures, pictures and the look — one guide tab each. */
export const HOW_IT_GOES = [
  {
    id: "how",
    tab: "How it works",
    text: "Describe the deck in the box. When you press Generate, I ask a few short questions, and every one can be skipped. Then I plan the story, build the deck on the Nagarro master slides and open it in the editor, where you can change anything.",
  },
  {
    id: "figures",
    tab: "Figures",
    text: "Every number on a slide comes from you: the prompt, your answers or the files you attach. I don’t invent figures. Where there are none, the slides make the point in words.",
  },
  {
    id: "pictures",
    tab: "Pictures",
    text: "Photos come from the Nagarro library, mostly real colleagues in Nagarro offices. They suit slides about Nagarro, teamwork and culture, but can’t stand in for specific people, like a client’s CTO, or for topics like code or data centres. For anything else, attach your own pictures in the questions after Generate.",
  },
  {
    id: "look",
    tab: "The look",
    text: "Covers, chapter dividers and the closing slide are dark; the slides between them are light.",
  },
];

/** The twelve points as headings to fill in, one per line. */
export function briefTemplate() {
  return [...BRIEF_POINTS.essentials, ...BRIEF_POINTS.optional]
    .map(([label], i) => `${i + 1}. ${label}: `)
    .join("\n");
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

/** Replaces the composer's text the way typing would: the page's own input
 *  listeners run, and where the browser supports it Ctrl+Z restores the old text. */
export function fillPrompt(promptInput, text) {
  promptInput.focus();
  promptInput.select();
  let inserted = false;
  try { inserted = document.execCommand("insertText", false, text); } catch { /* not supported */ }
  if (!inserted || promptInput.value !== text) {
    promptInput.value = text;
    promptInput.dispatchEvent(new Event("input", { bubbles: true }));
  }
  promptInput.setSelectionRange(text.length, text.length);
  promptInput.scrollTop = promptInput.scrollHeight;
}

/** The pills above the composer. */
export function mountStarters({ list, promptInput }) {
  list.replaceChildren(...STARTERS.map((s) => {
    const li = el("li", "starter");
    const btn = el("button", "starter__btn", s.title);
    btn.type = "button";
    btn.title = s.prompt;
    btn.setAttribute("aria-label", `Use the example prompt: ${s.title}`);
    btn.addEventListener("click", () => fillPrompt(promptInput, s.prompt));
    li.append(btn);
    return li;
  }));
}

/** The mark alone: the logo's own SVG with its viewBox cropped to the symbol. */
const MARK = NAGARRO_LOGO.replace('viewBox="0 0 191.678 47.8895"', 'viewBox="0 0 48 47.8895"');

/** The assistant's first message: the twelve points, then "Start from this list". */
export function mountIntro({ root, promptInput }) {
  const avatar = el("span", "intro__avatar");
  avatar.setAttribute("aria-hidden", "true");
  avatar.innerHTML = MARK; // a constant from js/logo.js, never user or model text

  const bubble = el("div", "intro__bubble");
  const lead = el("p", "intro__lead", "In your prompt, cover what you can. Short answers or pasted notes are fine.");
  lead.id = "intro-title";

  const cols = el("div", "intro__cols");
  let n = 0;
  for (const [heading, points] of [
    ["The essentials", BRIEF_POINTS.essentials],
    ["Optional, but they make the deck much better", BRIEF_POINTS.optional],
  ]) {
    const col = el("section", "intro__col");
    const ol = el("ol", "intro__points");
    ol.start = n + 1;
    for (const [label, text] of points) {
      n += 1;
      const li = el("li");
      li.append(el("strong", null, label + ":"), document.createTextNode(" " + text));
      ol.append(li);
    }
    col.append(el("h3", "intro__sub", heading), ol);
    cols.append(col);
  }

  const useList = el("button", "intro__use", "Start from this list");
  useList.type = "button";
  useList.addEventListener("click", () => fillPrompt(promptInput, briefTemplate()));

  bubble.append(lead, cols, useList);
  root.replaceChildren(avatar, bubble);
  root.hidden = false;
}
