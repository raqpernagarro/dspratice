'use client';

import { useMemo, useState } from 'react';
import { Copy } from 'lucide-react';
import { Button, Callout, Modal } from 'ds-ngr';
import { aiMdTarget, renderRule, shortRuleLine } from '@/lib/rules/markdown';
import { nextRuleId, type Rule } from '@/lib/rules/types';

/**
 * Turns a team rule into a DS-Ngr rule: shows where it lands in AI.md, under
 * which id, and the AI-short.md line. Copy the prompt for the DS-Ngr agent,
 * or — on a local dev server — write it into AI.md directly.
 */
export function ProposeRule({ rule, coreIds, canApply, onClose }: { rule: Rule; coreIds: string[]; canApply: boolean; onClose: () => void }) {
  const target = aiMdTarget(rule.category);
  const proposed = useMemo(() => ({ ...rule, id: nextRuleId(target.prefix, coreIds) }), [rule, target, coreIds]);
  const markdown = renderRule(proposed, { meta: false });
  const short = shortRuleLine(proposed);
  const prompt = [
    `Add this rule to AI.md at the end of “${target.heading.slice(3)}” as ${proposed.id}${rule.appliesTo.length ? ` (it covers ${rule.appliesTo.join(', ')})` : ''}.`,
    'Add the one-liner to the matching section of AI-short.md. If a component spec already covers this, update it to point at the rule instead of restating it.',
    'Then run the ds-doc-audit skill.',
    '',
    markdown.trimEnd(),
    '',
    'AI-short.md:',
    short,
  ].join('\n');

  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const copy = () =>
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });

  const apply = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/rules/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rule }) });
      const data = await res.json();
      setResult(res.ok ? { ok: true, text: `Added to AI.md as ${data.id}. Add this line to AI-short.md by hand: ${data.shortLine}` } : { ok: false, text: data.error ?? `Failed (${res.status}).` });
    } catch (err) {
      setResult({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title={`Propose ${rule.id} to DS-Ngr`}
      description={`It becomes ${proposed.id} in AI.md, under “${target.heading.slice(3)}”, and applies to everyone using DS-Ngr.`}
      showBottomBar
      bottomBarRightActions={
        <>
          {canApply && !result?.ok && (
            <Button variant="secondary" loading={busy} onClick={apply}>Write to AI.md</Button>
          )}
          <Button variant="primary" leadingIcon={<Copy />} showLeadingIcon onClick={copy}>
            {copied ? 'Copied' : 'Copy prompt for the DS agent'}
          </Button>
        </>
      }
    >
      <div className="rule-propose">
        <p className="muted">As it would read in AI.md</p>
        <pre className="theme-code"><code>{markdown}</code></pre>
        <p className="muted">One-liner for AI-short.md</p>
        <pre className="theme-code"><code>{short}</code></pre>
        {canApply && !result && (
          <p className="muted">You’re on a local dev server, so you can write it into AI.md directly. Review the diff before you commit.</p>
        )}
        {result && <Callout dismissible={false} severity={result.ok ? 'success' : 'error'} title={result.ok ? 'Written to AI.md' : 'Not written'} description={result.text} />}
      </div>
    </Modal>
  );
}
