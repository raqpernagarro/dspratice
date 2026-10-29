'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button, Callout, PromptInput, Tag } from 'ds-ngr';
import type { AssistRequest, AssistResult } from '@/lib/assist/mock';

/** Sends one request to /api/assist. Throws with the server's message. */
export async function requestAssist<T>(req: AssistRequest): Promise<AssistResult<T>> {
  const res = await fetch('/api/assist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Failed (${res.status}).`);
  return data;
}

interface Props<T> {
  /** Read out with the toggle, e.g. “AI assist for When to use”. */
  label?: string;
  actions: readonly { id: string; label: string }[];
  placeholder: string;
  /** Builds the request for a quick action (`id`) or typed text (`custom`). */
  request: (action: string, instruction: string) => AssistRequest;
  onAccept: (value: T) => void;
  /** Start open — e.g. when the form is still empty. */
  defaultOpen?: boolean;
  /** Toggle button size: `sm` inside a card header, `md` elsewhere. */
  size?: 'sm' | 'md';
}

/**
 * Ask → review → apply. Nothing changes in the form until the user accepts,
 * so a suggestion can be thrown away or asked for again.
 */
export function AssistPanel<T>({ label = 'AI assist', actions, placeholder, request, onAccept, defaultOpen = false, size = 'md' }: Props<T>) {
  const [open, setOpen] = useState(defaultOpen);
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<AssistResult<T> | null>(null);

  const run = async (action: string, instruction: string) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setSuggestion(null);
    try {
      setSuggestion(await requestAssist<T>(request(action, instruction)));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Button className="assist-toggle" variant="ghost" size={size} leadingIcon={<Sparkles />} showLeadingIcon onClick={() => setOpen(true)} aria-label={label === 'AI assist' ? undefined : label}>
        AI assist
      </Button>
    );
  }

  return (
    <div className="assist-panel" role="region" aria-label={label}>
      <div className="assist-head">
        <span className="assist-title"><Sparkles aria-hidden /> AI assist</span>
        <Tag size="sm" variant="neutral" label="Mock" />
        <Button variant="ghost" size="sm" onClick={() => { setOpen(false); setSuggestion(null); setError(null); }}>Close</Button>
      </div>
      <PromptInput
        aria-label={label}
        placeholder={placeholder}
        value={prompt}
        onChange={setPrompt}
        onSubmit={() => { if (!prompt.trim()) return; run('custom', prompt.trim()); setPrompt(''); }}
        quickActions={actions.map((a) => ({ id: a.id, label: a.label, onClick: () => run(a.id, prompt.trim()) }))}
      />
      <div aria-live="polite">
        {busy && <p className="muted assist-status">Thinking…</p>}
        {error && <Callout dismissible={false} severity="error" title="No suggestion" description={error} />}
        {suggestion && (
          <div className="assist-suggestion">
            <p>{suggestion.note}</p>
            {suggestion.changes.length > 0 && (
              <>
                <div className="rule-tags">{suggestion.changes.map((c) => <Tag key={c} size="sm" variant="highlight" label={c} />)}</div>
                <div className="rule-actions">
                  <Button variant="primary" size="sm" onClick={() => { onAccept(suggestion.value); setSuggestion(null); }}>Apply</Button>
                  <Button variant="secondary" size="sm" onClick={() => setSuggestion(null)}>Discard</Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
