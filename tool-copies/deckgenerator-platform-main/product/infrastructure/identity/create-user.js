#!/usr/bin/env node
// =============================================================================
// Bootstrap CLI — Milestone M4 (Decision D, resolving AUDIT-M4-03).
//
// No registration endpoint exists anywhere in Phase 2.5 §05, and adding one
// would be an unauthenticated user-creation route, which Phase 4 §12
// Rule 29 forbids. Users are therefore created out-of-band, here.
//
// Run: npm run auth:create-user
//
// The password is read from BOOTSTRAP_PASSWORD or prompted for
// interactively — never from a command-line argument, which would be
// recorded in shell history and visible in the process list.
//
// If no Workspace exists yet, one is created and the first user is made an
// admin (a workspace with no admin could never be administered). Otherwise
// the user joins the existing workspace with the role given.
// =============================================================================
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { workspaceRepository, ROLES } from "../../storage/workspace-repository.js";
import { localIdentityProvider } from "./local-identity-provider.js";

async function prompt(question, { silent = false } = {}) {
  const rl = createInterface({ input: stdin, output: stdout, terminal: true });
  if (!silent) {
    const answer = await rl.question(question);
    rl.close();
    return answer.trim();
  }
  // Suppress echo for the password.
  const onData = (char) => {
    if (["\n", "\r", ""].includes(char.toString())) return;
    stdout.write("\x1b[2K\x1b[200D" + question + "*".repeat(rl.line.length));
  };
  stdin.on("data", onData);
  const answer = await rl.question(question);
  stdin.off("data", onData);
  rl.close();
  stdout.write("\n");
  return answer;
}

async function main() {
  const email = process.env.BOOTSTRAP_EMAIL || (await prompt("Email: "));
  if (!email) throw new Error("An email is required.");

  if (await workspaceRepository.findUserByEmail(email)) {
    throw new Error(`A user with email ${email} already exists.`);
  }

  const name = process.env.BOOTSTRAP_NAME || (await prompt("Display name (optional): "));

  let workspace = await workspaceRepository.findAnyWorkspace();
  let role;
  if (!workspace) {
    const workspaceName = process.env.BOOTSTRAP_WORKSPACE || (await prompt("Workspace name: "));
    if (!workspaceName) throw new Error("A workspace name is required for the first user.");
    workspace = await workspaceRepository.insert({ name: workspaceName });
    role = "admin";
    console.log(`\nCreated workspace "${workspace.name}". First user will be an admin.`);
  } else {
    const requested = process.env.BOOTSTRAP_ROLE || (await prompt(`Role (${ROLES.join(" | ")}): `));
    role = requested || "member";
    if (!ROLES.includes(role)) throw new Error(`Role must be one of: ${ROLES.join(", ")}.`);
  }

  const password = process.env.BOOTSTRAP_PASSWORD || (await prompt("Password: ", { silent: true }));
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const user = await workspaceRepository.addMember({ name, email, role, workspaceId: workspace.id });
  await localIdentityProvider.setCredential(email, password);

  console.log(`\nCreated user ${user.email} (${user.role}) in workspace "${workspace.name}".`);
  console.log("Credential stored separately from the user profile.\n");
}

main().catch((err) => {
  console.error(`\nCould not create the user: ${err.message}\n`);
  process.exit(1);
});
