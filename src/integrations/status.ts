// Integration status, fetched once from the local server and on demand ("Check again").
// Kept out of the persisted store: it describes this machine, not the user's data.

import { create } from 'zustand'
import { getStatus, OFFLINE_STATUS, type IntegrationStatus } from './api'

interface StatusState { status: IntegrationStatus; checkedAt: number | null; loading: boolean; refresh: () => Promise<IntegrationStatus> }

export const useIntegrationStatus = create<StatusState>()((set) => ({
  status: { ...OFFLINE_STATUS, offline: false },
  checkedAt: null,
  loading: false,
  refresh: async () => {
    set({ loading: true })
    const status = await getStatus()
    set({ status, checkedAt: Date.now(), loading: false })
    return status
  },
}))

export function useIntegrations() {
  return useIntegrationStatus((s) => s.status)
}

export function integrations() {
  return useIntegrationStatus.getState().status
}
