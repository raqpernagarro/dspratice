'use client';

import { useEffect, useMemo, useState } from 'react';
import { Copy } from 'lucide-react';
import { Button, Select } from 'ds-ngr';
import { themeOptions, type ThemeOption } from './theme-options';

type Client = 'claude-code' | 'claude' | 'chatgpt' | 'cursor' | 'vscode';

const CLIENTS: { value: Client; label: string }[] = [
  { value: 'claude-code', label: 'Claude Code' },
  { value: 'claude', label: 'Claude app' },
  { value: 'chatgpt', label: 'ChatGPT' },
  { value: 'cursor', label: 'Cursor' },
  { value: 'vscode', label: 'VS Code / Copilot' },
];

function snippet(client: Client, url: string): { code: string; note: string } {
  switch (client) {
    case 'claude-code':
      return { code: `claude mcp add --transport http ds-ngr "${url}"`, note: 'Run in your project folder. Add --scope user to use it everywhere. In a DS-Ngr starter app, npx ds-ngr mcp --write does it for you.' };
    case 'claude':
      return { code: url, note: 'Settings → Connectors → Add custom connector, then paste the URL. Needs the hosted site (not localhost).' };
    case 'chatgpt':
      return { code: url, note: 'Settings → Apps & Connectors → Advanced → turn on Developer mode, then Create a connector with this URL. Needs the hosted site (not localhost).' };
    case 'cursor':
      return { code: JSON.stringify({ mcpServers: { 'ds-ngr': { url } } }, null, 2), note: 'Add to ~/.cursor/mcp.json (all projects) or .cursor/mcp.json (this project).' };
    case 'vscode':
      return { code: JSON.stringify({ servers: { 'ds-ngr': { type: 'http', url } } }, null, 2), note: 'Add to .vscode/mcp.json, then start the server from the MCP view.' };
  }
}

/**
 * Builds the MCP connection URL for a theme or team kit and shows the setup
 * for each client. The theme travels in the URL, so every tool call inherits it.
 */
export function ConnectPanel({ initialTheme, kitId, kitKey }: { initialTheme?: string; kitId?: string; kitKey?: string }) {
  const [options, setOptions] = useState<ThemeOption[]>([]);
  const [choice, setChoice] = useState(kitId ? 'kit' : initialTheme ? 'link' : 'preset:Nagarro');
  const [client, setClient] = useState<Client>('claude-code');
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
    const opts = themeOptions({ includeBrandSet: true });
    setOptions(opts);
    if (!kitId && !initialTheme && opts[0]?.value === 'site') setChoice('site');
  }, [kitId, initialTheme]);

  const all: ThemeOption[] = useMemo(
    () => [
      ...(kitId ? [{ value: 'kit', label: 'Team kit', description: 'Its theme and components', query: '' }] : []),
      ...(initialTheme ? [{ value: 'link', label: 'Theme from the configurator', description: 'The one you came from', query: initialTheme }] : []),
      ...options,
    ],
    [options, kitId, initialTheme],
  );

  const url = useMemo(() => {
    const p = new URLSearchParams();
    if (choice === 'kit' && kitId) {
      p.set('kit', kitId);
      if (kitKey) p.set('key', kitKey);
    } else {
      const q = all.find((o) => o.value === choice)?.query;
      if (q) p.set('theme', q);
    }
    const qs = p.toString();
    return `${origin}/api/mcp${qs ? `?${qs}` : ''}`;
  }, [choice, all, kitId, kitKey, origin]);

  const { code, note } = snippet(client, url);
  const local = /localhost|127\.0\.0\.1/.test(origin);

  return (
    <div className="connect">
      <div className="connect-row">
        <Select
          label="Customisation"
          options={all.map(({ value, label, description }) => ({ value, label, description }))}
          value={choice}
          onChange={(v: string) => setChoice(v)}
        />
        <Select label="AI client" options={CLIENTS} value={client} onChange={(v: string) => setClient(v as Client)} />
      </div>
      <pre className="theme-code connect-code"><code>{origin ? code : ' '}</code></pre>
      <div className="connect-row">
        <Button
          variant="secondary"
          showLeadingIcon
          leadingIcon={<Copy size={16} />}
          onClick={() => navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          })}
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>
        <span className="muted">{note}</span>
      </div>
      {kitKey && choice === 'kit' && <p className="muted">This link can edit the kit. Share the version without <code>key=</code> with your team.</p>}
      {local && <p className="muted">You are on a local server: Claude Code, Cursor and VS Code can connect; the Claude app and ChatGPT need the hosted site.</p>}
    </div>
  );
}
