'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Copy, Download, Plus, Save } from 'lucide-react';
import { Button, Callout, SegmentControl, Select, TextArea, TextInput } from 'ds-ngr';
import { AssistPanel } from '@/components/assist/AssistPanel';
import { LineList, RemoveButton, RuleCard } from '@/components/rules/KitRules';
import { ASSIST_ACTIONS, sectionActions } from '@/lib/assist/mock';
import type { Rule } from '@/lib/rules/types';
import { lintSpec, type SpecIssue } from '@/lib/spec/lint';
import { renderSpec } from '@/lib/spec/markdown';
import { emptySection, KNOWN_ORDER, SECTION_HEADINGS, SECTION_HELP, type ComponentSpec, type KnownKind, type SpecSection } from '@/lib/spec/types';

// react-markdown doesn't server-render from a client component here; the preview is client-only anyway.
const Markdown = dynamic(() => import('@/components/Markdown').then((m) => m.Markdown), { ssr: false });

interface Props {
  initial: ComponentSpec;
  slug: string;
  /** Repo path the spec is saved to. */
  target: string;
  /** Whether a spec already exists at `target`. */
  exists: boolean;
  components: string[];
  /** This component's props: name → declared type. */
  props: Record<string, string>;
  /** DS-Ngr rules that name this component. */
  related: Rule[];
  canWriteRepo: boolean;
}

/** Fields to merge into a section; SectionFields only sends the fields of its own kind. */
type Patch = Record<string, unknown>;

