'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Check, Crosshair } from 'lucide-react';
import { Button, Select, SegmentControl, Switcher, TextInput } from 'ds-ngr';
import type { CustomizationOption, Playground, proposeCustomization } from '@/lib/prototype/customize';
import type { Expr, KitSnapshot } from '@/lib/prototype/ir';
import { Chat, type CanvasProps, type ChatCopy, type ChatSource } from './Chat';
import type { Pick } from './pick';
import { CreatePullRequestButton } from './CreatePullRequestButton';
import { IssueBadges, IssueList, KitSavePanel, latestOutput, patchKit, SheetPreview } from './draft-shared';

type Proposal = ReturnType<typeof proposeCustomization>;
type Mode = 'light' | 'dark';
type Values = Record<string, string | number | boolean>;

const copyFor = (label: string): ChatCopy => ({
  intro: `Say how you or your team want ${label} to look or behave by default. The AI changes only its own tokens and default props — DS-Ngr itself stays untouched, so updates keep flowing in.`,
  placeholder: `How should ${label} differ for you?`,
  suggestions: [
    { label: 'Softer and rounder', prompt: `Make ${label} feel softer: rounder corners and a calmer look.` },
    { label: 'More compact', prompt: `We use ${label} in dense screens — make it more compact by default.` },
    { label: 'Match our brand', prompt: `Make ${label} lean more on our brand accent colour.` },
  ],
});

/** /components/[slug]/customize: the chat in customize mode with a before/after canvas. */
export function CustomizeChat({ source, component, label, slug, kitId, kitKey, help, playground, canCreatePr }: {
  source: ChatSource;
  component: string;
  label: string;
  slug: string;
  kitId?: string;
  kitKey?: string;
  help?: ReactNode;
  playground: Playground;
  canCreatePr?: boolean;
}) {
  return (
    <Chat
      source={source}
      title={`Customize ${label}${source === 'demo' ? ' · demo' : ''}`}
      back={{ href: `/components/${slug}`, label }}
      help={help}
      kitId={kitId}
      kitKey={kitKey}
      mode="customize"
      component={component}
      copy={copyFor(label)}
      canvas={(props) => (
        <CustomizeCanvas
          {...props}
          component={component}
          kitId={kitId}
          kitKey={kitKey}
          playground={playground}
          canCreatePr={canCreatePr}
        />
      )}
    />
  );
}

const lit = (v: string | number | boolean): Expr => ({ k: 'lit', v });
const style = (o: Record<string, string>): [string, Expr] => ['style', { k: 'obj', props: Object.entries(o).map(([k, v]) => [k, lit(v)]) }];
const div = (css: Record<string, string>, child: Expr): Expr => ({ k: 'el', type: { ns: 'html', name: 'div' }, props: [style(css)], children: [child] });

/** Only what's set: unset props fall through to DS-Ngr's — or the option's — defaults. */
const setProps = (values: Values) => Object.entries(values).filter(([, v]) => v !== '' && v !== false);

/** The component once, centred in the frame; block components get a readable column. */
function stage(pg: Playground, values: Values, children: string): Expr {
  const el: Expr = {
    k: 'el',
    type: { ns: 'ds', name: pg.component },
    props: setProps(values).map(([k, v]) => [k, lit(v)]),
    children: pg.children !== null && children ? [lit(children)] : [],
  };
  // Painted in the frame's own colour mode, so the stage reads as the canvas itself, not a card on it.
  const centre = { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 'var(--space-xl)', boxSizing: 'border-box', background: 'var(--color-background-neutral-secondary)' };
  return div(centre, pg.inline ? el : div({ width: '100%', maxWidth: '560px' }, el));
}

/** How the props read in a pointing message: the switches, not the sample text. */
const describeProps = (pg: Playground, values: Values) =>
  pg.props
    .filter((p) => (p.kind === 'enum' || p.kind === 'boolean') && values[p.name] !== undefined && values[p.name] !== '' && values[p.name] !== false)
    .map((p) => (values[p.name] === true ? p.name : `${p.name}="${values[p.name]}"`))
    .join(' ');

