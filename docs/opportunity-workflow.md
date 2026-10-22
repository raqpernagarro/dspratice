# Answering an opportunity

The workflow turns a client request (an RFP, a questionnaire, a brief or meeting notes) into a traceable first response. Every statement says whether a source supports it, and a person decides what reaches the client. It runs at **Win work › Opportunities** (`/nagarro/opportunities`) and on each engagement's Opportunities tab.

By default it spends **zero model tokens**. A model is used only when you choose an AI action and confirm the consent sheet.

## The seven steps

| # | Step | What happens | Model tokens |
|---|---|---|---|
| 1 | **Choose the opportunity** | Pick or create the client or prospect, the title and the task: RFP or questionnaire, proposal, approach, discovery questions, governance, summary, meeting prep | 0 |
| 2 | **Add the request** | Paste, upload (`.md`, `.txt`, `.docx`, `.pdf`) or use a sample. The original is kept read-only; a new version keeps the old one | 0 |
| 3 | **Confirm the context** | Client, audience, objective, expected deliverable and due date, prefilled from the engagement. Hints found in the request (deadline, deliverable, goal) can be applied with one click | 0 |
| 4 | **Check what they ask for** | **Analyze this request** lists each requirement with its passage highlighted in the original. You can edit, untick, mark must-answer, add or restore. Asks we never answer from documents are flagged "Not from documents" | 0 |
| 5 | **Pick the sources** | **Find relevant Nagarro material** ranks the sources this client may use and explains each match. Exclude a source with a reason. Notices cover outdated sources, internal-only sources and known conflicts | 0 |
| 6 | **Review the draft** | **Draft responses** builds the response by rules (below). Edit any section; redrafting keeps your edits unless you choose otherwise. **Draft with AI** and **Improve with AI** appear only when a key is configured | 0 by default |
| 7 | **Export or present** | Downloads, the generation packet, **Review and publish** to the client workspace, and **Prepare a presentation** | 0 |

## What a response contains

- **Our understanding**, in the client's words where possible.
- **Requirements and evidence**: a matrix with coverage, the statement kind and evidence chips. Each chip opens the cited section with its frame or file link.
- **Recommended approach and offering**.
  - Package rules: no system → DS Build; multi-brand → DS Scale; ongoing work → Support; otherwise a 2-week AI audit, then DS Accelerate.
  - Durations appear only when a cited source states them.
- **Where our sources disagree**, with the canonical wording.
- **The draft**, section by section. Each section is one of:
  - **Supported by a source**: an approved document says it, and the citation shows where.
  - **Recommendation**: our suggestion from the sources and the request, not yet confirmed by an expert.
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

The client sees the result under **Evidence and next steps › Proposal summary**, once the engagement has a published version and the client experience is open, or through **See it as the client**. Drafts, notes, the library and unticked sections never appear there.

## Using it for a real opportunity

1. **Library first.** Check that the sources you rely on are approved by their owners (Knowledge library › Needs attention). Add the client's own documents as client-scoped sources. Approve reuse only when the content is cleared.
2. **Create the client or prospect** (Clients and engagements › New client or prospect) and the opportunity with its task.
3. **Paste or upload the request.** Real client text stays in your browser unless you choose an AI action.
4. **Go through steps 3–5.** Fix the requirement list: it drives everything after it.
5. **Draft**, then edit every section you will stand behind. Resolve each open question with the account team: pricing, references, CVs, SLAs, dates.
6. **Export** `response.md` and the requirements CSV for the bid document. Publish a summary only after review.
7. **Prepare a presentation** from the reviewed response (see [presentations.md](presentations.md)).

## Edge checklist

`npm run e2e` runs the Northwind workflow, the library and the demo build in Microsoft Edge. Screenshots go to `E2E_SHOTS`. The Northwind spec checks:
- the requirement edit is restored;
- Contoso's questionnaire is absent;
- the template label, the package conflict and the approach appear;
- an edited section is kept on redraft;
- the markdown, CSV and packet download, with no isolation marker in the packet;
- publish refuses internal quotes, and the client summary shows ticked sections only, without internal names;
- the deck has 13 slides on Carolina's engine;
- `deck.json` and the HTML export work;
- present mode works;
- an outdated source raises the deck's Rebuild banner;
- there are no console errors.
