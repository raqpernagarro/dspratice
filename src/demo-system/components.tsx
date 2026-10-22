import { useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Plus, Search, Settings } from 'lucide-react'

// The Demo Brand kit: 16 small, real React components styled only by the system's tokens.

export function DsButton({ children, variant = 'primary', size = 'md', disabled, state, icon }: { children?: React.ReactNode; variant?: string; size?: string; disabled?: boolean; state?: 'hover' | 'active'; icon?: React.ReactNode }) {
  return (
    <button className="ds-button" data-variant={variant} data-size={size} data-state={state} disabled={disabled} type="button">
      {icon}
      {children}
    </button>
  )
}

export function DsIconButton({ label = 'Settings', variant = 'primary' }: { label?: string; variant?: string }) {
  return (
    <button className="ds-button ds-icon-button" data-variant={variant} aria-label={label} type="button">
      <Settings style={{ width: 16, height: 16 }} />
    </button>
  )
}

export function DsTabs({ items = ['Usage', 'Tokens', 'Figma', 'Checks'] }: { items?: string[] }) {
  const [i, setI] = useState(0)
  return (
    <div className="ds-tabs" role="tablist">
      {items.map((t, k) => (
        <button key={t} role="tab" aria-selected={i === k} onClick={() => setI(k)} type="button">
          {t}
        </button>
      ))}
    </div>
  )
}

export function DsLink({ children = 'Read the guidance' }: { children?: React.ReactNode }) {
  return (
    <button className="ds-link" type="button">
      {children}
    </button>
  )
}

export function DsMenu() {
  const [sel, setSel] = useState(1)
  return (
    <div className="ds-menu" role="menu">
      {['Rename', 'Duplicate', 'Move to…', 'Delete'].map((t, k) => (
        <button key={t} className="ds-menu-item" role="menuitem" aria-selected={sel === k} onClick={() => setSel(k)} type="button">
          {t}
        </button>
      ))}
    </div>
  )
}

export function DsToggle({ label = 'Email me about mentions', defaultChecked = true }: { label?: string; defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <button className="ds-toggle" role="switch" aria-checked={on} onClick={() => setOn(!on)} type="button">
      <span className="ds-toggle__track" />
      <span>{label}</span>
    </button>
  )
}

export function DsPagination({ pages = 5 }: { pages?: number }) {
  const [p, setP] = useState(2)
  return (
    <nav className="ds-pagination" aria-label="Pagination">
      <button type="button" onClick={() => setP(Math.max(1, p - 1))} aria-label="Previous">
        <ChevronLeft style={{ width: 14, height: 14 }} />
      </button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <button key={n} type="button" aria-current={p === n ? 'page' : undefined} onClick={() => setP(n)}>
          {n}
        </button>
      ))}
      <button type="button" onClick={() => setP(Math.min(pages, p + 1))} aria-label="Next">
        <ChevronRight style={{ width: 14, height: 14 }} />
      </button>
    </nav>
  )
}

export function DsInput({ label = 'Display name', placeholder = 'Ada Lovelace', error }: { label?: string; placeholder?: string; error?: string }) {
  return (
    <div className="ds-field">
      <label>{label}</label>
      <input className="ds-input" placeholder={placeholder} aria-invalid={error ? true : undefined} />
      {error && <span className="ds-field__error">{error}</span>}
    </div>
  )
}

