import { ArrowSquareOut, Code, DownloadSimple, MagnifyingGlass } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'

import tokensMd from '../../../docs/ai/tokens.md?raw'
import { Button } from '../../../stories/base-ui/components/button/Button'
import { currentVersion } from '../../../stories/base-ui/tokens/project-file'
import { figmaTokenToCssVar } from '../../../stories/base-ui/tokens/figma-css-var'
import { figmaBase, generateTokens } from '../../../stories/base-ui/tokens/theme-generator'
import { MODE_NAMES } from '../../../stories/base-ui/tokens/theme-config'
import { exportTheme, themeToCss } from '../../../stories/base-ui/tokens/theme-export'
import { projectFileName } from '../../../stories/base-ui/tokens/project-file'
import { variableGraph } from '../../../stories/base-ui/tokens/variables-model'
import { Markdown } from '../agent/Markdown'
import { figmaFileKey, githubRepo } from '../app/appTypes'
import { useProject } from '../app/AppContext'
import { download } from '../app/download'
import { buildChangeSet, changeSetSummary } from '../exchange/changeset'
import { useShell } from '../app/ShellContext'
import { useSemanticEditor } from '../context/SemanticEditorContext'
import { ICONS } from '../proto/Renderer'
import { ScreenRenderer } from '../proto/Renderer'
import type { UiNode } from '../proto/schema'
import { ThemeScope } from '../context/SemanticEditorContext'

/** One "## Heading" section of a Markdown file, without the heading. */
function section(md: string, heading: string): string {
  const start = md.indexOf(`\n## ${heading}\n`)
  if (start < 0) return ''
  const rest = md.slice(start + heading.length + 5)
  const end = rest.indexOf('\n## ')
  return (end < 0 ? rest : rest.slice(0, end)).trim()
}

const slugOf = (name: string) => projectFileName(name).replace('.dsproject.json', '')

export function Installation() {
  const { doc } = useProject()
  const { theme } = useSemanticEditor()
  const [base, ...others] = theme.modes
  const modeLine = others.length
    ? ` It starts in ${MODE_NAMES[base]}; ${others.map((m) => `\`data-appearance="${m}"\` on \`<html>\` switches to ${MODE_NAMES[m]}`).join(', ')}.`
    : ` The system has one mode, ${MODE_NAMES[base]}.`
  const repo = githubRepo(doc.info.githubUrl)
  const pkg = repo ? repo.split('/')[1] : 'your-design-system'
  const slug = slugOf(doc.info.name)
  return (
    <>
      <Markdown
        text={`Components and the theme ship together. In a product repo:

\`\`\`
npm install ${pkg}
\`\`\`

Load the theme once, at the root of your app.${modeLine}

\`\`\`
import '${pkg}/stories/base-ui/tokens/figma-semantic.css'
import { Button, Field, Input } from '${pkg}'

<Field label="Report name">
  <Input placeholder="Q4 revenue by region" />
</Field>
<Button>Create report</Button>
\`\`\`

${repo ? `The source lives in [${repo}](https://github.com/${repo}).` : 'Add the GitHub repository in the system settings to link the source here.'}

## Using another stack

Take the tokens directly, with this theme's values for light and dark.`}
      />
      <div className="doc-actions">
        <Button variant="secondary" leadIcon={<Code />} onClick={() => download(`${slug}.tokens.css`, themeToCss(exportTheme(theme)), 'text/css')}>
          CSS variables
        </Button>
        <Button variant="secondary" leadIcon={<Code />} onClick={() => download(`${slug}.tokens.json`, JSON.stringify(exportTheme(theme), null, 2))}>
          Token JSON
        </Button>
      </div>
    </>
  )
}

/** Keep Figma in sync: the theme through the plugin, saved screens through the agent. */
export function FigmaSync() {
  const { doc } = useProject()
  const { theme } = useSemanticEditor()
  const changes = useMemo(() => buildChangeSet(theme, currentVersion(doc.versions)), [theme, doc.versions])
  const fileKey = figmaFileKey(doc.info.figmaUrl)
  const slug = slugOf(doc.info.name)
  const figmaFile = fileKey ? `[your Figma file](${doc.info.figmaUrl})` : 'your Figma file'
  const prompt = `Using the figma-console MCP (Figma desktop bridge), open the Figma file ${fileKey ?? '<your file key>'} and add the screens from ds.project.json (the "prototypes" list) as frames built from the file's own components and variables. Ask before changing any existing page.`
  return (
    <>
      <Markdown
        text={`Designers work in a Figma file that mirrors the code: the same components and the same variables. When the theme changes, send the change to Figma too.

## The theme, with the plugin

${changeSetSummary(changes)}`}
      />
      <div className="doc-actions">
        <Button
          leadIcon={<DownloadSimple />}
          onClick={() => download(`${slug}.changes.json`, JSON.stringify(changes, null, 2))}
        >
          Download Figma changes
        </Button>
      </div>
      <Markdown
        text={`1. Open ${figmaFile}, then **Plugins → Development → DS Configurator**.
2. Choose **Import changes** and drop the file in.
3. Review the list of changes, then **Apply**.

> First time? A developer installs the plugin once with \`npm run plugin:install\`.

## Changes made in Figma

After an import the file remembers the sync. Change values, add variables or rebind component layers in Figma, then bring them back:

1. In the plugin, **Export variables**.
2. Here, **Edit system → Import a file** and drop the file in. It lists what you changed in Figma since the sync, what's new, and which components were rebound.
3. Keep what should become part of the system, then save the next version. The next changes file sends it all back, so nothing you kept gets overwritten.

## Screens, with the agent

The plugin moves tokens, not layouts. To turn saved screens into Figma frames, the agent works in Figma through the desktop bridge.

1. Open Figma Desktop with your file, and run the Figma Console bridge plugin.
2. In Claude Code, inside this repository, allow the figma-console tools when asked.
3. Ask:

\`\`\`
${prompt}
\`\`\``}
      />
    </>
  )
}

