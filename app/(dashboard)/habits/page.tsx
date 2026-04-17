import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HabitStreakCalendar } from "@/components/habits/HabitStreakCalendar"
import { toLocaleDateString } from "@/lib/utils"
import { CheckCircle, Circle, ChevronRight } from "lucide-react"
import type { HabitCheckin } from "@/types"

export default async function HabitsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const today = toLocaleDateString()

  // Get 90 days of checkins for calendar
  const since = new Date()
  since.setDate(since.getDate() - 90)

  const [todayResult, calendarResult] = await Promise.all([
    supabase.from("habit_checkins").select("*").eq("user_id", user.id).eq("checkin_date", today),
    supabase.from("habit_checkins").select("checkin_date,habit_type")
      .eq("user_id", user.id)
      .gte("checkin_date", toLocaleDateString(since)),
  ])

  const todayCheckins = (todayResult.data ?? []) as HabitCheckin[]
  const calendarCheckins = (calendarResult.data ?? []) as HabitCheckin[]

  const completedTypes = new Set(todayCheckins.map((c) => c.habit_type))

  const habits = [
    {
      type: "diet" as const,
      label: "飲食打卡",
      emoji: "🥗",
      desc: "記錄今日飲食習慣",
      xp: "+15 XP",
      checkinHref: "/habits/checkin?type=diet",
    },
    {
      type: "exercise" as const,
      label: "運動打卡",
      emoji: "🏃",
      desc: "記錄今日運動情況",
      xp: "+20~40 XP",
      checkinHref: "/habits/checkin?type=exercise",
    },
    {
      type: "medication" as const,
      label: "用藥確認",
      emoji: "💊",
      desc: "確認今日服藥情況",
      xp: "+15 XP",
      checkinHref: "/habits/checkin?type=medication",
    },
  ]

  // Stats
  const totalCheckins = calendarCheckins.length
  const dietCount = calendarCheckins.filter((c) => c.habit_type === "diet").length
  const exerciseCount = calendarCheckins.filter((c) => c.habit_type === "exercise").length
  const medCount = calendarCheckins.filter((c) => c.habit_type === "medication").length

  return (
    <div className="p-4 space-y-5">
      <h1 className="text-xl font-bold text-gray-900">習慣打卡</h1>

      {/* Today's progress */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">今日進度</p>
            <Badge variant={completedTypes.size === 3 ? "default" : "outline"}>
              {completedTypes.size}/3 完成
            </Badge>
          </div>
          <div className="space-y-2">
            {habits.map(({ type, label, emoji, desc, xp, checkinHref }) => {
              const done = completedTypes.has(type)
              const checkin = todayCheckins.find((c) => c.habit_type === type)
              return (
                <div
                  key={type}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    done ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
                  }`}
                >
                  <span className="text-2xl">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{label}</p>
                    {done ? (
                      <p className="text-xs text-green-600">已完成 ✓</p>
                    ) : (
                      <p className="text-xs text-gray-400">{desc} · {xp}</p>
                    )}
                    {/* Show checkin details */}
                    {checkin?.habit_type === "exercise" && checkin.exercise_minutes && (
                      <p className="text-xs text-green-600">{checkin.exercise_type} · {checkin.exercise_minutes}分鐘</p>
                    )}
                    {checkin?.habit_type === "diet" && checkin.diet_score && (
                      <p className="text-xs text-green-600">評分 {'⭐'.repeat(checkin.diet_score as number)}</p>
                    )}
                  </div>
                  {done ? (
                    <CheckCircle className="w-6 h-6 text-green-500 shrink-0" />
                  ) : (
                    <Link href={checkinHref}>
                      <Button size="sm" variant="outline">打卡</Button>
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 90-day heatmap calendar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-700">近90天打卡記錄</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <HabitStreakCalendar checkins={calendarCheckins} weeks={13} />
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-700">近90天統計</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-black text-gray-900">{dietCount}</p>
              <p className="text-xs text-gray-500">飲食打卡</p>
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{exerciseCount}</p>
              <p className="text-xs text-gray-500">運動打卡</p>
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{medCount}</p>
              <p className="text-xs text-gray-500">用藥確認</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
