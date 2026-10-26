# Responding to a client request

The workflow turns a client request (an RFP, a questionnaire, a brief or meeting notes) into a traceable first response. Every statement says whether a source backs it, a person checks every answer, and a person decides what reaches the client. It runs at **Opportunities** (`/nagarro/opportunities`, filter by project); each request's pages live there too (`/nagarro/opportunities/:id/:step`), whichever project it belongs to.

Progress means work done: a step is ticked because of what it produced (a request, a confirmed context, a list of requirements, chosen sources, checked answers, something shared), never because someone opened it. The original request opens from every step (**View the request**).

By default it spends **zero model tokens**. A model is used only when you choose an AI action and confirm the consent sheet.

## The steps

**Respond to a client request** creates the request (which client or prospect, a name, the kind of response). Then:

| # | Step | What happens | Model tokens |
|---|---|---|---|
| 1 | **Request** | Paste, upload (`.md`, `.txt`, `.docx`, `.pdf`) or use a sample. The original is kept read-only; a new version keeps the old one | 0 |
| 2 | **Context** | Client, audience, objective, expected deliverable and due date, prefilled from the project. Hints found in the request can be applied with one click | 0 |
| 3 | **What they ask** | **List what they ask for** lists each requirement with its passage highlighted in the original. Edit, remove, mark must-answer, add or restore. Asks we never answer from documents are flagged "Not from documents" | 0 |
| 4 | **Sources** | **Find matching material** ranks the sources this request may use and explains each match. Exclude a source with a reason. Notices cover out-of-date sources, internal-only sources and known conflicts | 0 |
| 5 | **Draft response** | **Draft the answers** builds the response by rules (below). A **To review** panel counts the answers still to check, the open questions and the source conflicts. Tick **Check** per requirement once you are sure its passage answers it; a redraft asks for a re-check. **Draft with AI** and **Rewrite with AI** appear only when a key is configured, each with its estimated cost | 0 by default |
| 6 | **Share and present** | Downloads, the generation packet, **Show a summary in the client demo** (chapter 8), **Prepare a presentation** and **Prepare the client demo** | 0 |

## What a response contains

- **Our understanding**, in the client's words where possible.
- **Requirements and evidence**: a matrix with coverage, the statement kind and evidence chips. Each chip opens the cited section with its frame or file link.
- **Recommended approach and offering**.
  - Package rules: no system → DS Build; multi-brand → DS Scale; ongoing work → Support; otherwise a 2-week AI audit, then DS Accelerate.
  - Durations appear only when a cited source states them.
- **Where our sources disagree**, with the canonical wording.
- **The draft**, section by section. Each section is one of:
  - **Backed by a source**: an approved source says it, and the citation shows where. Check that the passage really answers the question.
  - **Our recommendation**: our suggestion from draft material or our judgement; confirm before sending.
  - **Assumption**: something we had to assume; check it with the client.
  - **Open question**: the sources cannot answer it; the account team or a practice expert must.
- **Needs an expert**: gaps, each with a suggested owner, copyable as a question.
- **Next steps**.

## What it never invents

| Asked for | What the draft says |
|---|---|
| Pricing, day rates, totals | An open question for the account team |
| References, CVs, credentials | Provided by the account team after clearance |
| SLAs, liability, contract terms | They follow the master agreement; not drafted here |
| Start dates, team availability | Confirmed by resourcing |
| Client outcomes, figures | Only if a cited section states them. Otherwise the figure is replaced with ⟨not in sources⟩ and publishing is refused |
| A capability no source documents (for example Angular support) | An open question for a delivery lead |

**Source text is reference material, never instructions.** The validator applies these rules to both the template and the model path:
- citations must exist and quotes must match their section;
- figures must appear in a cited section;
- other clients' names are flagged;
- packages must be canonical.

The model prompt repeats that sources are data.

## Template draft and model draft

