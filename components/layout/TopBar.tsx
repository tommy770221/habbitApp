"use client"

import Link from "next/link"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Profile, UserGamification } from "@/types"
import { getLevelDefinition } from "@/types"

interface TopBarProps {
  profile: Profile | null
  gamification: UserGamification | null
}

export function TopBar({ profile, gamification }: TopBarProps) {
  const level = gamification?.current_level ?? 1
  const levelDef = getLevelDefinition(level)
  const initials = profile?.display_name?.slice(0, 2).toUpperCase() ?? "??"

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/profile" className="flex items-center gap-3">
          <Avatar className="w-9 h-9">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-green-100 text-green-700 text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              {profile?.display_name ?? "使用者"}
            </p>
            <p className="text-xs text-gray-500 leading-tight">
              {levelDef.icon} Lv.{level} {levelDef.title}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {gamification && (
            <div className="flex items-center gap-1 bg-green-50 rounded-full px-3 py-1">
              <span className="text-sm font-bold text-green-700">{gamification.total_xp.toLocaleString()}</span>
              <span className="text-xs text-green-600">XP</span>
            </div>
          )}
          {gamification && gamification.current_streak > 0 && (
            <div className="flex items-center gap-1 bg-orange-50 rounded-full px-3 py-1">
              <span className="text-sm">🔥</span>
              <span className="text-sm font-bold text-orange-700">{gamification.current_streak}</span>
            </div>
          )}
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/profile">
              <Bell className="w-5 h-5 text-gray-500" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
