// =============================================================================
// Theme — light · dark · auto.
//
// Auto is the DEFAULT and is not a stored value: when no explicit choice
// exists the attribute is absent, and app.css's `prefers-color-scheme`
// block does the work. That means the OS appearance changing mid-session
// re-themes the app live, with no listener and no reload — and it also
// means the very first paint is already correct (see the inline snippet in
// each page's <head>), so there is never a flash of the wrong theme.
// =============================================================================
const KEY = "nps:theme";
const MODES = ["auto", "light", "dark"];

export function getThemeMode() {
  const stored = localStorage.getItem(KEY);
  return MODES.includes(stored) ? stored : "auto";
}

export function applyTheme(mode) {
  const next = MODES.includes(mode) ? mode : "auto";
  if (next === "auto") {
    localStorage.removeItem(KEY);
    document.documentElement.removeAttribute("data-theme");
  } else {
    localStorage.setItem(KEY, next);
    document.documentElement.setAttribute("data-theme", next);
  }
  document.dispatchEvent(new CustomEvent("theme:changed", { detail: { mode: next } }));
  return next;
}

const ICONS = {
  auto: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
           <circle cx="12" cy="12" r="8"/><path d="M12 4v16" /><path d="M12 4a8 8 0 0 1 0 16" fill="currentColor" stroke="none"/></svg>`,
  light: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2M12 19.4v2M2.6 12h2M19.4 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/></svg>`,
  dark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true">
           <path d="M20 13.4A8.4 8.4 0 1 1 10.6 4a6.6 6.6 0 0 0 9.4 9.4Z"/></svg>`,
};
const LABELS = { auto: "Match system", light: "Light", dark: "Dark" };

/** Renders the three-state control. Returns the element. */
export function buildThemeSwitch() {
  const wrap = document.createElement("div");
  wrap.className = "theme-switch";
  wrap.setAttribute("role", "group");
  wrap.setAttribute("aria-label", "Appearance");
  wrap.innerHTML = MODES.map((m) => `
    <button type="button" class="theme-switch__btn" data-mode="${m}"
            title="${LABELS[m]}" aria-label="${LABELS[m]}">${ICONS[m]}</button>`).join("");

  const sync = () => {
    const active = getThemeMode();
    for (const b of wrap.querySelectorAll(".theme-switch__btn")) {
      b.setAttribute("aria-pressed", String(b.dataset.mode === active));
    }
  };
  wrap.addEventListener("click", (e) => {
    const mode = e.target.closest("[data-mode]")?.dataset.mode;
    if (!mode) return;
    applyTheme(mode);
    sync();
  });
  sync();
  return wrap;
}
