// The calendar folds Marketing Studio's statuses into TryPost's three, and only images become thumbnails.
import { describe, expect, it } from 'vitest'
import { toItem } from './Calendar'
import type { StudioPost } from '@/integrations/api'

const base: StudioPost = { id: 'p', person: 'Hugo', folder: 1, workspace: 'brands/hugo', title: 'T', status: 'draft', surface: 'linkedin', format: 'text', scheduledDate: null, postedAt: null, firstComment: '', assets: [], body: '', file: 'brands/hugo/content/p.md' }

describe('calendar items', () => {
  it('maps statuses to Draft, Planned and Published', () => {
    expect(toItem(base).state).toBe('draft')
    expect(toItem({ ...base, status: 'approved', scheduledDate: '2026-11-03T08:30:00+00:00' })).toMatchObject({ state: 'planned' })
    expect(toItem({ ...base, status: 'scheduled', scheduledDate: '2026-11-03T08:30:00+00:00' }).date?.toISOString()).toBe('2026-11-03T08:30:00.000Z')
    expect(toItem({ ...base, status: 'published' }).state).toBe('published')
    expect(toItem({ ...base, status: 'approved', postedAt: '2026-10-20T10:00:00+01:00' }).state).toBe('published')
    expect(toItem({ ...base, scheduledDate: 'not a date' }).state).toBe('draft')
  })
  it('uses the first image as the thumbnail, served from its folder', () => {
    expect(toItem({ ...base, assets: ['assets/p/clip.webm', 'assets/p/cover.png'] }).thumb).toBe('/api/engagement/asset?f=1&w=brands%2Fhugo&p=assets%2Fp%2Fcover.png')
    expect(toItem({ ...base, assets: ['assets/p/clip.webm'] }).thumb).toBeUndefined()
  })
})
