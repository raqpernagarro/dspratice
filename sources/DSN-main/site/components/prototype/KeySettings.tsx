'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import { Button, Callout, PasswordInput, SegmentControl } from 'ds-ngr';
import { BYOK_PROVIDERS, type Provider } from '@/lib/chat/models';
import { saveKey } from './ai-keys';
import { finishOpenRouterSignIn, startOpenRouterSignIn } from './openrouter';
import type { ChatSource } from './Chat';

interface Props {
  source: ChatSource;
  provider: Provider;
  onProviderChange: (p: Provider) => void;
  onKey: (key: string) => void;
}

/** First-run setup: paste a provider key, or sign in with OpenRouter. */
export function KeySettings({ source, provider, onProviderChange, onKey }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const code = source === 'openrouter' ? params.get('code') : null;

  // OpenRouter sends the user back with ?code=; trade it for a key once, then drop it from the URL.
  useEffect(() => {
    if (!code) return;
    setPending(true);
    finishOpenRouterSignIn(code)
      .then((key) => store(key))
      .catch((err: Error) => setError(err.message))
      .finally(() => {
        setPending(false);
        router.replace('/prototype/chat?source=openrouter');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const store = (key: string) => {
    if (!saveKey(provider, key)) {
      setError('This browser blocks local storage, so the key cannot be kept. Allow site data and try again.');
      return;
    }
    onKey(key);
  };

  const meta = BYOK_PROVIDERS.find((p) => p.value === provider);

  if (source === 'openrouter') {
    return (
      <div className="chat-setup">
        <Button variant="primary" showLeadingIcon leadingIcon={<KeyRound size={16} />} disabled={pending} onClick={() => startOpenRouterSignIn()}>
          {pending ? 'Finishing sign-in…' : 'Sign in with OpenRouter'}
        </Button>
        {error && <Callout severity="error" title="Sign-in failed" description={error} />}
        <details className="chat-setup-alt">
          <summary>Or paste an OpenRouter key</summary>
          <KeyForm value={value} setValue={setValue} placeholder="sk-or-…" onSave={() => value.trim() && store(value.trim())} />
        </details>
      </div>
    );
  }

  return (
    <div className="chat-setup">
      <SegmentControl
        aria-label="Provider"
        fullWidth
        options={BYOK_PROVIDERS.map(({ value: v, label }) => ({ value: v, label }))}
        value={provider}
        onChange={(v) => onProviderChange(v as Provider)}
      />
      <KeyForm value={value} setValue={setValue} placeholder={meta?.keyHint} onSave={() => value.trim() && store(value.trim())} />
      {meta && (
        <p className="muted">
          No key yet? Create one in the{' '}
          <a href={meta.keyUrl} target="_blank" rel="noreferrer">
            {meta.label} console
          </a>
          .{provider === 'google' && ' Gemini keys from Google AI Studio are free — no card needed.'}
        </p>
      )}
      {error && <Callout severity="error" title="Key not saved" description={error} />}
    </div>
  );
}

function KeyForm({ value, setValue, placeholder, onSave }: { value: string; setValue: (v: string) => void; placeholder?: string; onSave: () => void }) {
  return (
    <form
      className="chat-key-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <PasswordInput
        label="API key"
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        helperText="Kept in this browser only. Sent with each chat request, never saved on the server."
        onChange={(e) => setValue(e.target.value)}
      />
      <Button variant="primary" type="submit" disabled={!value.trim()}>
        Start chatting
      </Button>
    </form>
  );
}
