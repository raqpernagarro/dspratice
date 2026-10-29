'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { ArrowLeft, Check, Crosshair, ExternalLink, LoaderCircle, Share2, Sparkles, TriangleAlert, X } from 'lucide-react';
import { Avatar, Button, Callout, EmptyState, PromptInput, SegmentControl, Select, TextInput } from 'ds-ngr';
import { Markdown } from '@/components/Markdown';
import { TemplateThumb } from '@/components/templates/TemplateThumb';
import { KEY_HEADER, MODELS, type Provider } from '@/lib/chat/models';
import { forgetKey, readKey, readPrefs, savePrefs } from './ai-keys';
import { KeySettings } from './KeySettings';
import { PICK_MESSAGE, POINTING, pickPrompt, prototypePickPrompt, type Pick } from './pick';
import { CANVAS_CONTROLS, type CanvasControls } from './PrototypeCanvas';
import { ShareDialog } from './ShareDialog';
import { themeOptions, type ThemeOption } from './theme-options';

export type ChatSource = 'key' | 'openrouter' | 'demo';

const CUSTOM_MODEL = '__custom';

export type ChatMode = 'prototype' | 'component' | 'customize';

export type WsTemplate = { slug: string; title: string; description: string; category: string };

/** What changes between drawing screens and drafting a component; the canvas is passed in. */
export interface ChatCopy {
  intro: string;
  placeholder: string;
  suggestions: { label: string; prompt: string }[];
}

const PROTOTYPE_COPY: ChatCopy = {
  intro: 'Describe a screen. The AI reads DS-Ngr’s components and rules, then draws it on the canvas.',
  placeholder: 'Describe a screen, or ask for a change…',
  suggestions: [
    { label: 'Projects data page', prompt: 'Build a data page listing projects with status and owner' },
    { label: 'Settings page', prompt: 'A settings page with profile, notifications and security sections' },
    { label: 'KPI dashboard', prompt: 'A dashboard with four KPIs and a revenue chart' },
  ],
};

export interface CanvasProps {
  messages: UIMessage[];
  themeQuery: string;
  busy: boolean;
  send: (text: string) => void;
  pointing?: Pick | null;
  point?: (p: Pick) => void;
  /** Customize mode: portal target for canvas toolbar controls. */
  bar?: HTMLDivElement | null;
  /** Customize mode: portal target after the theme / brand picker. */
  barAfter?: HTMLDivElement | null;
}

type FrameSize = 'full' | 'tablet' | 'mobile';
type ColorMode = CanvasControls['mode'];

/**
 * Chat with DS-Ngr using the visitor's own model access. The conversation runs
 * through /api/chat with the same tools as the MCP server; the prototype the
 * model creates renders live on the right.
 */
