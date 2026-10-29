# Working instructions

**Read [`CLAUDE.md`](CLAUDE.md).** It is the authoritative guide for working in this
repository, and it is kept current.

This file used to hold a full second copy of those instructions, and two copies of
the same rules drift. This one did: it described a brand library of 91 templates
(the registry in `js/templates/` now holds well over 200 — the exact count is
registry-derived, see `js/templates/_CONTRACT.md`), `js/decks/<slug>.js` data files,
`deck.html`, `wiki.html` and a `python3 serve.py` setup — none of which exist any
more. An agent reading this file
instead of `CLAUDE.md` was being told to build against a version of the product that
had been deleted, which is exactly how off-brand output comes back.

So there is one copy now, and this points at it.

Also worth reading, in this order:

| File | |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | how to work here: brand rules, the template library, what needs permission |
| [`Design.md`](Design.md) | the brand and template specification |
| [`README.md`](README.md) | running the studio, for someone who just wants to use it |
| [`docs/EXPORT-NOTES.md`](docs/EXPORT-NOTES.md) | read before changing the exporter |

Run `npm test` before you finish. The suite is small, and every test in it exists
because the thing it checks broke once.
