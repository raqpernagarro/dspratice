import { Eye, EyeSlash, Key, X } from '@phosphor-icons/react'
import { useEffect, useId, useRef, useState } from 'react'

import { AGENT_MODELS, type AgentConnection } from './store'
import { resolveConnection, useApp, type AgentState } from './AppContext'

/** How the agent connects to Claude (the user's plan or an API key) and the model. Stored in this browser only. */
export function SettingsDialog() {
  const { settings, setSettings, agent, settingsOpen, setSettingsOpen, notify } = useApp()
  /** null until the user picks: follows the default (the plan when it is logged in). */
  const [pick, setPick] = useState<AgentConnection | null>(settings.connection)
  const [key, setKey] = useState(settings.apiKey)
  const [model, setModel] = useState(settings.model)
  const [show, setShow] = useState(false)
  const ref = useRef<HTMLDialogElement>(null)
  const keyId = useId()
  const { plan } = agent
  const connection = resolveConnection({ ...settings, connection: pick }, plan.supported, plan.status)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (settingsOpen && !el.open) {
      setPick(settings.connection)
      setKey(settings.apiKey)
      setModel(settings.model)
      plan.recheck()
      el.showModal()
    } else if (!settingsOpen && el.open) el.close()
  }, [settingsOpen, settings, plan])

  const save = () => {
    setSettings({ connection, apiKey: key.trim(), model })
    setSettingsOpen(false)
    if (connection === 'plan') notify(plan.status?.loggedIn ? 'Agent connected to your Claude plan. Look for the sparkle button in every step.' : 'Saved. Log in to Claude Code to use your plan.')
    else notify(key.trim() ? 'Agent connected with your API key. Look for the sparkle button in every step.' : 'Agent disconnected.')
  }

  return (
    <dialog ref={ref} className="ui-dialog" onClose={() => setSettingsOpen(false)} aria-labelledby="settings-title">
      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <header className="ui-dialog__head">
          <span className="ui-dialog__icon" aria-hidden="true">
            <Key size={18} weight="fill" />
          </span>
          <div>
            <h2 id="settings-title">Connect the agent</h2>
            <p>The agent styles your system from a description, answers questions in the docs and builds screens. It runs on Claude.</p>
          </div>
          <button type="button" className="ui-icon-btn" onClick={() => setSettingsOpen(false)} aria-label="Close">
            <X size={14} weight="bold" />
          </button>
        </header>

        <fieldset className="ui-connects">
          <legend className="ui-label">How should the agent connect to Claude?</legend>
          <div className={`ui-model${connection === 'plan' ? ' is-selected' : ''}${plan.supported ? '' : ' is-disabled'}`}>
            <label className="ui-connect">
              <input type="radio" name="connection" value="plan" checked={connection === 'plan'} disabled={!plan.supported} onChange={() => setPick('plan')} />
              <strong>My Claude plan (this computer)</strong>
              <span>Included in your Claude plan. Only works while the editor runs on this computer.</span>
            </label>
            <PlanStatusLine plan={plan} />
          </div>
          <div className={`ui-model${connection === 'apiKey' ? ' is-selected' : ''}`}>
            <label className="ui-connect">
              <input type="radio" name="connection" value="apiKey" checked={connection === 'apiKey'} onChange={() => setPick('apiKey')} />
              <strong>API key</strong>
              <span>Works anywhere, including the published site. Billed per use to the key’s account.</span>
            </label>
          </div>
        </fieldset>

        {connection === 'apiKey' ? (
          <>
            <label className="ui-label" htmlFor={keyId}>
              Claude API key
            </label>
            <div className="ui-input-row">
              <input
                id={keyId}
                className="ui-input"
                type={show ? 'text' : 'password'}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="sk-ant-…"
                autoComplete="off"
                spellCheck={false}
              />
              <button type="button" className="ui-icon-btn" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide key' : 'Show key'}>
                {show ? <EyeSlash size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p className="ui-hint">
              Saved in this browser only and sent straight to Anthropic, never to another server. Create one in the{' '}
              <a href="https://platform.claude.com/settings/keys" target="_blank" rel="noreferrer">
                Claude Console
              </a>
              . Usage is billed to that key’s account.
            </p>
          </>
        ) : null}

        <fieldset className="ui-models">
          <legend className="ui-label">Model</legend>
          {AGENT_MODELS.map((m) => (
            <label key={m.id} className={`ui-model${model === m.id ? ' is-selected' : ''}`}>
              <input type="radio" name="model" value={m.id} checked={model === m.id} onChange={() => setModel(m.id)} />
              <strong>{m.label}</strong>
              <span>{m.hint}</span>
            </label>
          ))}
        </fieldset>

        <footer className="ui-dialog__foot">
          {connection === 'apiKey' && settings.apiKey ? (
            <button
              type="button"
              className="ui-btn ui-btn--ghost"
              onClick={() => {
                setKey('')
                setSettings({ connection, apiKey: '', model })
                setSettingsOpen(false)
                notify('Agent disconnected. The key was removed from this browser.')
              }}
            >
              Remove key
            </button>
          ) : (connection === 'plan' ? plan.status?.loggedIn : key.trim()) ? (
            <span />
          ) : (
            <span className="ui-hint">Not connected? Presets and example screens still work.</span>
          )}
          <button type="submit" className="ui-btn ui-btn--primary">
            Save
          </button>
        </footer>
      </form>
    </dialog>
  )
}

/** Whether Claude Code is on this computer and logged in, in one line. */
function PlanStatusLine({ plan }: { plan: AgentState['plan'] }) {
  if (!plan.supported) return <span className="ui-status">Not on the published site: it needs the editor running on your computer.</span>
  if (plan.checking && !plan.status) return <span className="ui-status">Looking for Claude Code…</span>
  if (plan.status?.loggedIn) {
    return (
      <span className="ui-status is-ok">
        ✓ Found, logged in{plan.status.plan ? ` · ${plan.status.plan[0].toUpperCase()}${plan.status.plan.slice(1)} plan` : ''}
      </span>
    )
  }
  const installed = plan.status?.installed
  return (
    <div className="ui-status is-off">
      <details className="ui-howto">
        <summary>{installed ? '✗ Found, not logged in — how to log in' : '✗ Not found — how to install'}</summary>
        <ol>
          {installed ? null : (
            <li>
              Install Claude Code:{' '}
              <a href="https://claude.com/claude-code" target="_blank" rel="noreferrer">
                claude.com/claude-code
              </a>
              .
            </li>
          )}
          <li>
            In a terminal, run <code>claude</code> and log in with your Claude account.
          </li>
          <li>Come back here and check again.</li>
        </ol>
      </details>
      <button
        type="button"
        className="agent-link"
        onClick={plan.recheck}
        disabled={plan.checking}
      >
        {plan.checking ? 'Checking…' : 'Check again'}
      </button>
    </div>
  )
}
