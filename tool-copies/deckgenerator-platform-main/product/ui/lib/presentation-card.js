// =============================================================================
// Shared Presentation Card + Action Menu — M15 Phase 4 Slice 2.
//
// Extracted from presentations.js (Milestone M6), which was the only place
// this logic previously existed. Home and Library now both call into this
// one module instead of each owning their own copy — "one card/action
// implementation" (Slice 2's stated goal), not two.
//
// Owns every DOM node these actions need: the floating action menu, the
// Rename modal, and the Delete confirmation modal, plus a toast region —
// all built once, lazily, and injected into document.body on first use. No
// page's own HTML has to declare matching markup for any of this to work,
// which is why index.html needs none of it (Library's presentations.html
// used to hand-declare its own copies; those are now redundant and removed
// there too — see Slice 2 report).
//
// Deliberately does NOT own: search, sort, archive-view filtering,
// pagination, or page routing. Those stay exactly where they already were
// (presentations.js) — unique to Library, not a card/action concern.
//
// Every mutating action (rename/duplicate/archive/delete) takes an optional
// `onChange` callback, fired after the action succeeds, so each page decides
// for itself how to refresh its own list (Library re-runs its filtered
// fetchList(); Home re-runs its plain loadRecent()) — this module has no
// opinion on that.
// =============================================================================
import { api, ApiError } from "./api.js";
import { escapeHtml, cssEscape, trapFocus, formatDate } from "./dom.js";
import { buildStage } from "/js/render.js";

let ui = null; // lazily-built shared DOM refs — built once per page load

