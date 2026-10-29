// =============================================================================
// Shared DOM utilities — one definition each for the helpers that had grown
// per-screen copies (escapeHtml ×7, trapFocus ×4 with diverging selectors,
// formatDate ×4 with three behaviours, toast ×3, cssEscape ×3, formatSize ×2).
// Screens import from here; behaviour is the superset the screens relied on.
// =============================================================================

export function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function cssEscape(s) {
  return window.CSS?.escape ? CSS.escape(s) : String(s).replace(/["\\]/g, "\\$&");
}

/**
 * Keeps Tab/Shift+Tab inside `container`. Skips disabled and hidden
 * controls — a trap whose last element is a disabled confirm button
 * otherwise "focuses" a no-op node and leaks focus to the page behind
 * (exactly the two-step delete modals' shape).
 */
export function trapFocus(e, container) {
  const nodes = [...container.querySelectorAll(
    "button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])"
  )].filter((el) => el.offsetParent !== null || el === document.activeElement);
  if (!nodes.length) return;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

/** "Today" / "Yesterday" / short date — the richest of the copies. */
export function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const startOfDay = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(today) - startOfDay(d)) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-US", {
    day: "numeric", month: "short",
    year: d.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

export function formatSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Toast into `#toast-region` (or a supplied region), created on demand. */
export function toast(message, kind = "info", regionEl = null) {
  let region = regionEl || document.getElementById("toast-region");
  if (!region) {
    region = document.createElement("div");
    region.id = "toast-region";
    region.className = "toast-region";
    document.body.appendChild(region);
  }
  const el = document.createElement("div");
  el.className = `toast toast--${kind}`;
  el.setAttribute("role", "status");
  el.textContent = message;
  region.appendChild(el);
  setTimeout(() => el.remove(), kind === "error" ? 6000 : 4000);
  return el;
}
