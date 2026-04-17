"use client"

import { create } from "zustand"

interface PendingXPGain {
  id: string
  amount: number
  label: string
}

interface GamificationStore {
  pendingLevelUp: { newLevel: number; title: string } | null
  recentXPGains: PendingXPGain[]
  setPendingLevelUp: (data: { newLevel: number; title: string } | null) => void
  addXPGain: (amount: number, label: string) => void
  clearXPGain: (id: string) => void
  clearLevelUp: () => void
}

export const useGamificationStore = create<GamificationStore>((set) => ({
  pendingLevelUp: null,
  recentXPGains: [],
  setPendingLevelUp: (data) => set({ pendingLevelUp: data }),
  addXPGain: (amount, label) =>
    set((state) => ({
      recentXPGains: [
        ...state.recentXPGains,
        { id: Math.random().toString(36).slice(2), amount, label },
      ],
    })),
  clearXPGain: (id) =>
    set((state) => ({
      recentXPGains: state.recentXPGains.filter((g) => g.id !== id),
    })),
  clearLevelUp: () => set({ pendingLevelUp: null }),
}))
