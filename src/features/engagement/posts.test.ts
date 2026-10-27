// Engagement: the FigJam snapshot is complete and linked; a draft from a social cut keeps the cut's
// notes; the Marketing Studio command uses the studio's own script, the right mode, and survives
// quotes and dollar signs in a title.
import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { SHARED_POSTS, SNAPSHOT_POSTS, draftFromCut, studioCommands, studioId } from './posts'
import { SOCIAL_CUTS } from '@/fixtures/social-cuts'

describe('the Starter Pack posts snapshot', () => {
  it('has Nuno’s 17 posts, the article and the two ideas, each linked to its FigJam card', () => {
    expect(SNAPSHOT_POSTS).toHaveLength(20)
    expect(SNAPSHOT_POSTS.filter((p) => p.format === 'video')).toHaveLength(15)
    expect(SNAPSHOT_POSTS.filter((p) => p.format === 'idea').every((p) => p.status === 'idea' && !p.text)).toBe(true)
    for (const p of SNAPSHOT_POSTS) expect(p.figjam).toMatch(/^https:\/\/www\.figma\.com\/board\/yeiDcap30EfEY6aSa78VbX\/DS-Practice\?node-id=\d+-\d+$/)
    expect(new Set(SNAPSHOT_POSTS.map((p) => p.id)).size).toBe(20)
  })
})

describe('the posts for the Nagarro Design page', () => {
  // The main rules of Marketing Studio's check.py (evals/lib/checks.py), kept here so an edit cannot break them.
  const BANNED = ['game-changer', 'unlock', 'elevate', 'delve', 'leverage', 'landscape', 'crucial', 'pivotal', 'testament', 'showcase', 'quietly', 'vibrant', 'robust', 'seamless', 'thrilled', 'humbled', 'excited to announce']
  const NUNO = SNAPSHOT_POSTS.map((p) => p.text.toLowerCase())
  it.each(SHARED_POSTS.map((p) => [p.id, p]))('%s follows the house rules', (_id, p) => {
    expect(p.text).not.toMatch(/[\u2013\u2014]/)
    expect((p.text.match(/#\w+/g) ?? []).length).toBeLessThanOrEqual(3)
    expect(p.text.length).toBeLessThanOrEqual(1500)
    expect(p.text).not.toMatch(/https?:\/\//)
    for (const w of BANNED) expect(p.text.toLowerCase()).not.toContain(w)
    expect(p.text).not.toMatch(/\bcolor\b|\boptimiz|\borganiz/i)
    expect(p.text).not.toMatch(/ASSA|ABLOY|Yale|Jane/)
    expect(p.text.trim().endsWith('?') || /\?\n\n#/.test(p.text)).toBe(true)
    // never one of Nuno's lines: the two series go out on the same page
    for (const line of p.text.split(/(?<=[.?])\s+/).filter((l) => l.length > 30)) for (const n of NUNO) expect(n).not.toContain(line.toLowerCase())
    expect(p.cutId && p.notes.length > 40).toBeTruthy()
  })
})

describe('a draft from a social cut', () => {
  it('starts from the hook, lists what the clip shows, keeps the notes and links back', () => {
    const cut = SOCIAL_CUTS.find((c) => c.id === 'a-fix-travels')!
    const d = draftFromCut(cut)
    expect(d.text.startsWith(cut.hook)).toBe(true)
    expect(d.text).toContain('In the clip:')
    expect(d).toMatchObject({ notes: cut.notes, cutId: cut.id, surface: 'company', status: 'draft', format: 'video' })
  })
})

describe('sending to Marketing Studio', () => {
  it('uses new_idea.py with the nagarro mode for the company page and personal for own accounts', () => {
    const c = studioCommands({ title: 'Drift has a number', text: 'Post', notes: 'Facts', surface: 'company' }, '~/Claude/marketing-studio')
    expect(c.id).toBe('nd-drift-has-a-number')
    expect(c.shell).toContain('python3 scripts/new_idea.py nd-drift-has-a-number --title "Drift has a number" --mode nagarro --surfaces linkedin')
    expect(c.claude).toBe('/marketeer:write-social-post nd-drift-has-a-number')
    expect(studioCommands({ title: 'x', text: '', notes: '', surface: 'personal' }, '/tmp').shell).toContain('--mode personal')
  })

  it('keeps titles with quotes and dollar signs intact in the shell', () => {
    const title = 'Say "no" to $5 hex codes `now`'
    const c = studioCommands({ title, text: 'Body with $HOME and "quotes"', notes: '', surface: 'company' }, '/tmp')
    const line = c.shell.split('\n')[1]
    const titleArg = line.match(/--title (".*?[^\\]")/)![1]
    expect(execFileSync('bash', ['-c', `printf %s ${titleArg}`]).toString()).toBe(title)
    // the body is a quoted heredoc: nothing in it is expanded
    expect(c.shell).toContain("<<'POST_BODY'\nBody with $HOME and \"quotes\"")
    expect(studioId(title)).toBe('nd-say-no-to-5-hex-codes-now')
  })

  it('lets ~ expand in the folder and quotes the rest', () => {
    const home = studioCommands({ title: 'x', text: '', notes: '', surface: 'company' }, '~/Claude/marketing studio').shell.split('\n')[0]
    expect(home).toBe('cd ~/"Claude/marketing studio"')
    expect(execFileSync('bash', ['-c', `${home.replace('cd ', 'printf %s ')}`], { env: { HOME: '/Users/x' } }).toString()).toBe('/Users/x/Claude/marketing studio')
  })
})