export function DsSelect({ label = 'Frequency', options = ['Immediately', 'Daily digest', 'Weekly digest'] }: { label?: string; options?: string[] }) {
  return (
    <div className="ds-field">
      <label>{label}</label>
      <select className="ds-select" defaultValue={options[0]}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}

export function DsCheckbox({ label = 'Remember this device', defaultChecked = true }: { label?: string; defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <button className="ds-checkbox" role="checkbox" aria-checked={on} onClick={() => setOn(!on)} type="button">
      <span className="ds-checkbox__box">{on && <Check style={{ width: 12, height: 12 }} />}</span>
      <span>{label}</span>
    </button>
  )
}

export function DsCard({ title = 'Notifications', body = 'Choose how and when the product reaches you.', variant = 'default', children }: { title?: string; body?: string; variant?: string; children?: React.ReactNode }) {
  return (
    <div className="ds-card" data-variant={variant}>
      <h5>{title}</h5>
      <p>{body}</p>
      {children}
    </div>
  )
}

export function DsToast({ text = 'Changes saved', tone }: { text?: string; tone?: 'warning' }) {
  return (
    <div className="ds-toast" role="status" data-tone={tone}>
      <Check style={{ width: 14, height: 14 }} />
      {text}
    </div>
  )
}

export function DsModal({ title = 'Delete workspace?', body = 'This removes the workspace and its 12 projects for everyone.' }: { title?: string; body?: string }) {
  return (
    <div className="ds-modal" role="dialog" aria-modal="true">
      <h5>{title}</h5>
      <p style={{ margin: 0, color: 'var(--color-foreground-neutral-muted)', fontSize: 'var(--font-size-sm)' }}>{body}</p>
      <div className="ds-modal__actions">
        <DsButton variant="ghost">Cancel</DsButton>
        <DsButton variant="destructive">Delete</DsButton>
      </div>
    </div>
  )
}

export function DsBadge({ children = 'Active', tone }: { children?: React.ReactNode; tone?: 'success' | 'error' | 'warning' }) {
  return (
    <span className="ds-badge" data-tone={tone}>
      {children}
    </span>
  )
}

export function DsAvatar({ initials = 'AL' }: { initials?: string }) {
  return <span className="ds-avatar">{initials}</span>
}

export function DsTable({ rows = [['Starter', '€29', 'Active'], ['Team', '€79', 'Active'], ['Enterprise', 'Custom', 'Trial']] }: { rows?: string[][] }) {
  return (
    <table className="ds-table">
      <thead>
        <tr>
          <th>Plan</th>
          <th>Price</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r[0]}>
            <td>{r[0]}</td>
            <td>{r[1]}</td>
            <td>
              <DsBadge tone={r[2] === 'Active' ? 'success' : 'warning'}>{r[2]}</DsBadge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function DsPageHeader({ title = 'Settings', sub = 'Manage your workspace.' }: { title?: string; sub?: string }) {
  return (
    <div className="ds-page-header">
      <h4>{title}</h4>
      <p>{sub}</p>
    </div>
  )
}

export function DsSearch() {
  return (
    <div className="ds-field" style={{ position: 'relative' }}>
      <input className="ds-input" placeholder="Search" style={{ paddingLeft: 32 }} aria-label="Search" />
      <Search style={{ position: 'absolute', left: 10, top: 12, width: 14, height: 14, color: 'var(--color-foreground-neutral-subtle)' }} />
    </div>
  )
}

/** Renders a preview for any component id; data-only components get a representative stand-in. */
export function ComponentPreview({ id, label, props }: { id: string; label?: string; props?: Record<string, string> }) {
  switch (id) {
    case 'button':
      return (
        <DsButton variant={props?.variant ?? 'primary'} size={props?.size}>
          {label ?? 'Save changes'}
        </DsButton>
      )
    case 'icon-button':
      return <DsIconButton />
    case 'tabs':
      return <DsTabs />
    case 'link':
      return <DsLink>{label}</DsLink>
    case 'menu-item':
    case 'dropdown-menu':
      return <DsMenu />
    case 'toggle':
    case 'switch':
      return <DsToggle label={label} defaultChecked={props?.checked !== 'false'} />
    case 'pagination':
      return <DsPagination />
    case 'input':
    case 'text-area':
    case 'number-field':
    case 'date-field':
      return <DsInput label={label} />
    case 'search-input':
      return <DsSearch />
    case 'select':
    case 'combobox':
      return <DsSelect label={label} />
    case 'checkbox':
    case 'radio':
      return <DsCheckbox label={label} />
    case 'card':
    case 'kpi-card':
      return <DsCard title={label} />
    case 'toast':
    case 'snackbar':
      return <DsToast text={label} />
    case 'modal':
    case 'dialog':
      return <DsModal />
    case 'badge':
    case 'tag':
    case 'chip':
      return <DsBadge tone="success">{label ?? 'Active'}</DsBadge>
    case 'avatar':
      return <DsAvatar />
    case 'table':
    case 'data-grid':
    case 'list':
      return <DsTable />
    case 'page-header':
      return <DsPageHeader title={label} />
    default:
      return (
        <div className="ds-card" style={{ alignItems: 'center', justifyContent: 'center', minHeight: 56 }}>
          <p>
            {label ?? id} <Plus style={{ width: 12, height: 12, verticalAlign: 'middle' }} />
          </p>
        </div>
      )
  }
}
