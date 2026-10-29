'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'ds-ngr';
import { patchKit } from './draft-shared';

/** Drops a kit's layer on one component, so it goes back to plain DS-Ngr. Needs the edit link. */
export function KitOverrideReset({ kitId, kitKey, component }: { kitId: string; kitKey: string; component: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        loading={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await patchKit({ id: kitId, editToken: kitKey }, { remove: { kind: 'override', name: component } });
            router.refresh();
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        Reset to DS-Ngr
      </Button>
      {error && <p className="pg-error">{error}</p>}
    </>
  );
}