/** A kit that holds only this option's layer, when the proposal didn't render one. */
const layerKit = (component: string, o: CustomizationOption): KitSnapshot =>
  o.after?.kit ?? { id: 'draft', version: 0, components: {}, overrides: { [component]: { tokens: o.tokens, defaults: o.defaults } } };

/**
 * The component, live and centred, with a props panel beside it. Once options
 * are proposed, each is shown next to DS-Ngr with whatever props the panel
 * has set. Point mode (top bar) names the part clicked for the next message;
 * with nothing pointed at, a message is about the whole component.
 */
export function CustomizeCanvas({ messages, themeQuery, busy, component, kitId, kitKey, playground, pointing, point, bar, barAfter, canCreatePr }: CanvasProps & {
  component: string;
  kitId?: string;
  kitKey?: string;
  playground: Playground;
  canCreatePr?: boolean;
}) {
  const proposal = useMemo(() => latestOutput<Proposal>(messages, 'propose_component_customization'), [messages]);
  const [chosen, setChosen] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('light');
  const [picking, setPicking] = useState(false);
  // Start in the site's own mode, so the stage blends into the canvas around it.
  useEffect(() => setMode(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'), []);
  const [values, setValues] = useState<Values>(playground.initial);
  const [children, setChildren] = useState(playground.children ?? '');

  const root = useMemo(() => stage(playground, values, children), [playground, values, children]);
  const preview = { root, themeQuery, mode, pick: picking };
  const pick = (where?: string) => (p: Pick) => {
    point?.({ ...p, sample: where, props: describeProps(playground, values) || undefined });
    setPicking(false);
  };

  const tools = (
    <>
      <SegmentControl
        aria-label="Colour mode"
        options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
        value={mode}
        onChange={(v) => setMode(v as Mode)}
      />
      <Button
        variant={picking ? 'primary' : 'secondary'}
        showLabel={false}
        showLeadingIcon
        leadingIcon={<Crosshair size={16} aria-hidden="true" />}
        aria-pressed={picking}
        aria-label={picking ? 'Stop pointing — click a part of the preview' : pointing ? `Pointing at ${pointing.label} — point at something else` : 'Point at a part'}
        onClick={() => setPicking((v) => !v)}
      >
        Point at a part
      </Button>
    </>
  );

  const options = proposal?.options ?? [];
  const selected = options.find((o) => o.name === chosen) ?? options[0] ?? null;

  const prButton = canCreatePr ? <CreatePullRequestButton component={component} option={selected} busy={busy} /> : null;

  return (
    <div className={`custom-canvas${picking ? ' is-picking' : ''}`}>
      {bar && createPortal(tools, bar)}
      {barAfter && prButton && createPortal(prButton, barAfter)}
      <div className={`custom-main${proposal ? ' has-options' : ''}`}>
        {!proposal ? (
          <div className="custom-stage">
            <SheetPreview payload={preview} title={`${component} preview`} onPick={pick()} />
          </div>
        ) : (
          <>
            <IssueList issues={proposal.sampleIssues} />
            <div className="draft-options">
              {options.map((o, i) => (
                <OptionCard
                  key={o.name}
                  option={o}
                  index={i}
                  selected={selected?.name === o.name}
                  onSelect={() => setChosen(o.name)}
                  before={{ ...preview, kit: proposal.before?.kit }}
                  after={{ ...preview, kit: layerKit(component, o) }}
                  onPick={(side) => pick(side === 'before' ? 'DS-Ngr' : o.name)}
                />
              ))}
            </div>
            {selected && (
              <KitSavePanel
                key={selected.name}
                heading={`Use “${selected.name}” for ${component}`}
                errors={selected.errors}
                busy={busy}
                kitId={kitId}
                kitKey={kitKey}
                themeQuery={themeQuery}
                persist={(kit) => patchKit(kit, { override: { component, tokens: selected.tokens, defaults: selected.defaults, note: selected.summary } })}
                savedTitle={`${component} is customized in your kit`}
                savedDescription={`Every ${component} in this kit’s prototypes now uses it. Remove it from the kit page to go back to DS-Ngr.`}
                again={{ label: 'Back to components', href: () => '/components' }}
              />
            )}
          </>
        )}
      </div>
      <PropsPanel playground={playground} values={values} onChange={setValues} content={children} onContent={setChildren} />
    </div>
  );
}

function PropsPanel({ playground, values, onChange, content, onContent }: {
  playground: Playground;
  values: Values;
  onChange: (v: Values) => void;
  /** Text children, for components that take them. */
  content: string;
  onContent: (v: string) => void;
}) {
  const set = (name: string, v: string | number | boolean) => onChange({ ...values, [name]: v });
  return (
    <aside className="custom-props" aria-label="Props">
      <div className="ws-panel-head">
        <span className="ws-panel-title">Props</span>
        <Button variant="ghost" size="sm" onClick={() => { onChange(playground.initial); onContent(playground.children ?? ''); }}>
          Reset
        </Button>
      </div>
      <p className="muted custom-props-hint">Switch to the variant or state you want to change, then point at it.</p>
      {playground.props.map((p) => {
        const v = values[p.name];
        if (p.kind === 'boolean') {
          const id = `prop-${p.name}`;
          return (
            <div key={p.name} className="custom-prop-switch">
              <span id={id}>{p.name}</span>
              <Switcher aria-labelledby={id} checked={v === true} onChange={(c) => set(p.name, c)} />
            </div>
          );
        }
        if (p.kind === 'enum') {
          const opts = (p.values ?? []).map((x) => ({ value: x, label: x }));
          return (
            <Select
              key={p.name}
              label={p.name}
              options={p.required ? opts : [{ value: '', label: 'Default' }, ...opts]}
              value={typeof v === 'string' ? v : ''}
              onChange={(x: string) => set(p.name, x)}
            />
          );
        }
        return (
          <TextInput
            key={p.name}
            label={p.name}
            value={v === undefined || v === false ? '' : String(v)}
            onChange={(e) => set(p.name, p.kind === 'number' && e.target.value !== '' ? Number(e.target.value) : e.target.value)}
          />
        );
      })}
      {playground.children !== null && <TextInput label="children" value={content} onChange={(e) => onContent(e.target.value)} />}
    </aside>
  );
}

function OptionCard({ option, index, selected, onSelect, before, after, onPick }: {
  option: CustomizationOption;
  index: number;
  selected: boolean;
  onSelect: () => void;
  before: Parameters<typeof SheetPreview>[0]['payload'];
  after: Parameters<typeof SheetPreview>[0]['payload'];
  onPick: (side: 'before' | 'after') => (p: Pick) => void;
}) {
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
      <p className="draft-option-text">{option.summary}</p>

      <div className="custom-compare">
        <figure>
          <figcaption className="muted">DS-Ngr</figcaption>
          <div className="draft-frame">
            <SheetPreview payload={before} title="Original" onPick={onPick('before')} />
          </div>
        </figure>
        <figure>
          <figcaption>Yours</figcaption>
          <div className="draft-frame">
            <SheetPreview payload={after} title={`${option.name} preview`} onPick={onPick('after')} />
          </div>
        </figure>
      </div>

      {option.changes.length > 0 && (
        <ul className="custom-changes" aria-label="Changes">
          {option.changes.map((c) => (
            <li key={c.key}>
              <code>{c.kind === 'default' ? `${c.key} (default)` : c.key}</code>
              {c.from && <><span className="muted">{c.from}</span><ArrowRight size={12} aria-hidden="true" /></>}
              <code>{c.to}</code>
            </li>
          ))}
        </ul>
      )}
      {option.affects.length > 0 && <p className="muted draft-states">Also changes {option.affects.join(', ')} — they share these tokens.</p>}
      <IssueList issues={option.issues} />
    </section>
  );
}
