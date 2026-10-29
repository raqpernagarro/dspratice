'use client';

import { useEffect, useRef, useState } from 'react';
import type { UIMessage } from 'ai';
import { Button, Callout, Tag, TextInput } from 'ds-ngr';
import type { Issue } from '@/lib/prototype/ir';
import { toolName, type ToolPart } from './Chat';
import { PREVIEW_MESSAGE, type PreviewPayload } from './PreviewFrame';
import { PICK_MESSAGE, type Pick } from './pick';

/**
 * Pieces shared by the Create component and Customize component canvases:
 * reading tool results out of the chat, live preview frames, issue lists and
 * saving to a team kit.
 */

const SEVERITY_TAG = { error: 'error', warning: 'warning', info: 'neutral' } as const;

/** The newest successful output of tool `name` in the conversation. */
export function latestOutput<T>(messages: UIMessage[], name: string): T | null {
  for (let m = messages.length - 1; m >= 0; m--) {
    const parts = messages[m].parts;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (!('toolCallId' in p) || p.state !== 'output-available' || toolName(p as ToolPart) !== name) continue;
      const out = p.output as { error?: string } | undefined;
      if (out && !out.error) return out as T;
    }
  }
  return null;
}

/**
 * One same-origin preview frame, fed over postMessage once it says it's ready.
 * With `payload.pick`, clicks inside it point at a part and arrive in `onPick`.
 */
export function SheetPreview({ payload, title, onPick }: { payload: PreviewPayload; title: string; onPick?: (p: Pick) => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const ready = useRef(false);
  const latest = useRef(payload);
  latest.current = payload;
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  const post = () => {
    if (ready.current) frame.current?.contentWindow?.postMessage({ type: PREVIEW_MESSAGE, ...latest.current }, window.location.origin);
  };

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      if (e.data?.type === PICK_MESSAGE && e.data.pick) return pickRef.current?.(e.data.pick as Pick);
      if (e.data?.type !== `${PREVIEW_MESSAGE}:ready`) return;
      ready.current = true;
      post();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(post, [payload.root, payload.kit, payload.themeQuery, payload.mode, payload.pick]);

  return <iframe ref={frame} src="/p/preview" title={title} />;
}

export function IssueList({ issues }: { issues: Issue[] }) {
  if (!issues.length) return null;
  return (
    <ul className="pg-issues" aria-label="Issues">
      {issues.map((issue, i) => (
        <li key={i}>
          <Tag variant={SEVERITY_TAG[issue.severity]} size="sm" label={issue.severity} />
          <span>{issue.message}</span>
        </li>
      ))}
    </ul>
  );
}

export function IssueBadges({ errors, warnings }: { errors: number; warnings: number }) {
  return (
    <>
      {errors > 0 && <Tag size="sm" variant="error" label={`${errors} error${errors > 1 ? 's' : ''}`} />}
      {warnings > 0 && <Tag size="sm" variant="warning" label={`${warnings} warning${warnings > 1 ? 's' : ''}`} />}
      {errors + warnings === 0 && <Tag size="sm" variant="success" label="Passes DS rules" />}
    </>
  );
}

export type KitTarget = { id: string; editToken: string };

/**
 * Save the chosen option to the connected kit, or to a new one created on
 * the spot. `persist` does the actual write and throws with a readable message.
 */
export function KitSavePanel({
  heading,
  errors,
  busy,
  kitId,
  kitKey,
  themeQuery,
  persist,
  savedTitle,
  savedDescription,
  again,
}: {
  heading: string;
  errors: number;
  busy: boolean;
  kitId?: string;
  kitKey?: string;
  themeQuery: string;
  persist: (kit: KitTarget) => Promise<void>;
  savedTitle: string;
  savedDescription: string;
  /** Where "do another" goes; receives the kit query (kit + key). */
  again: { label: string; href: (kitQuery: string) => string };
}) {
  const [kitName, setKitName] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ kitId: string; created?: string } | null>(null);
  const canEdit = !!(kitId && kitKey);

  const save = async () => {
    setStatus('saving');
    setError(null);
    try {
      let target: KitTarget | null = canEdit ? { id: kitId!, editToken: kitKey! } : null;
      let created: string | undefined;
      if (!target) {
        const res = await fetch('/api/kits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: kitName.trim() || 'Team kit', theme: themeQuery }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `Could not create the kit (${res.status}).`);
        target = { id: data.id, editToken: data.editToken };
        created = data.editToken;
      }
      await persist(target);
      setSaved({ kitId: target.id, created });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setStatus('idle');
    }
  };

  if (saved) {
    const kitQuery = `kit=${saved.kitId}&key=${encodeURIComponent(saved.created ?? kitKey ?? '')}`;
    return (
      <Callout
        severity="success"
        title={savedTitle}
        dismissible={false}
        description={saved.created ? 'A new kit was created. Keep the edit link private — anyone with it can change the kit.' : savedDescription}
        actions={
          <div className="draft-save-actions">
            <a className="draft-link" href={`/prototype/kits/${saved.kitId}?key=${encodeURIComponent(saved.created ?? kitKey ?? '')}`} target="_blank" rel="noreferrer">Open kit</a>
            <a className="draft-link" href={`/prototype/chat?${kitQuery}`}>Use in a prototype</a>
            <a className="draft-link" href={again.href(kitQuery)}>{again.label}</a>
          </div>
        }
      />
    );
  }

  return (
    <div className="draft-save">
      <div className="draft-save-text">
        <strong>{heading}</strong>
        <span className="muted">
          {canEdit ? 'Saves to the connected kit — yours or your team’s. DS-Ngr itself is not changed.' : 'No kit is connected — one will be created for you. Keep it to yourself, or share it with your team.'}
        </span>
      </div>
      {!canEdit && <TextInput label="Kit name" placeholder="e.g. Checkout team, or your name" value={kitName} onChange={(e) => setKitName(e.target.value)} />}
      {error && <p className="pg-error">{error}</p>}
      <Button variant="primary" onClick={save} loading={status === 'saving'} disabled={errors > 0 || busy || status === 'saving'}>
        {errors > 0 ? 'Fix errors before saving' : 'Add to kit'}
      </Button>
    </div>
  );
}

/** PATCH a kit; turns a failed save into one readable message. */
export async function patchKit(kit: KitTarget, body: unknown) {
  const res = await fetch(`/api/kits/${kit.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-edit-token': kit.editToken },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    const first = (data.issues as Issue[] | undefined)?.find((i) => i.severity === 'error');
    throw new Error([data.error ?? `Save failed (${res.status}).`, first?.message].filter(Boolean).join(' '));
  }
  return data;
}
