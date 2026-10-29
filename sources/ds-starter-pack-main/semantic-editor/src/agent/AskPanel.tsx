import { ChatCircleDots, Key, PaperPlaneRight, Stop, X } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import type { BetaMessageParam } from '@anthropic-ai/sdk/resources/beta/messages/messages'

import { appType } from '../app/appTypes'
import { useApp, useProject } from '../app/AppContext'
import { explainError, streamAnswer } from './client'
import { componentDocs, docsSystemPrompt } from './docsContext'
import { Markdown } from './Markdown'

export interface AskTopic {
  /** Component name ("Button"), or null for the whole system. */
  component: string | null
  /** Where the user is, for the header ("Docs"). */
  place: string
}

interface Msg {
  role: 'user' | 'assistant'
  text: string
  error?: boolean
}

function suggestions(topic: AskTopic): string[] {
  if (topic.component) {
    const n = topic.component
    return [`When should I use ${n}?`, `Which props does ${n} have?`, `Show me ${n} in code`, `What tokens does ${n} use?`]
  }
  return ['Which component for a list of filters?', 'How do I add a new component?', 'What does density change?']
}

/** Questions and answers about the system, in context. */
export function AskPanel({ topic, onClose }: { topic: AskTopic; onClose: () => void }) {
  const { agent, setSettingsOpen } = useApp()
  const { doc } = useProject()
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const abort = useRef<AbortController | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages])
  useEffect(() => () => abort.current?.abort(), [])

  const ask = async (question: string) => {
    const q = question.trim()
    if (!q || busy) return
    const t = appType(doc.info.appType)
    const projectLine = `The project is “${doc.info.name}”, a ${t.name.toLowerCase()}.`
    const extra = topic.component ? `\n\n# The component the user is looking at\n${componentDocs(topic.component)}` : ''
    const history: BetaMessageParam[] = [
      ...messages.filter((m) => !m.error).map((m) => ({ role: m.role, content: m.text })),
      { role: 'user', content: q },
    ]
    setMessages((m) => [...m, { role: 'user', text: q }, { role: 'assistant', text: '' }])
    setInput('')
    setBusy(true)
    const controller = new AbortController()
    abort.current = controller
    try {
      await streamAnswer({
        settings: agent.run,
        system: [docsSystemPrompt(projectLine)[0] + extra],
        messages: history,
        signal: controller.signal,
        onText: (delta) =>
          setMessages((m) => {
            const copy = [...m]
            const last = copy[copy.length - 1]
            copy[copy.length - 1] = { ...last, text: last.text + delta }
            return copy
          }),
      })
    } catch (e) {
      setMessages((m) => {
        const copy = [...m]
        copy[copy.length - 1] = { role: 'assistant', text: explainError(e), error: true }
        return copy
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside className="agent-panel" aria-label="Ask the agent">
      <header className="agent-panel__head">
        <span className="agent-panel__badge" aria-hidden="true">
          <ChatCircleDots size={14} weight="fill" />
        </span>
        <div>
          <h2>{topic.component ? `Ask about ${topic.component}` : 'Ask about your system'}</h2>
          <p>Answers come from your system’s own docs.</p>
        </div>
        <button type="button" className="ui-icon-btn" onClick={onClose} aria-label="Close agent">
          <X size={14} weight="bold" />
        </button>
      </header>
      <div className="agent-panel__body agent-chat" ref={listRef}>
        {!messages.length ? (
          <div className="agent-chips agent-chips--stack">
            {suggestions(topic).map((s) => (
              <button key={s} type="button" disabled={!agent.ready} onClick={() => ask(s)}>
                {s}
              </button>
            ))}
          </div>
        ) : null}
        {messages.map((m, i) => (
          <div key={i} className={`agent-msg agent-msg--${m.role}${m.error ? ' is-error' : ''}`}>
            {m.role === 'assistant' ? m.text ? <Markdown text={m.text} /> : <p className="agent-timeline__wait">Thinking…</p> : <p>{m.text}</p>}
          </div>
        ))}
      </div>
      <form
        className="agent-ask agent-ask--dock"
        onSubmit={(e) => {
          e.preventDefault()
          ask(input)
        }}
      >
        {agent.ready ? null : (
          <button type="button" className="agent-link" onClick={() => setSettingsOpen(true)}>
            <Key size={12} weight="fill" /> Connect the agent to ask questions
          </button>
        )}
        <div className="agent-ask__inline">
          <input
            className="agent-ask__input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={topic.component ? `Ask about ${topic.component}…` : 'Ask anything about your system…'}
            aria-label="Your question"
            disabled={!agent.ready}
          />
          {busy ? (
            <button type="button" className="ui-btn ui-btn--ghost" onClick={() => abort.current?.abort()} aria-label="Stop">
              <Stop size={12} weight="fill" />
            </button>
          ) : (
            <button type="submit" className="ui-btn ui-btn--primary" disabled={!agent.ready || !input.trim()} aria-label="Send">
              <PaperPlaneRight size={12} weight="fill" />
            </button>
          )}
        </div>
        {agent.ready ? <p className="agent-via">Running on: {agent.connection === 'plan' ? 'your Claude plan' : 'API key'}</p> : null}
      </form>
    </aside>
  )
}
