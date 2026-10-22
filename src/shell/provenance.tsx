// Labels that say where something came from, so real reads and real model output never look like
// simulation, and template drafts never look like model output.
import { Radio, FileText, Link2, Sparkles, FlaskConical, Ban, CircleSlash } from 'lucide-react'
import type { Approval, Audience, Availability, KnowledgeSource, StatementKind } from '@/state/types'
import { Chip, SimBadge } from './ui'

const day = (t?: number) => (t ? new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '')

export function LiveBadge({ what, title }: { what: string; title?: string }) {
  return (
    <span className="chip chip--live" title={title}>
      <Radio />
      {what}
    </span>
  )
}

const READ_LABEL: Record<string, string> = { 'figma-mcp': 'Figma MCP', 'figma-rest': 'Figma REST', 'figma-plugin': 'Figma plugin', 'figma-cli': 'figma-cli', 'local-read': 'local file', upload: 'upload', paste: 'pasted' }

export function SourceBadge({ source }: { source: KnowledgeSource }) {
  if (source.availability === 'unsupported') return <Chip tone="dashed" icon={<Ban />} title={source.availabilityMessage}>Not readable</Chip>
  if (source.availability === 'inaccessible') return <Chip tone="err" icon={<CircleSlash />} title={source.availabilityMessage}>No access</Chip>
  if (source.location.type === 'url') return <Chip tone="outline" icon={<Link2 />} title="Links are registered, not read.">Link only</Chip>
  if (!source.readAt || source.availability === 'not-read') return <Chip tone="outline" title={source.availabilityMessage}>Not read yet</Chip>
  return <LiveBadge what={`Read · ${READ_LABEL[source.readBy ?? ''] ?? source.readBy} · ${day(source.readAt)}`} title={`Real text read ${new Date(source.readAt).toLocaleString()}. Nothing was written to the source.`} />
}

export function GenerationBadge({ mode, model, at }: { mode: 'template' | 'model'; model?: string; at?: number }) {
  if (mode === 'model') return <LiveBadge what={`Model draft · ${model ?? 'model'}${at ? ` · ${day(at)}` : ''}`} title="Drafted by the configured model from the selected sources, then checked by the hub. Review before sharing." />
  return <SimBadge what="Template draft (no model)" detail="Assembled by rules from the request and the sources' own text. No model was called and no tokens were spent." />
}

export const APPROVAL_TONE: Record<Approval, 'ok' | 'outline' | 'warn'> = { approved: 'ok', draft: 'outline', outdated: 'warn' }
export const APPROVAL_LABEL: Record<Approval, string> = { approved: 'Approved', draft: 'Draft', outdated: 'Outdated' }
export const AVAILABILITY_LABEL: Record<Availability, string> = { available: 'Available', inaccessible: 'No access', unsupported: 'Not readable', 'not-read': 'Not read' }
export const AUDIENCE_LABEL: Record<Audience, string> = { internal: 'Internal only', 'client-safe': 'Client-safe', public: 'Public' }

export function ApprovalChip({ approval, title }: { approval: Approval; title?: string }) {
  return <Chip tone={APPROVAL_TONE[approval]} title={title}>{APPROVAL_LABEL[approval]}</Chip>
}

export function AudienceChip({ audience }: { audience: Audience }) {
  return <Chip tone={audience === 'internal' ? 'ink' : audience === 'public' ? 'info' : 'mint'}>{AUDIENCE_LABEL[audience]}</Chip>
}

export const KIND_LABEL: Record<StatementKind, string> = { supported: 'Supported by a source', recommendation: 'Recommendation', assumption: 'Assumption', 'open-question': 'Open question' }
export const KIND_HELP: Record<StatementKind, string> = {
  supported: 'An approved Nagarro document says this; the citation shows exactly where.',
  recommendation: 'Our suggested answer, built from the sources and the request; not yet confirmed by an expert.',
  assumption: 'Something we had to assume because the request does not say; check it with the client.',
  'open-question': 'The sources cannot answer this; the account team or a practice expert must.',
}

export function KindChip({ kind }: { kind: StatementKind }) {
  return <span className={`kind-chip kind-chip--${kind}`} title={KIND_HELP[kind]}>{KIND_LABEL[kind]}</span>
}

export function ScopeChip({ source, clientName }: { source: KnowledgeSource; clientName?: string }) {
  if (source.scope.kind === 'practice') return <Chip tone="outline" icon={<FileText />}>Practice</Chip>
  return <Chip tone="ai" title={source.scope.reusable ? 'Approved for reuse with other clients' : 'Only visible inside this client'}>{clientName ?? 'Client'} {source.scope.reusable ? '· reusable' : 'only'}</Chip>
}

export function TemplateNote() {
  return (
    <span className="xs muted row" style={{ gap: 4 }}>
      <FlaskConical style={{ width: 12 }} /> Zero tokens
    </span>
  )
}

export function AiNote() {
  return (
    <span className="xs muted row" style={{ gap: 4 }}>
      <Sparkles style={{ width: 12 }} /> Uses the model
    </span>
  )
}
