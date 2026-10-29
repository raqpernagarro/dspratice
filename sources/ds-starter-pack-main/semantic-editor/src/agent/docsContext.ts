import componentsMd from '../../../docs/ai/components.md?raw'
import rulesMd from '../../../docs/ai/rules.md?raw'
import { SPECS } from '../../../stories/base-ui/spec'
import { CATEGORIES } from '../../../stories/base-ui/spec/categories'

/** One component's section of docs/ai/components.md ("### Button" up to the next "### "). */
export function componentDocs(name: string): string {
  const start = componentsMd.indexOf(`\n### ${name}\n`)
  if (start < 0) return ''
  const next = componentsMd.indexOf('\n### ', start + 5)
  const nextH2 = componentsMd.indexOf('\n## ', start + 5)
  const end = [next, nextH2].filter((n) => n > 0).reduce((a, b) => Math.min(a, b), componentsMd.length)
  return componentsMd.slice(start, end).trim()
}

/** Every component in one line each: name, category, summary. */
export function catalogSummary(): string {
  return Object.entries(CATEGORIES)
    .map(([cat, names]) => {
      const rows = names.map((n) => {
        const spec = SPECS.find((s) => s.name === n)
        return `- ${n}: ${spec?.docs?.summary ?? ''}`
      })
      return `${cat}\n${rows.join('\n')}`
    })
    .join('\n\n')
}

export function docsSystemPrompt(projectLine: string): string[] {
  return [
    `You are the design system assistant inside the DS Configurator's living docs. ${projectLine}
Answer questions about this design system for designers and developers, many of them new to design systems.
Be short, concrete and friendly. Use plain words. Prefer a short list or a code snippet over long paragraphs.
Only recommend components, props and tokens that exist in the docs below. If something does not exist, say so and suggest the closest option, or how to add it (the rules explain the process).
When you show code, import wrappers from 'stories/base-ui/components/<folder>/<Name>' as the docs do.

# Rules
${rulesMd}

# Component catalog
${catalogSummary()}`,
  ]
}
