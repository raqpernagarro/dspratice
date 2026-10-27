// Register a source: a Figma file or frame, a Figma folder (needs a token), JSON from the Figma
// knowledge plugin or figma-cli, a local practice file, an upload, or a link. Every read is real.
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Sheet, Field, Segmented, Callout } from '@/shell/ui'
import { DropZone } from '@/shell/DropZone'
import { act } from '@/state/hooks'
import { useIntegrations } from '@/integrations/status'
import { readSource, uploadToSource, pasteToSource, readTaskId } from '@/state/flows/knowledge'
import { practice } from '@/app/routes'
import { useStore } from '@/state/store'
import type { Audience, KnowledgeSource, SourceKind, SourceLocation } from '@/state/types'

type Where = 'figma' | 'upload' | 'local' | 'folder' | 'link'

export const KIND_OPTIONS: { id: SourceKind; label: string }[] = [
  { id: 'point-of-view', label: 'Point of view' },
  { id: 'offering', label: 'Offering' },
  { id: 'approach', label: 'Approach' },
  { id: 'governance-model', label: 'Governance or operating model' },
  { id: 'method', label: 'Method or playbook' },
  { id: 'deck', label: 'Deck' },
  { id: 'template', label: 'Template' },
  { id: 'proposal-section', label: 'Proposal section' },
  { id: 'case-study', label: 'Case study' },
  { id: 'resource', label: 'Resource' },
]

