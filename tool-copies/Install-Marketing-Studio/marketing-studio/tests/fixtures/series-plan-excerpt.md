# LinkedIn series: What AI changes for Design Systems

15 posts, one per weekday, Tue 20 Oct to Mon 9 Nov 2026, starting the same day as the company post. Written for Hugo's personal profile, following the Nagarro company post of 20 Oct.

Visuals are in `posts/<id>/`. Carousels are uploaded as **PDF documents**, videos as **MP4** (4:5, 1080×1350, no audio, so they work muted in the feed), images as **PNG**. Rebuild any visual with `python3 build.py <id>`.

## The arc

| Week | Theme | Source |
|---|---|---|

## 01 · Tue 20 Oct · Image
**Source:** Noel Cunningham, *Most design systems are not ready for AI*
**Visual:** `posts/01-brief-nobody-wrote/01-brief-nobody-wrote.png`. A prompt bar, the generic settings page it produces, and red tags on everything the model had to guess.

> "Build a settings page."
>
> That's the prompt @Noel Cunningham opens his article with. The AI returns something that works: toggles, labels, a save button. It compiles and it passes review.
>
> It also looks like every other settings page on the internet.
>
> Nothing went wrong technically. The model just had nothing to go on. Your spacing rhythm, how you group options, the tone of your helper text, when you ask for confirmation. Most of that lives in people's heads, in old Slack threads, in "we don't do that here."
>
> People absorb those rules over months. AI only gets what's written down.
>
> So before choosing which assistant to roll out, it's worth asking a simpler question. If a new tool connected to your design system today, with nobody around to explain it, what would it actually understand?
>
> Noel's article is a good place to start. Link in the comments.
>
> #FluidicIntelligence #DesignSystems #AI

**First comment:** Noel's full article: https://www.nagarro.com/en/blog/designing-ai-ready-systems

---

## 02 · Wed 21 Oct · Carousel (8 slides)
**Source:** Noel Cunningham, *Most design systems are not ready for AI*
**Visual:** `posts/02-rules-ai-has-never-seen/02-rules-ai-has-never-seen.pdf`. Cover, five unwritten rules with where each one "lives", a takeaway slide and a CTA.

> Every product team runs on rules nobody wrote down.
>
> One primary button per view. Always confirm before deleting. Numbers align right. Error messages explain how to fix the problem, not only that something failed.
>
> New designers pick these up through reviews and feedback. It takes months, and it works, because people ask questions and notice patterns.
>
> An AI assistant does neither. It reads your components, your tokens and whatever docs exist, and fills every gap with the most common pattern it has seen elsewhere. That's how you get output that's technically correct and still doesn't feel like your product.
>
> Swipe through for five examples, then try listing ten of your own. The ones you can't point to in documentation are the ones AI will get wrong.
>
> Based on @Noel Cunningham's article. Link in the comments.
>
> #FluidicIntelligence #DesignSystems #AI

**Document title (shown on LinkedIn):** Rules your team follows that AI has never seen
**First comment:** "Most design systems are not ready for AI" by Noel Cunningham: https://www.nagarro.com/en/blog/designing-ai-ready-systems

---

## 05 · Mon 26 Oct · Poll
**Source:** Nagarro, *AI-Ready Design Systems* (offering page)
**Visual:** none (LinkedIn poll, duration 3 days, so results are in before post 09 on Fri 30 Oct)

> A question for designers, engineers and design system teams already using AI to generate UI.
>
> When AI-generated interfaces go wrong in your product, what usually breaks first?
>
> The answer changes where you start. Brand drift points at tokens. The wrong component points at missing usage rules. Accessibility gaps point at component definitions that never included it. And if nobody's checking yet, that's the first thing to fix.
>
> I'll share the results at the end of the week.
>
> #FluidicIntelligence #DesignSystems

**Poll options** (max 30 characters each):
1. Brand and visual consistency
2. Wrong component for the job
3. Accessibility
4. We don't check it yet

**First comment:** If you want a structured view of where your system stands, there's a short self-assessment here: https://www.nagarro.com/en/services/design-studio/ai-ready-design-systems

---

## 09 · Fri 30 Oct · Text only
**Source:** Hugo Franca, *Designing products for people and agents*

> People paper over the cracks in your product. Agents amplify them.
>
> If your website shows one price, the app another and support quotes a third, a person will usually notice, get annoyed and ask. An agent picks one and moves on, often with full confidence, and then compares it with a competitor whose data is cleaner.
>
> That's why I keep coming back to product truth: one consistent set of facts about price, terms, availability and eligibility, shared by every channel, human or agent.
>
> Once agents can act as well as read, there's a second thing to design: permission.
>
> Research can be open. Buying, cancelling, sharing data or accepting terms should need the customer's explicit approval. In practice that means:
> → a clear scope of what the agent may do
> → an approval step before anything irreversible
> → a record the customer can check afterwards
>
> An agent that completes a task while leaving the customer in the dark hasn't improved the experience.
>
> P.S. Monday's poll: [X]% said [top answer] breaks first, and [Y]% said they don't check yet. Thanks to everyone who voted.
>
> #FluidicIntelligence #ProductDesign #AgenticAI

**First comment:** More on product truth, MCP, WebMCP and permission models: https://www.nagarro.com/en/blog/ai-agent-product-design-customer-journeys-product-truth

---

## 15 · Mon 9 Nov · Video (19s)
**Source:** the whole series
**Visual:** `posts/15-series-recap/15-series-recap.mp4`. "Three weeks. One idea." Five stages build up one at a time (component library, AI-ready design system, product truth, decision system, experience system), then the policy quote and the diagnostic CTA.

> For the past three weeks I've been posting about one idea from a few angles. Here's the short version.
>
> AI is generating more of our interfaces, and more of the decisions inside them. That moves the work:
> → from components to the rules behind them
> → from one interface to one product truth that people and agents both rely on
> → from documenting what exists to recording why and when
> → from designing screens to designing how a product behaves
>
> Each step needs knowledge most teams already have but haven't written down. The organization owns those rules, and the models follow them.
>
> If you want to see where your team stands, @Nagarro starts with a two-week AI Readiness Diagnostic. If you missed any of the articles, they're all in the comments.
>
> Thanks to @Noel Cunningham, @Carlos Sousa and everyone who joined the conversation.
>
> #FluidicIntelligence #DesignSystems #AI

**First comment:**
1. Most design systems are not ready for AI (Noel Cunningham): https://www.nagarro.com/en/blog/designing-ai-ready-systems
2. AI-Ready Design Systems: https://www.nagarro.com/en/services/design-studio/ai-ready-design-systems
3. Designing products for people and agents: https://www.nagarro.com/en/blog/ai-agent-product-design-customer-journeys-product-truth
4. The design system is becoming a decision system: https://www.nagarro.com/en/blog/ai-ready-design-systems-decision-systems
5. Experience systems: designing how products decide: [public URL]

---
