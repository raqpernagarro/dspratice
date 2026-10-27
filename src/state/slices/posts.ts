// Posts drafted in the workspace (Engagement). Practice-wide, not per project. Nothing here posts
// anywhere: Marketing Studio drafts and schedules, and a person posts by hand.

import type { PostActions } from '../actions'
import type { Ctx } from '../ctx'
import { uid } from '../sim'

export function postsSlice(ctx: Ctx): PostActions {
  const { set } = ctx
  return {
    addPost: (post) => {
      const id = uid('post')
      const now = ctx.now()
      set((s) => {
        ;(s.practice.posts ??= []).unshift({ ...post, id, createdAt: now, updatedAt: now })
      })
      return id
    },
    updatePost: (id, patch) =>
      set((s) => {
        const p = s.practice.posts?.find((x) => x.id === id)
        if (p) Object.assign(p, patch, { updatedAt: ctx.now() })
      }),
    deletePost: (id) =>
      set((s) => {
        s.practice.posts = (s.practice.posts ?? []).filter((x) => x.id !== id)
      }),
  }
}
