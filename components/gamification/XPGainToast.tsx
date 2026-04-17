"use client"

import { toast } from "sonner"

export function showXPGain(xp: number, label?: string) {
  toast.success(`+${xp} XP`, {
    description: label,
    duration: 2500,
    icon: "⚡",
  })
}

export function showLevelUp(newLevel: number, title: string) {
  toast.success(`升級！Lv.${newLevel} ${title}`, {
    description: "恭喜達到新等級！繼續保持！",
    duration: 5000,
    icon: "🎉",
  })
}

export function showBadgeUnlocked(badgeName: string, icon: string) {
  toast.success(`解鎖成就：${badgeName}`, {
    description: "新徽章已加入您的成就收藏",
    duration: 4000,
    icon,
  })
}
