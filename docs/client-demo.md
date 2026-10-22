# The client demo

The client demo is a **guided showcase we present in meetings**. It is not a client portal and not something clients use to run their system. It shows, on a fictional company's design system, how Nagarro keeps design, code and AI tools on one system, and what an engagement could leave behind.

Everything happens in the client demo; the hub is where you prepare. Open it with **Present client demo** (header, Home, a project's header, or **Client demo › Prepare a meeting**). **Back to preparation** returns to the page, or the slide, you came from.

## The story

| # | Chapter | What the client sees | Short path |
|---|---|---|---|
| 1 | The challenge | Design, code and AI tools drift apart | Yes |
| 2 | An example system | A read-only assessment of Demo Brand gives a baseline (sample figures) | Full only |
| 3 | One inconsistency | The real Button: in dark mode, hover looks the same as default | Yes |
| 4 | Why it matters | The evidence, the rule it breaks, and the three components that share the token | Yes |
| 5 | The proposed fix | What the fix affects before anyone merges it; a pull request and the matching Figma change | Yes |
| 6 | Reviewed in code and Figma | Five checks; the Figma–code check passes once the Figma change is applied; the owner merges | Full only |
| 7 | AI uses the system | A screen built only from real components; a made-up token is refused | Yes |
| 8 | Outcome and next step | An example of what the client keeps, a sample before-and-after, an optional proposal summary, and the next conversation (a 2-week AI audit) | Yes |

The **short path** takes about 12 minutes, the **full path** about 25. Choose the default per project on its Overview, or per meeting on **Prepare a meeting**.

The story follows one finding (`f-hover-dark`). Projects whose client demo version does not include it (Northwind) can be explored, but the guided story then runs on Demo Brand and says so.

## Controls

- **Next / Back** follow the chosen path. From a chapter outside the path, they go to the nearest chapter of the path.
- **Chapters** lists all eight. Any chapter can be entered directly: the chapters it depends on are set up first (`src/features/demo/prepare.ts`), and a short line on the guide bar says what was set up.
- **Show me** performs the chapter's action. In chapter 6 it applies the Figma change and merges in one go, then gives the presenter their own role back.
- **Pause** (Space) holds the simulation on its current state: scan stages and running checks wait until you resume.
- **Start again** goes back to chapter 1 and keeps what is on screen. **Reset the demo** goes back to the prepared version (a fresh copy of the published version). Neither touches your preparation in the hub.
- Keyboard: ← → chapters, Space pause, Esc hides the details.
- With reduced motion, entrances and counters are immediate.

## Presenter notes

Notes never appear on the shared tab. **Presenter notes** (demo header, or **Prepare a meeting**) opens a separate window that follows the chapters and can drive the demo (Back, Pause, Show me, Next, chapter list). Share only the demo tab or window.

- The notes are in `src/internal/presenterNotes.ts`, imported only by the notes window and the meeting-prep page. Neither exists in the demo build, and `scripts/check-demo-build.mjs` fails the build if note text leaks in.
- The window and the demo talk over `BroadcastChannel('ds-client-demo')`, so both must be in the same browser profile.
- **Prepare a meeting** also shows the whole script, the time per chapter, which package to propose next, and a short checklist. **Rehearse** opens the demo at any chapter.

## What is simulated

One notice in the demo header says it once: *Demonstration · fictional company · sample figures*. Actions that could be mistaken for live operations carry a small **Simulated** label: the scan of a repository and Figma file, pull requests and checks, the Figma review, generating the files AI tools read, release checks. Figures (health, readiness, accessibility) are sample data, never measured client results.

## Data

- **Preparation** (the project's draft) is where you work in the hub.
- **The client demo version** (published) is what the demo shows. Update it from the project's Overview or from *Review and share* in the improve journey.
- **The demo session** is what happens during a meeting. It starts from the published version and can be reset at any time.
- A response summary appears in chapter 8 only if someone added it from the request's *Share and present* step, after the publishing checks.
