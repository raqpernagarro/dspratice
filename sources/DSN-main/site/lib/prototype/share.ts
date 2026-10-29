import 'server-only';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { ServiceError } from './service';
import { getStore, tokenMatches, type PrototypeRecord } from './store';

/**
 * Who can open a prototype link. Public: anyone with the link (the default, and
 * every prototype made before sharing existed). Private: the link asks for a
 * password; entering it sets a cookie for that prototype. Only the holder of the
 * edit token can change access, and the edit token always grants view access.
 */

export type Visibility = 'public' | 'private';

export interface PrototypeAccess {
  visibility: Visibility;
  /** scrypt hash of the viewer password, hex. Private only. */
  passwordHash?: string;
  salt?: string;
}

export const MIN_PASSWORD = 4;
const MAX_PASSWORD = 200;
/** Unlocks last a month; changing the password invalidates them. */
export const UNLOCK_MAX_AGE = 60 * 60 * 24 * 30;

export const unlockCookieName = (id: string) => `dsn_p_${id}`;

const hashPassword = (password: string, salt: string) => scryptSync(password, salt, 32).toString('hex');

const sameHex = (a: string, b: string) => {
  const x = Buffer.from(a, 'hex');
  const y = Buffer.from(b, 'hex');
  return x.length === y.length && x.length > 0 && timingSafeEqual(x, y);
};

export const visibilityOf = (record: Pick<PrototypeRecord, 'access'>): Visibility => record.access?.visibility ?? 'public';

/** The cookie value that proves a viewer knew the current password. Derived, so nothing extra is stored. */
export function unlockValue(record: PrototypeRecord): string | null {
  const hash = record.access?.passwordHash;
  return hash ? createHash('sha256').update(`${record.id}:${hash}`).digest('hex') : null;
}

/** Whether a request may see this prototype: public, a valid unlock cookie, or the edit token. */
export function canView(record: PrototypeRecord, credentials: { cookie?: string | null; editToken?: string | null }): boolean {
  if (visibilityOf(record) === 'public') return true;
  if (credentials.editToken && tokenMatches(credentials.editToken, record.editKeyHash)) return true;
  const expected = unlockValue(record);
  return !!(expected && credentials.cookie && sameHex(credentials.cookie, expected));
}

/** Reads the unlock cookie for `id` from a request's Cookie header. */
export function cookieFrom(req: Request, id: string): string | null {
  const name = unlockCookieName(id);
  for (const part of (req.headers.get('cookie') ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

export function unlockCookie(id: string, value: string, secure: boolean): string {
  return `${unlockCookieName(id)}=${value}; Path=/; Max-Age=${UNLOCK_MAX_AGE}; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
}

async function loadOwned(id: string, editToken: string | null) {
  const record = await getStore().get(id);
  if (!record) throw new ServiceError(404, 'Prototype not found.');
  if (!tokenMatches(editToken, record.editKeyHash)) throw new ServiceError(403, 'Invalid edit token.');
  return record;
}

export async function getAccess(id: string, editToken: string | null) {
  const record = await loadOwned(id, editToken);
  return { visibility: visibilityOf(record), hasPassword: !!record.access?.passwordHash };
}

/**
 * Sets who can open the link. Going private needs a password, unless it already
 * has one and the caller only re-saves. Returns the owner's unlock cookie value
 * so the creator keeps seeing their own private prototype.
 */
export async function setAccess(id: string, editToken: string | null, input: { visibility: Visibility; password?: string }) {
  const record = await loadOwned(id, editToken);
  let access: PrototypeAccess;
  if (input.visibility === 'public') {
    access = { visibility: 'public' };
  } else {
    const password = input.password ?? '';
    if (password) {
      if (password.length < MIN_PASSWORD) throw new ServiceError(400, `Use a password of at least ${MIN_PASSWORD} characters.`);
      if (password.length > MAX_PASSWORD) throw new ServiceError(400, 'That password is too long.');
      const salt = randomBytes(16).toString('hex');
      access = { visibility: 'private', salt, passwordHash: hashPassword(password, salt) };
    } else if (record.access?.passwordHash) {
      access = { ...record.access, visibility: 'private' };
    } else {
      throw new ServiceError(400, 'Set a password to make the link private.');
    }
  }
  const next: PrototypeRecord = { ...record, access, updatedAt: new Date().toISOString() };
  await getStore().put(next);
  return { visibility: access.visibility, hasPassword: !!access.passwordHash, unlock: unlockValue(next) };
}

/** Checks a viewer password; returns the unlock cookie value. */
export async function unlock(id: string, password: string) {
  const record = await getStore().get(id);
  if (!record) throw new ServiceError(404, 'Prototype not found.');
  const { passwordHash, salt } = record.access ?? {};
  if (visibilityOf(record) === 'public' || !passwordHash || !salt) return { unlock: null };
  if (!sameHex(hashPassword(password.slice(0, MAX_PASSWORD), salt), passwordHash)) throw new ServiceError(401, 'That password isn’t right.');
  return { unlock: unlockValue(record) };
}

/** Throws 403 unless the request may view the prototype (used by the polling API). 404s pass through to the caller. */
export async function assertCanView(id: string, req: Request) {
  const record = await getStore().get(id);
  if (record && !canView(record, { cookie: cookieFrom(req, id), editToken: req.headers.get('x-edit-token') })) {
    throw new ServiceError(403, 'This prototype is private.');
  }
}
