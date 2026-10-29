/** Merges a (possibly filtered) audit run into the existing manifest.
 *  Only names in `audited` change state; everything else is preserved. */
export function mergeDarkSafe(existing, { safe, unsafe, audited }) {
  const auditedSet = new Set(audited);
  const keptSafe = (existing.safe || []).filter((n) => !auditedSet.has(n));
  const keptUnsafe = (existing.unsafe || []).filter((u) => !auditedSet.has(u.name));
  const outSafe = [...new Set([...keptSafe, ...safe])].sort();
  const outUnsafe = [...keptUnsafe, ...unsafe].sort((a, b) => a.name.localeCompare(b.name));
  return {
    ...existing,
    total: outSafe.length + outUnsafe.length,
    safe: outSafe,
    unsafe: outUnsafe,
  };
}
