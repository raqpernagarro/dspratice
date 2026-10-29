'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Check, ExternalLink } from 'lucide-react';
import { Button, Callout, EmptyState, SegmentControl } from 'ds-ngr';
import type { DraftOption, SimilarComponent, Verdict } from '@/lib/prototype/draft';
import { Chat, type CanvasProps, type ChatCopy, type ChatSource } from './Chat';
import { IssueBadges, IssueList, KitSavePanel, latestOutput, patchKit, SheetPreview } from './draft-shared';

type Similar = { verdict: Verdict; candidates: SimilarComponent[] };
type Mode = 'light' | 'dark';
type Width = 'full' | 'mobile';

const COPY: ChatCopy = {
  intro: 'Describe the component, or paste the ticket text. The AI checks what DS-Ngr already has, then drafts options built from its parts and tokens.',
  placeholder: 'Describe a component, or ask for a change…',
  suggestions: [
    { label: 'Order status timeline', prompt: 'A timeline showing the status history of an order: placed, paid, shipped, delivered, with dates' },
    { label: 'Team member row', prompt: 'A row for a team member: avatar, name, role, and a status tag' },
    { label: 'Usage meter', prompt: 'A plan usage meter: label, used vs. limit, and a warning when over 80%' },
  ],
};

/** /components/new (Create component): the chat in component mode with the draft canvas. */
export function ComponentDraftChat({ source, kitId, kitKey, help }: { source: ChatSource; kitId?: string; kitKey?: string; help?: ReactNode }) {
  return (
    <Chat
      source={source}
      title={source === 'demo' ? 'Create component · demo' : 'Create component'}
      back={{ href: '/components', label: 'Components' }}
      help={help}
      kitId={kitId}
      kitKey={kitKey}
      mode="component"
      copy={COPY}
      canvas={(props) => <DraftCanvas {...props} kitId={kitId} kitKey={kitKey} />}
    />
  );
}

const toSlug = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/**
 * The right-hand side of /components/new: what already exists, the drafted
 * options rendered live (light/dark, desktop/mobile), and saving the chosen
 * one to a team kit.
 */
export function DraftCanvas({ messages, themeQuery, busy, send, kitId, kitKey }: CanvasProps & { kitId?: string; kitKey?: string }) {
  const similar = useMemo(() => latestOutput<Similar>(messages, 'find_similar_components'), [messages]);
  const options = useMemo(() => latestOutput<{ options: DraftOption[] }>(messages, 'propose_component_options')?.options ?? [], [messages]);
  const [chosen, setChosen] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('light');
  const [width, setWidth] = useState<Width>('full');

  // Keep the choice across revisions; fall back to the first option.
  const selected = options.find((o) => o.name === chosen) ?? options[0] ?? null;

  if (!similar && !options.length) {
    return (
      <div className="pg-preview draft-canvas draft-empty">
        <EmptyState
          title="Options appear here"
          subtitle="The AI first checks what DS-Ngr already has, then drafts two or three options you can compare and save to your team kit."
          hasActions={false}
        />
      </div>
    );
  }

  return (
    <div className="draft-canvas">
      {similar && <VerdictBanner similar={similar} hasOptions={options.length > 0} busy={busy} send={send} />}

      {options.length > 0 && (
        <>
          <div className="draft-toolbar">
            <SegmentControl
              aria-label="Colour mode"
              options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
              value={mode}
              onChange={(v) => setMode(v as Mode)}
            />
            <SegmentControl
              aria-label="Preview width"
              options={[{ value: 'full', label: 'Desktop' }, { value: 'mobile', label: 'Mobile' }]}
              value={width}
              onChange={(v) => setWidth(v as Width)}
            />
          </div>

          <div className="draft-options">
            {options.map((o, i) => (
              <OptionCard
                key={o.name}
                option={o}
                index={i}
                selected={selected?.name === o.name}
                onSelect={() => setChosen(o.name)}
                themeQuery={themeQuery}
                mode={mode}
                width={width}
              />
            ))}
          </div>

          {selected && (
            <KitSavePanel
              key={selected.name}
              heading={`Add ${selected.name}`}
              errors={selected.errors}
              busy={busy}
              kitId={kitId}
              kitKey={kitKey}
              themeQuery={themeQuery}
              persist={(kit) => patchKit(kit, { component: { name: selected.name, description: selected.summary, source: selected.source } })}
              savedTitle={`${selected.name} is in your kit`}
              savedDescription="Anyone using this kit can now use it in prototypes and over MCP."
              again={{ label: 'Create another', href: (q) => `/components/new?${q}` }}
            />
          )}
        </>
      )}
    </div>
  );
}

