import { notFound } from 'next/navigation';
import { PrototypeRenderer } from '@/components/prototype/PrototypeRenderer';
import { ThemeStyle } from '@/components/prototype/ThemeStyle';
import { compilePrototype, getKitStore } from '@/lib/prototype';
import { themeFor } from '@/lib/prototype/service';

type Props = { params: Promise<{ id: string; pattern: string }> };

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pattern example', robots: { index: false } };

/** A team pattern's example screen, rendered in the kit's theme. */
export default async function KitPatternPage({ params }: Props) {
  const { id, pattern } = await params;
  const kit = await getKitStore().get(id);
  const p = kit?.patterns.find((x) => x.name === decodeURIComponent(pattern));
  if (!kit || !p) notFound();
  const result = compilePrototype(p.source, kit);
  if (!result.root) notFound();
  return (
    <>
      <ThemeStyle query={themeFor(null, null, kit).query} />
      <PrototypeRenderer root={result.root} kit={result.kit} />
    </>
  );
}
