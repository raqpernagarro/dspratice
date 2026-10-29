// test/pages.smoke.test.js
// =============================================================================
// Does each page actually DO its job in a browser?
//
// This exists because of a bug that got past everything else. A field-kind
// refactor used `export { x as y }` — an export alias, which creates no local
// binding — so an internal call threw at runtime inside the editor's render.
// The canvas came up blank on every deck. `node --check` passed. All 106 tests
// passed. The browser console was silent, because the throw happened inside a
// caller that swallowed it. It was found by accident.
//
// Every test in this repo was a unit or an API call. Not one loaded a page, so
// the suite could not see the product at all: a blank canvas, a dead panel, a
// page that throws on load — none of it was observable.
//
// These are deliberately shallow and few. They do not test behaviour; they
// assert each page rendered the thing it exists to render, and that nothing
// threw. That is the class of failure the rest of the suite is blind to.
// =============================================================================
import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { startTestServer } from "./helpers/server.js";

let server;
let browser;
let seeded;

before(async () => {
  server = await startTestServer();
  const { chromium } = await import("playwright");
  browser = await chromium.launch();
  seeded = await seedPresentation();
}, { timeout: 120_000 });

after(async () => {
  await browser?.close();
  await server?.stop();
});

/** A deck with a light slide and a dark one, so the editor has something real
 *  to render and the dark path is exercised too. */