export function parseFigmaUrl(input: string): { fileKey: string; nodeId?: string; board: boolean } | null {
  const m = /figma\.com\/(design|file|board|slides)\/([0-9a-zA-Z]{10,128})(?:\/[^?]*)?(?:\?[^#]*node-id=([0-9]+[-:][0-9]+))?/.exec(input)
  if (m) return { fileKey: m[2], nodeId: m[3]?.replace('-', ':'), board: m[1] === 'board' }
  if (/^[0-9a-zA-Z]{22,128}$/.test(input.trim())) return { fileKey: input.trim(), board: false }
  return null
}

export function AddSourceSheet({ onClose, replace, returnTo }: { onClose: () => void; replace?: KnowledgeSource; returnTo?: string }) {
  const navigate = useNavigate()
  const integrations = useIntegrations()
  const [where, setWhere] = useState<Where>(replace ? 'upload' : 'upload')
  const [title, setTitle] = useState(replace?.title ?? '')
  const [kind, setKind] = useState<SourceKind>(replace?.kind ?? 'resource')
  const [owner, setOwner] = useState(replace?.owner ?? '')
  const [audience, setAudience] = useState<Audience>(replace?.audience ?? 'internal')
  const projects = useStore((st) => st.projects)
  const [scopeProject, setScopeProject] = useState<string>('')
  const [tags, setTags] = useState('')
  const [figma, setFigma] = useState('')
  const [path, setPath] = useState('')
  const [url, setUrl] = useState('')
  const [teamId, setTeamId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const job = useStore((s) => (replace ? s.sim.jobs[readTaskId(replace.id)] : undefined))

  const finish = (id: string) => {
    onClose()
    navigate(returnTo ?? practice.knowledgeSource(id))
  }
  const register = (location: SourceLocation, fallbackTitle: string) =>
    act().registerSource({
      title: title.trim() || fallbackTitle,
      kind,
      scope: scopeProject ? { kind: 'client', projectId: scopeProject, reusable: false } : { kind: 'practice' },
      location,
      owner: owner.trim() || undefined,
      audience,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    })

  const onFile = async (file: File) => {
    setError(null)
    setBusy(true)
    const id = replace?.id ?? register({ type: 'upload', filename: file.name, mime: file.type }, file.name.replace(/\.[^.]+$/, ''))
    const out = await uploadToSource(id, file)
    setBusy(false)
    if (out.status === 'failed') {
      setError(out.error)
      if (!replace) act().setAvailability(id, 'unsupported', out.error)
      return
    }
    finish(id)
  }
  const onText = async (text: string) => {
    const id = replace?.id ?? register({ type: 'upload', filename: 'pasted text' }, 'Pasted text')
    await pasteToSource(id, text, title || 'Pasted text')
    finish(id)
  }
  const addFigma = async (read: boolean) => {
    const parsed = parseFigmaUrl(figma)
    if (!parsed) return setError('Paste a Figma file link (figma.com/design/…) or a file key.')
    const id = register(parsed.board ? { type: 'figjam', fileKey: parsed.fileKey, nodeIds: parsed.nodeId ? [parsed.nodeId] : [] } : { type: 'figma', fileKey: parsed.fileKey, nodeIds: parsed.nodeId ? [parsed.nodeId] : [] }, 'Figma file')
    if (read && integrations.figma.configured && !parsed.board) {
      setBusy(true)
      const out = await readSource(id)
      setBusy(false)
      if (out.status === 'failed') setError(out.error)
    }
    finish(id)
  }
  const addLocal = async () => {
    if (!path.trim()) return setError('Enter a path such as gtm/battle-card.md')
    const id = register({ type: 'local', path: path.trim() }, path.split('/').pop() ?? path)
    if (!integrations.offline) {
      setBusy(true)
      const out = await readSource(id)
      setBusy(false)
      if (out.status === 'failed') return setError(out.error)
    }
    finish(id)
  }

  return (
    <Sheet wide title={replace ? `Replace "${replace.title}"` : 'Add a source'} onClose={onClose}>
      <div className="stack">
        {!replace && (
          <Field label="Where is it?">
            <Segmented ariaLabel="Where is it" value={where} onChange={(v) => setWhere(v)} options={[{ id: 'upload', label: 'Upload or paste' }, { id: 'figma', label: 'Figma file' }, { id: 'folder', label: 'Figma folder' }, { id: 'local', label: 'Practice file' }, { id: 'link', label: 'Link only' }]} />
          </Field>
        )}
        {!replace && (
          <div className="grid grid--2">
            <Field label="Title">
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Governance playbook v2" data-testid="source-title" />
            </Field>
            <Field label="Kind">
              <select className="select" value={kind} onChange={(e) => setKind(e.target.value as SourceKind)}>
                {KIND_OPTIONS.map((k) => (
                  <option key={k.id} value={k.id}>{k.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Owner" hint="Who keeps it current">
              <input className="input" list="owners" value={owner} onChange={(e) => setOwner(e.target.value)} />
              <datalist id="owners">
                <option value="Raquel Pereira" />
                <option value="Nuno Almeida" />
                <option value="Rui Dias" />
                <option value="Carolina Baptista" />
              </datalist>
            </Field>
            <Field label="Topics" hint="Comma-separated; they help retrieval">
              <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="governance, tokens, enablement" />
            </Field>
            <Field label="Who may see it" hint="Client-safe sources can be cited in what you publish to a client. Internal sources only inform the draft.">
              <Segmented ariaLabel="Audience" value={audience} onChange={(v) => setAudience(v)} options={[{ id: 'internal', label: 'Internal only' }, { id: 'client-safe', label: 'Client-safe' }, { id: 'public', label: 'Public' }]} />
            </Field>
            <Field label="Who is it for?" hint="Material from one client stays inside that client’s project and requests, unless someone approves it for reuse.">
              <select className="select" value={scopeProject} onChange={(e) => setScopeProject(e.target.value)} aria-label="Scope" data-testid="source-scope">
                <option value="">The whole practice</option>
                {Object.values(projects).map((p) => (
                  <option key={p.id} value={p.id}>
                    Only {p.client.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}
        {error && <Callout tone="err">{error}</Callout>}
        {(where === 'upload' || replace) && (
          <DropZone accept=".md,.markdown,.txt,.docx,.pdf,.json" onFile={onFile} onText={onText} busy={busy || job?.status === 'running'} hint="Markdown, text, Word (.docx), PDF with a text layer, or Figma text JSON from the knowledge plugin or figma-cli. Read in this browser; nothing is uploaded anywhere." />
        )}
        {where === 'figma' && !replace && (
          <div className="stack">
            <Field label="Figma file or frame link" hint="The Figma MCP and plugins cannot list folders: add files one by one, or use the Figma folder option with a token.">
              <input className="input" value={figma} onChange={(e) => setFigma(e.target.value)} placeholder="https://www.figma.com/design/…?node-id=…" data-testid="figma-link" />
            </Field>
            {!integrations.figma.configured && (
              <Callout tone="info">
                Figma REST is not configured, so the workspace cannot read the file itself. Register it now, then read it with the <strong>Nagarro knowledge export</strong> Figma plugin (zero tokens, any plan, no AI needed) and upload the JSON with Replace. A FIGMA_TOKEN in .env.local lets the workspace read it directly.
              </Callout>
            )}
            <div className="row" style={{ gap: 8 }}>
              <button className="btn btn--secondary" onClick={() => addFigma(false)}>Add without reading</button>
              <button className="btn btn--primary" disabled={!integrations.figma.configured || busy} onClick={() => addFigma(true)} title={integrations.figma.configured ? '' : 'Needs FIGMA_TOKEN'}>Add and read now</button>
            </div>
          </div>
        )}
        {where === 'folder' && !replace && (
          <div className="stack">
            <Callout tone="info">Folder discovery uses Figma REST (team → folders → files) and needs FIGMA_TOKEN with projects:read or folders:read. The Figma MCP cannot list folders. Register the folder now; list its files from the source page once a token is set.</Callout>
            <Field label="Figma team id" hint="From the team URL: figma.com/files/team/<id>">
              <input className="input" value={teamId} onChange={(e) => setTeamId(e.target.value)} placeholder="1587507004059459999" />
            </Field>
            <button className="btn btn--primary" disabled={!/^\d+$/.test(teamId)} onClick={() => finish(register({ type: 'figma-folder', teamId }, `Figma team ${teamId}`))}>Register the folder</button>
          </div>
        )}
        {where === 'local' && !replace && (
          <div className="stack">
            <Field label="Path in the practice folder" hint="Read by the local server from the allowed folders: gtm/, product-scoping/ and the DSN and Starter Pack docs. Markdown, text or HTML.">
              <input className="input" value={path} onChange={(e) => setPath(e.target.value)} placeholder="gtm/battle-card.md" />
            </Field>
            {integrations.offline && <Callout tone="warn">The local server is not running (this is a static build), so local files cannot be read. Upload the file instead.</Callout>}
            <button className="btn btn--primary" disabled={busy} onClick={addLocal}>{integrations.offline ? 'Add without reading' : 'Add and read now'}</button>
          </div>
        )}
        {where === 'link' && !replace && (
          <div className="stack">
            <Field label="Link">
              <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" data-testid="source-url" />
            </Field>
            <Callout tone="info">Links are registered, not read, so they never feed a draft. Use them to point colleagues at the source.</Callout>
            <button className="btn btn--primary" disabled={!/^https?:\/\//.test(url)} onClick={() => finish(register({ type: 'url', url }, url.replace(/^https?:\/\//, '')))} data-testid="add-link">
              Add without reading
            </button>
          </div>
        )}
      </div>
    </Sheet>
  )
}
