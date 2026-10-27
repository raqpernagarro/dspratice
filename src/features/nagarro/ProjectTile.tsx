// One project on My work: a live preview of its own system, who it is for, where it stands and where
// its files live. Projects stay in this browser; nothing is shared between people.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { BookOpen, Code2, MoreHorizontal, PenTool, SquareKanban } from 'lucide-react'
import { act } from '@/state/hooks'
import { useStore } from '@/state/store'
import { nagarro, practice } from '@/app/routes'
import { Chip, Field, Sheet } from '@/shell/ui'
import { MenuButton, MenuItem } from '@/shell/Menu'
import { STATUS_LABEL, TAG_LABEL, flag, initials, isRealLink } from '@/state/card'
import { DemoScope } from '@/demo-system/DemoScope'
import { DsBadge, DsButton, DsInput, DsToggle } from '@/demo-system/components'
import { themeIntentVars } from '@/features/govern/LivePreview'
import type { Project, ProjectCard, ProjectStatus, ProjectTag } from '@/state/types'

export interface BoardItem {
  key: string
  name: string
  title?: string
  sector: string
  card: ProjectCard
  /** Where the tile opens. */
  to?: string
  projectId?: string
  sample?: boolean
  /** The project's own system, for the live preview. */
  system?: Project['draft']
  counts: { requests: number; decks: number; demo?: number }
}

export function boardItems(projects: Record<string, Project>): BoardItem[] {
  const local: BoardItem[] = Object.values(projects).map((p) => ({
    key: p.id,
    name: p.client.name,
    sector: p.client.sector,
    card: p.card,
    to: nagarro(p.slug).home,
    projectId: p.id,
    sample: p.client.fictional,
    system: p.draft,
    counts: { requests: Object.keys(p.opportunities ?? {}).length, decks: Object.keys(p.decks ?? {}).length, demo: p.published?.version },
  }))
  return local
}

const LINKS: { key: keyof ProjectCard['links']; label: string; icon: typeof PenTool }[] = [
  { key: 'figma', label: 'Figma', icon: PenTool },
  { key: 'code', label: 'Code', icon: Code2 },
  { key: 'jira', label: 'Jira', icon: SquareKanban },
  { key: 'storybook', label: 'Storybook', icon: BookOpen },
]

const STATUS_TONE: Record<ProjectStatus, 'ok' | 'warn' | 'outline' | 'default'> = { opportunity: 'warn', 'in-progress': 'ok', delivered: 'outline', paused: 'default' }

/** A small live preview of the project's own system: its brand, mode, radius and type on real components. */
export function SystemPreview({ system }: { system: Project['draft'] }) {
  const theme = system.theme
  const mode = theme.designedFirst ?? 'light'
  return (
    <DemoScope system={system} brand={theme.activeBrand} mode={mode} themed className="ptile__preview" style={themeIntentVars(theme, theme.activeBrand, mode)}>
      <div className="ptile__preview-row">
        <DsButton>Primary</DsButton>
        <DsButton variant="secondary">Secondary</DsButton>
        <DsBadge>Active</DsBadge>
      </div>
      <DsInput label="Display name" placeholder={theme.name} />
      <DsToggle label="Notifications" />
    </DemoScope>
  )
}

