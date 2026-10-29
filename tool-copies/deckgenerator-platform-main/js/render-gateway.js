// =============================================================================
// Engine Gateway (Milestone M1 — Phase 4 §02, Phase 1 §01).
// Extended additively at Milestone M3 (Decision C) — see below.
//
// renderFixture() below is byte-for-byte the Milestone M1 implementation:
// same FIXTURE object, same ?slide= handling, same buildStage() call, same
// label text. It is preserved as a permanent regression test — the exact
// checks in the M1 implementation report (render.html?slide=0 and
// render.html?slide=1, compared pixel-for-pixel against deck.html) must
// keep passing unchanged, forever.
//
// renderLive() is the M3 addition: when a real presentation id is supplied
// via ?id=, it fetches the deck definition from the Backend API
// (Milestone M3, product/application) instead of using the hardcoded
// fixture, and renders it through the exact same buildStage() call.
// Nothing about M1's code path changes when ?id= is absent.
// =============================================================================
import { buildStage } from "./render.js";

const FIXTURE = {
  meta: {
    id: "assa-abloy-connect",
    kind: "presentation",
    basedOn: "main-template",
    title: "ASSA ABLOY — Connect Experience",
    description: "The experience continuity layer — POV, workshop proof, and a year-end MVP.",
    created: "2026-06-06",
    footer: {
      col1: "Connect Experience",
      col2: "ASSA ABLOY",
      col3: "2026",
      copyright: "© 2026",
    },
  },
  slides: [
    {
      template: "lead-statement",
      theme: "dark",
      eyebrow: "Main point of view",
      heading: "The experience continuity layer",
      body: "Users may log in once, but they still cross systems to finish one job. The design has to carry intent, identity, entitlement, brand, project and order context through the flow.",
    },
    {
      template: "slide-10",
      theme: "light",
      title: "Confidentiality Statement",
      body: "This document contains proprietary and confidential information and shall not be used, reproduced, or disclosed to third parties, in whole or in part, for any purpose other than to evaluate this document, without the prior written consent of Nagarro.",
    },
  ],
};

const viewport = document.getElementById("viewport");
const label = document.getElementById("proof-label");
const params = new URLSearchParams(location.search);

function fit() {
  const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  const x = (window.innerWidth - 1920 * s) / 2;
  const y = (window.innerHeight - 1080 * s) / 2;
  viewport.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
}
window.addEventListener("resize", fit);

// ---- M1 — unmodified, permanent regression path ---------------------------
function renderFixture() {
  const requested = parseInt(params.get("slide"), 10);
  const index = Number.isInteger(requested) && FIXTURE.slides[requested] ? requested : 0;

  const slide = FIXTURE.slides[index];
  const stage = buildStage(slide, FIXTURE.meta);
  stage.classList.add("is-active");
  viewport.appendChild(stage);

  label.innerHTML =
    `<b>Engine Gateway — M1 proof</b> · slide ${index + 1} of ${FIXTURE.slides.length} ` +
    `· template <code>${slide.template}</code> · theme ${slide.theme} ` +
    `· compare against <code>deck.html?id=${FIXTURE.meta.id}#${index + 1}</code>`;

  document.title = `Engine Gateway — ${FIXTURE.meta.title}`;
  fit();
}

/* ---- live data from the Backend API ---------------------------------------
 *
 * Same origin as the page. This was hardcoded to http://localhost:4600 from
 * the era when a Python file server and the API ran on different ports — but
 * one server has served both for a while now, and the launcher deliberately
 * moves to the next free port when 4600 is taken. So the viewer failed with
 * "make sure the API server is running" on exactly the machines the launcher
 * exists to handle, and inside the editor, which embeds this as an iframe.
 *
 * An empty base makes every request relative, which is right in the one-server
 * world and needs no configuration. In the split setup serve.py injects
 * <meta name="api-base"> (the same tag api.js reads); window.__API_BASE is
 * honoured too. Reading only the window variable left every live preview
 * calling the static server and failing with "API returned 404". */
const API_BASE = typeof window !== "undefined"
  ? (window.__API_BASE || document.querySelector('meta[name="api-base"]')?.content || "")
  : "";

async function renderLive(id) {
  label.innerHTML = `<b>Engine Gateway — live</b> · loading presentation <code>${id}</code>…`;

  let deck;
  try {
    // Milestone M4 (Decision I): the API now requires a session, carried by
    // an HTTP-only cookie, so this request must be credentialed. Without
    // credentials: "include" the browser omits the cookie cross-origin and
    // every live load would 401.
    const res = await fetch(`${API_BASE}/api/presentations/${encodeURIComponent(id)}/deck`, {
      credentials: "include",
    });
    if (res.status === 401) throw new Error("not signed in (401)");
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    deck = await res.json();
  } catch (err) {
    label.hidden = false;
    label.innerHTML = `<b>Couldn't load this presentation</b> · ${err.message} · make sure the API server is running, then reload.`;
    return;
  }
  if (!deck || !Array.isArray(deck.slides) || deck.slides.length === 0) {
    label.innerHTML = `<b>Engine Gateway — live</b> · presentation <code>${id}</code> has no slides.`;
    return;
  }

  const requested = parseInt(params.get("slide"), 10);
  const index = Number.isInteger(requested) && deck.slides[requested] ? requested : 0;
  const slide = deck.slides[index];
  const stage = buildStage(slide, deck.meta);
  stage.classList.add("is-active");
  viewport.appendChild(stage);

  // The proof label is a dev/diagnostic affordance: keep it while loading
  // and on failure, but never over a successfully rendered slide — the
  // embedding product surfaces (Detail, Present) show users this frame.
  label.hidden = true;

  document.title = `Engine Gateway — ${deck.meta.title}`;
  fit();
}

// ---- boot -------------------------------------------------------------------
const presentationId = params.get("id");
if (presentationId) {
  renderLive(presentationId);
} else {
  renderFixture();
}
