<!--
  The pitch deck's story. `npm run pitch:build` turns it into slides; see pitch/README.md.
-->

<!-- layout: title -->
# Nagarro DS Starter Pack
## One spec per component. Figma and code, always in sync.

---

# The problem
- Every client project starts its design system from zero.
- Figma says one thing, the code says another, and they drift a little more every sprint.
- Tokens have different names in design and in code, so every handover needs a translation table.
- Quality checks (accessibility, consistency) happen late, by hand, if at all.

---

<!-- layout: statement -->
# The idea
Describe each component **once**, in a spec. Generate everything else from it: the Figma component, the React code, the tokens, the configurator and the docs.

---

# How it works
1. A **spec** lists a component's parts, variants and which token each part uses.
2. Generators build the **Figma component set** and bind every layer to tokens.
3. The same spec produces the **React styles** and the **docs**.
4. A **parity check** compares Figma with the specs: {{parity}}.
5. Tests open **every story** in a browser and check accessibility on each one.

---

# By the numbers
{{facts}}

---

# What it looks like
{{gallery: navigation-menu--preview, popover--preview, menu--popup, select--listbox, dialog--preview, toast--preview}}

---

# The DS Configurator
{{configurator}}

---

# Starting a client project
1. **Use this template** on GitHub: a separate copy of the code, with a fresh history.
2. Duplicate the Figma file into the client's workspace and point the project at it.
3. Set the client's colors, fonts, shapes and density in the configurator, then push them to Figma.
4. Regenerate and run the parity check: Figma and code now match, in the client's brand.
5. Add the client's own components with the same spec workflow.

---

# What's built
{{roadmap: done}}

---

# What's next
{{roadmap: next}}

---

# Why it matters for Nagarro
- **Faster client kickoffs**: start from a complete, tested system instead of a blank file.
- **Quality built in**: accessibility and Figma–code parity are checked automatically, on every change.
- **One language** for designers and developers: the same token names on both sides.
- **AI-ready**: specs are structured data, so agents can build UIs with the system correctly.

---

<!-- layout: statement -->
# The ask
*Edit this slide in pitch/story.md: what you need (people, time, a pilot client) and by when.*
