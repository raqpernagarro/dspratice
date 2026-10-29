// product/ui/editor-ai/memory.js
// =============================================================================
// Standing instructions for this deck.
//
// "Always write in British English." "Never use exclamation marks." "The client
// is called Northwind, not NorthWind." Things you would otherwise repeat in
// every single AI request, which the model then forgets on the next one.
//
// The whole mechanism already existed and had never been reachable: the
// repository validates, de-dupes and caps `aiMemory`; editor-ai-service injects
// it into every assist and plan prompt, pinned entries first; and editor.js
// exposes patchPresentation "for the caller (memory.js)" — a file that did not
// exist. This is that file.
//
// Deliberately small. It is a list of sentences with an add field, a pin and a
// delete: the value is that the instructions reach the model at all, not that
// managing them is elaborate.
// =============================================================================
import { ctx } from "./context.js";

/** Matches the repository's own limits, so the UI refuses before the API does
 *  and the user gets an immediate answer rather than a round trip. */
const MAX_ENTRIES = 20;
const MAX_TEXT = 500;

let panel = null;
let open = false;

/* editor.js's aiInterface already exposes exactly this — getPresentation()
 * returns aiMemory, and patchPresentation is documented in that file as being
 * "for the caller (memory.js)". This is that caller. */
const entries = () => ctx.iface?.getPresentation?.()?.aiMemory || [];

/** Pinned first, then oldest — the same order the service sends to the model,
 *  so what you see is the priority the AI actually gets. */
function ordered() {
  return [...entries()].sort((a, b) =>
    (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) ||
    String(a.createdAt).localeCompare(String(b.createdAt))
  );
}

async function save(next) {
  // The repository re-derives ids and createdAt; only text and pinned travel.
  await ctx.iface.patchPresentation({
    aiMemory: next.map((e) => ({ id: e.id, text: e.text, pinned: !!e.pinned })),
  });
  render();
}

function render() {
  if (!panel) return;
  const list = panel.querySelector("[data-memory-list]");
  const rows = ordered();

  list.innerHTML = "";
  if (!rows.length) {
    const empty = document.createElement("p");
    empty.className = "ed-memory__empty";
    empty.textContent = "Nothing yet. Anything you add here is sent with every AI request for this deck.";
    list.appendChild(empty);
  }

  for (const entry of rows) {
    const row = document.createElement("li");
    row.className = "ed-memory__row";

    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = "ed-memory__pin";
    pin.dataset.on = String(!!entry.pinned);
    pin.title = entry.pinned ? "Unpin" : "Pin to the top";
    pin.setAttribute("aria-label", `${entry.pinned ? "Unpin" : "Pin"}: ${entry.text}`);
    pin.textContent = entry.pinned ? "★" : "☆";
    pin.addEventListener("click", () =>
      save(entries().map((e) => (e.id === entry.id ? { ...e, pinned: !e.pinned } : e))));

    // textContent, never innerHTML: this is raw user input, and the repository
    // stores it unescaped by design.
    const text = document.createElement("span");
    text.className = "ed-memory__text";
    text.textContent = entry.text;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "ed-memory__remove";
    remove.setAttribute("aria-label", `Remove: ${entry.text}`);
    remove.textContent = "×";
    remove.addEventListener("click", () =>
      save(entries().filter((e) => e.id !== entry.id)));

    row.append(pin, text, remove);
    list.appendChild(row);
  }

  const count = panel.querySelector("[data-memory-count]");
  if (count) count.textContent = rows.length ? `${rows.length} of ${MAX_ENTRIES}` : "";

  const input = panel.querySelector("[data-memory-input]");
  const add = panel.querySelector("[data-memory-add]");
  const atLimit = rows.length >= MAX_ENTRIES;
  input.disabled = atLimit;
  add.disabled = atLimit;
  input.placeholder = atLimit
    ? `That's the limit of ${MAX_ENTRIES} — remove one to add another`
    : "e.g. Always write in British English";
}

function build() {
  const el = document.createElement("section");
  el.className = "ed-memory";
  el.hidden = true;
  el.innerHTML =
    `<div class="ed-memory__head">` +
      `<p class="ed-memory__title">Standing instructions</p>` +
      `<span class="ed-memory__count" data-memory-count></span>` +
    `</div>` +
    `<p class="ed-memory__hint">Sent with every AI request for this deck.</p>` +
    `<ul class="ed-memory__list" data-memory-list></ul>` +
    `<form class="ed-memory__add">` +
      `<input type="text" class="ed-memory__input" data-memory-input maxlength="${MAX_TEXT}" ` +
             `aria-label="Add a standing instruction" />` +
      `<button type="submit" class="ed-memory__btn" data-memory-add>Add</button>` +
    `</form>`;

  el.querySelector(".ed-memory__add").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = el.querySelector("[data-memory-input]");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    await save([...entries(), { text, pinned: false }]);
    input.focus();
  });

  return el;
}

/** Mounts the panel and returns a toggle the header button can call. */
export function initMemory(host) {
  if (!host) return () => {};
  panel = build();
  host.appendChild(panel);
  render();
  return toggleMemory;
}

export function toggleMemory() {
  if (!panel) return;
  open = !open;
  panel.hidden = !open;
  if (open) {
    render();
    panel.querySelector("[data-memory-input]")?.focus();
  }
}

/** Called after the record changes elsewhere, so the list cannot go stale. */
export function refreshMemory() {
  if (open) render();
}