export function Chat({
  source,
  kitId,
  kitKey,
  mode = 'prototype',
  copy = PROTOTYPE_COPY,
  canvas,
  component,
  skill,
  title,
  back,
  help,
  templates,
}: {
  source: ChatSource;
  kitId?: string;
  kitKey?: string;
  mode?: ChatMode;
  copy?: ChatCopy;
  canvas?: (props: CanvasProps) => ReactNode;
  component?: string;
  /** Prototype mode: run this repo skill (skills/<slug>/SKILL.md) as the chat's instructions. */
  skill?: string;
  title?: string;
  back?: { href: string; label: string };
  help?: ReactNode;
  /** Prototype mode: starter gallery before the first message. */
  templates?: WsTemplate[];
}) {
  const demo = source === 'demo';
  const [provider, setProvider] = useState<Provider>(source === 'openrouter' ? 'openrouter' : 'anthropic');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [model, setModel] = useState(MODELS[provider][0].value);
  const [customModel, setCustomModel] = useState('');
  const [themes, setThemes] = useState<ThemeOption[]>([]);
  const [themeKey, setThemeKey] = useState('preset:Nagarro');
  const [draft, setDraft] = useState('');
  const [frame, setFrame] = useState<FrameSize>('full');
  const [pointing, setPointing] = useState<Pick | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [barEl, setBarEl] = useState<HTMLDivElement | null>(null);
  const [barAfterEl, setBarAfterEl] = useState<HTMLDivElement | null>(null);
  const [colorMode, setColorMode] = useState<ColorMode>('light');
  const [picking, setPicking] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  // Storage is read after mount so server and first client render match.
  useEffect(() => {
    const prefs = readPrefs();
    const p = source === 'openrouter' ? 'openrouter' : prefs.provider && prefs.provider !== 'openrouter' ? prefs.provider : 'anthropic';
    setProvider(p);
    setApiKey(demo ? 'demo' : readKey(p));
    setModel(prefs.models?.[p] ?? MODELS[p][0].value);
    const opts = themeOptions({ includeBrandSet: true });
    setThemes(opts);
    setThemeKey(prefs.themeKey && opts.some((o) => o.value === prefs.themeKey) ? prefs.themeKey : opts[0]?.value === 'site' ? 'site' : 'preset:Nagarro');
    // The canvas starts in the site's own mode.
    setColorMode(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
    setReady(true);
  }, [source, demo]);

  const themeQuery = themes.find((o) => o.value === themeKey)?.query ?? '';
  const modelId = model === CUSTOM_MODEL ? customModel.trim() : model;

  const live = useRef({ apiKey, provider, modelId, themeQuery });
  live.current = { apiKey, provider, modelId, themeQuery };

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        headers: (): Record<string, string> => (live.current.apiKey && live.current.apiKey !== 'demo' ? { [KEY_HEADER]: live.current.apiKey } : {}),
        body: () => ({
          source,
          provider: live.current.provider,
          model: live.current.modelId,
          theme: live.current.themeQuery,
          ...(kitId && { kit: kitId }),
          ...(kitKey && { kitKey }),
          ...(mode !== 'prototype' && { mode }),
          ...(component && { component }),
          ...(skill && { skill }),
        }),
      }),
    [source, kitId, kitKey, mode, component, skill],
  );

  const { messages, sendMessage, status, error, stop, setMessages, clearError } = useChat({ transport });
  const busy = status === 'submitted' || status === 'streaming';
  const prototype = useMemo(() => latestPrototype(messages), [messages]);

  // Prototype canvas: colour mode, theme and point mode go to the frame, picks come back from it.
  const controls = useRef<CanvasControls>({ mode: colorMode, pick: picking, themeQuery });
  controls.current = { mode: colorMode, pick: picking, themeQuery };
  const postControls = () => frameRef.current?.contentWindow?.postMessage({ type: CANVAS_CONTROLS, ...controls.current }, window.location.origin);
  useEffect(postControls, [colorMode, picking, themeQuery]);
  useEffect(() => {
    if (canvas) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frameRef.current?.contentWindow) return;
      if (e.data?.type === `${CANVAS_CONTROLS}:ready`) return postControls();
      if (e.data?.type === PICK_MESSAGE && e.data.pick) {
        setPointing(e.data.pick as Pick);
        setPicking(false);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [canvas]);
  // Nothing to point at until there's a prototype; don't stay armed across a new one.
  useEffect(() => setPicking(false), [prototype?.id]);

  const thread = useRef<HTMLDivElement>(null);
  useEffect(() => {
    thread.current?.scrollTo({ top: thread.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    if (!demo && (!apiKey || !modelId)) return;
    clearError();
    let msg = t;
    if (pointing) {
      msg = (component ? pickPrompt(pointing, component) : prototypePickPrompt(pointing)) + msg;
      setPointing(null);
    }
    sendMessage({ text: msg });
    setDraft('');
  };

  const needsKey = !demo && !apiKey;
  const showGallery = !canvas && mode === 'prototype' && !messages.length && (templates?.length ?? 0) > 0;

  if (!ready) {
    return (
      <div className="ws ws-loading">
        <p className="muted chat-loading">Loading…</p>
      </div>
    );
  }

  const modelOptions = demo ? [] : [...MODELS[provider], { value: CUSTOM_MODEL, label: 'Other model id…' }];

  const canvasNode = canvas ? (
    canvas({
      messages,
      themeQuery,
      busy,
      send,
      pointing,
      point: component ? setPointing : undefined,
      bar: barEl,
      barAfter: mode === 'customize' ? barAfterEl : null,
    })
  ) : prototype ? (
    <div className="ws-stage">
      <div className={`ws-frame${picking ? ' is-picking' : ''}${frame === 'tablet' ? ' is-tablet' : frame === 'mobile' ? ' is-mobile' : ''}`}>
        <iframe ref={frameRef} key={prototype.id} src={`/p/${prototype.id}?live`} title="Prototype canvas" />
      </div>
    </div>
  ) : showGallery ? (
    <WorkspaceGallery templates={templates!} busy={busy} onPick={(t) => send(`Build a ${t.title.toLowerCase()}: ${t.description}`)} />
  ) : (
    <div className="chat-empty">
      <EmptyState title="Your prototype appears here" subtitle="It updates live as the AI builds and fixes it." hasActions={false} />
    </div>
  );

  return (
    <div className="ws">
      <header className="ws-bar">
        <div className="ws-bar-start">
          {back && (
            <Link href={back.href} className="ws-back" aria-label={`Back to ${back.label}`}>
              <ArrowLeft size={18} aria-hidden="true" />
            </Link>
          )}
          <Link href="/prototype" className="ws-brand">
            DS-Ngr
          </Link>
          {title && (
            <>
              <span className="ws-sep" aria-hidden="true">
                /
              </span>
              <h1 className="ws-title">{title}</h1>
            </>
          )}
        </div>
        <div className="ws-bar-center">
          {prototype && !canvas && (
            <SegmentControl
              aria-label="Preview width"
              options={[
                { value: 'full', label: 'Desktop' },
                { value: 'tablet', label: 'Tablet' },
                { value: 'mobile', label: 'Mobile' },
              ]}
              value={frame}
              onChange={(v) => setFrame(v as FrameSize)}
            />
          )}
        </div>
        <div className="ws-bar-end">
          {prototype && !canvas && (
            <div className="ws-bar-tools">
              <SegmentControl
                aria-label="Colour mode"
                options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
                value={colorMode}
                onChange={(v) => setColorMode(v as ColorMode)}
              />
              <Button
                variant={picking ? 'primary' : 'secondary'}
                showLabel={false}
                showLeadingIcon
                leadingIcon={<Crosshair size={16} aria-hidden="true" />}
                aria-pressed={picking}
                aria-label={picking ? 'Stop pointing — click an element on the canvas' : pointing ? `Pointing at ${pointing.label} — point at something else` : 'Point at an element'}
                onClick={() => setPicking((v) => !v)}
              >
                Point at an element
              </Button>
            </div>
          )}
          <div className="ws-bar-tools" ref={setBarEl} />
          {themes.length > 0 && (
            <Select
              className="pg-theme"
              aria-label="Prototype theme"
              options={themes.map(({ value, label, description }) => ({ value, label, description }))}
              value={themeKey}
              onChange={(v: string) => {
                setThemeKey(v);
                savePrefs({ themeKey: v });
              }}
            />
          )}
          {mode === 'customize' && <div className="ws-bar-tools" ref={setBarAfterEl} />}
          {prototype && !canvas && (
            <>
              <Button variant="secondary" size="md" showLeadingIcon leadingIcon={<Share2 size={16} aria-hidden="true" />} onClick={() => setShareOpen(true)}>
                Share
              </Button>
              <a className="ws-open" href={`/p/${prototype.id}${colorMode === 'dark' ? '?mode=dark' : ''}`} target="_blank" rel="noreferrer">
                Open <ExternalLink size={14} aria-hidden="true" />
              </a>
            </>
          )}
          {!demo && apiKey && (
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                forgetKey(provider);
                setApiKey(null);
              }}
            >
              {source === 'openrouter' ? 'Sign out' : 'Forget key'}
            </Button>
          )}
        </div>
      </header>

      <div className="ws-body">
        <div className="ws-panel">
          {needsKey ? (
            <div className="ws-panel-setup">
              <KeySettings
                source={source}
                provider={provider}
                onProviderChange={(p) => {
                  setProvider(p);
                  setModel(readPrefs().models?.[p] ?? MODELS[p][0].value);
                  savePrefs({ provider: p });
                }}
                onKey={(k) => setApiKey(k)}
              />
              {help}
            </div>
          ) : (
            <>
              {model === CUSTOM_MODEL && modelOptions.length > 0 && (
                <TextInput
                  label="Model id"
                  placeholder={provider === 'openrouter' ? 'vendor/model, e.g. anthropic/claude-sonnet-5.5' : 'Exact model id from the provider'}
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                />
              )}

              <div className="chat-thread" ref={thread} aria-live="polite">
                {messages.length === 0 ? (
                  <div className="chat-suggestions">
                    <p className="muted">{copy.intro}</p>
                    <div className="chat-suggestion-row">
                      {copy.suggestions.map((s) => (
                        <Button key={s.label} variant="secondary" size="sm" onClick={() => send(s.prompt)} disabled={busy}>
                          {s.label}
                        </Button>
                      ))}
                    </div>
                    {demo && (
                      <p className="muted ws-demo-hint">
                        Demo mode uses scripted replies — pick a suggestion or a template on the canvas. It cannot follow edit requests.
                      </p>
                    )}
                  </div>
                ) : (
                  messages.map((m) => <Message key={m.id} message={m} />)
                )}
                {status === 'submitted' && <p className="muted chat-thinking">Thinking…</p>}
                {error && <Callout severity="error" title="The chat stopped" description={readableError(error)} />}
              </div>

              {pointing && (
                <div className="chat-pointing">
                  <span>
                    {pointing.label}
                    {!component && pointing.text && <span className="muted"> · {pointing.text}</span>}
                  </span>
                  <Button variant="ghost" size="sm" showLabel={false} showLeadingIcon leadingIcon={<X size={14} aria-hidden="true" />} aria-label="Stop pointing" onClick={() => setPointing(null)} />
                </div>
              )}

              <PromptInput
                placeholder={busy ? 'Working…' : copy.placeholder}
                value={draft}
                onChange={setDraft}
                onSubmit={() => (busy ? stop() : send(draft))}
                modelOptions={demo ? [] : modelOptions}
                modelValue={model}
                onModelChange={(v) => {
                  setModel(v);
                  if (v !== CUSTOM_MODEL) savePrefs({ models: { [provider]: v } });
                }}
              />
              {!demo && (
                <p className="muted chat-privacy">
                  Your key stays in this browser. It is sent only with your chat requests and is never saved on the server.
                </p>
              )}
              {help}
            </>
          )}
        </div>

        <div className={`ws-canvas${canvas && mode !== 'customize' ? ' ws-canvas-pad' : ''}`}>{canvasNode}</div>
      </div>

      {prototype && (
        <ShareDialog id={prototype.id} editToken={prototype.editToken} open={shareOpen} onClose={() => setShareOpen(false)} />
      )}
    </div>
  );
}

function WorkspaceGallery({ templates, busy, onPick }: { templates: WsTemplate[]; busy: boolean; onPick: (t: WsTemplate) => void }) {
  const [pending, setPending] = useState<string | null>(null);
  const pick = (t: WsTemplate) => {
    if (busy) return;
    setPending(t.slug);
    onPick(t);
  };
  return (
    <div className="ws-gallery">
      <div className="ws-gallery-head">
        <div>
          <h2>Start from a template</h2>
          <p className="muted">Each page is a real DS-Ngr template. Pick one to build it on the canvas.</p>
        </div>
      </div>
      <div className="ws-gallery-grid">
        {templates.map((t) => (
          <button key={t.slug} type="button" className="ws-tpl" disabled={busy} onClick={() => pick(t)}>
            <span className="ws-tpl-thumb">
              <TemplateThumb slug={t.slug} title={t.title} />
              {pending === t.slug && busy && (
                <span className="ws-tpl-busy">
                  <LoaderCircle size={16} className="chat-spin" aria-hidden="true" /> Building…
                </span>
              )}
            </span>
            <span className="ws-tpl-name">{t.title}</span>
            <span className="ws-tpl-desc">{t.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Messages ────────────────────────────────────────────────────────────────

type Part = UIMessage['parts'][number];
export type ToolPart = Extract<Part, { toolCallId: string }>;

function Message({ message }: { message: UIMessage }) {
  if (message.role === 'user') {
    const text = message.parts.map((p) => (p.type === 'text' ? p.text : '')).join('');
    const match = text.match(POINTING);
    const body = match ? text.slice(match[0].length) : text;
    return (
      <div className="chat-user">
        {match && <div className="chat-user-pointing">{match[1]}</div>}
        {body}
      </div>
    );
  }
  return (
    <div className="chat-assistant">
      <Avatar size="xs" variant="organization" fill="icon" icon={Sparkles} name="DS-Ngr assistant" />
      <div className="chat-assistant-body">
        {message.parts.map((p, i) => {
          if (p.type === 'text') return p.text ? <Markdown key={i}>{p.text}</Markdown> : null;
          if ('toolCallId' in p) return <ToolStep key={p.toolCallId} part={p as ToolPart} />;
          return null;
        })}
      </div>
    </div>
  );
}

export const toolName = (part: ToolPart) => ('toolName' in part && typeof part.toolName === 'string' ? part.toolName : part.type.replace(/^tool-/, ''));

function stepLabel(name: string, input: Record<string, unknown> | undefined): string {
  const arg = (k: string) => (typeof input?.[k] === 'string' ? ` ${input[k]}` : '');
  switch (name) {
    case 'get_design_context':
      return 'Read the design context';
    case 'list_components':
      return 'Listed components';
    case 'get_component':
      return `Read component${arg('name')}`;
    case 'list_patterns':
      return 'Listed patterns';
    case 'get_pattern':
      return `Read pattern${arg('name')}`;
    case 'get_tokens':
      return 'Looked up tokens';
    case 'get_theme':
      return 'Read the theme';
    case 'validate_prototype':
      return 'Checked the JSX';
    case 'create_prototype':
      return 'Created the prototype';
    case 'update_prototype':
      return 'Updated the prototype';
    case 'get_prototype':
      return 'Opened the prototype';
    case 'find_similar_components':
      return 'Checked what already exists';
    case 'propose_component_options': {
      const n = Array.isArray(input?.options) ? input.options.length : 0;
      return n ? `Drafted ${n} option${n > 1 ? 's' : ''}` : 'Drafted options';
    }
    case 'get_kit':
      return 'Read the team kit';
    case 'propose_component_customization': {
      const n = Array.isArray(input?.options) ? input.options.length : 0;
      return n ? `Drafted ${n} customization${n > 1 ? 's' : ''}` : 'Drafted customizations';
    }
    default:
      return name.replace(/_/g, ' ');
  }
}

function ToolStep({ part }: { part: ToolPart }) {
  const name = toolName(part);
  const input = part.input as Record<string, unknown> | undefined;
  const output =
    part.state === 'output-available'
      ? (part.output as { error?: string; issues?: { severity: string }[]; options?: { errors: number; warnings: number }[] } | undefined)
      : undefined;
  const failed = part.state === 'output-error' || !!output?.error;
  const issues = output?.issues ?? [];
  const errors = output?.options ? output.options.reduce((n, o) => n + o.errors, 0) : issues.filter((i) => i.severity === 'error').length;
  const warnings = output?.options ? output.options.reduce((n, o) => n + o.warnings, 0) : issues.filter((i) => i.severity === 'warning').length;
  const detail = [errors && `${errors} error${errors > 1 ? 's' : ''}`, warnings && `${warnings} warning${warnings > 1 ? 's' : ''}`].filter(Boolean).join(', ');
  const done = part.state === 'output-available' || part.state === 'output-error';
  return (
    <span className={`chat-step${failed ? ' is-error' : ''}`}>
      {!done ? <LoaderCircle size={14} className="chat-spin" aria-hidden="true" /> : failed ? <TriangleAlert size={14} aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}
      {stepLabel(name, input)}
      {failed && output?.error ? ` — ${output.error}` : detail ? ` · ${detail}` : ''}
    </span>
  );
}

/** The newest prototype id (and edit token) the model created or updated in this conversation. */
export function latestPrototype(messages: UIMessage[]): { id: string; editToken: string | null } | null {
  for (let m = messages.length - 1; m >= 0; m--) {
    const parts = messages[m].parts;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (!('toolCallId' in p) || p.state !== 'output-available') continue;
      const name = toolName(p as ToolPart);
      const out = p.output as { id?: unknown; editToken?: unknown; error?: unknown } | undefined;
      if (out?.error) continue;
      if ((name === 'create_prototype' || name === 'update_prototype') && typeof out?.id === 'string') {
        return { id: out.id, editToken: typeof out.editToken === 'string' ? out.editToken : null };
      }
    }
  }
  return null;
}

/** /api/chat answers setup errors as JSON; show their message, not the raw body. */
function readableError(error: Error): string {
  try {
    const data = JSON.parse(error.message) as { error?: string };
    if (data.error) return data.error;
  } catch {
    // Already plain text.
  }
  return error.message || 'Something went wrong.';
}
