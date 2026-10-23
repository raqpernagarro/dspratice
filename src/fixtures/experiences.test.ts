// The tool catalog: every experience points at a known server, every server names its owner, how
// it starts and what it writes (the reason it runs from a copy).
import { describe, expect, it } from 'vitest'
import { EXPERIENCES, TOOL_SERVERS, defaultAddress, serverOf, startCommand } from './experiences'

describe('tool catalog', () => {
  it('has unique ids and complete servers', () => {
    expect(new Set(EXPERIENCES.map((e) => e.id)).size).toBe(EXPERIENCES.length)
    expect(new Set(TOOL_SERVERS.map((s) => s.port)).size).toBe(TOOL_SERVERS.length)
    for (const s of TOOL_SERVERS) {
      expect(s.owner).toBeTruthy()
      expect(s.version).toBeTruthy()
      expect(s.start.length).toBeGreaterThan(0)
      expect(s.writes.length).toBeGreaterThan(0)
      expect(s.probe.startsWith('/')).toBe(true)
      expect(defaultAddress(s)).toBe(`http://localhost:${s.port}`)
    }
  })

  it('points every experience at a server, with a path and what you get', () => {
    for (const e of EXPERIENCES) {
      expect(serverOf(e)).toBeDefined()
      expect(e.path.startsWith('/')).toBe(true)
      expect(e.what && e.get).toBeTruthy()
    }
    expect(startCommand('dsn')).toBe('npm run tools -- start dsn')
  })
})
