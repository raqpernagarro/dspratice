'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Copy, Download, Save } from 'lucide-react';
import { Button, Callout, SegmentControl, TextArea } from 'ds-ngr';

// react-markdown doesn't server-render from a client component here; the preview is client-only anyway.
const Markdown = dynamic(() => import('@/components/Markdown').then((m) => m.Markdown), { ssr: false });

interface Props {
  slug: string;
  /** Repo path, e.g. skills/ds-patrol/SKILL.md. */
  source: string;
  initial: string;
  canWriteRepo: boolean;
}

/** SKILL.md as plain markdown with a live preview, and copy / download / save. */
export function SkillEditor({ slug, source, initial, canWriteRepo }: Props) {
  const [original, setOriginal] = useState(initial);
  const [markdown, setMarkdown] = useState(initial);
  const [view, setView] = useState<'preview' | 'markdown'>('preview');
  const [saved, setSaved] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const dirty = markdown !== original;

  const copy = () => navigator.clipboard.writeText(markdown).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  const download = () => {
    const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown' }));
    Object.assign(document.createElement('a'), { href: url, download: 'SKILL.md' }).click();
    URL.revokeObjectURL(url);
  };
  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/skills/${slug}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ original, markdown }) });
      const data = await res.json();
      if (res.ok) setOriginal(markdown);
      setSaved(res.ok ? { ok: true, text: `Updated ${data.path} and re-synced .claude/commands.` } : { ok: false, text: data.error });
    } catch (err) {
      setSaved({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="skill-editor">
      <TextArea
        className="skill-editor-source"
        aria-label={source}
        value={markdown}
        minRows={30}
        onChange={(e) => { setMarkdown(e.target.value); setSaved(null); }}
      />
      <aside className="spec-side">
        <SegmentControl
          aria-label="Preview as"
          value={view}
          onChange={(v) => setView(v as 'preview' | 'markdown')}
          options={[{ value: 'preview', label: 'Preview' }, { value: 'markdown', label: 'Markdown' }]}
        />
        <div className="spec-preview">
          {view === 'preview' ? <Markdown>{markdown.replace(/^---\n[\s\S]*?\n---\n*/, '')}</Markdown> : <pre className="theme-code"><code>{markdown}</code></pre>}
        </div>
        <div className="spec-actions">
          <Button variant="secondary" leadingIcon={<Copy />} showLeadingIcon onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
          <Button variant="secondary" leadingIcon={<Download />} showLeadingIcon onClick={download}>Download</Button>
          {canWriteRepo && (
            <Button variant="primary" leadingIcon={<Save />} showLeadingIcon disabled={!dirty} loading={busy} onClick={save}>Save to repo</Button>
          )}
        </div>
        {!canWriteRepo && <p className="muted">Hosted site: copy or download it and open a pull request against {source}.</p>}
        {saved && <Callout dismissible={false} severity={saved.ok ? 'success' : 'error'} title={saved.ok ? 'Saved' : 'Not saved'} description={saved.text} />}
      </aside>
    </div>
  );
}
