// product/ui/coach.js
// =============================================================================
// Coach v2 — the question form at every prompt-path Generate.
//
// Opens at once, above the composer (the prompt stays visible), with the
// fixed questions from js/brief-check.js: audience/goal and key points when
// the checklist shows them missing, the reference question, the hook and the
// length. One question at a time — Back / Skip / Next, a "2 of 5" hint —
// options as pills plus a free-text box, and "Generate now" always enabled.
// Never blocking: every question can be skipped; Esc, or editing the prompt
// (home.js), closes it — and cancels the tailored request still in flight.
//
// The tailored options come from a second request (POST /api/briefs/coach,
// ~19s on Haiku through the CLI). When it lands, a question's wording and
// options are replaced ONLY if the person has not touched that question yet,
// and a figures question is appended when the model says the topic needs
// numbers. A late answer for a closed form is dropped by token.
//
// References are attached INSIDE the form (the "+" on the composer stays the
// .pptx import path): a file goes to POST /api/references, pasted text to
// /api/references/text; each shows as a chip with remove, and images get a
// "Use on slides" toggle (off by default).
//
// Model-written text is set with textContent / properties only.
// =============================================================================
import { api } from "./lib/api.js";
import {
  checkBrief, missingFrom, coachQuestions, figuresQuestion, coachPayload, assembleBrief, lengthWhy,
} from "/js/brief-check.js";

// The server gives the model 30s (COACH_TIMEOUT_MS); this only covers the
// server itself being unreachable.
const COACH_CLIENT_TIMEOUT_MS = 35_000;
const MAX_REFERENCES = 10;
const MAX_REFERENCE_BYTES = 30 * 1024 * 1024;
const REFERENCE_ACCEPT = ".pdf,.docx,.pptx,.xlsx,.csv,.txt,.md,.markdown,.png,.jpg,.jpeg,.webp";

/** Answers the form starts with — the defaults, shown selected but not
 *  counted as answered. */
const DEFAULTS = { hook: "yes", length: "you-decide" };

/**
 * @param {HTMLElement} root  the #coach section
 * @param {{ onGenerate: (prompt: string, fields: object) => void, onClose?: () => void }} hooks
 */
