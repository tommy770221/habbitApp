import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { XPProgressBar } from "@/components/gamification/XPProgressBar"
import { StreakCounter } from "@/components/gamification/StreakCounter"
import { toLocaleDateString } from "@/lib/utils"
import { Activity, CheckSquare, Pill, Plus, ChevronRight, BookOpen } from "lucide-react"
import type { HealthMetric } from "@/types"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const today = toLocaleDateString()

  // Fetch all dashboard data in parallel
  const [
    gamificationResult,
    todayCheckinsResult,
    recentMetricsResult,
    activeMissionsResult,
    todayXPResult,
  ] = await Promise.all([
    supabase.from("user_gamification").select("*").eq("user_id", user.id).single(),
    supabase.from("habit_checkins").select("*").eq("user_id", user.id).eq("checkin_date", today),
    supabase.from("health_metrics").select("*").eq("user_id", user.id)
      .order("recorded_at", { ascending: false }).limit(3),
    supabase.from("user_missions")
      .select("*, template:mission_templates(*)")
      .eq("user_id", user.id).eq("status", "active").limit(3),
    supabase.from("xp_transactions").select("xp_amount")
      .eq("user_id", user.id)
      .gte("created_at", `${today}T00:00:00`),
  ])

  const gamification = gamificationResult.data
  const todayCheckins = todayCheckinsResult.data ?? []
  const recentMetrics = recentMetricsResult.data ?? []
  const activeMissions = activeMissionsResult.data ?? []
  const todayXP = (todayXPResult.data ?? []).reduce((sum, t) => sum + t.xp_amount, 0)

  const habitTypes = [
    { type: "diet", label: "飲食", emoji: "🥗", href: "/habits/checkin?type=diet" },
    { type: "exercise", label: "運動", emoji: "🏃", href: "/habits/checkin?type=exercise" },
    { type: "medication", label: "用藥", emoji: "💊", href: "/habits/checkin?type=medication" },
  ]

  const completedTypes = new Set(todayCheckins.map((c) => c.habit_type))
  const completedCount = completedTypes.size

  function getMetricSummary(metric: HealthMetric): string {
    if (metric.metric_type === "blood_pressure" && metric.systolic && metric.diastolic) {
      return `${metric.systolic}/${metric.diastolic} mmHg`
    }
    if (metric.metric_type === "blood_sugar" && metric.glucose_value) {
      return `${metric.glucose_value} mmol/L`
    }
    if (metric.metric_type === "blood_lipids" && metric.ldl) {
      return `LDL ${metric.ldl} mmol/L`
    }
    return "—"
  }

  const metricTypeLabel: Record<string, string> = {
    blood_pressure: "血壓",
    blood_sugar: "血糖",
    blood_lipids: "血脂",
  }

  const metricTypeEmoji: Record<string, string> = {
    blood_pressure: "💓",
    blood_sugar: "🩸",
    blood_lipids: "🫀",
  }

  return (
    <div className="space-y-5 p-4">
      {/* Tutorial link */}
      <Link href="/onboarding">
        <Card className="border-green-200 bg-green-50 hover:border-green-400 transition-colors cursor-pointer">
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900 text-sm">功能使用教學</p>
                <p className="text-xs text-gray-500">重新瀏覽 App 功能介紹</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </CardContent>
        </Card>
      </Link>

      {/* Today XP earned */}
      {todayXP > 0 && (
        <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl p-4 text-white">
          <p className="text-sm font-medium opacity-90">今日已獲得</p>
          <p className="text-3xl font-black">+{todayXP} XP</p>
        </div>
      )}

      {/* XP & Level */}
      {gamification && (
        <Card>
          <CardContent className="pt-5">
            <XPProgressBar
              totalXP={gamification.total_xp}
              currentLevel={gamification.current_level}
            />
          </CardContent>
        </Card>
      )}

      {/* Streak + Today's Tasks */}
      <div className="grid grid-cols-2 gap-3">
        {/* Streak */}
        <Card>
          <CardContent className="pt-4 pb-4 flex flex-col items-center">
            <p className="text-xs font-medium text-gray-500 mb-2">連續打卡</p>
            <StreakCounter streak={gamification?.current_streak ?? 0} compact />
            {gamification && gamification.streak_shield_count > 0 && (
              <p className="text-xs text-gray-400 mt-1">🛡️ ×{gamification.streak_shield_count}</p>
            )}
          </CardContent>
        </Card>

        {/* Today's tasks */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-medium text-gray-500 mb-2">今日完成</p>
            <p className="text-3xl font-black text-gray-900 mb-1">{completedCount}<span className="text-lg font-normal text-gray-400">/3</span></p>
            <div className="flex gap-1">
              {habitTypes.map(({ type, emoji }) => (
                <span
                  key={type}
                  className={completedTypes.has(type) ? "opacity-100" : "opacity-30"}
                  title={type}
                >
                  {emoji}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's habit cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">今日習慣打卡</h2>
          <Link href="/habits" className="text-sm text-green-600 flex items-center gap-0.5">
            全部 <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="space-y-2">
          {habitTypes.map(({ type, label, emoji, href }) => {
            const done = completedTypes.has(type)
            return (
              <Link key={type} href={done ? "/habits" : href}>
                <Card className={`transition-all ${done ? "bg-green-50 border-green-200" : "hover:border-gray-300"}`}>
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{emoji}</span>
                      <div>
                        <p className="font-medium text-gray-900">{label}打卡</p>
                        <p className={`text-xs ${done ? "text-green-600 font-medium" : "text-gray-500"}`}>
                          {done ? "已完成 ✓" : "點擊打卡 +15 XP"}
                        </p>
                      </div>
                    </div>
                    {done ? (
                      <Badge className="bg-green-100 text-green-700 border-0">完成</Badge>
                    ) : (
                      <div className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center">
                        <Plus className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">快速記錄</h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "血壓", emoji: "💓", href: "/metrics/input?type=blood_pressure" },
            { label: "血糖", emoji: "🩸", href: "/metrics/input?type=blood_sugar" },
            { label: "血脂", emoji: "🫀", href: "/metrics/input?type=blood_lipids" },
          ].map(({ label, emoji, href }) => (
            <Link key={href} href={href}>
              <Card className="hover:border-green-300 transition-colors cursor-pointer">
                <CardContent className="py-4 flex flex-col items-center gap-1">
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-xs font-medium text-gray-700">{label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent health metrics */}
      {recentMetrics.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">最近記錄</h2>
            <Link href="/metrics" className="text-sm text-green-600 flex items-center gap-0.5">
              全部 <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentMetrics.map((metric) => (
              <Card key={metric.id}>
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{metricTypeEmoji[metric.metric_type]}</span>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{metricTypeLabel[metric.metric_type]}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(metric.recorded_at).toLocaleDateString("zh-TW", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900">{getMetricSummary(metric as HealthMetric)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Active missions preview */}
      {activeMissions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">進行中任務</h2>
            <Link href="/missions" className="text-sm text-green-600 flex items-center gap-0.5">
              全部 <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {activeMissions.slice(0, 2).map((mission) => {
              const progress = Math.min(100, Math.round((mission.current_count / mission.target_count) * 100))
              return (
                <Link key={mission.id} href="/missions">
                  <Card className="hover:border-gray-300 transition-colors">
                    <CardContent className="py-3 px-4">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium text-gray-900">{(mission as any).template?.title ?? "任務"}</p>
                        <span className="text-xs text-gray-500">{mission.current_count}/{mission.target_count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-green-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state for new users */}
      {recentMetrics.length === 0 && completedCount === 0 && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="py-8 text-center">
            <p className="text-3xl mb-2">👋</p>
            <p className="font-semibold text-gray-700">歡迎開始您的健康旅程</p>
            <p className="text-sm text-gray-500 mt-1 mb-4">記錄第一筆數值或完成今日打卡</p>
            <div className="flex gap-2 justify-center">
              <Button asChild size="sm">
                <Link href="/metrics/input">記錄數值</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/habits">開始打卡</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