export function ProjectTile({ item, onEdit }: { item: BoardItem; onEdit?: (projectId: string) => void }) {
  const navigate = useNavigate()
  const projects = useStore((s) => s.projects)
  const { card } = item
  const slug = item.projectId ? projects[item.projectId]?.slug : undefined
  const body = (
    <>
      <span className="ptile__thumb" aria-hidden="true" style={card.thumbnail ? { backgroundImage: `url("${card.thumbnail}")` } : undefined}>
        {!card.thumbnail && item.system ? <SystemPreview system={item.system} /> : !card.thumbnail && <span className="ptile__mono">{initials(item.name)}</span>}
      </span>
      <span className="ptile__head">
        <strong className="ptile__name">
          {item.name}
          {item.title && <span className="ptile__title"> · {item.title}</span>}
        </strong>
        <span className="xs muted">
          {flag(card.country) && <span aria-label={card.country}>{flag(card.country)} </span>}
          {item.sector}
          {item.sample ? ' · sample' : ''}
        </span>
      </span>
      {card.brief && <span className="ptile__brief">{card.brief}</span>}
    </>
  )
  return (
    <article className="ptile" data-testid={`tile-${item.key}`}>
      {item.to ? (
        <Link to={item.to} className="ptile__main" onClick={() => item.projectId && act().selectProject(item.projectId)}>
          {body}
        </Link>
      ) : (
        <div className="ptile__main">{body}</div>
      )}
      <div className="ptile__chips">
        <Chip tone={STATUS_TONE[card.status]}>{STATUS_LABEL[card.status]}</Chip>
        {card.tags.map((t) => (
          <Chip key={t} tone="outline">
            {TAG_LABEL[t]}
          </Chip>
        ))}
      </div>
      <div className="ptile__foot">
        <span className="xs muted">{card.links && Object.values(card.links).some(isRealLink) ? 'Links' : 'No links yet'}</span>
        <span className="ptile__links">
          {LINKS.filter((l) => isRealLink(card.links[l.key])).map((l) => (
            <a key={l.key} href={card.links[l.key]} target="_blank" rel="noreferrer" className="icon-btn" title={l.label} aria-label={`${l.label} for ${item.name}`}>
              <l.icon />
            </a>
          ))}
          {(item.counts.requests > 0 || item.counts.decks > 0 || item.counts.demo) && (
            <span className="xs muted ptile__counts">
              {[item.counts.requests && `${item.counts.requests} request${item.counts.requests > 1 ? 's' : ''}`, item.counts.decks && `${item.counts.decks} deck${item.counts.decks > 1 ? 's' : ''}`, item.counts.demo && `demo v${item.counts.demo}`].filter(Boolean).join(' · ')}
            </span>
          )}
          {item.projectId && slug && (
            <MenuButton label={<><MoreHorizontal /><span className="sr-only">Actions for {item.name}</span></>} className="icon-btn" testid={`tile-menu-${item.key}`}>
              {(close) => (
                <>
                  <MenuItem title="Edit the card" detail="Status, tags, people, links" onClick={() => { close(); onEdit?.(item.projectId!) }} />
                  <MenuItem title="New client request" onClick={() => { close(); navigate(`${practice.opportunityStart}?project=${slug}`) }} />
                  <MenuItem title="New presentation" onClick={() => { close(); navigate(`${practice.deckNew}?project=${slug}`) }} />
                  <MenuItem title="Requests and decks" onClick={() => { close(); navigate(`${nagarro(slug).home}/requests`) }} />
                </>
              )}
            </MenuButton>
          )}
        </span>
      </div>
    </article>
  )
}

const STATUSES: ProjectStatus[] = ['opportunity', 'in-progress', 'delivered', 'paused']
const TAGS: ProjectTag[] = ['product-design', 'design-system', 'prototype', 'ai-ready']

export function EditCardSheet({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const p = useStore((s) => s.projects[projectId])
  const [card, setCard] = useState<ProjectCard>(() => structuredClone(p.card))
  const set = (patch: Partial<ProjectCard>) => setCard((c) => ({ ...c, ...patch }))
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  const save = () => {
    act().updateCard(projectId, { ...card, country: card.country?.trim().toUpperCase() || undefined, thumbnail: card.thumbnail?.trim() || undefined })
    onClose()
  }
  return (
    <Sheet
      title={`${p.client.name}: the project card`}
      onClose={onClose}
      wide
      actions={
        <>
          <button className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={save} data-testid="save-card">
            Save the card
          </button>
        </>
      }
    >
      <p className="small muted">What you see on this project’s tile in My work. It stays in this browser. Tasks stay in Jira: link the project, not the tickets.</p>
      <Field label="Where it stands">
        <select className="select" value={card.status} onChange={(e) => set({ status: e.target.value as ProjectStatus })} data-testid="card-status">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="What kind of work">
        <div className="row" style={{ flexWrap: 'wrap', gap: 12 }}>
          {TAGS.map((t) => (
            <label key={t} className="row small" style={{ gap: 6 }}>
              <input type="checkbox" checked={card.tags.includes(t)} onChange={() => set({ tags: toggle(card.tags, t) })} /> {TAG_LABEL[t]}
            </label>
          ))}
        </div>
      </Field>
      <Field label="In one line">
        <textarea className="input" rows={2} value={card.brief} onChange={(e) => set({ brief: e.target.value })} />
      </Field>
      <div className="grid grid--2">
        <Field label="Country" hint="Two letters, e.g. PT">
          <input className="input" value={card.country ?? ''} maxLength={2} onChange={(e) => set({ country: e.target.value })} />
        </Field>
        <Field label="Picture" hint="Optional image address; otherwise the system's colours">
          <input className="input" value={card.thumbnail ?? ''} onChange={(e) => set({ thumbnail: e.target.value })} placeholder="https://…" />
        </Field>
        {LINKS.map((l) => (
          <Field key={l.key} label={l.label}>
            <input className="input" value={card.links[l.key] ?? ''} onChange={(e) => set({ links: { ...card.links, [l.key]: e.target.value.trim() || undefined } })} placeholder="https://…" data-testid={`card-link-${l.key}`} />
          </Field>
        ))}
      </div>
    </Sheet>
  )
}
