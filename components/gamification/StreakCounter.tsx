"use client"

import { cn } from "@/lib/utils"

interface StreakCounterProps {
  streak: number
  shields?: number
  compact?: boolean
}

export function StreakCounter({ streak, shields = 0, compact = false }: StreakCounterProps) {
  const getStreakColor = (n: number) => {
    if (n >= 30) return "text-purple-600 bg-purple-50"
    if (n >= 14) return "text-orange-600 bg-orange-50"
    if (n >= 7) return "text-yellow-600 bg-yellow-50"
    if (n >= 3) return "text-green-600 bg-green-50"
    return "text-gray-600 bg-gray-50"
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1 rounded-full px-3 py-1", getStreakColor(streak))}>
        <span className="text-base">🔥</span>
        <span className="font-bold text-sm">{streak}</span>
        <span className="text-xs opacity-75">天</span>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className={cn("inline-flex flex-col items-center gap-1 rounded-2xl px-6 py-4", getStreakColor(streak))}>
        <span className="text-4xl">🔥</span>
        <span className="text-4xl font-black">{streak}</span>
        <span className="text-sm font-medium opacity-75">連續天數</span>
        {shields > 0 && (
          <div className="flex items-center gap-1 mt-1 bg-white/50 rounded-full px-2 py-0.5">
            <span className="text-xs">🛡️</span>
            <span className="text-xs font-medium">×{shields} 保護盾</span>
          </div>
        )}
      </div>
    </div>
  )
}
