// product/ui/guide.js
// =============================================================================
// "New here? How to get a great deck" — the getting-started guide.
//
// Tabs, one theme each: how it works, figures, pictures, the look, examples
// and good prompts (ARIA tabs: arrow keys, Home/End, one tab stop).
//
// An inline, dismissable region under the composer. Never a modal: nothing is
// trapped, the composer stays usable, Esc closes it from anywhere (focus goes
// back to the link when it was in the panel). The link carries a one-time
// highlight on a person's first visit (localStorage "nps:guide-seen"); opening
// the guide records that it was seen.
// =============================================================================

import { STARTERS, HOW_IT_GOES, fillPrompt } from "./starters.js";

const SEEN_KEY = "nps:guide-seen";

/** The guide's examples are the first three prompt starters, so the two never drift. */
export const EXAMPLES = STARTERS.slice(0, 3);

const WEAK = "Make a presentation about our AI services.";
const STRONG =
  "A twenty-minute introduction to our AI services for the CTO of a retail bank. She wants to know where AI can reduce the cost of compliance reviews without adding risk. Show two or three places we have done it, how we govern the model's decisions, and ask for a workshop with her team.";

function readSeen() {
  try { return localStorage.getItem(SEEN_KEY) === "1"; } catch { return false; }
}
function writeSeen() {
  try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* storage blocked: highlight just repeats */ }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

/**
 * @param {{link: HTMLElement, panel: HTMLElement, promptInput: HTMLTextAreaElement}} els
 * @returns {{open: Function, close: Function, isOpen: () => boolean}}
 */
export function mountGuide({ link, panel, promptInput }) {
  const steps = [
    ["Say who it is for and what you want them to do.", "A board, a client, new joiners. Then the decision, the next step or the feeling you want them to leave with."],
    ["Add your material.", "Files, screenshots, spreadsheets, notes. The deck uses your real figures and cases, and says so when it has none."],
    ["Answer the coach's questions, or skip them.", "They take a minute and sharpen the story. Every one can be skipped."],
  ];

  const head = el("div", "guide-panel__head");
  const title = el("h2", "guide-panel__title", "How to get a great deck");
  title.id = "guide-title";
  title.tabIndex = -1;
  const close = el("button", "guide-panel__close");
  close.type = "button";
  close.setAttribute("aria-label", "Close the guide");
  close.textContent = "Close";
  head.append(title, close);

  const stepList = el("ol", "guide-steps");
  for (const [lead, rest] of steps) {
    const li = el("li", "guide-steps__item");
    li.append(el("strong", "guide-steps__lead", lead), document.createTextNode(" " + rest));
    stepList.append(li);
  }

  const pairWrap = el("div", "guide-pair");
  for (const [kind, label, text] of [["weak", "A thin prompt", WEAK], ["strong", "A prompt that works", STRONG]]) {
    const box = el("figure", `guide-pair__box guide-pair__box--${kind}`);
    box.append(el("figcaption", "guide-pair__label", label), el("blockquote", "guide-pair__text", text));
    pairWrap.append(box);
  }

  const hook = el(
    "p", "guide-hook",
    "The hook is the opening line or scene of the deck. The coach asks about it because a real moment from your material beats anything we could invent."
  );

  const exWrap = el("div", "guide-examples");
  for (const ex of EXAMPLES) {
    const card = el("article", "guide-example");
    const use = el("button", "guide-example__use", "Use this example");
    use.type = "button";
    use.setAttribute("aria-label", `Use this example: ${ex.title}`);
    use.addEventListener("click", () => {
      fillPrompt(promptInput, ex.prompt);
      closeGuide(false);
    });
    card.append(el("h3", "guide-example__title", ex.title), el("p", "guide-example__text", ex.prompt), use);
    exWrap.append(card);
  }

  /* One theme per tab, so the guide reads in small pieces rather than as one
   * wall of text. How it works also carries the three steps; Good prompts
   * the thin-or-specific pair and the hook. */
  const byId = Object.fromEntries(HOW_IT_GOES.map((t) => [t.id, t]));
  const text = (id) => el("p", "guide-text", byId[id].text);
  const TABS = [
    { id: "how", label: byId.how.tab, body: [text("how"), el("h3", "guide-sub", "Three steps"), stepList] },
    { id: "figures", label: byId.figures.tab, body: [text("figures")] },
    { id: "pictures", label: byId.pictures.tab, body: [text("pictures")] },
    { id: "look", label: byId.look.tab, body: [text("look")] },
    { id: "examples", label: "Examples", body: [exWrap] },
    { id: "prompts", label: "Good prompts", body: [pairWrap, hook] },
  ];

  const tablist = el("div", "guide-tabs");
  tablist.setAttribute("role", "tablist");
  tablist.setAttribute("aria-label", "Guide topics");
  const tabs = [];
  const panes = [];
  for (const t of TABS) {
    const tab = el("button", "guide-tab", t.label);
    tab.type = "button";
    tab.id = `guide-tab-${t.id}`;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", `guide-pane-${t.id}`);
    const pane = el("div", "guide-pane");
    pane.id = `guide-pane-${t.id}`;
    pane.setAttribute("role", "tabpanel");
    pane.setAttribute("aria-labelledby", tab.id);
    pane.tabIndex = 0;
    pane.append(...t.body);
    tabs.push(tab);
    panes.push(pane);
    tablist.append(tab);
  }

  function selectTab(i, { focus = false } = {}) {
    tabs.forEach((tab, j) => {
      const on = i === j;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
      panes[j].hidden = !on;
    });
    if (focus) tabs[i].focus();
  }
  tabs.forEach((tab, i) => tab.addEventListener("click", () => selectTab(i)));
  tablist.addEventListener("keydown", (e) => {
    const at = tabs.indexOf(document.activeElement);
    if (at === -1) return;
    const next = { ArrowRight: at + 1, ArrowLeft: at - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next == null) return;
    e.preventDefault();
    selectTab((next + tabs.length) % tabs.length, { focus: true });
  });
  selectTab(0);

  panel.replaceChildren(head, tablist, ...panes);

  function isOpen() { return !panel.hidden; }

  /* Esc closes the guide wherever focus is (the composer stays usable while
   * it is open), so the listener is on the document — and only while open.
   * Focus goes back to the link only when it was inside the panel. */
  function onKeydown(e) {
    if (e.key !== "Escape" || e.defaultPrevented) return;
    closeGuide(panel.contains(document.activeElement));
  }

  function openGuide() {
    panel.hidden = false;
    document.addEventListener("keydown", onKeydown);
    link.setAttribute("aria-expanded", "true");
    link.classList.remove("is-new");
    writeSeen();
    title.focus();
  }
  function closeGuide(returnFocus = true) {
    document.removeEventListener("keydown", onKeydown);
    panel.hidden = true;
    link.setAttribute("aria-expanded", "false");
    if (returnFocus) link.focus();
  }

  link.setAttribute("aria-expanded", "false");
  link.setAttribute("aria-controls", panel.id);
  link.addEventListener("click", () => (isOpen() ? closeGuide() : openGuide()));
  close.addEventListener("click", () => closeGuide());

  // First visit only: a quiet highlight on the link, never an auto-open.
  if (!readSeen()) link.classList.add("is-new");

  return { open: openGuide, close: closeGuide, isOpen };
}
