---
id: eval-good-linkedin
type: post
title: "The failure you cannot see"
status: draft
brand: hugo
surface: linkedin
format: text
mode: personal
campaign: null
pillar: 3
author: hugo
timezone: Europe/Lisbon
first_comment: ""
score: null
created: 2026-10-22T10:00:00+01:00
updated: 2026-10-22T10:00:00+01:00
---

The most expensive AI mistake in product work is the one that passes review.

A client asked me a question this year that I have not stopped thinking about: "How do you solve QA when designers build components with AI?"

Their designers were already doing it. The components looked right, and they shipped.

The problem showed up later, and it never showed up as a bug.

→ a colour sits one step off the palette
→ a radius appears that exists nowhere in the system
→ a button behaves like a link, because nothing said it should not

None of these fail a review. Each one is defensible on its own. Together, across the few hundred decisions an agent makes in a quarter, they become a product that is slowly no longer yours.

We built review processes for human mistakes. A person drifts occasionally and in ways you can predict. An agent drifts consistently, in ways that look intentional, because it is filling every gap you left with a confident guess.

That is the real QA problem: not catching errors, but noticing decisions that nobody made.

You cannot review your way out of it. The fix sits upstream, in what the system tells the agent before it starts.

More on that next week. For now, one question worth asking your team: of the components AI touched this month, how many did anyone check against the system, not just against the ticket?

#DesignSystems #AI
