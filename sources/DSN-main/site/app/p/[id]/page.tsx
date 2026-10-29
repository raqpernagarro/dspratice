import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getStore, publicRecord } from '@/lib/prototype';
import { PrototypeCanvas } from '@/components/prototype/PrototypeCanvas';
import { PasswordGate } from '@/components/prototype/PasswordGate';
import { canView, unlockCookieName, visibilityOf } from '@/lib/prototype/share';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const record = await getStore().get((await params).id);
  // A private prototype's title is part of what the password protects.
  const locked = record && visibilityOf(record) === 'private' && !canView(record, { cookie: (await cookies()).get(unlockCookieName(record.id))?.value });
  const title = locked ? 'Private prototype' : record?.title;
  return { title: title ?? 'Prototype', robots: { index: false } };
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * Full-screen shareable prototype, in the theme it was saved with.
 * `?live` follows an agent's edits; `?brand=<slug>` switches brand in a
 * multi-brand set; `?theme=<settings query>` previews another theme;
 * `?mode=dark|light` forces a color mode. Private prototypes ask for their
 * password first (see lib/prototype/share.ts).
 */
export default async function PrototypePage({ params, searchParams }: Props) {
  const record = await getStore().get((await params).id);
  if (!record) notFound();
  const cookie = (await cookies()).get(unlockCookieName(record.id))?.value;
  if (!canView(record, { cookie })) return <PasswordGate id={record.id} />;
  const sp = await searchParams;
  const mode = one(sp.mode);
  const { id, root, version, themeQuery, brandsParam, kit } = publicRecord(record);
  return (
    <>
      {(mode === 'dark' || mode === 'light') && (
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.setAttribute('data-theme','${mode}')` }} />
      )}
      <PrototypeCanvas
        id={id}
        initial={{ root, version, themeQuery: themeQuery ?? '', brandsParam, kit }}
        override={{ theme: one(sp.theme), brand: one(sp.brand) }}
      />
    </>
  );
}
