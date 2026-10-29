'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button, MenuCell, Select } from 'ds-ngr';
import { THEME_CHANGE_EVENT } from '@/lib/theme/brands';
import { applySiteThemeTo } from '@/lib/theme/site-theme';

type Story = { id: string; name: string };
type ArgType = {
  control?: { type?: string; disable?: boolean } | false;
  options?: unknown[];
  table?: { disable?: boolean; defaultValue?: { summary?: string } };
};
type Control = { name: string; fallback?: unknown } & (
  | { kind: 'enum'; options: string[] }
  | { kind: 'boolean' }
);
type Args = Record<string, unknown>;

const CHANNEL = 'storybook-channel';

// Plumbing props that make noisy controls and say nothing about the component's design.
const SKIP = /^(aria-|on[A-Z]|data-)|^(className|style|id|ref|key|tabIndex|role|name|form)$/;

/** Storybook's postMessage payloads are telejson: JSON plus `_duplicate_[path]` back-references. */
function decode(raw: string) {
  const root = JSON.parse(raw);
  const walk = (node: unknown): unknown => {
    if (typeof node === 'string' && node.startsWith('_duplicate_')) {
      const target = (JSON.parse(node.slice('_duplicate_'.length)) as string[]).reduce<any>((o, k) => o?.[k], root);
      return walk(target);
    }
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === 'object') return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, walk(v)]));
    return node;
  };
  return walk(root) as { key?: string; event?: { type: string; args: any[] } };
}

