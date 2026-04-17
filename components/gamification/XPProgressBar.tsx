"use client"

import { Progress } from "@/components/ui/progress"
import { getLevelDefinition, getLevelFromXP, getXPProgress, LEVEL_DEFINITIONS } from "@/types"
import { cn } from "@/lib/utils"

interface XPProgressBarProps {
  totalXP: number
  currentLevel: number
  compact?: boolean
}

export function XPProgressBar({ totalXP, currentLevel, compact = false }: XPProgressBarProps) {
  const levelDef = getLevelDefinition(currentLevel)
  const progress = getXPProgress(totalXP, currentLevel)
  const isMaxLevel = currentLevel >= 10

  const xpInCurrentLevel = totalXP - levelDef.min_xp
  const xpNeeded = isMaxLevel ? 0 : levelDef.max_xp - levelDef.min_xp + 1

  if (compact) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className={cn("font-semibold", levelDef.colorClass)}>
            {levelDef.icon} Lv.{currentLevel} {levelDef.title}
          </span>
          {!isMaxLevel && (
            <span className="text-gray-500">{xpInCurrentLevel}/{xpNeeded} XP</span>
          )}
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{levelDef.icon}</span>
          <div>
            <p className={cn("font-bold text-base leading-tight", levelDef.colorClass)}>
              Lv.{currentLevel} {levelDef.title}
            </p>
            <p className="text-xs text-gray-500">
              {isMaxLevel ? "已達最高等級" : `距下一等 ${getLevelDefinition(currentLevel + 1).title}`}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg text-gray-900">{totalXP.toLocaleString()}</p>
          <p className="text-xs text-gray-500">總 XP</p>
        </div>
      </div>
      <Progress value={progress} className="h-3" />
      {!isMaxLevel && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>{xpInCurrentLevel.toLocaleString()} XP</span>
          <span>{xpNeeded.toLocaleString()} XP</span>
        </div>
      )}
    </div>
  )
}
