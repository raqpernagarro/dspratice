'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import { Button, Callout, Combobox, Drawer, SegmentControl, Select, Tag, TextArea, TextInput } from 'ds-ngr';
import { patchKit } from '@/components/prototype/draft-shared';
import { AssistPanel } from '@/components/assist/AssistPanel';
import { ASSIST_ACTIONS } from '@/lib/assist/mock';
import { ProposeRule } from './ProposeRule';
import { lintRule, type RuleIssue } from '@/lib/rules/lint';
import { renderRule } from '@/lib/rules/markdown';
import { emptyRule, RULE_CATEGORIES, type Rule, type RuleCategory, type RuleExample } from '@/lib/rules/types';

interface Props {
  kitId: string;
  /** Edit token; without it the list is read-only. */
  kitKey?: string;
  rules: Rule[];
  /** DS-Ngr's own numbered rules (AI.md), for overlap hints. */
  coreRules: Rule[];
  components: string[];
  tokens: string[];
  /** Local dev server: proposals can be written into AI.md directly. */
  canWriteRepo?: boolean;
}

const categoryLabel = (id: RuleCategory) => RULE_CATEGORIES.find((c) => c.id === id)?.label ?? id;

/** The team's rules on the kit page: cards, plus an "Add rule" drawer with a live preview and checks. */
export function KitRules({ kitId, kitKey, rules, coreRules, components, tokens, canWriteRepo = false }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<Rule | null>(null);
  const [proposing, setProposing] = useState<Rule | null>(null);
  const [filter, setFilter] = useState<RuleCategory | 'all'>('all');
  const [error, setError] = useState<string | null>(null);
  const shown = filter === 'all' ? rules : rules.filter((r) => r.category === filter);
  const used = RULE_CATEGORIES.filter((c) => rules.some((r) => r.category === c.id));

  const remove = async (id: string) => {
    setError(null);
    try {
      await patchKit({ id: kitId, editToken: kitKey! }, { remove: { kind: 'rule', name: id } });
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <>
      <div className="kit-item-head">
        <p className="muted">Agents connected to this kit follow these on top of DS-Ngr’s own rules.</p>
        {kitKey && (
          <Button variant="secondary" leadingIcon={<Plus />} showLeadingIcon onClick={() => setEditing(emptyRule(''))}>
            Add rule
          </Button>
        )}
      </div>
      {used.length > 1 && (
        <SegmentControl
          aria-label="Filter rules by category"
          value={filter}
          onChange={(v) => setFilter(v as RuleCategory | 'all')}
          options={[{ value: 'all', label: 'All' }, ...used.map((c) => ({ value: c.id, label: c.label }))]}
        />
      )}
      {rules.length === 0 && (
        <p className="muted">{kitKey ? 'None yet. Add one, or ask your AI to “remember this as a team rule”.' : 'None yet. Open the kit with its edit link to add one.'}</p>
      )}
      {error && <p className="pg-error">{error}</p>}
      <div className="rule-list">
        {shown.map((r) => (
          <RuleCard
            key={r.id}
            rule={r}
            onEdit={kitKey ? () => setEditing(r) : undefined}
            onRemove={kitKey ? () => remove(r.id) : undefined}
            onPropose={() => setProposing(r)}
          />
        ))}
      </div>
      {proposing && <ProposeRule rule={proposing} coreIds={coreRules.map((r) => r.id)} canApply={canWriteRepo} onClose={() => setProposing(null)} />}
      {editing && kitKey && (
        <RuleDrawer
          initial={editing}
          lintCtx={{ components, tokens, existing: [...coreRules, ...rules] }}
          onClose={() => setEditing(null)}
          onSave={async (rule) => {
            await patchKit({ id: kitId, editToken: kitKey }, { rule: { ...rule, id: rule.id || undefined } });
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

export function RuleCard({ rule, onEdit, onRemove, onPropose }: { rule: Rule; onEdit?: () => void; onRemove?: () => void; onPropose?: () => void }) {
  return (
    <section className="rule-card">
      <div className="kit-item-head">
        <h3>
          <code className="rule-id">{rule.id || 'New'}</code> {rule.title || <span className="muted">Untitled rule</span>}
        </h3>
        {(onEdit || onRemove || onPropose) && (
          <div className="rule-actions">
            {onPropose && <Button variant="ghost" size="sm" onClick={onPropose}>Propose to DS-Ngr</Button>}
            {onEdit && <Button variant="ghost" size="sm" onClick={onEdit}>Edit</Button>}
            {onRemove && <Button variant="ghost" size="sm" onClick={onRemove}>Remove</Button>}
          </div>
        )}
      </div>
      <div className="rule-tags">
        <Tag size="sm" variant="neutral" label={categoryLabel(rule.category)} />
        {rule.appliesTo.map((c) => <Tag key={c} size="sm" variant="highlight" label={c} />)}
      </div>
      {rule.description && <p className="rule-desc">{rule.description}</p>}
      {(rule.dos.length > 0 || rule.donts.length > 0) && (
        <ul className="rule-lines">
          {rule.dos.map((d, i) => <li key={`d${i}`} className="rule-do">{d}</li>)}
          {rule.donts.map((d, i) => <li key={`n${i}`} className="rule-dont">{d}</li>)}
        </ul>
      )}
      {rule.examples.map((e, i) => (
        <figure key={i} className={`rule-example rule-example-${e.kind}`}>
          {e.kind !== 'mixed' && <figcaption>{e.kind === 'good' ? 'Do' : 'Don’t'}{e.label && ` — ${e.label}`}</figcaption>}
          <pre className="theme-code"><code>{e.code}</code></pre>
        </figure>
      ))}
    </section>
  );
}

/** The ✕ used to remove a row, line or section in the rule and spec forms. `label` is read out, e.g. “Remove don’t 2”. */
export function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <Button variant="ghost" size="sm" showLabel={false} leadingIcon={<X />} showLeadingIcon aria-label={label} onClick={onClick} />;
}

/** A list of one-line inputs with “Add …” and remove buttons. The new line takes focus. */
export function LineList({
  label,
  add,
  values,
  onChange,
  issues = [],
  optional = true,
  placeholder,
}: {
  label: string;
  add: string;
  values: string[];
  onChange: (v: string[]) => void;
  issues?: { message: string }[];
  optional?: boolean;
  placeholder?: string;
}) {
  const box = useRef<HTMLFieldSetElement>(null);
  const added = useRef(false);
  useEffect(() => {
    if (!added.current) return;
    added.current = false;
    [...(box.current?.querySelectorAll('input') ?? [])].at(-1)?.focus();
  }, [values.length]);
  const addLine = () => {
    added.current = true;
    onChange([...values, '']);
  };
  return (
    <fieldset className="rule-field" ref={box}>
      <legend>{label}{optional && <span className="muted"> (optional)</span>}</legend>
      {values.map((v, i) => (
        <div key={i} className="rule-line-row">
          <TextInput
            aria-label={`${label} ${i + 1}`}
            placeholder={placeholder}
            value={v}
            onChange={(e) => onChange(values.map((x, j) => (j === i ? e.target.value : x)))}
          />
          <RemoveButton label={`Remove ${label.toLowerCase()} ${i + 1}`} onClick={() => onChange(values.filter((_, j) => j !== i))} />
        </div>
      ))}
      <Button variant="ghost" size="sm" leadingIcon={<Plus />} showLeadingIcon onClick={addLine}>{add}</Button>
      {issues.map((i, n) => <p key={n} className="pg-warning">{i.message}</p>)}
    </fieldset>
  );
}

/** The Add / Edit rule drawer: form, live preview, checks. `onSave` persists it and throws to show an error. */
export function RuleDrawer({
  initial,
  lintCtx,
  onClose,
  onSave,
  notice,
  saveLabel = 'Save rule',
  placeholderId = 'KIT-new',
  meta = true,
}: {
  initial: Rule;
  lintCtx: { components: string[]; tokens: string[]; existing: Rule[] };
  onClose: () => void;
  onSave: (rule: Rule) => Promise<void>;
  /** Shown above the form, e.g. what saving does to a hand-written rule. */
  notice?: string;
  saveLabel?: string;
  /** Id shown in the preview before the rule has one. */
  placeholderId?: string;
  /** Include the Category / Applies to line in the agent view (kit rules do; AI.md rules don't). */
  meta?: boolean;
}) {
  const [rule, setRule] = useState<Rule>(initial);
  const [view, setView] = useState<'card' | 'markdown'>('card');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Rule>(k: K, v: Rule[K]) => setRule((r) => ({ ...r, [k]: v }));

  const ctx = useMemo(() => ({ components: new Set(lintCtx.components), tokens: new Set(lintCtx.tokens), existing: lintCtx.existing }), [lintCtx]);
  const issues = useMemo(() => lintRule({ ...rule, id: rule.id || placeholderId }, ctx), [rule, ctx, placeholderId]);
  const errors = issues.filter((i) => i.severity === 'error');
  const by = (field: RuleIssue['field'], sev?: RuleIssue['severity']) => issues.filter((i) => i.field === field && (!sev || i.severity === sev));
  const titleIssue = by('title')[0];
  const dirty = JSON.stringify(rule) !== JSON.stringify(initial);

  const save = async () => {
    if (errors.length || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSave({ ...rule, dos: rule.dos.filter((d) => d.trim()), donts: rule.donts.filter((d) => d.trim()) });
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  const setExample = (i: number, patch: Partial<RuleExample>) => set('examples', rule.examples.map((e, j) => (j === i ? { ...e, ...patch } : e)));

  return (
    <Drawer
      open
      onOpenChange={(o) => !o && onClose()}
      closeOnEscape={!dirty}
      closeOnOverlayClick={!dirty}
      width="min(960px, 100vw)"
      title={initial.id ? `Edit ${initial.id}` : 'Add rule'}
      description="Write it the way you’d explain it to a new teammate. Agents read it word for word."
      showBottomBar
      bottomBarRightActions={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={errors.length > 0} loading={busy} onClick={save} shortcut shortcutLabel="⌘↵" shortcutAriaLabel="Command Enter">
            {saveLabel}
          </Button>
        </>
      }
    >
      {notice && <div className="rule-notice"><Callout dismissible={false} severity="default" title={notice} /></div>}
      {/* Outside the <form>: PromptInput submits on Enter by itself. */}
      <div className="rule-assist">
        <AssistPanel<Rule>
          label="AI assist for this rule"
          actions={ASSIST_ACTIONS.rule}
          placeholder={rule.title ? 'Ask for a change, e.g. “make the don’ts more specific”' : 'Describe the rule in a sentence, e.g. “amounts always show the currency”'}
          defaultOpen={!initial.title}
          request={(action, instruction) => ({ target: 'rule', action, instruction, rule, components: lintCtx.components })}
          onAccept={setRule}
        />
      </div>
      <form
        className="rule-editor"
        onSubmit={(e) => { e.preventDefault(); save(); }}
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); save(); } }}
      >
        <div className="rule-form">
          <TextInput
            label="Title"
            placeholder="e.g. Amounts always show the currency"
            value={rule.title}
            onChange={(e) => set('title', e.target.value)}
            error={titleIssue?.severity === 'error' && rule.title.length > 0}
            errorMessage={titleIssue?.severity === 'error' ? titleIssue.message : undefined}
            helperText={titleIssue?.severity === 'warning' ? titleIssue.message : 'One line, sentence case.'}
          />
          <Select
            label="Category"
            value={rule.category}
            onChange={(v) => set('category', v as RuleCategory)}
            options={RULE_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))}
          />
          <Combobox
            selectionMode="multi"
            label="Applies to"
            optional
            placeholder="Search components"
            values={rule.appliesTo}
            onValuesChange={(v) => set('appliesTo', v)}
            options={lintCtx.components.map((c) => ({ value: c, label: c }))}
            helperText="Leave empty for a rule about whole pages."
            error={by('appliesTo', 'error').length > 0}
            errorMessage={by('appliesTo', 'error')[0]?.message}
          />
          <TextArea
            label="Description"
            optional
            minRows={3}
            placeholder="What the rule is and why. Markdown and `code` work."
            value={rule.description}
            onChange={(e) => set('description', e.target.value)}
          />
          <LineList label="Do" add="Add a do" values={rule.dos} onChange={(v) => set('dos', v)} issues={by('dos')} />
          <LineList label="Don’t" add="Add a don’t" values={rule.donts} onChange={(v) => set('donts', v)} issues={by('donts')} />

          <fieldset className="rule-field">
            <legend>Examples <span className="muted">(optional)</span></legend>
            {rule.examples.map((ex, i) => (
              <div key={i} className="rule-example-edit">
                <div className="rule-line-row">
                  <SegmentControl
                    aria-label={`Example ${i + 1} kind`}
                    value={ex.kind === 'mixed' ? 'good' : ex.kind}
                    onChange={(v) => setExample(i, { kind: v as 'good' | 'bad' })}
                    options={[{ value: 'good', label: 'Do' }, { value: 'bad', label: 'Don’t' }]}
                  />
                  <RemoveButton label={`Remove example ${i + 1}`} onClick={() => set('examples', rule.examples.filter((_, j) => j !== i))} />
                </div>
                <TextInput label="Note" optional value={ex.label ?? ''} onChange={(e) => setExample(i, { label: e.target.value })} />
                <TextArea label="Code" minRows={4} className="rule-code" value={ex.code} onChange={(e) => setExample(i, { code: e.target.value })} />
              </div>
            ))}
            <Button variant="ghost" size="sm" leadingIcon={<Plus />} showLeadingIcon onClick={() => set('examples', [...rule.examples, { kind: rule.examples.some((e) => e.kind === 'good') ? 'bad' : 'good', lang: 'tsx', code: '' }])}>
              Add example
            </Button>
            {by('examples').map((i, n) => <p key={n} className="pg-warning">{i.message}</p>)}
          </fieldset>
        </div>

        <aside className="rule-preview">
          <SegmentControl
            aria-label="Preview as"
            value={view}
            onChange={(v) => setView(v as 'card' | 'markdown')}
            options={[{ value: 'card', label: 'Preview' }, { value: 'markdown', label: 'What agents read' }]}
          />
          {view === 'card' ? <RuleCard rule={{ ...rule, dos: rule.dos.filter(Boolean), donts: rule.donts.filter(Boolean) }} /> : <pre className="theme-code"><code>{renderRule({ ...rule, id: rule.id || placeholderId }, { meta })}</code></pre>}
          {dirty && by('content').filter((i) => i.severity !== 'info').map((i, n) => (
            <Callout key={n} dismissible={false} severity={i.severity === 'error' ? 'error' : 'warning'} title={i.message} />
          ))}
          {by('content', 'info').length > 0 && (
            <Callout dismissible={false} severity="default" title="Related rules" description={by('content', 'info').map((i) => i.message).join(' ')} />
          )}
          {error && <Callout dismissible={false} severity="error" title="Not saved" description={error} />}
        </aside>
      </form>
    </Drawer>
  );
}
