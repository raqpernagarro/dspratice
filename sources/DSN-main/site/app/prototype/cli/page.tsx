import Link from 'next/link';
import { Breadcrumb } from '@/components/SectionNav';
import { CliPanel, Command } from '@/components/prototype/CliPanel';

export const metadata = { title: 'Build with the CLI' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Commands available inside an app the CLI created (cli/lib/*.mjs). */
const IN_APP: { command: string; what: string }[] = [
  { command: 'npx ds-ngr docs DataTable', what: 'Props, allowed values, variants and usage rules for a component. Leave out the name to list them all. Add --json for scripts and AI assistants.' },
  { command: 'npx ds-ngr add', what: 'Lists the ready-made pages: dashboard, data page, kanban board, detail drawer, form page, settings, sign-in and AI chat.' },
  { command: 'npx ds-ngr add data-page', what: 'Adds that page as src/pages/DataPage.tsx and prints the line to import it. --name and --out change the file name and folder.' },
  { command: 'npx ds-ngr mcp --write', what: 'Connects Claude Code to the DS-Ngr MCP server for this project. --client cursor or --client vscode for those editors.' },
  { command: 'npx ds-ngr agents', what: 'Refreshes the DS-Ngr rules in AGENTS.md to the installed version. Your own project rules are kept.' },
];

export default async function CliPage({ searchParams }: Props) {
  const theme = one((await searchParams).theme);
  return (
    <main className="page">
      <Breadcrumb label="Prototype" base="/prototype" current="Build with the CLI" />
      <h1>Build with the CLI</h1>
      <p className="lead">
        Start the real app in your own codebase. One command creates a React app with DS-Ngr installed, your theme
        applied, and instructions that keep AI coding assistants (Claude Code, Cursor, Copilot) on the design system.
        Then add pages and look up components from your terminal.
      </p>

      <h2>Create your app</h2>
      <p className="muted">
        Pick a name, a starting page and a theme. Your saved brands and the theme applied on this site are listed;
        to make a new one, go to <Link href="/brands">Brands</Link>.
      </p>
      <CliPanel initialTheme={theme} />

      <h2>Run it</h2>
      <ol className="steps">
        <li>
          Go into the new folder: <code>cd my-dsn-app</code> (or the name you picked).
        </li>
        <li>
          Install and start: <code>npm install</code>, then <code>npm run dev</code>.
        </li>
        <li>Open the address it prints, usually http://localhost:5173.</li>
        <li>Open the folder in your editor and build with your AI assistant. It already knows the DS-Ngr rules from AGENTS.md.</li>
      </ol>

      <h2>Inside your app</h2>
      <p className="muted">
        The CLI comes installed in every app it creates. Run these from the app folder; <code>npx ds-ngr --help</code>{' '}
        lists them all.
      </p>
      <ul className="tool-list">
        {IN_APP.map((c) => (
          <li key={c.command}>
            <code>{c.command}</code>
            <span className="muted">{c.what}</span>
          </li>
        ))}
      </ul>
      <p className="muted">
        Added pages come with sample data and a <code>// @ts-nocheck</code> line that switches off type checking for
        it. Replace the data with your own, then delete that line.
      </p>

      <h2>Already have an app?</h2>
      <p className="muted">If it already uses DS-Ngr, add the CLI to it and the commands above work there too:</p>
      <Command command="npm install --save-dev {site}/cli/ds-ngr-cli.tgz" />

      <h2>Look up a component without an app</h2>
      <Command command="npx {site}/cli/ds-ngr-cli.tgz docs Tag" note="Asks this site, so it works from any folder." />

      <h2>If something goes wrong</h2>
      <ul className="tool-list">
        <li>
          <code>ds-ngr is not installed here</code>
          <span className="muted">Run the command inside your app folder, after npm install.</span>
        </li>
        <li>
          <code>already exists and isn’t empty</code>
          <span className="muted">Pick another app name, or remove that folder.</span>
        </li>
        <li>
          <code>The site couldn’t build the starter</code>
          <span className="muted">
            Try again in a minute. If it keeps failing, use Download starter (.zip) on <Link href="/brands">Brands</Link>.
          </span>
        </li>
      </ul>
    </main>
  );
}
