#!/usr/bin/env node
/**
 * Sync versioned agent skills from skills/<command>/SKILL.md
 * to derived Claude/Cursor command files at .claude/commands/<command>.md
 *
 * Source of truth: skills/ (tracked in git)
 * Derived: .claude/commands/ (gitignored; regenerated locally)
 *
 * Usage:
 *   node scripts/sync-skills.mjs
 *   npm run sync:skills
 */

import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SKILLS_DIR = join(ROOT, 'skills');
const COMMANDS_DIR = join(ROOT, '.claude', 'commands');

function discoverSkills() {
  if (!statSync(SKILLS_DIR, { throwIfNoEntry: false })?.isDirectory()) {
    return [];
  }

  return readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const commandName = entry.name;
      const sourcePath = join(SKILLS_DIR, commandName, 'SKILL.md');
      if (!statSync(sourcePath, { throwIfNoEntry: false })?.isFile()) {
        return null;
      }
      return {
        commandName,
        sourcePath,
        targetPath: join(COMMANDS_DIR, `${commandName}.md`),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.commandName.localeCompare(b.commandName));
}

function main() {
  const skills = discoverSkills();

  if (skills.length === 0) {
    console.error('❌ No skills found under skills/<command>/SKILL.md');
    process.exit(1);
  }

  mkdirSync(COMMANDS_DIR, { recursive: true });

  let synced = 0;
  for (const skill of skills) {
    const content = readFileSync(skill.sourcePath, 'utf8');
    writeFileSync(skill.targetPath, content, 'utf8');
    synced += 1;
    console.log(`  ✓ ${skill.commandName} → .claude/commands/${skill.commandName}.md`);
  }

  console.log(`\n✅ Synced ${synced} skill(s) to .claude/commands/`);
}

main();
