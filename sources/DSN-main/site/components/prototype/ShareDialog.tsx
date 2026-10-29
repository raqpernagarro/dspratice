'use client';

import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button, Callout, Modal, PasswordInput, SingleChoice } from 'ds-ngr';

type Visibility = 'public' | 'private';

const MIN_PASSWORD = 4;

const OPTIONS = [
  { id: 'public', label: 'Anyone with the link', description: 'Opens straight away, no password.' },
  { id: 'private', label: 'Only people with the password', description: 'Viewers enter a password before the prototype opens.' },
];

/**
 * Share a prototype: copy its link and choose who can open it. Access changes
 * need the edit token the conversation got when the prototype was created.
 */
export function ShareDialog({ id, editToken, open, onClose }: { id: string; editToken: string | null; open: boolean; onClose: () => void }) {
  const [saved, setSaved] = useState<{ visibility: Visibility; hasPassword: boolean } | null>(null);
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const url = typeof window === 'undefined' ? `/p/${id}` : `${window.location.origin}/p/${id}`;

  // Load current access each time the dialog opens for a prototype.
  useEffect(() => {
    if (!open) return;
    setPassword('');
    setError(null);
    setNotice(null);
    setCopied(false);
    if (!editToken) return;
    let live = true;
    fetch(`/api/prototypes/${id}/access`, { headers: { 'x-edit-token': editToken }, cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Couldn’t load the share settings.');
        if (!live) return;
        setSaved(data);
        setVisibility(data.visibility);
      })
      .catch((err: Error) => live && setError(err.message));
    return () => {
      live = false;
    };
  }, [open, id, editToken]);

  const needsPassword = visibility === 'private' && !saved?.hasPassword;
  const passwordProblem = password && password.length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters.` : null;
  const changed = !!saved && (visibility !== saved.visibility || (visibility === 'private' && !!password));
  const canSave = changed && !pending && !passwordProblem && !(needsPassword && !password);

  const save = async () => {
    if (!editToken || !canSave) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/prototypes/${id}/access`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-edit-token': editToken },
        body: JSON.stringify({ visibility, ...(visibility === 'private' && password && { password }) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      setSaved(data);
      setPassword('');
      setNotice(data.visibility === 'private' ? 'The link now asks for the password. Share the password separately.' : 'Anyone with the link can open it.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('This browser blocked the clipboard. Select the link and copy it instead.');
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Share prototype"
      description="Anyone you send the link to sees the live prototype, not the chat."
      className="share-dialog"
      bottomBarRightActions={
        <>
          <Button variant="ghost" onClick={onClose}>
            {changed ? 'Cancel' : 'Done'}
          </Button>
          {editToken && (
            <Button variant="primary" onClick={save} disabled={!canSave}>
              {pending ? 'Saving…' : 'Save'}
            </Button>
          )}
        </>
      }
    >
      <div className="share-body">
        <div className="share-link">
          <span className="share-url" title={url}>
            {url}
          </span>
          <Button variant="secondary" showLeadingIcon leadingIcon={copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />} onClick={copy}>
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        </div>

        {editToken ? (
          <>
            <SingleChoice
              label="Who can open the link"
              helperText=""
              options={OPTIONS}
              value={visibility}
              onValueChange={(v) => {
                setVisibility(v as Visibility);
                setNotice(null);
              }}
              disabled={!saved || pending}
            />
            {visibility === 'private' && (
              <PasswordInput
                label={saved?.hasPassword ? 'New password' : 'Password'}
                optional={!!saved?.hasPassword}
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
                error={!!passwordProblem}
                errorMessage={passwordProblem ?? undefined}
                helperText={saved?.hasPassword ? 'Leave empty to keep the current password.' : `At least ${MIN_PASSWORD} characters. Send it separately from the link.`}
              />
            )}
          </>
        ) : (
          <p className="muted">This prototype wasn’t created in this chat, so its access can’t be changed here.</p>
        )}

        {notice && <Callout severity="success" title="Saved" description={notice} />}
        {error && <Callout severity="error" title="Something went wrong" description={error} />}
      </div>
    </Modal>
  );
}
