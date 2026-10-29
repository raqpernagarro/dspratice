#!/usr/bin/env node
/**
 * Verify derived .claude/commands/*.md matches skills/<command>/SKILL.md
 *
 * Run after sync:skills (or npm install, which runs prepare → sync:skills).
 *
 * Usage:
 *   node scripts/check-skills.mjs
 *   npm run check:skills
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SKILLS_DIR = join(ROOT, 'skills');
const COMMANDS_DIR = join(ROOT, '.claude', 'commands');

function discoverSkills() {
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
  if (!statSync(SKILLS_DIR, { throwIfNoEntry: false })?.isDirectory()) {
    console.error('❌ skills/ directory is missing');
    process.exit(1);
  }

  const skills = discoverSkills();
  if (skills.length === 0) {
    console.error('❌ No skills/<command>/SKILL.md files found');
    process.exit(1);
  }

  const stale = [];

  for (const skill of skills) {
    const source = readFileSync(skill.sourcePath, 'utf8');
    if (!existsSync(skill.targetPath)) {
      stale.push(`${skill.commandName}: missing derived file (run npm run sync:skills)`);
      continue;
    }
    const derived = readFileSync(skill.targetPath, 'utf8');
    if (source !== derived) {
      stale.push(`${skill.commandName}: out of sync with skills/${skill.commandName}/SKILL.md`);
    }
  }

  if (stale.length > 0) {
    console.error('❌ Agent skill commands are out of sync:\n');
    for (const line of stale) {
      console.error(`  - ${line}`);
    }
    console.error('\nRun: npm run sync:skills');
    process.exit(1);
  }

  console.log(`✅ ${skills.length} skill command(s) in sync with skills/`);
  process.exit(0);
}

main();