function ensureUi() {
  if (ui) return ui;

  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div class="toast-region" id="pc-toast-region" aria-live="polite"></div>
    <div class="card-menu" id="pc-card-menu" role="menu" hidden></div>

    <div class="modal-overlay" id="pc-rename-modal" hidden>
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="pc-rename-title">
        <h2 id="pc-rename-title">Rename presentation</h2>
        <form id="pc-rename-form" novalidate>
          <div class="field" id="pc-rename-field">
            <label for="pc-rename-input">Title</label>
            <input type="text" id="pc-rename-input" autocomplete="off" required />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn--ghost" id="pc-rename-cancel">Cancel</button>
            <button type="submit" class="btn btn--primary" id="pc-rename-save">Save</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal-overlay" id="pc-delete-modal" hidden>
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="pc-delete-title">
        <h2 id="pc-delete-title">Delete presentation</h2>
        <p id="pc-delete-body"></p>
        <div class="field">
          <label for="pc-delete-confirm-input">Type the title to confirm</label>
          <input type="text" id="pc-delete-confirm-input" autocomplete="off" />
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn--ghost" id="pc-delete-cancel">Cancel</button>
          <button type="button" class="btn btn--danger" id="pc-delete-confirm" disabled>Delete</button>
        </div>
      </div>
    </div>
  `
  );

  ui = {
    toastRegion: document.getElementById("pc-toast-region"),
    cardMenu: document.getElementById("pc-card-menu"),
    renameModal: document.getElementById("pc-rename-modal"),
    renameForm: document.getElementById("pc-rename-form"),
    renameField: document.getElementById("pc-rename-field"),
    renameInput: document.getElementById("pc-rename-input"),
    renameCancelBtn: document.getElementById("pc-rename-cancel"),
    renameSaveBtn: document.getElementById("pc-rename-save"),
    deleteModal: document.getElementById("pc-delete-modal"),
    deleteModalBody: document.getElementById("pc-delete-body"),
    deleteConfirmInput: document.getElementById("pc-delete-confirm-input"),
    deleteCancelBtn: document.getElementById("pc-delete-cancel"),
    deleteConfirmBtn: document.getElementById("pc-delete-confirm"),
  };

  wireCardMenu();
  wireRenameModal();
  wireDeleteModal();
  return ui;
}

/* ---- Card overflow menu (Context Menu component, §05) -------------------- */
let menuOpenFor = null; // { item, trigger, onChange }

function wireCardMenu() {
  document.addEventListener("click", (e) => {
    if (!ui.cardMenu.hidden && !ui.cardMenu.contains(e.target)) closeCardMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (ui.cardMenu.hidden) return;
    if (e.key === "Escape") { closeCardMenu(); return; }
    const items = Array.from(ui.cardMenu.querySelectorAll('[role="menuitem"]'));
    const idx = items.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); items[(idx + 1) % items.length]?.focus(); }
    if (e.key === "ArrowUp") { e.preventDefault(); items[(idx - 1 + items.length) % items.length]?.focus(); }
  });
}

function openCardMenu(trigger, item, onChange) {
  if (menuOpenFor?.trigger === trigger) { closeCardMenu(); return; }
  menuOpenFor = { item, trigger, onChange };

  const unarchiveLabel = item.status === "Archived" ? "Unarchive" : "Archive";
  ui.cardMenu.innerHTML = `
    <button type="button" role="menuitem" data-action="rename">Rename</button>
    <button type="button" role="menuitem" data-action="duplicate">Duplicate</button>
    <button type="button" role="menuitem" data-action="archive">${unarchiveLabel}</button>
    <button type="button" role="menuitem" class="danger" data-action="delete">Delete</button>
  `;

  // Measure while invisible (offsetWidth is 0 on a hidden element, which
  // painted the menu at the wrong x for one frame), then place it once.
  const rect = trigger.getBoundingClientRect();
  ui.cardMenu.style.visibility = "hidden";
  ui.cardMenu.hidden = false;
  const menuWidth = ui.cardMenu.offsetWidth;
  ui.cardMenu.style.top = `${rect.bottom + window.scrollY + 6}px`;
  ui.cardMenu.style.left = `${Math.max(8, rect.right + window.scrollX - menuWidth)}px`;
  ui.cardMenu.style.visibility = "";
  trigger.setAttribute("aria-expanded", "true");

  ui.cardMenu.querySelector('[data-action="rename"]').addEventListener("click", () => {
    closeCardMenu();
    openRenameModal(item, onChange);
  });
  ui.cardMenu.querySelector('[data-action="duplicate"]').addEventListener("click", () => {
    closeCardMenu();
    handleDuplicate(item, onChange);
  });
  ui.cardMenu.querySelector('[data-action="archive"]').addEventListener("click", () => {
    closeCardMenu();
    handleArchiveToggle(item, onChange);
  });
  ui.cardMenu.querySelector('[data-action="delete"]').addEventListener("click", () => {
    closeCardMenu();
    openDeleteModal(item, onChange);
  });

  ui.cardMenu.querySelector('[role="menuitem"]').focus();
}

function closeCardMenu() {
  if (!menuOpenFor) return;
  menuOpenFor.trigger.setAttribute("aria-expanded", "false");
  // Restore focus only when the menu owns it — an outside click into e.g.
  // the search field must not have its focus yanked back to the "⋯" button.
  if (ui.cardMenu.contains(document.activeElement)) menuOpenFor.trigger.focus();
  ui.cardMenu.hidden = true;
  menuOpenFor = null;
}

/* ---- Rename (new in Slice 2 — supersedes M6 decision B: Rename is now
   reachable from the shared card menu on both Home and Library, not just
   Presentation Detail's inline title edit, which is untouched). Reuses the
   existing .modal/.field/.modal-actions conventions and the same
   api.updatePresentation call Detail's inline rename already uses — no new
   backend endpoint. ------------------------------------------------------- */
let renameTarget = null; // { item, onChange }

function wireRenameModal() {
  ui.renameForm.addEventListener("submit", (e) => { e.preventDefault(); confirmRename(); });
  ui.renameCancelBtn.addEventListener("click", closeRenameModal);
  ui.renameModal.addEventListener("click", (e) => { if (e.target === ui.renameModal) closeRenameModal(); });
  document.addEventListener("keydown", (e) => {
    if (ui.renameModal.hidden) return;
    if (e.key === "Escape") closeRenameModal();
    if (e.key === "Tab") trapFocus(e, ui.renameModal);
  });
}

function openRenameModal(item, onChange) {
  renameTarget = { item, onChange };
  clearFieldError(ui.renameField);
  ui.renameInput.value = item.title;
  ui.renameModal.hidden = false;
  ui.renameInput.focus();
  ui.renameInput.select();
}

function closeRenameModal() {
  const trigger = document.querySelector(`[data-id="${cssEscape(renameTarget?.item.id || "")}"] .card-menu-btn`);
  ui.renameModal.hidden = true;
  renameTarget = null;
  trigger?.focus();
}

async function confirmRename() {
  if (!renameTarget) return;
  const { item, onChange } = renameTarget;

  const next = ui.renameInput.value.trim();
  clearFieldError(ui.renameField);
  if (!next) {
    setFieldError(ui.renameField, "Give your presentation a title.");
    ui.renameInput.focus();
    return;
  }

  ui.renameSaveBtn.disabled = true;
  try {
    await api.updatePresentation(item.id, { title: next });
    ui.renameModal.hidden = true;
    renameTarget = null;
    showToast("Presentation renamed.", "success");
    onChange?.();
  } catch (err) {
    setFieldError(ui.renameField, err instanceof ApiError ? err.message : "Could not rename the presentation.");
  } finally {
    ui.renameSaveBtn.disabled = false;
  }
}

/* ---- Duplicate / Archive ---------------------------------------------- */
async function handleDuplicate(item, onChange) {
  try {
    await api.duplicatePresentation(item.id);
    // Journey 11: "New card titled '(copy)' appears" — the refetch itself
    // is the feedback (Constitution Rule 09: inline while on-screen), same
    // as the original Library implementation — no toast added here.
    onChange?.();
  } catch (err) {
    showToast(err instanceof ApiError ? err.message : "Could not duplicate the presentation.", "error");
  }
}

async function handleArchiveToggle(item, onChange) {
  const archiving = item.status !== "Archived";
  try {
    await api.archivePresentation(item.id, archiving);
    // Journey 12: "Toast confirmation, card moves to Archived filter."
    showToast(archiving ? "Presentation archived." : "Presentation restored.", "success");
    onChange?.();
  } catch (err) {
    showToast(err instanceof ApiError ? err.message : "Could not update the presentation.", "error");
  }
}

/* ---- Delete — two-step "type to confirm" Confirmation Modal (§05, decision F) */
let deleteTarget = null; // { item, onChange }

function wireDeleteModal() {
  ui.deleteConfirmInput.addEventListener("input", () => {
    ui.deleteConfirmBtn.disabled = ui.deleteConfirmInput.value !== deleteTarget?.item.title;
  });
  ui.deleteCancelBtn.addEventListener("click", closeDeleteModal);
  ui.deleteConfirmBtn.addEventListener("click", confirmDelete);
  document.addEventListener("keydown", (e) => {
    if (ui.deleteModal.hidden) return;
    if (e.key === "Escape") closeDeleteModal();
    // "Never accidental-click-outside dismissible for the two-step variant"
    // (§05) — Escape is still offered as the one deliberate keyboard exit;
    // click-outside is not wired at all.
    if (e.key === "Tab") trapFocus(e, ui.deleteModal);
  });
}

function openDeleteModal(item, onChange) {
  deleteTarget = { item, onChange };
  ui.deleteModalBody.textContent = `This permanently deletes “${item.title}.” This can't be undone.`;
  ui.deleteConfirmInput.value = "";
  ui.deleteConfirmBtn.disabled = true; // never default-enabled/focused (§05)
  ui.deleteModal.hidden = false;
  ui.deleteConfirmInput.focus();
}

