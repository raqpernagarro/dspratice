'use client';

import { useState } from 'react';
import { GitPullRequest } from 'lucide-react';
import { Button } from 'ds-ngr';

type CustomizeOption = {
  name: string;
  summary: string;
  tokens: Record<string, string>;
  defaults: Record<string, string | number | boolean>;
  errors: number;
};

export function CreatePullRequestButton({
  component,
  option,
  busy,
}: {
  component: string;
  option: CustomizeOption | null;
  busy: boolean;
}) {
  const [status, setStatus] = useState<'idle' | 'working'>('idle');
  const [error, setError] = useState<string | null>(null);

  const disabled = !option || option.errors > 0 || busy || status === 'working';
  const label = status === 'working' ? 'Opening…' : 'Create PR';

  const create = async () => {
    if (!option || disabled) return;
    setStatus('working');
    setError(null);
    try {
      const res = await fetch('/api/customize/pull-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          component,
          optionName: option.name,
          summary: option.summary,
          tokens: option.tokens,
          defaults: option.defaults,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Could not create the pull request (${res.status}).`);
      if (data.url) window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setStatus('idle');
    }
  };

  return (
    <Button
      variant="secondary"
      size="md"
      showLeadingIcon
      leadingIcon={<GitPullRequest size={16} aria-hidden="true" />}
      disabled={disabled}
      loading={status === 'working'}
      onClick={create}
      title={error ?? undefined}
      aria-label={option ? `Create pull request for ${option.name}` : 'Choose an option before creating a pull request'}
    >
      {label}
    </Button>
  );
}
