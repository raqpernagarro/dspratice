# Try it: Nagarro Design Workspace, for Nuno and Rui

Thank you for looking at this. It takes about 15 minutes. What helps most is where you got stuck, what you expected to happen, and what you would remove.

## Set it up (5 minutes)

```bash
npm run setup
```

```bash
npm run dev
```

Then open <http://localhost:4300>. Everything runs on your machine; sample clients and figures are fictional.

The practice tools open from their journeys when they run. If you want to try them too:

```bash
npm run tools -- copy all
```

```bash
npm run tools -- start starter
```

(`starter`, `dsn`, `studio` or `prototyping`; a tool page says how to start it when it isn't running.)

## What to try

1. **Home: type what you need.** Write it the way you would say it to a colleague. Some to start with:
   - "rfp due friday, where do I start"
   - "need a deck for monday"
   - "Figma variables out of sync with the code"
   - "make a clickable prototype for the customer portal"
   - "their design system is a mess, help me clean it up"
   It should suggest the right job and say which of your words matched. Tell us any phrasing that lands on the wrong job: it goes straight into the tests.
2. **Projects.** One page: what you left unfinished, then each project with a live preview of its own system. Open Demo Brand: the Overview shows the system at a glance and what to do next, including the AI agents' suggestions you can approve or reject.
3. **Start a design system.** From Home or a project: step 1 is the DS Starter Pack itself (Nuno, your tool, shown in the page), step 2 brings the result into the project. Is it clear what happens where?
4. **Demos › Prepare a client meeting.** Pick a client and the kind of meeting, then make the four things one by one: a presentation, a demo, your notes, the follow-up. Press Present: the client demo opens and your notes window follows it.
5. **Engagement.** The calendar reads Marketing Studio's post files. To see your own posts, add your folder to `.env.local` and restart:

   ```
   MARKETING_STUDIO_FOLDERS="Nuno=~/Claude/marketing-studio"
   ```

   Without it, the calendar explains how and shows Nuno's Starter Pack posts in the tray.

## What is real and what is simulated

- **Real:** the routing on Home (no AI involved), the practice tools when they run, the Starter Pack set-up and its recording, decks on Carolina's Nagarro Master Slides, the Marketing Studio files the calendar reads.
- **Simulated in the client demo:** scans, pull requests and checks, the Figma review, the files AI tools read, and the screen builder (a rule-based planner stands in for the AI model). They are labelled where they could look live.
- **Needs a key:** "Ask AI" on Home and AI drafting of responses (`ANTHROPIC_API_KEY` in `.env.local`).
- **Not shared:** projects stay in your browser (NDA). Nothing is posted anywhere.

## Sending feedback

Send Raquel a short note with, for each thing: what you tried, what you expected, what happened. A screenshot helps. "Remove this" is useful feedback too.
