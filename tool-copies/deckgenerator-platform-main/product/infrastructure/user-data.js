// product/infrastructure/user-data.js
// =============================================================================
// Where a person's own work lives: presentations, users, sessions,
// credentials, and uploaded images.
//
// It lives INSIDE the app folder, deliberately:
//
//     product/data/                              presentations, users, sessions
//     product/infrastructure/identity/store/     password credentials
//     assets/uploads/                            images added to slides
//     product/data/exports/                      exported .pptx / .pdf files
//
// Everything is in one place you can see, copy, back up and hand to someone —
// which is the point. Nothing is hidden away in a system directory.
//
// THE TRADE-OFF, stated plainly because it matters when distributing this:
// the app folder is no longer disposable. Replacing it with a newer copy, or
// deleting it to re-clone, takes this content with it. Updating in place with
// `git pull` (what "Update Studio" does) is safe — all three paths are
// git-ignored, so an update never touches them. Copying a whole new folder
// over an old one is NOT safe. Back this content up before doing that.
//
// NPS_DATA_DIR overrides the root — used by test rigs so they can never write
// into a real install.
// =============================================================================
import { join, dirname } from "node:path";
import { existsSync, mkdirSync, readdirSync, copyFileSync, statSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { homedir, platform } from "node:os";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OVERRIDE = process.env.NPS_DATA_DIR;

export const DATA_DIR = OVERRIDE ? join(OVERRIDE, "data") : join(REPO_ROOT, "product", "data");
export const CREDENTIALS_DIR = OVERRIDE
  ? join(OVERRIDE, "credentials")
  : join(REPO_ROOT, "product", "infrastructure", "identity", "store");
export const UPLOADS_DIR = OVERRIDE ? join(OVERRIDE, "uploads") : join(REPO_ROOT, "assets", "uploads");
/* Exported .pptx/.pdf files. They used to be written to the OS temp directory,
 * where macOS purges them on reboot and after a few days — so the exports list
 * kept offering downloads that 404'd, and exported work was excluded from the
 * "copy the folder and you have everything" promise. */
export const EXPORTS_DIR = OVERRIDE ? join(OVERRIDE, "exports") : join(REPO_ROOT, "product", "data", "exports");

/** Shown at startup so it is always obvious where the work is. */
export const USER_DATA_ROOT = OVERRIDE || join(REPO_ROOT, "product", "data");

/** The system location a previous build used. Only referenced to bring that
 *  content home — nothing is ever written there. */
function legacySystemRoot() {
  const home = homedir();
  const name = "Nagarro Presentation Studio";
  if (platform() === "darwin") return join(home, "Library", "Application Support", name);
  if (platform() === "win32") return join(process.env.APPDATA || join(home, "AppData", "Roaming"), name);
  return join(process.env.XDG_DATA_HOME || join(home, ".local", "share"), "nagarro-presentation-studio");
}

/** Copies files into `to`, but only when `to` holds none — so this runs once
 *  and can never overwrite newer state. Copies rather than moves: a failed
 *  migration must not be able to lose anything. */
function reclaimOnce(from, to, label, moved) {
  if (!existsSync(from) || !existsSync(to)) return;
  let incoming;
  try {
    incoming = readdirSync(from).filter((f) => statSync(join(from, f)).isFile() && f !== ".DS_Store");
  } catch {
    return;
  }
  if (!incoming.length) return;
  if (readdirSync(to).filter((f) => f !== ".DS_Store").length) return;
  for (const file of incoming) {
    try {
      copyFileSync(join(from, file), join(to, file));
    } catch {
      // One unreadable file must not abort the rest.
    }
  }
  moved.push(`${label} (${incoming.length})`);
}

/**
 * Creates the data directories, and brings back anything a previous build
 * left in the system location. The originals are left in place.
 *
 * @returns {{root: string, reclaimed: string[]}}
 */
/** Where daily snapshots of the JSON stores go. Inside the data directory so
 *  copying the folder takes the backups with it. */
export const BACKUP_DIR = join(USER_DATA_ROOT, "backups");

/** How many days of snapshots to keep. Enough to notice a mistake and go back;
 *  short enough that this never becomes a disk problem. */
const BACKUP_KEEP_DAYS = 14;

/**
 * Takes one snapshot of the JSON stores per day, and prunes old ones.
 *
 * Corruption is quarantined rather than overwritten now, and writes are atomic,
 * but neither helps against the ordinary case: someone deletes a deck, or an
 * edit goes wrong, and wants yesterday back. Presentations are the only thing
 * in this product that cannot be regenerated — decks are hours of work and
 * exports can always be re-run — so they are what gets copied.
 *
 * Cheap enough to do at every boot: a few JSON files, once a day, skipped
 * entirely if today's snapshot already exists.
 */
export function backupUserData() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const target = join(BACKUP_DIR, today);
    if (existsSync(target)) return { created: false, path: target };

    const files = readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
    if (!files.length) return { created: false, path: null };

    mkdirSync(target, { recursive: true });
    for (const file of files) copyFileSync(join(DATA_DIR, file), join(target, file));

    // Prune by name — the directories are ISO dates, so lexical order is
    // chronological and no stat() is needed.
    const kept = readdirSync(BACKUP_DIR).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
    for (const old of kept.slice(0, Math.max(0, kept.length - BACKUP_KEEP_DAYS))) {
      rmSync(join(BACKUP_DIR, old), { recursive: true, force: true });
    }
    return { created: true, path: target, files: files.length };
  } catch (err) {
    // A failed backup must never stop the app from starting.
    return { created: false, error: err.message };
  }
}

export function ensureUserData() {
  for (const dir of [DATA_DIR, CREDENTIALS_DIR, UPLOADS_DIR, EXPORTS_DIR]) {
    mkdirSync(dir, { recursive: true });
  }
  const reclaimed = [];
  if (!OVERRIDE) {
    const legacy = legacySystemRoot();
    reclaimOnce(join(legacy, "data"), DATA_DIR, "presentations", reclaimed);
    reclaimOnce(join(legacy, "credentials"), CREDENTIALS_DIR, "credentials", reclaimed);
    reclaimOnce(join(legacy, "uploads"), UPLOADS_DIR, "uploaded images", reclaimed);
  }
  return { root: USER_DATA_ROOT, reclaimed };
}
