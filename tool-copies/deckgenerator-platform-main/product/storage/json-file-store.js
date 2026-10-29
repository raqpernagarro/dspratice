// =============================================================================
// Shared JSON-file store helper — WP1 Storage Correction.
//
// export-repository.js and presentation-repository.js each persist state as
// a whole-file JSON array: read the array, mutate it, write the whole array
// back. Two concurrent async operations against the SAME file (e.g. two
// overlapping POST requests) can interleave at their own `await` points —
// both read the same on-disk array, both compute their own next array, and
// whichever writes last silently discards the other's change, even though
// both call sites already returned a "successful" result to their caller.
// Reproduced live during WP6 verification: two concurrent
// POST /api/exports both returned 201, but only one Job was ever persisted.
//
// This module makes every read-modify-write against a given file path run
// as one serialized critical section, in-process, via plain Promise
// chaining — no file locks, no worker threads, no external dependency, and
// no cross-process guarantee (none is needed: every writer here is the same
// single Node process, the architecture already approved for this store).
// Concurrent callers targeting the same path queue behind one another
// instead of interleaving; callers targeting different paths never wait on
// each other.
// =============================================================================
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, basename } from "node:path";

const queues = new Map(); // file path -> tail of that path's pending-operations chain

/** Runs `fn` after every previously-queued operation on `path` has
 * settled, and queues every later one behind it in turn. The stored tail
 * always resolves (errors are swallowed there) so one caller's rejection
 * never wedges the queue for callers after it; the actual outcome is still
 * propagated to this call's own caller via the returned promise. */
function withFileLock(path, fn) {
  const tail = queues.get(path) || Promise.resolve();
  const result = tail.then(fn);
  queues.set(path, result.then(() => {}, () => {}));
  return result;
}

async function ensureDir(path) {
  await mkdir(dirname(path), { recursive: true });
}

async function readJsonFileRaw(path) {
  await ensureDir(path);
  if (!existsSync(path)) return [];
  const raw = await readFile(path, "utf8");
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new SyntaxError("expected a JSON array");
    return parsed;
  } catch {
    /* An unparsable file used to return [] — and because the next write then
     * persisted that empty array, a file damaged by anything the atomic write
     * does NOT cover (a hand edit, a disk fault, two processes writing at once)
     * escalated from "corrupt" into "every presentation deleted".
     *
     * Setting it aside keeps the bytes. The app carries on with an empty store,
     * which is the same practical outcome, except the content still exists on
     * disk and the filename says what happened.
     *
     * An empty or whitespace-only file is treated as a fresh store rather than
     * damage: that is what a store looks like before anything is written, and
     * there is nothing to preserve. */
    if (!raw.trim()) return [];
    const quarantinePath = `${path}.corrupt-${Date.now()}`;
    try {
      await rename(path, quarantinePath);
      console.error(
        `[storage] ${basename(path)} could not be read and has been set aside as ` +
        `${basename(quarantinePath)}. Starting a fresh one — your previous content ` +
        `is still in that file.`
      );
    } catch (err) {
      console.error(`[storage] ${basename(path)} is unreadable and could not be set aside: ${err.message}`);
    }
    return [];
  }
}

async function writeJsonFileRaw(path, records) {
  await ensureDir(path);
  // Atomic tmp+rename — a crash mid-write must never truncate the file
  // (readJsonFileRaw treats an unparsable file as empty, so a truncated
  // store would silently become a data wipe on the next write).
  const tmp = `${path}.tmp`;
  await writeFile(tmp, JSON.stringify(records, null, 2) + "\n", "utf8");
  await rename(tmp, path);
}

/** A plain, unserialized read of `path`'s JSON array. Safe to call any
 * time — read-only queries were never the source of the lost-write race,
 * so they stay outside the critical section (matches every findById/
 * findByWorkspace/findJobsByStatus-style method in both repositories). */
export async function readJsonFile(path) {
  return readJsonFileRaw(path);
}

/**
 * Runs a read-modify-write cycle against `path` as one atomic (in-process)
 * critical section, serialized against every other `withJsonFile` call on
 * the same path.
 *
 * `mutator(records)` receives the file's current array and must return
 * `{ records, result }`:
 *   - `records`: the next array to persist, or `undefined` to skip the
 *     write entirely (e.g. a delete that matched nothing).
 *   - `result`: whatever the calling repository method should return.
 * `mutator` may throw (e.g. "not found", an invalid transition) — the
 * write is skipped and the rejection propagates to this call's caller,
 * exactly as a synchronous validation throw would.
 */
export function withJsonFile(path, mutator) {
  return withFileLock(path, async () => {
    const current = await readJsonFileRaw(path);
    const { records, result } = await mutator(current);
    if (records !== undefined) await writeJsonFileRaw(path, records);
    return result;
  });
}