function closeDeleteModal() {
  const trigger = document.querySelector(`[data-id="${cssEscape(deleteTarget?.item.id || "")}"] .card-menu-btn`);
  ui.deleteModal.hidden = true;
  deleteTarget = null;
  trigger?.focus();
}

async function confirmDelete() {
  if (!deleteTarget || ui.deleteConfirmInput.value !== deleteTarget.item.title) return;
  const { item, onChange } = deleteTarget;
  ui.deleteConfirmBtn.disabled = true;
  try {
    await api.deletePresentation(item.id);
    ui.deleteModal.hidden = true;
    deleteTarget = null;
    // Journey 13: "Card removed" — no toast specified for this journey.
    onChange?.();
  } catch (err) {
    ui.deleteConfirmBtn.disabled = false;
    showToast(err instanceof ApiError ? err.message : "Could not delete the presentation.", "error");
  }
}

/* ---- Toast (§12: "A foreground action completes cleanly" → success toast) */
function showToast(message, kind) {
  const toast = document.createElement("div");
  toast.className = `toast toast--${kind}`;
  toast.setAttribute("role", "status");
  toast.textContent = message;
  ui.toastRegion.appendChild(toast);
  setTimeout(() => toast.remove(), kind === "error" ? 6000 : 4000);
}

/**
 * The card overflow menu, opened against any trigger element — used by the
 * app shell's Recent rows so the sidebar gets Rename / Duplicate / Archive /
 * Delete without a second action implementation. `ensureUi()` is called here
 * because a sidebar row can open the menu before any card has rendered.
 *
 * The trigger should carry class `card-menu-btn` and sit inside an element
 * with a matching `data-id`, so the modals can restore focus to it on close.
 *
 * @param {HTMLElement} trigger
 * @param {object} item - a Presentation summary
 * @param {() => void} [onChange] - fired after a mutating action succeeds
 */
