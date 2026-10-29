import { describe, expect, it } from 'vitest';
import { createPrototype, getPrototype } from './service';
import { canView, getAccess, setAccess, unlock, unlockValue } from './share';
import { getStore, publicRecord } from './store';

const SOURCE = `import { Button } from 'ds-ngr';\nexport default function Screen() { return <Button>Hi</Button>; }`;

async function fresh() {
  const { id, editToken } = await createPrototype({ source: SOURCE, title: 'Share test' }, 'http://test');
  return { id, editToken };
}

describe('prototype sharing', () => {
  it('is public by default', async () => {
    const { id, editToken } = await fresh();
    expect(await getAccess(id, editToken)).toEqual({ visibility: 'public', hasPassword: false });
    expect(canView((await getStore().get(id))!, {})).toBe(true);
  });

  it('only the edit token changes access', async () => {
    const { id } = await fresh();
    await expect(setAccess(id, 'wrong', { visibility: 'private', password: 'secret' })).rejects.toMatchObject({ status: 403 });
  });

  it('needs a password of at least four characters to go private', async () => {
    const { id, editToken } = await fresh();
    await expect(setAccess(id, editToken, { visibility: 'private' })).rejects.toMatchObject({ status: 400 });
    await expect(setAccess(id, editToken, { visibility: 'private', password: 'abc' })).rejects.toMatchObject({ status: 400 });
  });

  it('locks a private prototype until the password is given', async () => {
    const { id, editToken } = await fresh();
    const { unlock: ownerCookie } = await setAccess(id, editToken, { visibility: 'private', password: 'open sesame' });
    const record = (await getStore().get(id))!;

    expect(canView(record, {})).toBe(false);
    expect(canView(record, { cookie: 'nope' })).toBe(false);
    expect(canView(record, { cookie: ownerCookie })).toBe(true);
    expect(canView(record, { editToken })).toBe(true);

    await expect(unlock(id, 'wrong')).rejects.toMatchObject({ status: 401 });
    expect((await unlock(id, 'open sesame')).unlock).toBe(unlockValue(record));

    // Agents need the edit token to read it, and clients never see the hash.
    await expect(getPrototype(id)).rejects.toMatchObject({ status: 403 });
    expect(await getPrototype(id, editToken)).not.toHaveProperty('access');
    expect(publicRecord(record)).not.toHaveProperty('access');
  });

  it('keeps the password when re-saving private, and a new password revokes old unlocks', async () => {
    const { id, editToken } = await fresh();
    const first = await setAccess(id, editToken, { visibility: 'private', password: 'first pass' });
    expect((await setAccess(id, editToken, { visibility: 'private' })).unlock).toBe(first.unlock);
    await setAccess(id, editToken, { visibility: 'private', password: 'second pass' });
    expect(canView((await getStore().get(id))!, { cookie: first.unlock })).toBe(false);
  });

  it('going public opens it to everyone', async () => {
    const { id, editToken } = await fresh();
    await setAccess(id, editToken, { visibility: 'private', password: 'secret' });
    await setAccess(id, editToken, { visibility: 'public' });
    expect(canView((await getStore().get(id))!, {})).toBe(true);
  });
});