export function Changelog() {
  const { doc } = useProject()
  if (!doc.versions.length) return <p className="doc-muted">No saved versions yet. Saving a change with Edit system starts the history.</p>
  return (
    <div className="md-table">
      <table>
        <thead>
          <tr>
            <th scope="col">Version</th>
            <th scope="col">What changed</th>
            <th scope="col">Date</th>
          </tr>
        </thead>
        <tbody>
          {doc.versions.map((v) => (
            <tr key={v.version + v.date}>
              <td>
                <code>v{v.version}</code>
                {v.version === currentVersion(doc.versions) ? <span className="doc-pill">Current</span> : null}
              </td>
              <td>{v.note}</td>
              <td>{v.date ? new Date(v.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Naming() {
  return (
    <>
      <Markdown text={section(tokensMd, 'Naming grammar')} />
      <h2>Rules</h2>
      <Markdown text={section(tokensMd, 'Rules')} />
    </>
  )
}

const resolve = (value: string, gen: Record<string, string>, base: Record<string, string>, depth = 0): string => {
  const ref = value.match(/^var\(--([\w-]+)\)$/)
  if (!ref || depth > 8) return value
  const name = [...variableGraph.vars.values()].find((v) => figmaTokenToCssVar(v.name) === `--${ref[1]}`)?.name
  const next = name ? (gen[name] ?? base[name]) : undefined
  return next === undefined ? value : resolve(next, gen, base, depth + 1)
}

export function TokenReference() {
  const { theme } = useSemanticEditor()
  const [query, setQuery] = useState('')
  const rows = useMemo(() => {
    const modes = theme.modes.map((appearance) => {
      const base = figmaBase({ brand: theme.brand, appearance })
      const gen = generateTokens({ ...theme, appearance })
      return { base, gen }
    })
    return [...variableGraph.vars.values()]
      .filter((v) => v.collection === variableGraph.semantic.id)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
      .map((v) => ({
        name: v.name,
        type: v.type,
        values: modes.map((m) => resolve(m.gen[v.name] ?? m.base[v.name] ?? '', m.gen, m.base)),
        description: v.description ?? '',
      }))
  }, [theme])
  const q = query.trim().toLowerCase()
  const shown = rows.filter((r) => !q || r.name.includes(q) || r.description.toLowerCase().includes(q))
  const cell = (type: string, value: string) =>
    type === 'COLOR' ? (
      <span className="doc-value">
        <i style={{ background: value }} aria-hidden="true" />
        <code>{value}</code>
      </span>
    ) : (
      <code>{value}</code>
    )
  return (
    <>
      <label className="doc-filter">
        <MagnifyingGlass size={14} aria-hidden="true" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Filter ${rows.length} tokens`} aria-label="Filter tokens" />
      </label>
      <div className="md-table">
        <table>
          <thead>
            <tr>
              <th scope="col">Token</th>
              {theme.modes.map((m) => (
                <th key={m} scope="col">
                  {MODE_NAMES[m]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.name} title={r.description}>
                <td>
                  <code>{r.name}</code>
                  {r.description ? <small className="doc-token-desc">{r.description}</small> : null}
                </td>
                {r.values.map((value, i) => (
                  <td key={theme.modes[i]}>{cell(r.type, value)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export function Screens() {
  const { doc } = useProject()
  const { openPrototype } = useShell()
  if (!doc.prototypes.length)
    return (
      <p className="doc-muted">
        No saved screens yet.{' '}
        {openPrototype ? (
          <button type="button" className="doc-link" onClick={() => openPrototype()}>
            Prototype one
          </button>
        ) : null}
      </p>
    )
  return (
    <div className="doc-screens">
      {doc.prototypes.map((p) => (
        <article key={p.id} className="doc-screen">
          <div className="doc-screen__thumb" aria-hidden="true">
            <ThemeScope>
              <div className="doc-screen__scale">
                <ScreenRenderer tree={p.tree as UiNode} />
              </div>
            </ThemeScope>
          </div>
          <div className="doc-screen__meta">
            <strong>{p.title}</strong>
            {p.prompt ? <span>{p.prompt.split('\n')[0]}</span> : null}
            {openPrototype ? (
              <button type="button" className="doc-link" onClick={() => openPrototype(p.id)}>
                Open in Prototype <ArrowSquareOut size={12} />
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  )
}

export function IconGrid() {
  return (
    <div className="doc-icons">
      {Object.entries(ICONS).map(([name, IconCmp]) => (
        <div key={name}>
          <IconCmp weight={['check', 'x', 'plus'].includes(name) ? 'bold' : 'fill'} aria-hidden="true" />
          <span>{name}</span>
        </div>
      ))}
    </div>
  )
}