/** The spec template as a form: one card per section, live preview, checks, and copy / download / save. */
export function SpecEditor({ initial, slug, target, exists, components, props, related, canWriteRepo }: Props) {
  const [spec, setSpec] = useState(initial);
  const [view, setView] = useState<'preview' | 'markdown'>('preview');
  const [saved, setSaved] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const markdown = useMemo(() => renderSpec(spec), [spec]);
  const ctx = useMemo(() => ({ components: new Set(components), props: new Set(Object.keys(props)) }), [components, props]);
  const issues = useMemo(() => lintSpec(spec, ctx), [spec, ctx]);
  const dirty = markdown !== renderSpec(initial);

  const setSection = (i: number, patch: Patch) =>
    setSpec((s) => ({ ...s, sections: s.sections.map((x, j) => (j === i ? ({ ...x, ...patch } as SpecSection) : x)) }));
  const removeSection = (i: number) => setSpec((s) => ({ ...s, sections: s.sections.filter((_, j) => j !== i) }));
  const missing = KNOWN_ORDER.filter((k) => !spec.sections.some((s) => s.kind === k));
  const addSection = (kind: KnownKind | 'custom') =>
    setSpec((s) => {
      const section: SpecSection = kind === 'custom' ? { kind, heading: 'New section', body: '' } : emptySection(kind);
      // Known sections go back to their template position; extra ones before Examples.
      const order = (x: SpecSection) => (x.kind === 'custom' ? KNOWN_ORDER.indexOf('examples') - 0.5 : KNOWN_ORDER.indexOf(x.kind));
      const at = s.sections.findIndex((x) => order(x) > order(section));
      const sections = [...s.sections];
      sections.splice(at < 0 ? sections.length : at, 0, section);
      return { ...s, sections };
    });

  const fileName = target.split('/').pop()!;
  const copy = () => navigator.clipboard.writeText(markdown).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  const download = () => {
    const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown' }));
    Object.assign(document.createElement('a'), { href: url, download: fileName }).click();
    URL.revokeObjectURL(url);
  };
  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/specs/${slug}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markdown }) });
      const data = await res.json();
      setSaved(res.ok ? { ok: true, text: `${data.created ? 'Created' : 'Updated'} ${data.path}.${data.created ? ' ds-index.json was regenerated.' : ''}` } : { ok: false, text: data.error });
    } catch (err) {
      setSaved({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const of = (kind: SpecIssue['section']) => issues.filter((i) => i.section === kind);

  return (
    <div className="spec-editor">
      <div className="spec-form">
        <section className="spec-card">
          <div className="spec-meta">
            <TextInput label="Tier" value={spec.tier} onChange={(e) => setSpec({ ...spec, tier: e.target.value })} />
            <TextInput label="Version" value={spec.version} onChange={(e) => setSpec({ ...spec, version: e.target.value })} errorMessage={of('meta')[0]?.message} error={of('meta').some((i) => i.severity === 'error')} />
          </div>
          <p className="muted">Saved as <code>{target}</code></p>
          <AssistPanel<SpecSection[]>
            label="AI assist for the whole spec"
            actions={ASSIST_ACTIONS.spec}
            placeholder="Ask for a change across the spec, e.g. “fill the empty sections”"
            defaultOpen={!exists}
            request={(action, instruction) => ({ target: 'spec', action, instruction, sections: spec.sections, name: spec.name, props, components })}
            onAccept={(sections) => setSpec((x) => ({ ...x, sections }))}
          />
        </section>

        {spec.sections.map((s, i) => (
          <SectionCard
            key={`${s.kind}-${i}`}
            section={s}
            issues={s.kind === 'custom' ? [] : of(s.kind)}
            onRemove={() => removeSection(i)}
            assist={
              <AssistPanel<SpecSection>
                label={`AI assist for ${s.kind === 'custom' ? s.heading : SECTION_HEADINGS[s.kind]}`}
                size="sm"
                actions={sectionActions(s.kind)}
                placeholder="Ask for a change to this section"
                request={(action, instruction) => ({ target: 'section', action, instruction, section: s, name: spec.name, props, components })}
                onAccept={(next) => setSection(i, next)}
              />
            }
          >
            <SectionFields section={s} set={(p) => setSection(i, p)} props={props} />
          </SectionCard>
        ))}

        <div className="spec-add">
          {missing.map((k) => (
            <Button key={k} variant="secondary" size="sm" leadingIcon={<Plus />} showLeadingIcon onClick={() => addSection(k)}>{SECTION_HEADINGS[k]}</Button>
          ))}
          <Button variant="ghost" size="sm" leadingIcon={<Plus />} showLeadingIcon onClick={() => addSection('custom')}>Add section</Button>
        </div>
      </div>

      <aside className="spec-side">
        <SegmentControl
          aria-label="Preview as"
          value={view}
          onChange={(v) => setView(v as 'preview' | 'markdown')}
          options={[{ value: 'preview', label: 'Preview' }, { value: 'markdown', label: 'Markdown' }]}
        />
        <div className="spec-preview">
          {view === 'preview' ? <Markdown>{markdown.replace(/^\{% raw %\}\n*/, '')}</Markdown> : <pre className="theme-code"><code>{markdown}</code></pre>}
        </div>
        <div className="spec-actions">
          <Button variant="secondary" leadingIcon={<Copy />} showLeadingIcon onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
          <Button variant="secondary" leadingIcon={<Download />} showLeadingIcon onClick={download}>Download</Button>
          {canWriteRepo && (
            <Button variant="primary" leadingIcon={<Save />} showLeadingIcon disabled={!dirty && exists} loading={busy} onClick={save}>
              {exists ? 'Save to repo' : 'Create in repo'}
            </Button>
          )}
        </div>
        {!canWriteRepo && <p className="muted">Hosted site: copy or download it and open a pull request, or hand it to the DS agent.</p>}
        {saved && <Callout dismissible={false} severity={saved.ok ? 'success' : 'error'} title={saved.ok ? 'Saved' : 'Not saved'} description={saved.text} />}
        {issues.filter((i) => i.severity !== 'info').length > 0 && (
          <Callout
            dismissible={false}
            severity="warning"
            title={`${issues.filter((i) => i.severity !== 'info').length} things to check`}
            description="Shown on each section. They don’t block saving."
          />
        )}
        {related.length > 0 && (
          <details className="spec-related">
            <summary>DS-Ngr rules that mention {spec.name} ({related.length})</summary>
            <p className="muted">State each rule once. If the spec needs it, point to the rule id rather than restating it.</p>
            {related.map((r) => <RuleCard key={r.id} rule={r} />)}
          </details>
        )}
      </aside>
    </div>
  );
}

function SectionCard({ section, issues, onRemove, assist, children }: { section: SpecSection; issues: SpecIssue[]; onRemove: () => void; assist?: React.ReactNode; children: React.ReactNode }) {
  const known = section.kind !== 'custom';
  return (
    <section className="spec-card">
      <div className="kit-item-head">
        <h3>{known ? SECTION_HEADINGS[section.kind as KnownKind] : 'Custom section'}</h3>
        <RemoveButton label={`Remove section ${known ? SECTION_HEADINGS[section.kind as KnownKind] : section.kind === 'custom' ? section.heading : ''}`} onClick={onRemove} />
      </div>
      {known && <p className="muted">{SECTION_HELP[section.kind as KnownKind]}</p>}
      {assist}
      {children}
      {issues.map((i, n) => <p key={n} className={i.severity === 'info' ? 'muted' : 'pg-warning'}>{i.message}</p>)}
    </section>
  );
}

const Lead = ({ value, set }: { value: string; set: (v: string) => void }) => (
  <TextArea label="Intro" optional minRows={2} placeholder="Optional lead-in before the list." value={value} onChange={(e) => set(e.target.value)} />
);

function SectionFields({ section: s, set, props }: { section: SpecSection; set: (p: Patch) => void; props: Record<string, string> }) {
  switch (s.kind) {
    case 'whatItIs':
      return <TextArea aria-label="What it is" minRows={2} placeholder="A … that renders …" value={s.text} onChange={(e) => set({ text: e.target.value })} />;
    case 'whenToUse':
    case 'whenNotToUse':
      return (
        <>
          <Lead value={s.lead} set={(lead) => set({ lead })} />
          <LineList
            label="Cases"
            optional={false}
            add={s.kind === 'whenToUse' ? 'Add a case' : 'Add a case and its alternative'}
            placeholder={s.kind === 'whenToUse' ? 'Use when …' : 'Do not use when … → use `Component` instead'}
            values={s.items}
            onChange={(items) => set({ items })}
          />
        </>
      );
    case 'variants':
      return (
        <>
          <Lead value={s.lead} set={(lead) => set({ lead })} />
          {s.tables.map((t, ti) => (
            <div key={ti} className="spec-table">
              <div className="kit-item-head">
                <span className="spec-field-label">Prop</span>
                <RemoveButton label={`Remove table ${t.heading}`} onClick={() => set({ tables: s.tables.filter((_, j) => j !== ti) })} />
              </div>
              <TextInput aria-label={`Table ${ti + 1} prop`} value={t.heading} onChange={(e) => set({ tables: s.tables.map((x, j) => (j === ti ? { ...x, heading: e.target.value } : x)) })} />
              <TableFields rows={t.rows} onChange={(rows) => set({ tables: s.tables.map((x, j) => (j === ti ? { ...x, rows } : x)) })} />
            </div>
          ))}
          <Button variant="ghost" size="sm" leadingIcon={<Plus />} showLeadingIcon onClick={() => set({ tables: [...s.tables, { heading: '`prop` prop', rows: [['Value', 'Use when'], ['', '']] }] })}>Add a prop table</Button>
        </>
      );
    case 'spatial':
      return (
        <>
          <Lead value={s.lead} set={(lead) => set({ lead })} />
          <TextInput label="Owns its padding" placeholder="yes — …" value={s.ownsPadding} onChange={(e) => set({ ownsPadding: e.target.value })} />
          <TextInput label="Owns its margin" placeholder="no — spacing comes from the parent layout" value={s.ownsMargin} onChange={(e) => set({ ownsMargin: e.target.value })} />
          <TextInput label="Fills its container" placeholder="yes — width: 100%" value={s.fillsContainer} onChange={(e) => set({ fillsContainer: e.target.value })} />
          <TextInput label="Notes" optional value={s.notes} onChange={(e) => set({ notes: e.target.value })} />
        </>
      );
    case 'composition':
      return (
        <>
          <Lead value={s.lead} set={(lead) => set({ lead })} />
          <LineList label="Can be used inside / with" add="Add one" placeholder="Can be used inside: forms, settings panels." values={s.allowed} onChange={(allowed) => set({ allowed })} />
          <LineList label="Never" add="Add one" placeholder="Never place inside a Card — …" values={s.never} onChange={(never) => set({ never })} />
        </>
      );
    case 'props': {
      const unused = Object.keys(props).filter((p) => !s.rows.some((r) => r.prop.includes(`\`${p}\``))).sort();
      return (
        <>
          <Lead value={s.lead} set={(lead) => set({ lead })} />
          {s.rows.map((r, ri) => (
            <div key={ri} className="spec-row">
              <TextInput aria-label="Prop" value={r.prop} onChange={(e) => set({ rows: s.rows.map((x, j) => (j === ri ? { ...x, prop: e.target.value } : x)) })} />
              <TextInput aria-label="Type" value={r.type} onChange={(e) => set({ rows: s.rows.map((x, j) => (j === ri ? { ...x, type: e.target.value } : x)) })} />
              <TextInput aria-label="When to set" placeholder="When to set" value={r.when} onChange={(e) => set({ rows: s.rows.map((x, j) => (j === ri ? { ...x, when: e.target.value } : x)) })} />
              <RemoveButton label={`Remove prop ${r.prop || ri + 1}`} onClick={() => set({ rows: s.rows.filter((_, j) => j !== ri) })} />
            </div>
          ))}
          {unused.length > 0 && (
            <Select
              aria-label="Add a prop"
              placeholder="Add a prop…"
              value=""
              options={unused.map((p) => ({ value: p, label: p, description: props[p] }))}
              onChange={(p) => set({ rows: [...s.rows, { prop: `\`${p}\``, type: `\`${props[p]}\``, when: '' }] })}
            />
          )}
        </>
      );
    }
    case 'mistakes':
      return (
        <>
          <Lead value={s.lead} set={(lead) => set({ lead })} />
          {s.items.map((m, mi) => (
            <div key={mi} className="spec-row spec-row-2">
              <TextInput aria-label={`Mistake ${mi + 1}`} placeholder="The mistake" value={m.mistake} onChange={(e) => set({ items: s.items.map((x, j) => (j === mi ? { ...x, mistake: e.target.value } : x)) })} />
              <TextInput aria-label={`Fix ${mi + 1}`} placeholder="Why it’s wrong, what to do instead" value={m.fix} onChange={(e) => set({ items: s.items.map((x, j) => (j === mi ? { ...x, fix: e.target.value } : x)) })} />
              <RemoveButton label={`Remove mistake ${mi + 1}`} onClick={() => set({ items: s.items.filter((_, j) => j !== mi) })} />
            </div>
          ))}
          <Button variant="ghost" size="sm" leadingIcon={<Plus />} showLeadingIcon onClick={() => set({ items: [...s.items, { mistake: '', fix: '' }] })}>Add a mistake</Button>
        </>
      );
    case 'examples':
      return (
        <>
          <Lead value={s.lead} set={(lead) => set({ lead })} />
          {s.blocks.map((b, bi) => (
            <div key={bi} className="spec-table">
              <div className="kit-item-head">
                <span className="spec-field-label">Example {bi + 1}</span>
                <RemoveButton label={`Remove example ${bi + 1}`} onClick={() => set({ blocks: s.blocks.filter((_, j) => j !== bi) })} />
              </div>
              <TextArea aria-label={`Example ${bi + 1}`} className="rule-code" minRows={4} value={b.code} onChange={(e) => set({ blocks: s.blocks.map((x, j) => (j === bi ? { ...x, code: e.target.value } : x)) })} />
            </div>
          ))}
          <Button variant="ghost" size="sm" leadingIcon={<Plus />} showLeadingIcon onClick={() => set({ blocks: [...s.blocks, { lang: 'tsx', code: '// Most common usage\n' }] })}>Add an example</Button>
        </>
      );
    case 'custom':
      return (
        <>
          <TextInput label="Heading" value={s.heading} onChange={(e) => set({ heading: e.target.value })} />
          <TextArea label="Content" helperText="Markdown." minRows={4} className="rule-code" value={s.body} onChange={(e) => set({ body: e.target.value })} />
        </>
      );
  }
}

/** A small table editor: the first row is the header. */
function TableFields({ rows, onChange }: { rows: string[][]; onChange: (rows: string[][]) => void }) {
  const width = rows[0]?.length ?? 2;
  const setCell = (r: number, c: number, v: string) => onChange(rows.map((row, i) => (i === r ? row.map((x, j) => (j === c ? v : x)) : row)));
  return (
    <>
      {rows.map((row, r) => (
        <div key={r} className="spec-row" style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr)) auto` }}>
          {row.map((cell, c) => (
            <TextInput key={c} aria-label={r === 0 ? `Column ${c + 1} heading` : `${rows[0][c]} row ${r}`} value={cell} onChange={(e) => setCell(r, c, e.target.value)} />
          ))}
          {r > 0 ? (
            <RemoveButton label={`Remove row ${r}`} onClick={() => onChange(rows.filter((_, i) => i !== r))} />
          ) : (
            // Same width as the ✕ below, so header cells line up with the rows.
            <span className="remove-spacer" aria-hidden><RemoveButton label="" onClick={() => {}} /></span>
          )}
        </div>
      ))}
      <Button variant="ghost" size="sm" leadingIcon={<Plus />} showLeadingIcon onClick={() => onChange([...rows, Array(width).fill('')])}>Add a row</Button>
    </>
  );
}
