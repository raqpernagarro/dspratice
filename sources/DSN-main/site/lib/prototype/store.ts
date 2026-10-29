import 'server-only';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { Rule } from '@/lib/rules/types';
import type { Expr, Issue, KitComponent, KitOverride, KitPattern, KitSnapshot } from './ir';

/**
 * Persistence for prototypes and team kits. `version` bumps on every update
 * so a live canvas can poll cheaply.
 *
 * Only a local file store exists today. Hosting isn't chosen yet — a hosted
 * deploy needs a durable backend (Vercel Blob, Supabase…) behind this same
 * interface, selected in getCollection().
 */

export interface PrototypeRecord {
  id: string;
  title: string;
  source: string;
  root: Expr;
  issues: Issue[];
  version: number;
  /** Configurator settings query the prototype renders in ('' = Nagarro). */
  themeQuery?: string;
  /** Multi-brand set (encodeBrands) when the theme came from one; the canvas can switch brands. */
  brandsParam?: string;
  /** Team kit components this prototype uses, snapshotted at save so old links keep rendering. */
  kit?: KitSnapshot;
  /** sha256 of the edit token handed to the creator; never sent to clients. */
  editKeyHash: string;
  /** Who can open the link (see share.ts). Absent = public. Never sent to clients. */
  access?: import('./share').PrototypeAccess;
  createdAt: string;
  updatedAt: string;
}

export interface KitRecord {
  id: string;
  name: string;
  themeQuery: string;
  brandsParam?: string;
  components: KitComponent[];
  patterns: KitPattern[];
  /** DS-Ngr component name → this kit's layer on it. Absent on kits made before overrides. */
  overrides?: Record<string, KitOverride>;
  /** Team usage rules agents follow on top of DS-Ngr's. Absent on kits made before rules. */
  rules?: Rule[];
  version: number;
  editKeyHash: string;
  createdAt: string;
  updatedAt: string;
}

/** A keyed JSON collection. One implementation per backend; see getStore(). */
export interface Collection<T extends { id: string }> {
  get(id: string): Promise<T | null>;
  put(record: T): Promise<void>;
}

export type PrototypeStore = Collection<PrototypeRecord>;

/** 10 chars of base62-ish: unguessable enough for unlisted share links. */
export const newId = () => randomBytes(12).toString('base64url').replace(/[-_]/g, '').slice(0, 10).padEnd(10, '0');
export const isValidId = (id: string) => /^[A-Za-z0-9]{10}$/.test(id);

export const newEditToken = () => randomBytes(24).toString('base64url');
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
export const tokenMatches = (token: string | null, hash: string) => {
  if (!token) return false;
  const a = Buffer.from(hashToken(token), 'hex');
  const b = Buffer.from(hash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
};

/** The record as clients see it: no edit-key hash, no access settings (password hash). */
export const publicRecord = <T extends { editKeyHash: string; access?: unknown }>({ editKeyHash: _, access: __, ...rest }: T) => rest;

class FileCollection<T extends { id: string }> implements Collection<T> {
  constructor(private dir: string) {}

  private file(id: string) {
    if (!isValidId(id)) throw new Error('Invalid id');
    return path.join(this.dir, `${id}.json`);
  }

  async get(id: string) {
    if (!isValidId(id)) return null;
    try {
      return JSON.parse(await fs.readFile(this.file(id), 'utf8')) as T;
    } catch {
      return null;
    }
  }

  async put(record: T) {
    await fs.mkdir(this.dir, { recursive: true });
    const target = this.file(record.id);
    const tmp = `${target}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(record));
    await fs.rename(tmp, target);
  }
}

const collections = new Map<string, Collection<{ id: string }>>();

function getCollection<T extends { id: string }>(name: 'prototypes' | 'kits'): Collection<T> {
  if (!collections.has(name)) collections.set(name, new FileCollection(path.join(/*turbopackIgnore: true*/ process.cwd(), '.data', name)));
  return collections.get(name) as unknown as Collection<T>;
}

export const getStore = () => getCollection<PrototypeRecord>('prototypes');
export const getKitStore = () => getCollection<KitRecord>('kits');