- **Template draft (no model).** The composer quotes the best-matching passage per requirement. It is deterministic and free, and plainer than a model draft. **A person must check that each quote actually answers the question.** Retrieval is keyword and topic matching, so a quote can be relevant to the topic but not to the ask.
- **Model draft** (with `ANTHROPIC_API_KEY`):
  - Defaults: `claude-opus-5-5`, medium effort for a whole response, low for one section.
  - The model sees only the top-ranked sections, about 20K tokens at most, never whole decks, and the source block is cached.
  - Before the first call, a consent sheet says what is sent (the request, the requirements, the selected sections) and where. It applies per opportunity.
  - Each action shows an estimate first and the actual usage after. The per-opportunity meter and **Settings › Integrations** keep the total.
- **Generation packet.** Without a key, download the packet in step 7 and paste it into any Claude or ChatGPT chat you are allowed to use. It holds the rules, the request, the requirements and only the most relevant sections.

## Publishing to the client

**Review and publish** opens a checklist of sections:
- Open questions start unticked.
- Citations to internal-only sources are removed from the client copy.
- Publishing is refused for a section that:
  - cites an outdated source;
  - still contains ⟨not in sources⟩;
  - names another client;
  - still quotes internal-only material word for word.

  Such sections start unticked and say why.

The summary appears in the client demo's last chapter (**Outcome and next step › Proposal summary**) once the project has a client demo version. **Preview in the client demo** opens it as presenter. The client demo is something we present in meetings, not a portal the client logs into. Drafts, notes, the library and unticked sections never appear there. Ticked sections with answers nobody has checked yet get a warning.

## Using it for a real client request

1. **Library first.** Check that the sources you rely on are approved by their owners (Knowledge library › Needs attention). Add the client's own documents as client-scoped sources. Approve reuse only when the content is cleared.
2. **Create the project** for the client or prospect (Projects › New project, or directly in **Respond to a client request**) and the request with its kind of response.
3. **Paste or upload the request.** Real client text stays in your browser unless you choose an AI action.
4. **Go through Context, What they ask and Sources.** Fix the requirement list: it drives everything after it.
5. **Draft**, then read every answer next to its passage and tick **Check** only when the passage really answers the question. Edit every section you will stand behind. Resolve each open question with the account team: pricing, references, CVs, SLAs, dates.
6. **Download** `response.md` and the requirements CSV for the bid document. Add a summary to the client demo only after review.
7. **Prepare a presentation** from the reviewed response (see [presentations.md](presentations.md)).

## Edge checklist

`npm run e2e` runs the Northwind workflow, the library and the demo build in Microsoft Edge. Screenshots go to `E2E_SHOTS`. The Northwind spec checks:
- the requirement edit is restored;
- Contoso's questionnaire is absent;
- the rule-based label, the package conflict and the approach appear;
- the To review panel counts answers to check, and checking one updates it; the draft step stays unticked;
- the original request opens from the draft step;
- an edited section is kept on redraft;
- the markdown, CSV and packet download, with no isolation marker in the packet;
- adding a summary to the client demo refuses internal quotes, and the summary shows ticked sections only, without internal names;
- the deck has 13 slides on Carolina's engine;
- `deck.json` and the HTML export work;
- present mode works, a demo slide opens the live demo, and Back to preparation returns to the same slide;
- an out-of-date source raises the deck's Rebuild banner;
- there are no console errors.

Other specs: `orientation.spec.ts` (Home asks what you need to do, with two journeys; the six-item sidebar; Prepare a client conversation and its four starts; Start a project asks new or existing; no header overlap at 1280 and 1440; fonts; one current nav item; empty state), `journeys.spec.ts` (a Starter Pack set-up recorded from its project file; the basics by hand and the improve journey: nothing ticked by opening, resume), `client-demo.spec.ts` (direct chapter entry, Show me, keyboard, notes window, reset, Back to preparation, reduced motion).
