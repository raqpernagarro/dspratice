'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { AlertDialog, Button, Callout, Drawer, SearchBar, SegmentControl, Tag, TextArea } from 'ds-ngr';
import type { DocBlock } from '@/lib/rules/document';
import { aiMdTarget, renderRule } from '@/lib/rules/markdown';
import { emptyRule, type Rule } from '@/lib/rules/types';
import { AssistPanel } from '@/components/assist/AssistPanel';
import { ASSIST_ACTIONS } from '@/lib/assist/mock';
import { RuleDrawer } from './KitRules';

// react-markdown doesn't server-render from a client component here; previews are client-only anyway.
const Markdown = dynamic(() => import('@/components/Markdown').then((m) => m.Markdown), { ssr: false });

interface Props {
  blocks: DocBlock[];
  components: string[];
  tokens: string[];
  /** Local dev server: saves write AI.md. Otherwise each change is copied as a prompt for the DS agent. */
  canWriteRepo: boolean;
}

type Editing =
  | { kind: 'rule'; block: DocBlock }
  | { kind: 'markdown'; block: DocBlock }
  | { kind: 'add' }
  | { kind: 'delete'; block: DocBlock };

const preview = (text: string) => text.split('\n').slice(1).join(' ').replace(/[`*#>|]/g, '').replace(/\s+/g, ' ').trim().slice(0, 160);

/** AI.md, section by section: numbered rules open in the rule form, everything else as markdown. */
export function AiMdEditor({ blocks, components, tokens, canWriteRepo }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<Editing | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const coreRules = useMemo(() => blocks.flatMap((b) => (b.rule ? [b.rule] : [])), [blocks]);

  const q = query.trim().toLowerCase();
  const sections = useMemo(() => {
    const out: { head: DocBlock; children: DocBlock[] }[] = [];
    for (const b of blocks) {
      if (b.level === 2 || !out.length) out.push({ head: b, children: [] });
      else out.at(-1)!.children.push(b);
    }
    if (!q) return out;
    return out
      .map((s) => ({ ...s, children: s.children.filter((c) => c.text.toLowerCase().includes(q)) }))
      .filter((s) => s.children.length || s.head.text.toLowerCase().includes(q));
  }, [blocks, q]);

  /** Sends one change; on a hosted site, copies it as a prompt instead. Throws on failure so the drawer shows it. */
  const send = async (body: Record<string, unknown>, prompt: string) => {
    if (!canWriteRepo) {
      await navigator.clipboard.writeText(prompt);
      setStatus({ ok: true, text: 'Copied the change as a prompt. Paste it to the agent working in the DS-Ngr repo.' });
      setEditing(null);
      return;
    }
    const res = await fetch('/api/rules/ai-md', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? `Failed (${res.status}).`);
    setStatus({ ok: true, text: `${data.note ?? (data.changed ? 'Saved to AI.md.' : 'No changes.')} AI-short.md isn’t updated automatically — check whether its matching line needs the same change.` });
    setEditing(null);
    router.refresh();
  };

  const replace = (block: DocBlock, text: string) =>
    send(
      { op: 'replace', key: block.key, original: block.text, text },
      `In AI.md, replace the block that starts with “${block.text.split('\n')[0]}” with the text below. Then check AI-short.md for a line that needs the same change.\n\n${text.trim()}`,
    );

  return (
    <>
      {canWriteRepo ? (
        <Callout dismissible={false} severity="default" title="Local dev server: saving writes AI.md" description="Each save changes only the block you edited. Review the diff before you commit." />
      ) : (
        <Callout dismissible={false} severity="default" title="Read-only here" description="Edit as usual; saving copies the change as a prompt for the agent in the DS-Ngr repo. Run the site locally to write AI.md directly." />
      )}
      {status && <Callout dismissible onDismiss={() => setStatus(null)} severity={status.ok ? 'success' : 'error'} title={status.ok ? 'Done' : 'Not saved'} description={status.text} />}

      <div className="aimd-toolbar">
        <SearchBar aria-label="Find a rule or section" placeholder="Find a rule or section" value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery('')} />
        <Button variant="primary" leadingIcon={<Plus />} showLeadingIcon onClick={() => setEditing({ kind: 'add' })}>Add rule</Button>
      </div>

      <div className="aimd-sections">
        {sections.map(({ head, children }) => (
          <section key={head.key} className="aimd-section">
            <div className="kit-item-head">
              <h2>{head.heading || 'Top of file'}</h2>
              <Button variant="ghost" size="sm" onClick={() => setEditing({ kind: 'markdown', block: head })}>{head.heading ? 'Edit intro' : 'Edit'}</Button>
            </div>
            {preview(head.text) && <p className="muted aimd-preview">{preview(head.text)}</p>}
            {children.length > 0 && (
              <ul className="aimd-blocks">
                {children.map((b) => (
                  <li key={b.key}>
                    <div className="aimd-block-title">
                      {b.rule ? <code className="rule-id">{b.rule.id}</code> : <Tag size="sm" variant="neutral" label="Text" />}
                      <span>{b.rule ? b.rule.title : b.heading}</span>
                    </div>
                    <div className="rule-actions">
                      {b.rule && <Button variant="ghost" size="sm" onClick={() => setEditing({ kind: 'rule', block: b })}>Edit</Button>}
                      <Button variant="ghost" size="sm" onClick={() => setEditing({ kind: 'markdown', block: b })}>{b.rule ? 'Markdown' : 'Edit'}</Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditing({ kind: 'delete', block: b })}>Delete</Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
        {sections.length === 0 && <p className="muted">Nothing in AI.md matches “{query}”.</p>}
      </div>

      {editing?.kind === 'rule' && editing.block.rule && (
        <RuleDrawer
          initial={editing.block.rule}
          lintCtx={{ components, tokens, existing: coreRules }}
          meta={false}
          saveLabel={canWriteRepo ? 'Save to AI.md' : 'Copy change'}
          notice={
            renderRule(editing.block.rule, { meta: false }).trim() !== editing.block.text.trim()
              ? `Saving from the form rewrites ${editing.block.rule.id} in the form’s layout: description, then ✅/❌ lines, then examples. To keep its current layout, close this and use Markdown.`
              : undefined
          }
          onClose={() => setEditing(null)}
          onSave={(rule) => replace(editing.block, renderRule({ ...rule, id: editing.block.rule!.id }, { meta: false }))}
        />
      )}

      {editing?.kind === 'add' && (
        <RuleDrawer
          initial={{ ...emptyRule(''), category: 'layout' }}
          lintCtx={{ components, tokens, existing: coreRules }}
          meta={false}
          placeholderId="NEW"
          saveLabel={canWriteRepo ? 'Add to AI.md' : 'Copy change'}
          notice="Navigation rules go at the end of “Navigation & page structure rules” as NAV-…; every other category at the end of “Layout & component behavior rules” as LCB-…. The id is the next free one."
          onClose={() => setEditing(null)}
          onSave={(rule) => {
            const target = aiMdTarget(rule.category);
            return send(
              { op: 'add', rule },
              `Add this rule to AI.md at the end of “${target.heading.slice(3)}” with the next free ${target.prefix} id, and add a one-line version to AI-short.md.\n\n${renderRule({ ...rule, id: `${target.prefix}-NEW` }, { meta: false }).trim()}`,
            );
          }}
        />
      )}

      {editing?.kind === 'markdown' && <MarkdownDrawer block={editing.block} canWriteRepo={canWriteRepo} onClose={() => setEditing(null)} onSave={(text) => replace(editing.block, text)} />}

      {editing?.kind === 'delete' && (
        <AlertDialog
          open
          variant="danger"
          title={`Delete “${editing.block.rule?.id ?? editing.block.heading}”?`}
          message={`It is removed from AI.md${editing.block.rule ? '. Other rules or specs that point to this id need updating too' : ''}. You can restore it from git.`}
          confirmLabel={canWriteRepo ? 'Delete' : 'Copy change'}
          cancelLabel="Cancel"
          onCancel={() => setEditing(null)}
          onOpenChange={(o) => !o && setEditing(null)}
          onConfirm={() => {
            const block = editing.block;
            send({ op: 'delete', key: block.key, original: block.text }, `In AI.md, delete the block that starts with “${block.text.split('\n')[0]}”, and anything in AI-short.md or the specs that points to it.`).catch((err) =>
              setStatus({ ok: false, text: (err as Error).message }),
            );
          }}
        />
      )}
    </>
  );
}

function MarkdownDrawer({ block, canWriteRepo, onClose, onSave }: { block: DocBlock; canWriteRepo: boolean; onClose: () => void; onSave: (text: string) => Promise<void> }) {
  const [text, setText] = useState(block.text);
  const [view, setView] = useState<'edit' | 'preview'>('edit');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = text !== block.text;
  const save = async () => {
    if (!dirty || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSave(text);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };
  return (
    <Drawer
      open
      onOpenChange={(o) => !o && onClose()}
      closeOnEscape={!dirty}
      closeOnOverlayClick={!dirty}
      width="min(960px, 100vw)"
      title={block.heading || 'Top of file'}
      description={block.level === 2 && block.heading ? 'The section intro, up to its first ### heading. Subsections are edited on their own.' : 'Markdown. Keep the heading on the first line.'}
      showBottomBar
      bottomBarRightActions={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!dirty} loading={busy} onClick={save} shortcut shortcutLabel="⌘↵" shortcutAriaLabel="Command Enter">
            {canWriteRepo ? 'Save to AI.md' : 'Copy change'}
          </Button>
        </>
      }
    >
      <div className="rule-assist">
        <AssistPanel<string>
          label={`AI assist for ${block.heading || 'top of file'}`}
          actions={ASSIST_ACTIONS.markdown}
          placeholder="Ask for a change, e.g. “make this shorter”"
          request={(action, instruction) => ({ target: 'markdown', action, instruction, text })}
          onAccept={(v) => { setText(v); setView('edit'); }}
        />
      </div>
      <div className="aimd-md" onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); save(); } }}>
        <SegmentControl aria-label="View" value={view} onChange={(v) => setView(v as 'edit' | 'preview')} options={[{ value: 'edit', label: 'Markdown' }, { value: 'preview', label: 'Preview' }]} />
        {view === 'edit' ? (
          <TextArea aria-label="Markdown" className="rule-code aimd-textarea" minRows={20} value={text} onChange={(e) => setText(e.target.value)} />
        ) : (
          <div className="spec-preview"><Markdown>{text}</Markdown></div>
        )}
        {error && <Callout dismissible={false} severity="error" title="Not saved" description={error} />}
      </div>
    </Drawer>
  );
}