export function openPresentationMenu(trigger, item, onChange) {
  ensureUi();
  openCardMenu(trigger, item, onChange);
}

/* ---- Card builder (Presentation Card — grid variant, §05) ----------------- */
/**
 * @param {object} item - a Presentation summary (id, title, status,
 *   slideCount, updatedAt, ...) as returned by GET /api/presentations.
 * @param {{ onChange?: () => void, exported?: boolean }} [opts] - onChange
 *   fires after rename/duplicate/archive/delete succeeds, so the caller can
 *   refresh its own list however it sees fit; exported (Home-only, Slice 2)
 *   shows the additional "Exported" badge next to the status pill.
 */
export async function buildPresentationCard(item, { onChange, exported = false } = {}) {
  ensureUi();

  const card = document.createElement("div");
  card.className = "deck-card lib-card";
  card.dataset.id = item.id;

  const link = document.createElement("a");
  link.className = "lib-card__stretched-link";
  link.href = `detail.html?id=${encodeURIComponent(item.id)}`; // Journey 4 (Phase 3 §03): opens Presentation Detail (M7)
  link.setAttribute("aria-label", item.title);

  const thumb = document.createElement("div");
  thumb.className = "deck-card__thumb";
  const frame = document.createElement("div");
  frame.className = "deck-card__frame";
  thumb.appendChild(frame);

  const menuBtn = document.createElement("button");
  menuBtn.type = "button";
  menuBtn.className = "card-menu-btn";
  menuBtn.setAttribute("aria-haspopup", "menu");
  menuBtn.setAttribute("aria-expanded", "false");
  menuBtn.setAttribute("aria-label", `More actions for ${item.title}`);
  menuBtn.textContent = "⋯";
  menuBtn.addEventListener("click", (e) => { e.stopPropagation(); openCardMenu(menuBtn, item, onChange); });

  const meta = document.createElement("div");
  meta.className = "deck-card__meta";
  const slideLabel = item.slideCount === 1 ? "1 slide" : `${item.slideCount} slides`;
  meta.innerHTML =
    `<h3 class="deck-card__title">${escapeHtml(item.title)}</h3>` +
    `<div class="deck-card__foot">` +
      `<span class="status" data-status="${escapeHtml(item.status)}">${escapeHtml(item.status)}</span>` +
      (exported ? `<span class="status" data-status="Exported">Exported</span>` : "") +
      `<span>${slideLabel}</span>` +
      `<span>${formatDate(item.updatedAt)}</span>` +
    `</div>`;

  card.append(link, thumb, menuBtn, meta);

  try {
    const deck = await api.getDeck(item.id);
    const first = deck.slides?.[0];
    if (first) {
      thumb.dataset.theme = first.theme || "light";
      const stage = buildStage(first, deck.meta);
      stage.classList.add("is-thumb");
      frame.appendChild(stage);
      requestAnimationFrame(() => {
        frame.style.transform = `scale(${thumb.clientWidth / 1920})`;
      });
    }
  } catch {
    // One thumbnail failing must never blank the grid.
  }

  return card;
}

/** Keeps every shared card's thumbnail correctly scaled on resize — call
 * from each page's own `resize` listener (Phase 3 §04's responsive rule). */
export function rescalePresentationCardThumbs() {
  // Batch all reads before all writes (clientWidth read + transform write
  // interleaved per card forces one layout pass per thumbnail).
  const jobs = [];
  for (const thumb of document.querySelectorAll(".lib-card .deck-card__thumb")) {
    const frame = thumb.querySelector(".deck-card__frame");
    if (frame && frame.firstChild) jobs.push([frame, thumb.clientWidth / 1920]);
  }
  for (const [frame, scale] of jobs) frame.style.transform = `scale(${scale})`;
}

/* ---- Helpers -------------------------------------------------------------- */
function setFieldError(field, message) {
  field.classList.add("is-invalid");
  let el = field.querySelector(".field-error");
  if (!el) {
    el = document.createElement("p");
    el.className = "field-error";
    field.appendChild(el);
  }
  el.textContent = message;
  field.querySelector("input, select, textarea")?.setAttribute("aria-invalid", "true");
}
function clearFieldError(field) {
  field.classList.remove("is-invalid");
  field.querySelector(".field-error")?.remove();
  field.querySelector("input, select, textarea")?.removeAttribute("aria-invalid");
}