// ─── Verdict ─────────────────────────────────────────────────────────────────

const VERDICT: Record<Verdict, { severity: 'default' | 'success' | 'warning'; title: string }> = {
  use: { severity: 'success', title: 'This may already exist' },
  compose: { severity: 'default', title: 'Close matches in DS-Ngr' },
  new: { severity: 'default', title: 'Nothing close in DS-Ngr' },
};

function VerdictBanner({ similar, hasOptions, busy, send }: { similar: Similar; hasOptions: boolean; busy: boolean; send: (t: string) => void }) {
  const v = VERDICT[similar.verdict];
  const top = similar.candidates.slice(0, 4);
  return (
    <Callout
      severity={v.severity}
      title={v.title}
      dismissible={false}
      description={
        similar.verdict === 'new'
          ? 'No existing component covers this, so the options below are new compositions.'
          : similar.verdict === 'use'
            ? 'Check the closest match before adding something new — the library stays smaller and consistent.'
            : 'The options below should be built from these, not reinvent them.'
      }
      content={
        top.length ? (
          <div className="draft-matches">
            {top.map((c) =>
              c.source === 'ds-ngr' ? (
                <a key={c.name} href={`/components/${toSlug(c.name)}`} target="_blank" rel="noreferrer" className="draft-match">
                  {c.name} <ExternalLink size={12} aria-hidden="true" />
                </a>
              ) : (
                <span key={c.name} className="draft-match">{c.name} · team kit</span>
              ),
            )}
          </div>
        ) : undefined
      }
      actions={
        similar.verdict === 'use' && !hasOptions ? (
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => send('I still need a new component — draft the options.')}>
            Draft options anyway
          </Button>
        ) : undefined
      }
    />
  );
}

// ─── Options ─────────────────────────────────────────────────────────────────

function OptionCard({ option, index, selected, onSelect, themeQuery, mode, width }: {
  option: DraftOption;
  index: number;
  selected: boolean;
  onSelect: () => void;
  themeQuery: string;
  mode: Mode;
  width: Width;
}) {
  const issues = [...option.issues, ...option.states.flatMap((s) => s.issues.map((i) => ({ ...i, message: `${s.label}: ${i.message}` })))];
  return (
    <section className={`draft-option${selected ? ' is-selected' : ''}`} aria-label={option.name}>
      <header className="draft-option-head">
        <div className="draft-option-title">
          <span className="muted">Option {String.fromCharCode(65 + index)}</span>
          <strong>{option.name}</strong>
        </div>
        <div className="draft-option-badges">
          <IssueBadges errors={option.errors} warnings={option.warnings} />
          <Button
            variant={selected ? 'primary' : 'secondary'}
            size="sm"
            aria-label={selected ? `${option.name} is chosen` : `Choose ${option.name}`}
            showLeadingIcon={selected}
            leadingIcon={<Check size={14} aria-hidden="true" />}
            onClick={onSelect}
          >
            {selected ? 'Chosen' : 'Choose'}
          </Button>
        </div>
      </header>
      <p className="draft-option-text">{option.rationale}</p>
      <div className={`draft-frame${width === 'mobile' ? ' is-mobile' : ''}`}>
        {option.sheet ? (
          <SheetPreview payload={{ root: option.sheet.root, kit: option.sheet.kit, themeQuery, mode }} title={`${option.name} states`} />
        ) : (
          <p className="muted draft-frame-empty">This option can’t render yet — the AI is fixing it.</p>
        )}
      </div>
      <p className="muted draft-states">States: {option.states.map((s) => s.label).join(' · ')}</p>
      <IssueList issues={issues} />
    </section>
  );
}
