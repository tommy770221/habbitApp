import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BADGE_RARITY_CONFIG } from "@/types"
import { cn } from "@/lib/utils"
import type { BadgeDefinition, UserBadge } from "@/types"

export default async function AchievementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [allBadgesResult, userBadgesResult] = await Promise.all([
    supabase.from("badge_definitions").select("*").order("sort_order"),
    supabase.from("user_badges").select("badge_id, unlocked_at").eq("user_id", user.id),
  ])

  const allBadges = (allBadgesResult.data ?? []) as BadgeDefinition[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawUserBadges = (userBadgesResult.data ?? []) as any[]
  const unlockedIds = new Set(rawUserBadges.map((b) => b.badge_id as string))
  const unlockedDates: Record<string, string> = {}
  for (const ub of rawUserBadges) {
    unlockedDates[ub.badge_id] = ub.unlocked_at
  }

  const unlockedCount = unlockedIds.size
  const totalCount = allBadges.length

  const categoryLabels: Record<string, string> = {
    milestone: "里程碑",
    streak: "連續打卡",
    metrics: "健康數據",
    habits: "習慣養成",
    social: "社交",
    special: "特殊",
  }

  const grouped = allBadges.reduce<Record<string, BadgeDefinition[]>>((acc, badge) => {
    const cat = badge.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(badge)
    return acc
  }, {})

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">成就徽章</h1>
        <span className="text-sm text-gray-500">{unlockedCount}/{totalCount} 已解鎖</span>
      </div>

      {/* Overall progress */}
      <Card className="bg-gradient-to-r from-purple-50 to-yellow-50 border-purple-200">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">收藏進度</p>
            <p className="text-sm font-bold text-purple-700">{Math.round((unlockedCount / totalCount) * 100)}%</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-purple-500 to-yellow-500 h-2.5 rounded-full transition-all"
              style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Rarity legend */}
      <div className="flex gap-2 flex-wrap">
        {(["common", "rare", "epic", "legendary"] as const).map((rarity) => {
          const config = BADGE_RARITY_CONFIG[rarity]
          return (
            <div key={rarity} className={cn("flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1 border", config.borderClass, config.textClass)}>
              {config.label}
            </div>
          )
        })}
      </div>

      {/* Badge groups by category */}
      {Object.entries(grouped).map(([category, badges]) => (
        <div key={category}>
          <h2 className="text-sm font-semibold text-gray-600 mb-3">{categoryLabels[category] ?? category}</h2>
          <div className="grid grid-cols-3 gap-3">
            {badges.map((badge) => {
              const isUnlocked = unlockedIds.has(badge.id)
              const rarityConfig = BADGE_RARITY_CONFIG[badge.rarity]
              const unlockDate = unlockedDates[badge.id]

              return (
                <div
                  key={badge.id}
                  className={cn(
                    "rounded-2xl border-2 p-3 flex flex-col items-center gap-1.5 transition-all",
                    isUnlocked
                      ? cn("bg-white shadow-sm", rarityConfig.borderClass,
                          badge.rarity !== "common" && cn("shadow", rarityConfig.glowClass))
                      : "bg-gray-50 border-gray-200 opacity-50 grayscale"
                  )}
                >
                  <div className="text-3xl">{badge.icon_url || "🏅"}</div>
                  <p className={cn("text-xs font-semibold text-center leading-tight", isUnlocked ? "text-gray-800" : "text-gray-400")}>
                    {badge.name}
                  </p>
                  <span className={cn("text-xs font-medium rounded-full px-1.5 py-0.5 border", rarityConfig.borderClass, rarityConfig.textClass)}>
                    {rarityConfig.label}
                  </span>
                  {isUnlocked && unlockDate && (
                    <p className="text-xs text-gray-400">
                      {new Date(unlockDate).toLocaleDateString("zh-TW", { month: "2-digit", day: "2-digit" })}
                    </p>
                  )}
                  {!isUnlocked && (
                    <p className="text-xs text-gray-400 text-center line-clamp-2">{badge.description}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
