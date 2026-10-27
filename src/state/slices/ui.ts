import type { UiActions } from '../actions'
import type { Ctx } from '../ctx'
import { activeScope } from '../scope'

export function uiSlice(ctx: Ctx): UiActions {
  const { set } = ctx
  return {
    pushToast: ctx.toast,
    dismissToast: (id) =>
      set((s) => {
        s.sim.toasts = s.sim.toasts.filter((t) => t.id !== id)
      }),
    log: (text, entity, simulated, actor) => ctx.log(activeScope(), text, entity, simulated, actor),
    setActingAs: (personId) =>
      set((s) => {
        s.ui.actingAs = personId
      }),
    setMe: (personId) =>
      set((s) => {
        s.ui.me = personId
      }),
    setPreview: (p) =>
      set((s) => {
        Object.assign(s.ui, p)
      }),
    setSideOpen: (open) =>
      set((s) => {
        s.ui.sideOpen = open
      }),
    setCmdkOpen: (open) =>
      set((s) => {
        s.ui.cmdkOpen = open
      }),
    setSimSpeed: (sp) =>
      set((s) => {
        s.ui.simSpeed = sp
      }),
    setLastWorkspace: (w) =>
      set((s) => {
        s.ui.lastWorkspace = w
      }),
    setPresenter: (on) =>
      set((s) => {
        s.ui.presenter = on
      }),
    setMotionPaused: (paused) =>
      set((s) => {
        s.ui.motionPaused = paused
      }),
    setReturnTo: (path) =>
      set((s) => {
        s.ui.returnTo = path
      }),
  }
}
