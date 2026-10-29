/**
 * Puts the configurator back to the starter system (the Base UI look), from the terminal.
 *
 *   npm run ds:reset              reset everything
 *   npm run ds:reset -- --force   also when ds.project.json is committed to git
 *
 * 1. Deletes ds.project.json: the saved system and every version in it. There is no backup.
 * 2. Deletes old local builds of the docs site and the editor, so nothing shows the old system.
 * 3. Writes .ds-reset. The editor's dev server sees it and reloads every open editor, which then
 *    forgets what it saved in the browser (unsaved changes, the theme copy, imported Figma
 *    variables). The agent's API key is kept.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const projectFile = path.join(root, 'ds.project.json')
const force = process.argv.includes('--force')
const lines = []

// The stamp goes first: deleting ds.project.json reloads open editors, and they must see the new
// stamp then to forget their unsaved changes.
let stamped = false
function writeStamp() {
  if (stamped) return
  fs.writeFileSync(path.join(root, '.ds-reset'), JSON.stringify({ stamp: new Date().toISOString() }) + '\n')
  stamped = true
}

if (fs.existsSync(projectFile)) {
  let tracked = false
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', 'ds.project.json'], { cwd: root, stdio: 'ignore' })
    tracked = true
  } catch {
    // Not in git: a local experiment.
  }
  if (tracked && !force) {
    console.error(
      [
        'ds.project.json is committed: it is this repo’s design system, not an experiment.',
        'Nothing was changed. To reset anyway, run:  npm run ds:reset -- --force',
        '(Then commit the removal if the repo should go back to the starter system.)',
      ].join('\n'),
    )
    process.exit(1)
  }
  let name = 'the saved system'
  let versions = 0
  try {
    const file = JSON.parse(fs.readFileSync(projectFile, 'utf8'))
    name = `“${file.project?.name ?? 'Untitled'}”`
    versions = Array.isArray(file.versions) ? file.versions.length : 0
  } catch {
    // Unreadable file: deleted all the same.
  }
  writeStamp()
  fs.rmSync(projectFile)
  lines.push(`Deleted ${name} and its ${versions} version${versions === 1 ? '' : 's'} (ds.project.json).`)
} else {
  lines.push('No saved system (ds.project.json) to delete.')
}

writeStamp()

// Backups from earlier resets, and local builds that still show the old system.
for (const dir of ['.ds-backups', 'semantic-editor/dist-docs', 'semantic-editor/dist']) {
  const full = path.join(root, dir)
  if (!fs.existsSync(full)) continue
  fs.rmSync(full, { recursive: true, force: true })
  lines.push(`Deleted ${dir}/.`)
}

lines.push(
  'Open editors reload on the starter system (the Base UI look) and forget their unsaved changes.',
  'An editor that isn’t open forgets them the next time it starts.',
  'Kept: your agent settings (API key, model).',
)
console.log(lines.join('\n'))
