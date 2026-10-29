// test/helpers/server.js
// =============================================================================
// Boots a real server on a free port with its own throwaway data directory, so
// tests exercise the actual HTTP stack without ever touching someone's work.
//
// NPS_DATA_DIR is the same override the app already supports, so nothing here
// is a test-only code path in the server itself.
// =============================================================================
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** An OS-assigned free port, so parallel test files never collide. */
function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

/**
 * Starts the server and resolves once it answers. Always pair with stop().
 *
 * @param {{env?: Record<string,string>}} [options]
 * @returns {Promise<{origin: string, port: number, dataDir: string, stop: () => Promise<void>}>}
 */
export async function startTestServer({ env = {} } = {}) {
  const port = await freePort();
  const dataDir = mkdtempSync(join(tmpdir(), "nps-test-"));

  const child = spawn(process.execPath, [join(REPO_ROOT, "product", "application", "server.js")], {
    cwd: REPO_ROOT,
    env: { ...process.env, PORT: String(port), NPS_DATA_DIR: dataDir, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const logs = [];
  child.stdout.on("data", (d) => logs.push(String(d)));
  child.stderr.on("data", (d) => logs.push(String(d)));

  const origin = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 20_000;
  for (;;) {
    if (child.exitCode !== null) {
      throw new Error(`Server exited early (code ${child.exitCode}):\n${logs.join("")}`);
    }
    try {
      await fetch(`${origin}/api/presentations`);
      break;
    } catch {
      if (Date.now() > deadline) throw new Error(`Server did not start in 20s:\n${logs.join("")}`);
      await new Promise((r) => setTimeout(r, 120));
    }
  }

  return {
    origin,
    port,
    dataDir,
    logs,
    async stop() {
      child.kill("SIGTERM");
      await new Promise((r) => child.once("exit", r));
      rmSync(dataDir, { recursive: true, force: true });
    },
  };
}
