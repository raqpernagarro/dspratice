'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Select, Tag } from 'ds-ngr';
import type { CompileResult, Issue, KitSnapshot } from '@/lib/prototype/ir';
import { EXAMPLE_SOURCE } from './example';
import { PREVIEW_MESSAGE, type PreviewPayload } from './PreviewFrame';
import { themeOptions, type ThemeOption } from './theme-options';

const DEBOUNCE_MS = 400;
const SEVERITY_TAG = { error: 'error', warning: 'warning', info: 'neutral' } as const;

interface Saved {
  id: string;
  url: string;
  editToken: string;
}

/**
 * Paste JSX, see it rendered with real DS-Ngr components and checked against
 * the rules, then save it as a shareable link. The same compile/save API backs
 * the MCP server and the in-site chat.
 */
export function Playground({ initialSource = EXAMPLE_SOURCE }: { initialSource?: string }) {
  const [source, setSource] = useState(initialSource);
  const [result, setResult] = useState<(CompileResult & { kit?: KitSnapshot }) | null>(null);
  const [options, setOptions] = useState<ThemeOption[]>([]);
  const [themeKey, setThemeKey] = useState('preset:Nagarro');
  const themeQuery = useMemo(() => options.find((o) => o.value === themeKey)?.query ?? '', [options, themeKey]);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [status, setStatus] = useState<'idle' | 'compiling' | 'saving'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const frameReady = useRef(false);
  const latest = useRef<PreviewPayload>({ root: null, themeQuery: '' });

  const post = useCallback((patch: Partial<PreviewPayload>) => {
    latest.current = { ...latest.current, ...patch };
    if (frameReady.current) frame.current?.contentWindow?.postMessage({ type: PREVIEW_MESSAGE, ...latest.current }, window.location.origin);
  }, []);

  // Storage is read after mount so server and first client render match.
  useEffect(() => {
    const opts = themeOptions();
    setOptions(opts);
    if (opts[0]?.value === 'site') setThemeKey('site');
  }, []);

  useEffect(() => post({ themeQuery }), [themeQuery, post]);

  // The frame announces itself once mounted; replay the latest tree then.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== `${PREVIEW_MESSAGE}:ready`) return;
      frameReady.current = true;
      post({});
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [post]);

  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setStatus('compiling');
      try {
        const res = await fetch('/api/prototypes/compile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source }),
          signal: ctrl.signal,
        });
        const data = (await res.json()) as CompileResult & { kit?: KitSnapshot; error?: string };
        if (data.error) setResult({ ok: false, root: null, issues: [{ severity: 'error', rule: 'request', message: data.error }] });
        else {
          setResult(data);
          // Keep the last good render on screen while the source is mid-edit.
          if (data.ok) post({ root: data.root, kit: data.kit });
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setResult({ ok: false, root: null, issues: [{ severity: 'error', rule: 'request', message: 'Could not reach the compiler.' }] });
      } finally {
        if (!ctrl.signal.aborted) setStatus('idle');
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [source, post]);

  const save = async () => {
    setStatus('saving');
    setSaveError(null);
    try {
      const res = await fetch(saved ? `/api/prototypes/${saved.id}` : '/api/prototypes', {
        method: saved ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...(saved ? { 'x-edit-token': saved.editToken } : {}) },
        body: JSON.stringify({ source, theme: themeQuery }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Save failed (${res.status})`);
      setSaved({ id: data.id, url: data.url, editToken: saved?.editToken ?? data.editToken });
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setStatus('idle');
    }
  };

  const issues = result?.issues ?? [];
  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.filter((i) => i.severity === 'warning').length;

  return (
    <div className="pg">
      <div className="pg-editor">
        <div className="pg-toolbar">
          <span className="muted">{status === 'compiling' ? 'Checking…' : result ? summary(errors, warnings) : ' '}</span>
          <div className="pg-actions">
            {options.length > 0 && (
              <Select
                className="pg-theme"
                aria-label="Prototype theme"
                options={options.map(({ value, label, description }) => ({ value, label, description }))}
                value={themeKey}
                onChange={(v) => setThemeKey(v)}
              />
            )}
            <Button variant="ghost" size="sm" onClick={() => setSource(initialSource)}>
              Reset example
            </Button>
            <Button variant="secondary" size="sm" onClick={save} disabled={!result?.ok || status === 'saving'}>
              {saved ? 'Update link' : 'Save and share'}
            </Button>
          </div>
        </div>
        <textarea
          className="pg-source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          spellCheck={false}
          aria-label="Prototype JSX source"
        />
        {saved && (
          <p className="pg-share muted">
            Share link:{' '}
            <a href={saved.url} target="_blank" rel="noreferrer">
              {saved.url}
            </a>
          </p>
        )}
        {saveError && <p className="pg-share pg-error">{saveError}</p>}
        <IssueList issues={issues} />
      </div>
      <div className="pg-preview">
        <iframe ref={frame} src="/p/preview" title="Prototype preview" />
      </div>
    </div>
  );
}

const summary = (errors: number, warnings: number) =>
  errors + warnings === 0 ? 'No issues' : [errors && `${errors} error${errors > 1 ? 's' : ''}`, warnings && `${warnings} warning${warnings > 1 ? 's' : ''}`].filter(Boolean).join(' · ');

function IssueList({ issues }: { issues: Issue[] }) {
  if (!issues.length) return null;
  return (
    <ul className="pg-issues" aria-label="Issues">
      {issues.map((issue, i) => (
        <li key={i}>
          <Tag variant={SEVERITY_TAG[issue.severity]} size="sm" label={issue.severity} />
          <span>
            {issue.line ? <span className="muted">Line {issue.line} · </span> : null}
            {issue.message}
          </span>
        </li>
      ))}
    </ul>
  );
}
