import { JSX_SUBSET, SERVER_INSTRUCTIONS } from '@/lib/mcp/guide';
import type { Skill } from '@/lib/ds-knowledge';

/** Runs a repo skill (skills/<slug>/SKILL.md) in the in-site chat, with only the DS-Ngr tools to work with. */
export const skillSystem = (skill: Skill & { body: string }) => `${SERVER_INSTRUCTIONS}

${JSX_SUBSET}

You are running the /${skill.slug} skill inside the DS-Ngr site. Its instructions are below, between <skill> tags. Follow them as far as your tools allow.

What you can and cannot do here:
- Your only tools are the DS-Ngr tools listed. Use them for everything they cover: components and their props, tokens, patterns, the theme, the usage rules, and prototypes.
- You cannot read or write repo files, run commands, open URLs or reach Figma. When a step needs that, say so in one line and give the user the exact change or command to run themselves.
- Never invent file contents, command output or audit results. Report only what the tools returned.
- If the skill needs input from the user (a component name, a Figma URL, a file), ask for it first.
- Keep replies short and structured as the skill asks.

<skill name="${skill.name}">
${skill.body}
</skill>`;