async function seedPresentation() {
  const { allTemplates } = await import("../js/templates/index.js");
  const cover = allTemplates.find((t) => t.name === "core/cover-single");
  const content = allTemplates.find((t) => t.name === "core/content-twocol");
  const body = {
    title: "Smoke test deck",
    slides: [
      {
        order: 0,
        templateReference: { templateName: cover.name, templateVersion: 1, templatePackId: "main-template" },
        themeOverride: "dark",
        content: { ...cover.example, title: "A dark cover", subtitle: "For the smoke test" },
      },
      {
        order: 1,
        templateReference: { templateName: content.name, templateVersion: 1, templatePackId: "main-template" },
        content: { ...content.example, title: "A light content slide" },
      },
    ],
  };
  const res = await fetch(`${server.origin}/api/presentations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: server.origin },
    body: JSON.stringify(body),
  });
  assert.equal(res.status, 201, "could not seed a presentation for the smoke tests");
  return res.json();
}

/** Opens `path`, collecting anything the page threw or logged as an error. */
async function open(path, viewport = { width: 1440, height: 900 }) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (e) => errors.push(`uncaught: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
  page.on("requestfailed", (r) => errors.push(`request failed: ${r.url()}`));
  const res = await page.goto(`${server.origin}${path}`, { waitUntil: "networkidle" });
  return { page, errors, status: res?.status() };
}

describe("every page loads without throwing", () => {
  const PAGES = [
    ["/", "the home page"],
    ["/templates.html", "the template gallery"],
    ["/presentations.html", "the library"],
    ["/export-jobs.html", "export activity"],
    ["/login.html", "the sign-in page"],
  ];

  for (const [path, label] of PAGES) {
    test(`${label} (${path})`, async () => {
      const { page, errors, status } = await open(path);
      try {
        assert.equal(status, 200);
        assert.deepEqual(errors, [], `${path} reported errors`);
      } finally {
        await page.close();
      }
    });
  }
});

describe("the home page markup", () => {
  test("has the getting-started guide link, the coach form and the drafting stages", async () => {
    const { page, errors } = await open("/");
    try {
      const found = await page.evaluate(() => ({
        guideLink: !!document.getElementById("guide-link"),
        guidePanelHidden: document.getElementById("guide-panel")?.hidden,
        // Task 10's form container is #coach (class .coach2); there is no #coach2.
        coach: !!document.getElementById("coach"),
        prompt: !!document.getElementById("prompt"),
        stages: [...document.querySelectorAll("#build-stages [data-stage]")].map((li) => li.dataset.stage),
      }));
      assert.ok(found.guideLink, "no #guide-link on the home page");
      assert.equal(found.guidePanelHidden, true, "the guide must start closed");
      assert.ok(found.coach, "no #coach form container");
      assert.ok(found.prompt);
      assert.deepEqual(found.stages.slice(0, 3), ["understanding", "story", "drafting"]);
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });
});

describe("the home page, final fix round", () => {
  test("compose-stage labels do not echo the drafting ones", async () => {
    const { page, errors } = await open("/");
    try {
      const labels = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll("#build-stages [data-stage]")]
        .map((li) => [li.dataset.stage, li.querySelector(".build__label")?.textContent.trim()])));
      assert.equal(labels.analyzing, "Sorting the slides");
      assert.equal(labels.planning, "Planning sections");
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });

  test("Esc closes the guide with focus outside it, and stops listening once closed", async () => {
    const { page, errors } = await open("/");
    try {
      await page.click("#guide-link");
      assert.equal(await page.evaluate(() => document.getElementById("guide-panel").hidden), false);
      await page.focus("#prompt");
      await page.keyboard.press("Escape");
      assert.equal(await page.evaluate(() => document.getElementById("guide-panel").hidden), true, "Esc in the composer left the guide open");
      assert.equal(await page.evaluate(() => document.activeElement?.id), "prompt", "focus stays where it was");
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });
});

describe("the home page: opening message and prompt starters", () => {
  test("the opening message shows the twelve points; the live checklist is gone", async () => {
    const { page, errors } = await open("/");
    try {
      const found = await page.evaluate(() => ({
        introShown: !document.getElementById("intro").hidden,
        points: document.querySelectorAll("#intro .intro__points li").length,
        checklist: !!document.getElementById("brief-pills"),
      }));
      assert.equal(found.introShown, true);
      assert.equal(found.points, 12);
      assert.equal(found.checklist, false, "the live checklist under the composer was removed");
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });

  test("a starter pill puts its full prompt in the box; Start from this list puts the twelve headings", async () => {
    const { page, errors } = await open("/");
    try {
      const pills = await page.$$eval("#starters .starter__btn", (bs) => bs.map((b) => b.textContent.trim()));
      assert.ok(pills.length >= 4, JSON.stringify(pills));
      assert.ok(pills.every((t) => t.split(/\s+/).length <= 3), `pills are two or three words: ${pills}`);
      await page.click("#starters .starter__btn");
      const filled = await page.evaluate(() => ({
        prompt: document.getElementById("prompt").value,
        generate: !document.getElementById("create-submit").disabled,
      }));
      assert.ok(filled.prompt.length > 150, "the full prompt, not the pill's label");
      assert.equal(filled.generate, true);
      await page.click("#intro .intro__use");
      const lines = (await page.inputValue("#prompt")).split("\n");
      assert.equal(lines.length, 12);
      assert.match(lines[0], /^1\. Topic and key messages: $/);
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });

  /* Like a chat: the composer is docked at the bottom of the screen and only
   * the thread above it scrolls — on a laptop, on a phone, with the guide open. */
  for (const [label, viewport] of [["a laptop", { width: 1470, height: 830 }], ["a phone", { width: 375, height: 812 }]]) {
    test(`on ${label} the prompt box is docked at the bottom, also with the guide open`, async () => {
      const { page, errors } = await open("/", viewport);
      try {
        // The dock rises into place on load; measure once it has settled.
        await page.waitForTimeout(1000);
        const measure = () => page.evaluate(() => ({
          formBottom: document.getElementById("create-form").getBoundingClientRect().bottom,
          dockBottom: document.querySelector(".create__dock").getBoundingClientRect().bottom,
          pageScroll: document.scrollingElement.scrollTop + document.body.scrollTop,
          pageHeight: document.documentElement.scrollHeight,
        }));
        const before = await measure();
        await page.click("#guide-link");
        await page.waitForTimeout(400);
        const after = await measure();
        for (const m of [before, after]) {
          assert.ok(Math.abs(m.dockBottom - viewport.height) <= 1, `the dock ends at ${Math.round(m.dockBottom)}px, not the bottom (${viewport.height}px)`);
          assert.ok(m.formBottom <= viewport.height && m.formBottom > viewport.height - 140, `the prompt box ends at ${Math.round(m.formBottom)}px`);
          assert.equal(m.pageScroll, 0, "the page scrolled instead of the thread");
          assert.ok(m.pageHeight <= viewport.height, `the page is ${m.pageHeight}px tall on a ${viewport.height}px screen`);
        }
        assert.deepEqual(errors, []);
      } finally {
        await page.close();
      }
    });
  }

  test("the guide holds how it works, figures, pictures and the look as tabs", async () => {
    const { page, errors } = await open("/");
    try {
      await page.click("#guide-link");
      const tabs = await page.$$eval("#guide-panel [role=tab]", (ts) => ts.map((t) => t.textContent.trim()));
      assert.deepEqual(tabs.slice(0, 4), ["How it works", "Figures", "Pictures", "The look"]);
      const visible = () => page.$$eval("#guide-panel [role=tabpanel]", (ps) => ps.filter((p) => !p.hidden).map((p) => p.id));
      assert.deepEqual(await visible(), ["guide-pane-how"]);
      await page.click("#guide-tab-pictures");
      assert.deepEqual(await visible(), ["guide-pane-pictures"]);
      await page.keyboard.press("ArrowRight");
      assert.deepEqual(await visible(), ["guide-pane-look"]);
      assert.equal(await page.evaluate(() => document.activeElement?.id), "guide-tab-look");
      assert.match(await page.textContent("#guide-pane-look"), /dark/);
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });

  test("with the guide open, the greeting stays reachable and the rail stays put", async () => {
    const { page, errors } = await open("/");
    try {
      await page.click("#guide-link");
      const scrolled = await page.evaluate(() => {
        const thread = document.getElementById("create-thread");
        thread.scrollTop = 0;
        const headTop = document.querySelector(".create__head").getBoundingClientRect().top;
        thread.scrollTop = thread.scrollHeight;
        return {
          headTop,
          railTop: document.querySelector(".shell__side").getBoundingClientRect().top,
          pageScroll: document.scrollingElement.scrollTop + document.body.scrollTop,
          overflows: thread.scrollHeight > thread.clientHeight,
        };
      });
      assert.equal(scrolled.overflows, true, "the fixture needs content taller than the window");
      assert.ok(scrolled.headTop >= 0, `the greeting was cut off above the top (${scrolled.headTop}px)`);
      assert.equal(scrolled.railTop, 0, "the rail scrolled away");
      assert.equal(scrolled.pageScroll, 0, "the page itself scrolled instead of the Create area");
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });
});

/* On a phone the rail is a top bar. With labelled nav rows and the theme
 * switch it needed ~544px, which widened every shell page past a 375px screen. */
describe("the shell fits a phone", () => {
  for (const [path, width] of [["/", 375], ["/", 320], ["/templates.html", 375], ["/presentations.html", 375]]) {
    test(`${path} at ${width}px has no sideways scroll`, async () => {
      const { page, errors } = await open(path, { width, height: 800 });
      try {
        const found = await page.evaluate(() => ({
          width: document.documentElement.scrollWidth,
          navNames: [...document.querySelectorAll(".nav-row")].map((a) => a.textContent.trim()),
        }));
        assert.ok(found.width <= width, `page is ${found.width}px wide on a ${width}px screen`);
        assert.ok(found.navNames.every(Boolean), "icon-only nav rows keep their names");
        assert.deepEqual(errors, []);
      } finally {
        await page.close();
      }
    });
  }
});

/* The deck viewer is exactly one screen tall. The slide used to be sized as
 * "100vh minus 210px", so a header that grew (the two-line notice about
 * default layouts) pushed the toolbar — counter, PDF, PPTX — off the bottom. */
describe("the deck viewer fits the window", () => {
  for (const viewport of [{ width: 1470, height: 830 }, { width: 1280, height: 600 }, { width: 375, height: 812 }]) {
    test(`at ${viewport.width}×${viewport.height}, with a two-line notice, the toolbar stays on screen`, async () => {
      const { page, errors } = await open(`/?id=${seeded.id}`, viewport);
      try {
        await page.waitForSelector(".ws.is-open .ws__canvas", { timeout: 15_000 });
        await page.evaluate(() => {
          const n = document.getElementById("ws-notice");
          n.textContent = "19 of 19 slides use a default layout, because the layouts for them could not be chosen. Pick a layout for those slides in the editor.";
          n.hidden = false;
        });
        await page.waitForTimeout(800); // the open transition settles
        const m = await page.evaluate(() => {
          const r = (s) => document.querySelector(s).getBoundingClientRect();
          return {
            toolsBottom: r(".ws__tools").bottom, toolsTop: r(".ws__tools").top,
            canvasBottom: r(".ws__canvas").bottom, canvasHeight: r(".ws__canvas").height,
            pageH: document.documentElement.scrollHeight, pageW: document.documentElement.scrollWidth,
          };
        });
        assert.ok(m.toolsBottom <= viewport.height + 1, `the toolbar ends at ${Math.round(m.toolsBottom)}px on a ${viewport.height}px window`);
        assert.ok(m.canvasBottom <= m.toolsTop, "the slide overlaps the toolbar");
        assert.ok(m.canvasHeight > 100, "the slide collapsed");
        assert.ok(m.pageH <= viewport.height, `the page is ${m.pageH}px tall`);
        assert.ok(m.pageW <= viewport.width, `the page is ${m.pageW}px wide`);
        assert.deepEqual(errors, []);
      } finally {
        await page.close();
      }
    });
  }
});

describe("the editor renders a slide", () => {
  test("the canvas contains a rendered stage, not an empty box", async () => {
    const { page, errors } = await open(`/editor.html?id=${seeded.id}`);
    try {
      await page.waitForSelector("#ed-canvas .stage", { timeout: 15_000 });
      const found = await page.evaluate(() => {
        const canvas = document.getElementById("ed-canvas");
        const stage = canvas?.querySelector(".stage");
        const text = (stage?.textContent || "").trim();
        return {
          hasStage: !!stage,
          textLength: text.length,
          theme: stage?.dataset?.theme || null,
          background: stage ? getComputedStyle(stage).backgroundColor : null,
        };
      });
      // The exact failure this file exists for: a canvas holding only a
      // skeleton, with the slide never mounted.
      assert.ok(found.hasStage, "the editor canvas has no stage in it");
      assert.ok(found.textLength > 20, `the stage rendered almost no text (${found.textLength} chars)`);
      assert.deepEqual(errors, [], "the editor reported errors");
    } finally {
      await page.close();
    }
  });

  test("a dark slide actually renders dark", async () => {
    const { page } = await open(`/editor.html?id=${seeded.id}`);
    try {
      await page.waitForSelector("#ed-canvas .stage", { timeout: 15_000 });
      const look = await page.evaluate(() => {
        const stage = document.querySelector("#ed-canvas .stage");
        const root = stage?.querySelector(".v2f-root");
        return {
          theme: stage?.dataset?.theme,
          rootBg: root ? getComputedStyle(root).backgroundColor : null,
          rootColor: root ? getComputedStyle(root).color : null,
        };
      });
      assert.equal(look.theme, "dark", "slide 1 was seeded dark");
      // Dark means the template repainted itself, not just the stage behind it.
      assert.notEqual(look.rootBg, "rgb(255, 255, 255)", "the template is still painting itself white");
      assert.equal(look.rootColor, "rgb(255, 255, 255)", "dark text should be white");
    } finally {
      await page.close();
    }
  });

  test("the AI panel mounts its controls", async () => {
    // The same bug blanked the panel: its controls disappeared alongside the
    // canvas, because both are built after the failing call.
    const { page } = await open(`/editor.html?id=${seeded.id}`);
    try {
      await page.waitForSelector("#ed-canvas .stage", { timeout: 15_000 });
      const text = await page.evaluate(() =>
        (document.querySelector(".ed__ai")?.textContent || "").replace(/\s+/g, " ").trim());
      assert.match(text, /review/i, `the AI panel is missing its controls: ${JSON.stringify(text.slice(0, 120))}`);
    } finally {
      await page.close();
    }
  });
});

describe("the template gallery renders real templates", () => {
  test("it shows the whole library, with names", async () => {
    const { page, errors } = await open("/templates.html");
    try {
      await page.waitForSelector(".stage, [class*='tpl'], [class*='card']", { timeout: 20_000 });
      const seen = await page.evaluate(() => ({
        count: Number((document.getElementById("lib-count")?.textContent || "").replace(/\D/g, "")) || 0,
        tiles: document.querySelectorAll(".stage").length,
      }));
      // Retired templates (replacedBy) still render for old decks but are not
      // offered in the gallery, so the gallery shows the live library.
      const { liveTemplates } = await import("../product/domain/live-templates.js");
      assert.equal(seen.count, liveTemplates.length, "the gallery's own count disagrees with the live library");
      assert.ok(seen.tiles > 0, "no template tiles rendered");
      assert.deepEqual(errors, [], "the gallery reported errors");
    } finally {
      await page.close();
    }
  });
});

describe("the viewer gateway renders a slide", () => {
  test("render.html mounts the requested slide", async () => {
    const { page, errors } = await open(`/render.html?id=${seeded.id}&slide=0`);
    try {
      /* `attached`, not the default `visible`: the viewer fades a slide in, so
       * a stage can be mounted and correct while still mid-transition. What
       * matters here is that it mounted at all. */
      await page.waitForSelector(".stage", { state: "attached", timeout: 20_000 }).catch(() => {});
      const found = await page.evaluate(() => ({
        hasStage: !!document.querySelector(".stage"),
        text: (document.querySelector(".stage")?.textContent || "").trim().length,
        body: document.body.textContent.replace(/\s+/g, " ").trim().slice(0, 200),
      }));
      assert.ok(found.hasStage, `the viewer mounted no stage. Page said: ${JSON.stringify(found.body)}`);
      assert.ok(found.text > 20, `the viewer rendered an empty stage (${found.text} chars)`);
      assert.deepEqual(errors, [], "the viewer reported errors");
    } finally {
      await page.close();
    }
  });
});