export function createCoach(root, { onGenerate, onClose }) {
  const el = (id) => root.querySelector(`[data-coach="${id}"]`);
  const progressEl = el("progress");
  const questionEl = el("question");
  const whyEl = el("why");
  const optionsEl = el("options");
  const textEl = el("text");
  const refsEl = el("refs");
  const backBtn = el("back");
  const skipBtn = el("skip");
  const nextBtn = el("next");
  const goBtn = el("go");
  const closeBtn = el("close");
  const fileInput = el("file");
  const pasteBox = el("paste");
  const pasteText = el("paste-text");
  const pasteAdd = el("paste-add");
  const refList = el("ref-list");
  const refError = el("ref-error");
  fileInput.accept = REFERENCE_ACCEPT;

  /** The open form, or null. */
  let state = null;
  /** Attached references outlive a closed form (Esc must not throw away an
   *  upload); they are cleared once a generation takes them. */
  let refs = [];

  function open(prompt) {
    const check = checkBrief(prompt);
    const token = Symbol("coach");
    state = {
      token, prompt, check,
      abort: new AbortController(), // cancels the tailored request on close
      questions: coachQuestions(check, { hasReferences: false }),
      index: 0,
      source: "fallback",
      answers: {},        // id → { selected: string[], text: string }
      touched: new Set(), // ids the person has changed
      visited: new Set(),
    };
    root.hidden = false;
    render();
    loadTailored(token, prompt, state.abort.signal);
  }

  function close({ restoreFocus = true } = {}) {
    if (!state) return;
    state.abort.abort();
    state = null;
    root.hidden = true;
    pasteBox.hidden = true;
    if (restoreFocus) onClose?.();
  }

  async function loadTailored(token, prompt, signal) {
    let answer;
    try {
      answer = await api.coachBrief(prompt, { hasReferences: refs.length > 0 }, AbortSignal.any([signal, AbortSignal.timeout(COACH_CLIENT_TIMEOUT_MS)]));
    } catch {
      return; // the fixed questions are already showing
    }
    if (!state || state.token !== token || !Array.isArray(answer?.questions)) return;
    if (answer.source === "model") state.source = "model";
    let changedCurrent = false;
    for (const fresh of answer.questions) {
      const i = state.questions.findIndex((q) => q.id === fresh.id);
      if (i < 0) {
        if (fresh.id === "figures") state.questions.push({ ...figuresQuestion(), ...fresh });
        continue;
      }
      if (state.touched.has(fresh.id) || fresh.id === "hook" || fresh.id === "length" || fresh.id === "references") continue;
      state.questions[i] = { ...state.questions[i], ...fresh };
      if (i === state.index) changedCurrent = true;
    }
    if (changedCurrent) render({ keepFocus: true });
    else renderProgress();
  }

  /* ---- Answers ------------------------------------------------------------ */
  function answerOf(id) {
    if (!state.answers[id]) {
      state.answers[id] = { selected: id in DEFAULTS ? [DEFAULTS[id]] : [], text: "" };
    }
    return state.answers[id];
  }

  /** The form's answers as coachPayload / assembleBrief read them. */
  function collect() {
    const out = {};
    for (const q of state.questions) {
      if (q.id === "references") continue;
      const a = state.answers[q.id];
      if (q.id === "hook") { out.hook = a?.selected[0] ?? DEFAULTS.hook; continue; }
      if (q.id === "length") {
        out.length = a?.text.trim() || a?.selected[0] || DEFAULTS.length;
        continue;
      }
      if (!a || !state.touched.has(q.id)) continue;
      const labels = a.selected.map((v) => q.options.find((o) => o.value === v)?.label ?? v);
      const value = [...labels, a.text.trim()].filter(Boolean).join("; ");
      if (value) out[q.id] = value;
    }
    out.references = refs.filter((r) => r.id).map((r) => r.id);
    return out;
  }

  function generate() {
    if (!state) return;
    if (refs.some((r) => r.uploading)) {
      showRefError("Wait for the upload to finish, or remove it.");
      return;
    }
    const { prompt, check, questions, source } = state;
    const answers = collect();
    const payload = coachPayload(answers);
    const answered = questions
      .map((q) => q.id)
      .filter((id) => id === "references" ? payload.referenceIds.length > 0 : state.touched.has(id) && (
        id === "hook" || id === "length" || payload.answers[id]));
    const coaching = {
      missing: missingFrom(check),
      asked: [...state.visited],
      answered,
      source,
      skipped: answered.length === 0,
    };
    const brief = assembleBrief(prompt, payload.answers);
    close({ restoreFocus: false });
    refs = [];
    renderRefs();
    onGenerate(brief, { coaching, ...payload, background: true }, prompt);
  }

  /* ---- Navigation --------------------------------------------------------- */
  function go(delta) {
    const next = state.index + delta;
    if (next < 0) return;
    if (next >= state.questions.length) { generate(); return; }
    state.index = next;
    render();
  }

  function skip() {
    const q = state.questions[state.index];
    if (q.id !== "references") {
      delete state.answers[q.id];
      state.touched.delete(q.id);
    }
    go(1);
  }

  /* ---- Rendering ---------------------------------------------------------- */
  function renderProgress() {
    progressEl.textContent = `${state.index + 1} of ${state.questions.length}`;
    const last = state.index === state.questions.length - 1;
    nextBtn.hidden = last;
    skipBtn.textContent = last ? "Skip and generate" : "Skip";
    goBtn.classList.toggle("is-primary", last);
    backBtn.disabled = state.index === 0;
  }

  function render({ keepFocus = false } = {}) {
    const q = state.questions[state.index];
    state.visited.add(q.id);
    renderProgress();
    questionEl.textContent = q.question;
    const why = q.id === "length" ? lengthWhy(answerOf("hook").selected[0] ?? DEFAULTS.hook) : q.why;
    whyEl.textContent = why || "";
    whyEl.hidden = !why;

    const a = answerOf(q.id);
    optionsEl.setAttribute("role", q.multi ? "group" : "radiogroup");
    optionsEl.setAttribute("aria-labelledby", questionEl.id);
    optionsEl.replaceChildren(...q.options.map((o) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "coach2__opt";
      b.dataset.value = o.value;
      b.setAttribute("role", q.multi ? "checkbox" : "radio");
      const on = q.id === "references" ? isRefOptionOn(o.value) : a.selected.includes(o.value);
      b.setAttribute("aria-checked", String(on));
      b.textContent = o.label;
      return b;
    }));
    optionsEl.hidden = q.options.length === 0;

    textEl.hidden = !q.freeText;
    textEl.value = a.text;
    textEl.placeholder = q.placeholder ?? "";
    textEl.inputMode = q.id === "length" ? "numeric" : "text";
    textEl.setAttribute("aria-label", q.id === "length" ? "Number of slides" : "Your own answer");

    refsEl.hidden = q.id !== "references";
    if (q.id === "references") renderRefs();

    if (!keepFocus) {
      const first = optionsEl.querySelector('[aria-checked="true"]') || optionsEl.querySelector("button");
      (q.freeText && !q.options.length ? textEl : first || textEl).focus({ preventScroll: true });
    }
  }

  function isRefOptionOn(value) {
    if (value === "attach") return refs.some((r) => r.kind !== "text");
    if (value === "paste") return refs.some((r) => r.kind === "text") || !pasteBox.hidden;
    if (value === "none") return state.answers.references?.selected.includes("none") && refs.length === 0;
    return false;
  }

  function choose(value) {
    const q = state.questions[state.index];
    if (q.id === "references") return chooseReference(value);
    const a = answerOf(q.id);
    if (q.multi) {
      a.selected = a.selected.includes(value) ? a.selected.filter((v) => v !== value) : [...a.selected, value];
    } else {
      a.selected = a.selected.includes(value) && !(q.id in DEFAULTS) ? [] : [value];
      if (q.id === "length") a.text = "";
    }
    state.touched.add(q.id);
    render({ keepFocus: true });
    optionsEl.querySelector(`[data-value="${CSS.escape(value)}"]`)?.focus({ preventScroll: true });
  }

  /* ---- References --------------------------------------------------------- */
  function chooseReference(value) {
    const a = answerOf("references");
    state.touched.add("references");
    hideRefError();
    if (value === "attach") {
      if (refs.length >= MAX_REFERENCES) return showRefError(`A deck can use at most ${MAX_REFERENCES} references.`);
      fileInput.value = "";
      fileInput.click();
      return;
    }
    if (value === "paste") {
      pasteBox.hidden = false;
      render({ keepFocus: true });
      pasteText.focus();
      return;
    }
    // "No, work from my prompt" — a choice, and the way on.
    a.selected = ["none"];
    pasteBox.hidden = true;
    render({ keepFocus: true });
    go(1);
  }

  async function addFile(file) {
    if (refs.length >= MAX_REFERENCES) return showRefError(`A deck can use at most ${MAX_REFERENCES} references.`);
    if (file.size > MAX_REFERENCE_BYTES) return showRefError(`${file.name} is larger than 30 MB. Try a smaller file.`);
    const entry = { key: Symbol(file.name), name: file.name, kind: /\.(png|jpe?g|webp)$/i.test(file.name) ? "image" : "file", uploading: true };
    refs.push(entry);
    renderRefs();
    try {
      const saved = await api.uploadReference(file);
      Object.assign(entry, { id: saved.id, name: saved.name || file.name, kind: saved.kind, useOnSlides: !!saved.useOnSlides, uploading: false });
    } catch (err) {
      refs = refs.filter((r) => r !== entry);
      showRefError(err.message || `Could not read ${file.name}.`);
    }
    renderRefs();
    if (state?.questions[state.index]?.id === "references") render({ keepFocus: true });
  }

  async function addPasted() {
    const text = pasteText.value.trim();
    if (!text) { pasteText.focus(); return; }
    if (refs.length >= MAX_REFERENCES) return showRefError(`A deck can use at most ${MAX_REFERENCES} references.`);
    const entry = { key: Symbol("text"), name: "Pasted text", kind: "text", uploading: true };
    refs.push(entry);
    pasteAdd.disabled = true;
    renderRefs();
    try {
      const saved = await api.addTextReference(text);
      Object.assign(entry, { id: saved.id, name: saved.name || "Pasted text", kind: "text", uploading: false });
      pasteText.value = "";
      pasteBox.hidden = true;
    } catch (err) {
      refs = refs.filter((r) => r !== entry);
      showRefError(err.message || "Could not save this text.");
    } finally {
      pasteAdd.disabled = false;
    }
    renderRefs();
    if (state?.questions[state.index]?.id === "references") render({ keepFocus: true });
  }

  function removeRef(entry) {
    refs = refs.filter((r) => r !== entry);
    if (entry.id) api.deleteReference(entry.id).catch(() => {}); // best effort
    renderRefs();
    if (state?.questions[state.index]?.id === "references") render({ keepFocus: true });
  }

  async function toggleUseOnSlides(entry, on, input) {
    entry.useOnSlides = on;
    try {
      await api.setReferenceUseOnSlides(entry.id, on);
    } catch (err) {
      entry.useOnSlides = !on;
      input.checked = !on;
      showRefError(err.message || "Could not update this image.");
    }
  }

  function renderRefs() {
    refList.replaceChildren(...refs.map((r) => {
      const li = document.createElement("li");
      li.className = "ref-chip";
      if (r.uploading) li.classList.add("is-uploading");
      const row = document.createElement("span");
      row.className = "ref-chip__row";
      const name = document.createElement("span");
      name.className = "ref-chip__name";
      name.textContent = r.name;
      name.title = r.name;
      const meta = document.createElement("span");
      meta.className = "ref-chip__meta";
      meta.textContent = r.uploading ? "Reading…" : r.kind === "text" ? "Text" : r.kind === "image" ? "Image" : "File";
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "ref-chip__remove";
      remove.setAttribute("aria-label", `Remove ${r.name}`);
      remove.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
      remove.disabled = !!r.uploading;
      remove.addEventListener("click", () => removeRef(r));
      row.append(name, meta, remove);
      li.append(row);
      if (r.kind === "image" && !r.uploading) {
        const label = document.createElement("label");
        label.className = "ref-chip__toggle";
        const box = document.createElement("input");
        box.type = "checkbox";
        box.checked = !!r.useOnSlides;
        box.addEventListener("change", () => toggleUseOnSlides(r, box.checked, box));
        label.append(box, document.createTextNode("Use on slides"));
        li.append(label);
      }
      return li;
    }));
    refList.hidden = refs.length === 0;
  }

  function showRefError(message) { refError.textContent = message; refError.hidden = false; }
  function hideRefError() { refError.textContent = ""; refError.hidden = true; }

  /* ---- Events ------------------------------------------------------------- */
  optionsEl.addEventListener("click", (event) => {
    const b = event.target.closest(".coach2__opt");
    if (b && state) choose(b.dataset.value);
  });

  // Arrow keys move between pills, the way a radio group does.
  optionsEl.addEventListener("keydown", (event) => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) return;
    const buttons = [...optionsEl.querySelectorAll("button")];
    const i = buttons.indexOf(document.activeElement);
    if (i < 0) return;
    event.preventDefault();
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    buttons[(i + step + buttons.length) % buttons.length].focus();
  });

  textEl.addEventListener("input", () => {
    if (!state) return;
    const q = state.questions[state.index];
    const a = answerOf(q.id);
    a.text = textEl.value;
    state.touched.add(q.id);
    // A typed number replaces a chosen length.
    if (q.id === "length" && textEl.value.trim()) {
      a.selected = [];
      for (const b of optionsEl.children) b.setAttribute("aria-checked", "false");
    }
  });

  textEl.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.isComposing) return;
    event.preventDefault();
    go(1);
  });

  backBtn.addEventListener("click", () => state && go(-1));
  nextBtn.addEventListener("click", () => state && go(1));
  skipBtn.addEventListener("click", () => state && skip());
  goBtn.addEventListener("click", () => generate());
  closeBtn.addEventListener("click", () => close());

  fileInput.addEventListener("change", () => {
    const files = [...fileInput.files];
    fileInput.value = "";
    for (const file of files) addFile(file);
  });
  pasteAdd.addEventListener("click", () => addPasted());

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !state) return;
    event.preventDefault();
    close();
  });

  return {
    open,
    close,
    isOpen: () => state !== null,
    /** Generate pressed again on the composer: "take me to the form". */
    focus: () => {
      (optionsEl.querySelector('[aria-checked="true"]') || optionsEl.querySelector("button") || textEl).focus();
    },
  };
}
