// Settings › Integrations: where each practice tool answers on this machine. Kept in this browser
// only. `npm run tools` starts every tool on its default port, so a change here is for a tool you
// run yourself on another port or host.

import { useEffect, useState } from 'react'
import { TOOL_SERVERS, defaultAddress, type ToolServer } from '@/fixtures/experiences'
import { cleanAddress, useAddress, useTools } from '@/integrations/tools'
import { Panel } from '@/shell/ui'
import { RunChip } from './ExperienceFrame'

function AddressRow({ s }: { s: ToolServer }) {
  const address = useAddress(s.id)
  const run = useTools((st) => st.run[s.id])
  const setAddress = useTools((st) => st.setAddress)
  const check = useTools((st) => st.check)
  const [value, setValue] = useState(address)
  const invalid = value.trim() !== '' && !cleanAddress(value)
  useEffect(() => setValue(address), [address])
  const commit = () => {
    if (invalid) return
    setAddress(s.id, value.trim() || null)
    void check(s.id)
  }
  return (
    <li className="tool-address">
      <span>
        <strong>{s.name}</strong>
        <span className="xs muted" style={{ display: 'block' }}>
          {s.from} · default {defaultAddress(s)}
        </span>
      </span>
      <span>
        <input
          className="input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          aria-label={`${s.name} address`}
          aria-invalid={invalid || undefined}
          placeholder={defaultAddress(s)}
          data-testid={`address-${s.id}`}
        />
        {invalid && <span className="xs" style={{ color: 'var(--n-err, #c62828)' }}>Use a full address, such as {defaultAddress(s)}.</span>}
      </span>
      <RunChip state={run.state} />
    </li>
  )
}

export function ToolAddresses() {
  const checkAll = useTools((s) => s.checkAll)
  useEffect(() => {
    void checkAll()
  }, [checkAll])
  return (
    <Panel title="Practice tools on this machine" actions={<span className="xs muted">Saved in this browser. Leave empty for the default.</span>}>
      <p className="small muted" style={{ marginTop: 0 }}>
        Where the workspace looks for each tool. <code>npm run tools -- start &lt;tool&gt;</code> uses the default address.
      </p>
      <ul className="stack" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 12 }}>
        {TOOL_SERVERS.map((s) => (
          <AddressRow key={s.id} s={s} />
        ))}
      </ul>
    </Panel>
  )
}
