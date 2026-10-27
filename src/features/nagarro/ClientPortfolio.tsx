// New project: a client or prospect, created in this browser. Shown on My work.

import { useState } from 'react'
import { useNavigate } from 'react-router'
import { act } from '@/state/hooks'
import { nagarro } from '@/app/routes'
import { Field, Sheet } from '@/shell/ui'
import type { ProjectStatus } from '@/state/types'

export function NewProjectSheet({ onClose, onCreated }: { onClose: () => void; onCreated?: (slug: string) => void }) {
  const [name, setName] = useState('')
  const [sector, setSector] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('opportunity')
  const navigate = useNavigate()
  const create = () => {
    const slug = act().createProspect({ name, sector })
    if (status !== 'opportunity') act().updateCard(slug, { status })
    onClose()
    if (onCreated) onCreated(slug)
    else navigate(nagarro(slug).home)
  }
  return (
    <Sheet
      title="New project"
      onClose={onClose}
      actions={
        <>
          <button className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" disabled={!name.trim()} onClick={create} data-testid="create-project">
            Create the project
          </button>
        </>
      }
    >
      <p className="small muted">A project holds one client’s or prospect’s work: set-up journeys, their system, requests and presentations. It appears on My work and stays in this browser.</p>
      <Field label="Client or prospect">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Retail" autoFocus data-testid="project-name" />
      </Field>
      <Field label="Sector" hint="Optional. Used as context in drafts and decks.">
        <input className="input" value={sector} onChange={(e) => setSector(e.target.value)} placeholder="e.g. Retail" />
      </Field>
      <Field label="Where it stands" hint="An opportunity becomes a project when the work is won. You can change it on the card later.">
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
          <option value="opportunity">Opportunity: we are pitching or responding</option>
          <option value="in-progress">In progress: the work has started</option>
        </select>
      </Field>
    </Sheet>
  )
}

