# Journeys: what Home offers, and how a sentence finds one

Home asks one question, "What do you need to do?". Every answer is a **journey**: one job a colleague comes to do. The journeys are described once, as data, in `src/fixtures/journeys.ts`. Home shows them, the prompt matches words against them, and *Ask AI* is given that same list. People and machines read the same description. That is the AI-ready idea applied to the workspace itself.

## The two groups

| Client conversations | Project work |
|---|---|
| Respond to an RFP or proposal | Start a new design system |
| Build a presentation | Improve an existing design system |
| Prepare a client demo | Prototype on a client’s design system |
| Check a client’s AI readiness | Start a product design workflow (guide) |
| Turn an idea into a deck | Make a design system AI-ready (guide) |
| Follow up after a meeting | Connect Figma and code (guide) |
| Shape the offer (guide) | Share a project update |

Four per group are featured on Home; "All journeys" lists every one.

## What a journey says

| Field | What it holds |
|---|---|
| `id`, `group`, `title` | The job, in words a colleague would use, starting with a verb |
| `outcome` | What you get, in one line |
| `forWho` | Who usually does this job |
| `to` | Where it starts: a workspace page, a practice tool (`/nagarro/tools/<id>`) or its own guide page |
| `backedBy` | The workflow or tool behind it, with its owner |
| `status` | `tool` when it ends in something that works; `guide` when it is steps and links only |
| `featured` | Shown in its group on Home |
| `keywords` | Words and phrases people use for this job, lower case; phrases count more than words |
| `antiUse` | When this is the wrong journey, and which one to pick instead |
| `steps`, `branch` | Guides only: the steps, and an optional first question (for example "Does the product already have a design system?") |

A **set-up guide** never shows progress and always says "no tool yet". When a tool appears for it, change `status` and `to`; the guide page then redirects to the tool.

## How a sentence finds a journey (no model)

`src/features/nagarro/intent.ts` lower-cases the text, drops punctuation and filler words, and trims plurals and "-ing". It then scores each journey:

- a matching keyword phrase scores 1 plus its number of words;
- a matching single keyword scores 1;
- a title word scores 0.5, unless it is a word every journey shares ("design", "system", "AI").

The best three appear under the prompt with the words that matched ("Because you wrote: …"). Twenty typical phrasings are tested in `intent.test.ts`, for example "Jane needs a prototype on the ASSA ABLOY design system" → *Prototype on a client’s design system*. When a phrasing should find a journey and does not, add the phrasing to the test and the missing words to `keywords`.

## Ask AI (explicit, small, metered)

When a model key is set, *Ask AI instead* sends the journey list and the sentence (`POST /api/generate`, kind `route`, at most 1,000 output tokens). The model may only return ids from the list. The button shows the estimated size before anything is sent, and the result shows the model and the tokens used. Without a key, the button is not shown and the router works as before.

The handbook is also available as plain Markdown for AI tools (`npm run handbook:md` → `src/knowledge/handbook.md`). It is not sent with *Ask AI*, which only routes; it is there for assistants and, later, for design.nagarro.com.

## Adding a journey

1. Add the entry to `src/fixtures/journeys.ts`, in its group.
2. Add two or three phrasings to `src/features/nagarro/intent.test.ts`.
3. If it opens a practice tool, add the tool to `src/fixtures/tool-servers.json` and `src/fixtures/experiences.ts` (see CONTRIBUTING.md).
4. Run `npm test`.