/** The prop's documented default (`'16:9'`, `true`, `0`), shown when the story leaves the arg unset. */
function parseDefault(summary?: string): unknown {
  if (!summary) return undefined;
  if (summary === 'true' || summary === 'false') return summary === 'true';
  if (/^-?\d+(\.\d+)?$/.test(summary)) return Number(summary);
  const quoted = summary.match(/^(['"`])(.*)\1$/);
  return quoted ? quoted[2] : undefined;
}

function toControls(argTypes: Record<string, ArgType>, include?: unknown, exclude?: unknown): Control[] {
  const listed = (v: unknown) => (Array.isArray(v) ? (v as string[]) : null);
  const only = listed(include);
  const skip = listed(exclude) ?? [];
  const controls: Control[] = [];
  for (const [name, t] of Object.entries(argTypes)) {
    if (SKIP.test(name) || skip.includes(name) || (only && !only.includes(name))) continue;
    if (!t.control || t.control.disable || t.table?.disable) continue;
    const type = t.control.type;
    const options = (t.options ?? []).filter((o): o is string => typeof o === 'string');
    const fallback = parseDefault(t.table?.defaultValue?.summary);
    // A native `type` attribute (button/submit/reset) is a behavior choice, not a design one.
    if (name === 'type' && options.includes('submit')) continue;
    if ((type === 'select' || type === 'radio' || type === 'inline-radio') && options.length) controls.push({ name, fallback, kind: 'enum', options });
    // Text and number args (labels, titles, indexes) are content, not states — leave them to the story.
    else if (type === 'boolean') controls.push({ name, fallback, kind: 'boolean' });
  }
  return controls.sort((a, b) => Number(a.kind === 'boolean') - Number(b.kind === 'boolean'));
}

/**
 * Embeds a Storybook story with a controls panel. Controls are built from the story's own argTypes
 * (sent by the preview over Storybook's postMessage channel), and edits are pushed back live —
 * so the panel always matches what Storybook itself would show.
 */
export function StoryPlayground({ storybookUrl, stories, title }: { storybookUrl: string; stories: Story[]; title: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [storyId, setStoryId] = useState(stories[0].id);
  const [theme, setTheme] = useState<string | null>(null);
  const [controls, setControls] = useState<Control[]>([]);
  const [args, setArgs] = useState<Args>({});
  const [initialArgs, setInitialArgs] = useState<Args>({});

  const send = useCallback((type: string, payload: unknown) => {
    frame.current?.contentWindow?.postMessage(JSON.stringify({ key: CHANNEL, event: { type, args: [payload], from: 'ds-site' } }), '*');
  }, []);

  // Follow the site's data-theme. The first value goes in the URL; later changes go over the
  // channel so the story keeps its edited args instead of reloading.
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  // Follow the site theme too (header brand picker); onLoad covers the first paint.
  useEffect(() => {
    const apply = () => frame.current && applySiteThemeTo(frame.current);
    window.addEventListener(THEME_CHANGE_EVENT, apply);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, apply);
  }, []);
  const [initialTheme, setInitialTheme] = useState<string | null>(null);
  useEffect(() => {
    if (!theme) return;
    if (!initialTheme) setInitialTheme(theme);
    else send('updateGlobals', { globals: { theme } });
  }, [theme, initialTheme, send]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || typeof e.data !== 'string' || !e.data.includes(CHANNEL)) return;
      let msg;
      try { msg = decode(e.data); } catch { return; }
      if (msg.key !== CHANNEL || !msg.event) return;
      const [payload] = msg.event.args;
      if (msg.event.type === 'storyPrepared' && payload?.id === storyId) {
        const { include, exclude } = payload.parameters?.controls ?? {};
        setControls(toControls(payload.argTypes ?? {}, include, exclude));
        setInitialArgs(payload.initialArgs ?? {});
        setArgs(payload.args ?? payload.initialArgs ?? {});
      } else if (msg.event.type === 'storyArgsUpdated' && payload?.storyId === storyId) {
        setArgs(payload.args);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [storyId]);

  const update = (name: string, value: unknown) => {
    setArgs((a) => ({ ...a, [name]: value }));
    send('updateStoryArgs', { storyId, updatedArgs: { [name]: value } });
  };
  const reset = () => send('resetStoryArgs', { storyId });
  const changed = useMemo(
    () => controls.some((c) => (args[c.name] ?? undefined) !== (initialArgs[c.name] ?? undefined)),
    [controls, args, initialArgs],
  );

  const pickStory = (id: string) => {
    if (id === storyId) return;
    setControls([]);
    setStoryId(id);
  };

  const story = stories.find((s) => s.id === storyId) ?? stories[0];

  return (
    <div className="playground">
      <div className="playground-card">
        {stories.length > 1 && (
          <div className="playground-bar">
            <Select
              className="playground-story"
              aria-label="Story"
              options={stories.map((s) => ({ value: s.id, label: s.name }))}
              value={storyId}
              onChange={pickStory}
            />
          </div>
        )}
        {initialTheme && (
          <iframe
            ref={frame}
            className="story-frame playground-frame"
            title={`${title} — ${story.name}`}
            onLoad={(e) => applySiteThemeTo(e.currentTarget)}
            src={`${storybookUrl}/iframe.html?id=${storyId}&viewMode=story&globals=theme:${initialTheme}`}
          />
        )}
        <div className="playground-panel">
          {controls.length > 0 ? (
            <div className="playground-controls">
              {controls.map((c) => (
                <PlaygroundControl key={`${storyId}-${c.name}`} control={c} value={args[c.name] ?? c.fallback} onChange={(v) => update(c.name, v)} />
              ))}
            </div>
          ) : (
            <p className="muted playground-empty">
              No boolean or enum props to switch here — use the story picker above or open Storybook for the full control panel.
            </p>
          )}
          <Button variant="ghost" size="sm" leadingIcon={<RotateCcw size={16} />} onClick={reset} disabled={!changed}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}

function PlaygroundControl({ control, value, onChange }: { control: Control; value: unknown; onChange: (v: unknown) => void }) {
  const { name } = control;
  if (control.kind === 'boolean') {
    return (
      <MenuCell
        variant="switcher"
        fullWidth
        role="group"
        aria-label={name}
        label={name}
        showLeadingIcon={false}
        showTrailingIcon={false}
        switcherChecked={Boolean(value)}
        onSwitcherChange={onChange}
        onClick={() => onChange(!value)}
        tabIndex={-1}
      />
    );
  }
  return (
    <Select
      label={name}
      placeholder="—"
      options={control.options.map((o) => ({ value: o, label: o }))}
      value={typeof value === 'string' ? value : undefined}
      onChange={onChange}
    />
  );
}
