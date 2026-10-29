'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { Button, PasswordInput } from 'ds-ngr';

/** Shown in place of a private prototype until the viewer enters its password. */
export function PasswordGate({ id }: { id: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    if (!password || pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/prototypes/${id}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error ?? 'Couldn’t open the prototype.');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setPending(false);
    }
  };

  return (
    <main className="gate">
      <form
        className="gate-card"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <span className="gate-icon" aria-hidden="true">
          <Lock size={20} />
        </span>
        <h1>This prototype is private</h1>
        <p className="muted">Enter the password the owner shared with you.</p>
        <PasswordInput
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={!!error}
          errorMessage={error ?? undefined}
        />
        <Button variant="primary" type="submit" disabled={!password || pending}>
          {pending ? 'Checking…' : 'Open prototype'}
        </Button>
      </form>
    </main>
  );
}
