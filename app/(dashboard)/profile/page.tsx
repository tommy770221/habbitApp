import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { XPProgressBar } from "@/components/gamification/XPProgressBar"
import { StreakCounter } from "@/components/gamification/StreakCounter"
import { HabitStreakCalendar } from "@/components/habits/HabitStreakCalendar"
import { getLevelDefinition } from "@/types"
import { toLocaleDateString } from "@/lib/utils"
import { LogOut, Settings } from "lucide-react"
import type { HabitCheckin } from "@/types"
import Link from "next/link"
import { SignOutButton } from "./SignOutButton"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const since = new Date()
  since.setDate(since.getDate() - 90)

  const [profileResult, gamificationResult, badgesResult, calendarResult, recentXPResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("user_gamification").select("*").eq("user_id", user.id).single(),
    supabase.from("user_badges")
      .select("*, badge:badge_definitions(*)")
      .eq("user_id", user.id)
      .order("unlocked_at", { ascending: false })
      .limit(6),
    supabase.from("habit_checkins")
      .select("checkin_date,habit_type")
      .eq("user_id", user.id)
      .gte("checkin_date", toLocaleDateString(since)),
    supabase.from("xp_transactions")
      .select("xp_amount,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  const profile = profileResult.data
  const gamification = gamificationResult.data
  const badges = badgesResult.data ?? []
  const calendarCheckins = (calendarResult.data ?? []) as HabitCheckin[]
  const recentXP = recentXPResult.data ?? []

  if (!profile || !gamification) redirect("/login")

  const levelDef = getLevelDefinition(gamification.current_level)
  const conditions = [
    { label: "高血壓", active: profile.has_hypertension, emoji: "💓" },
    { label: "高血糖", active: profile.has_diabetes, emoji: "🩸" },
    { label: "高血脂", active: profile.has_hyperlipidemia, emoji: "🫀" },
  ].filter((c) => c.active)

  return (
    <div className="p-4 space-y-5">
      {/* Profile header */}
      <Card className="bg-gradient-to-br from-green-500 to-teal-600 text-white border-0">
        <CardContent className="pt-6 pb-5">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-16 h-16 border-2 border-white/50">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                {profile.display_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{profile.display_name}</h2>
              <p className="text-white/80 text-sm">{user.email}</p>
              {conditions.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {conditions.map((c) => (
                    <span key={c.label} className="text-xs bg-white/20 rounded-full px-2 py-0.5">
                      {c.emoji} {c.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <XPProgressBar
              totalXP={gamification.total_xp}
              currentLevel={gamification.current_level}
              compact
            />
          </div>
        </CardContent>
      </Card>

      {/* Streak */}
      <div className="flex gap-3">
        <Card className="flex-1">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-gray-500 mb-1">連續打卡</p>
            <p className="text-3xl font-black text-orange-600">🔥 {gamification.current_streak}</p>
            <p className="text-xs text-gray-400">最高 {gamification.longest_streak} 天</p>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-gray-500 mb-1">保護盾</p>
            <p className="text-3xl font-black text-blue-600">🛡️ {gamification.streak_shield_count}</p>
            <p className="text-xs text-gray-400">防止 streak 中斷</p>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-gray-500 mb-1">成就徽章</p>
            <p className="text-3xl font-black text-purple-600">🏅 {badges.length}</p>
            <p className="text-xs text-gray-400">已解鎖</p>
          </CardContent>
        </Card>
      </div>

      {/* 90-day calendar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-700">近90天打卡紀錄</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <HabitStreakCalendar checkins={calendarCheckins} weeks={13} />
        </CardContent>
      </Card>

      {/* Recent badges */}
      {badges.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-gray-700">最近解鎖徽章</CardTitle>
              <Link href="/achievements" className="text-xs text-green-600">查看全部</Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {badges.map((ub) => (
                <div key={ub.id} className="flex flex-col items-center gap-1 shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-teal-50 border border-green-200 flex items-center justify-center text-2xl">
                    {(ub as any).badge?.icon_url ?? "🏅"}
                  </div>
                  <p className="text-xs text-gray-600 text-center w-12 truncate">{(ub as any).badge?.name ?? ""}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent XP */}
      {recentXP.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">最近 XP 記錄</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentXP.slice(0, 5).map((t, i) => (
                <div key={i} className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {new Date(t.created_at).toLocaleDateString("zh-TW", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <span className="text-sm font-semibold text-green-600">+{t.xp_amount} XP</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sign out */}
      <SignOutButton />
    </div>
  )
}
