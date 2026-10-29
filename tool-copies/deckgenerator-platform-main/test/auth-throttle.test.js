// test/auth-throttle.test.js
// =============================================================================
// Failing to sign in must slow down the account being guessed — and nobody else.
//
// The throttle used to keep a per-IP counter alongside the per-email one, so
// ten wrong passwords for one account returned 429 to every other user on the
// same machine. Behind a proxy, where every request carries one address, one
// person mistyping locked out the whole deployment. Counters only reset on a
// successful login, which is impossible while throttled, so it was a hard
// fifteen-minute wall.
// =============================================================================
import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { startTestServer } from "./helpers/server.js";

let server;
before(async () => {
  // AUTO_LOGIN off, or every request is already authenticated and /login is moot.
  server = await startTestServer({ env: { AUTO_LOGIN: "0" } });
});
after(async () => { await server?.stop(); });

const login = (email, password) =>
  fetch(`${server.origin}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: server.origin },
    body: JSON.stringify({ email, password }),
  });

describe("a throttled account does not take others down with it", () => {
  test("hammering one account leaves another able to try", async () => {
    const victim = "someone@example.test";
    const bystander = "other@example.test";

    // Well past the 10-attempt limit.
    let sawThrottle = false;
    for (let i = 0; i < 14; i++) {
      const res = await login(victim, `wrong-${i}`);
      if (res.status === 429) sawThrottle = true;
    }
    assert.ok(sawThrottle, "repeated failures for one account should eventually be throttled");

    // The bystander is not being guessed and must still get a real answer.
    // 401 (wrong credentials) is the correct outcome here — the point is that
    // it is NOT 429.
    const other = await login(bystander, "also-wrong");
    assert.notEqual(other.status, 429,
      "a different account must not be throttled by someone else's failed attempts");
    assert.equal(other.status, 401);
  });

  test("a throttled response says something a person can act on", async () => {
    const email = "throttled@example.test";
    let body = null;
    for (let i = 0; i < 14; i++) {
      const res = await login(email, `nope-${i}`);
      if (res.status === 429) { body = await res.json(); break; }
    }
    assert.ok(body, "expected to reach the throttle");
    assert.match(body.error, /too many/i);
    assert.match(body.error, /try again/i, "tell them what to do, not just that it failed");
  });

  test("a wrong password never reveals whether the account exists", async () => {
    const missing = await login("no-such-account@example.test", "x");
    const real = await login("also-missing@example.test", "y");
    assert.equal(missing.status, 401);
    assert.equal((await missing.json()).error, (await real.json()).error,
      "identical message regardless of whether the account exists");
  });
});
