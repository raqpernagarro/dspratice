import { describe, expect, it } from 'vitest'

import { currentVersion, makeProjectFile, nextVersion, versionAfter, parseProjectFile, projectFileName } from './project-file'
import { DEFAULT_THEME_CONFIG } from './theme-config'

describe('project file', () => {
  it('round-trips a project', () => {
    const file = makeProjectFile({ name: 'Acme Insights', description: '', appType: 'admin', githubUrl: '', figmaUrl: '', color: '#60a5fa' }, { ...DEFAULT_THEME_CONFIG, radius: 12 })
    const back = parseProjectFile(JSON.stringify(file))
    expect(back.project.name).toBe('Acme Insights')
    expect(back.theme.radius).toBe(12)
  })

  it('rejects other JSON with a plain message', () => {
    expect(() => parseProjectFile('{"format":"something-else"}')).toThrow(/not a DS Configurator project file/)
  })

  it('rejects files from a newer version', () => {
    expect(() => parseProjectFile({ format: 'ds-configurator/project', version: 99 })).toThrow(/newer version/)
  })

  it('fills gaps and drops invalid values', () => {
    const back = parseProjectFile({ format: 'ds-configurator/project', version: 1, project: { name: '  ', appType: 'spaceship', color: 'red' }, theme: { radius: 'big' } })
    expect(back.project).toMatchObject({ name: 'Untitled project', appType: 'dashboard', color: '#8b7cff' })
    expect(back.theme.radius).toBeNull()
  })

  it('names files after the project', () => {
    expect(projectFileName('Acme Insights!')).toBe('acme-insights.dsproject.json')
  })

  it('keeps written pages and versions, and drops broken entries', () => {
    const back = parseProjectFile({
      format: 'ds-configurator/project',
      version: 1,
      pages: { voice: '# Voice', broken: 42 },
      versions: [{ version: '1.1', note: 'Docs', date: '2026-10-18' }, { note: 'no version' }, 'nope'],
    })
    expect(back.pages).toEqual({ voice: '# Voice' })
    expect(back.versions).toEqual([{ version: '1.1', note: 'Docs', date: '2026-10-18' }])
  })

  it('older files without pages or versions still open', () => {
    const back = parseProjectFile({ format: 'ds-configurator/project', version: 1 })
    expect(back.pages).toEqual({})
    expect(back.versions).toEqual([])
  })

  it('numbers versions', () => {
    expect(currentVersion([])).toBe('1.0')
    expect(currentVersion([{ version: '1.3', note: '', date: '' }, { version: '1.2', note: '', date: '' }])).toBe('1.3')
    expect(nextVersion('1.0')).toBe('1.1')
    expect(nextVersion('1.9')).toBe('1.10')
    expect(nextVersion('2')).toBe('2.1')
    expect(nextVersion('garbage')).toBe('1.1')
    expect(versionAfter([])).toBe('1.0')
    expect(versionAfter([{ version: '1.4', note: '', date: '' }])).toBe('1.5')
  })
})
