'use client';

import { useEffect, useMemo, useState } from 'react';
import { Copy } from 'lucide-react';
import { Button, Select, TextInput } from 'ds-ngr';
import { DEFAULT_STARTER_NAME, STARTER_PAGES, toPackageName, type StarterPage } from '@/lib/starter/options';
import { themeOptions, type ThemeOption } from './theme-options';

const CLI_PATH = '/cli/ds-ngr-cli.tgz';

/** This site's origin, after mount (commands embed it). */
function useOrigin() {
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);
  return origin;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
      showLeadingIcon
      leadingIcon={<Copy size={16} />}
      disabled={!text}
      onClick={() =>
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        })
      }
    >
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
}

/** A command with a copy button. `{site}` in `command` becomes this site's origin. */
export function Command({ command, note }: { command: string; note?: string }) {
  const origin = useOrigin();
  const text = command.includes('{site}') ? (origin ? command.replaceAll('{site}', origin) : '') : command;
  return (
    <div className="connect">
      <pre className="theme-code connect-code"><code>{text || ' '}</code></pre>
      <div className="connect-row">
        <CopyButton text={text} />
        {note && <span className="muted">{note}</span>}
      </div>
    </div>
  );
}

/**
 * Builds the `ds-ngr create` command for an app name, starting page and theme.
 * Same output as the Customize page's starter pack download.
 */
export function CliPanel({ initialTheme }: { initialTheme?: string }) {
  const origin = useOrigin();
  const [options, setOptions] = useState<ThemeOption[]>([]);
  const [choice, setChoice] = useState(initialTheme ? 'link' : 'preset:Nagarro');
  const [name, setName] = useState(DEFAULT_STARTER_NAME);
  const [page, setPage] = useState<StarterPage>('dashboard');

  useEffect(() => {
    const opts = themeOptions({ includeBrandSet: true });
    setOptions(opts);
    if (!initialTheme && opts[0]?.value === 'site') setChoice('site');
  }, [initialTheme]);

  const all: ThemeOption[] = useMemo(
    () => [...(initialTheme ? [{ value: 'link', label: 'Theme from Customize', description: 'The one you came from', query: initialTheme }] : []), ...options],
    [options, initialTheme],
  );

  const command = useMemo(() => {
    if (!origin) return '';
    const query = all.find((o) => o.value === choice)?.query ?? '';
    return [
      `npx ${origin}${CLI_PATH} create ${toPackageName(name)}`,
      `--page ${page}`,
      query && `--theme "${origin}/customize?${query}"`,
      query.startsWith('brands=') && '--brands all',
    ].filter(Boolean).join(' ');
  }, [origin, all, choice, name, page]);

  return (
    <div className="connect">
      <div className="connect-row connect-fields">
        <TextInput
          label="App name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setName(toPackageName(name))}
          helperText="The folder and package name."
        />
        <Select
          label="Starting page"
          options={STARTER_PAGES.map(({ value, label, description }) => ({ value, label, description }))}
          value={page}
          onChange={(v: string) => setPage(v as StarterPage)}
        />
        <Select
          label="Theme"
          options={all.map(({ value, label, description }) => ({ value, label, description }))}
          value={choice}
          onChange={(v: string) => setChoice(v)}
        />
      </div>
      <pre className="theme-code connect-code"><code>{command || ' '}</code></pre>
      <div className="connect-row">
        <CopyButton text={command} />
        <span className="muted">Paste it into a terminal, in the folder where the app should go. Needs Node.js 20 or later.</span>
      </div>
    </div>
  );
}
