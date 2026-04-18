import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Target, CheckCircle, Clock } from "lucide-react"
import { ClaimMissionButton } from "./ClaimMissionButton"
import { MissionTypeTabs } from "./MissionTypeTabs"
import { DailyMissionForm } from "./DailyMissionForm"

const VALID_TYPES = ["daily", "weekly", "monthly"] as const
type TabType = typeof VALID_TYPES[number]

const EMPTY_MESSAGES: Record<TabType, { main: string; sub: string }> = {
  daily:   { main: "今天的任務尚未生成",   sub: "每天零時自動生成每日任務" },
  weekly:  { main: "本週任務尚未生成",     sub: "每週一自動生成每週任務" },
  monthly: { main: "本月任務尚未生成",     sub: "每月1日自動生成每月任務" },
}

const categoryLabels: Record<string, string> = {
  metrics: "健康數據",
  diet: "飲食",
  exercise: "運動",
  medication: "用藥",
  streak: "連續打卡",
  mixed: "綜合",
}

const categoryColors: Record<string, string> = {
  metrics: "bg-blue-100 text-blue-700",
  diet: "bg-green-100 text-green-700",
  exercise: "bg-orange-100 text-orange-700",
  medication: "bg-purple-100 text-purple-700",
  streak: "bg-yellow-100 text-yellow-700",
  mixed: "bg-teal-100 text-teal-700",
}

export default async function MissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const params = await searchParams
  const activeType: TabType = VALID_TYPES.includes(params.type as TabType)
    ? (params.type as TabType)
    : "daily"

  const todayStr = new Date().toISOString().split("T")[0]

  // Fetch missions with template, filtered by type
  const [missionsResult, completedResult] = await Promise.all([
    supabase
      .from("user_missions")
      .select("*, template:mission_templates(*)")
      .eq("user_id", user.id)
      .in("status", ["active", "completed"])
      .order("created_at", { ascending: false }),
    supabase
      .from("user_missions")
      .select("*, template:mission_templates(*)")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(20),
  ])

  const allMissions = missionsResult.data ?? []
  const typedActive = allMissions.filter(
    (m) => (m as any).template?.mission_type === activeType && m.status === "active"
  )
  const typedCompleted = (completedResult.data ?? []).filter(
    (m) => (m as any).template?.mission_type === activeType
  )

  // For daily tab: fetch today's responses keyed by user_mission_id
  let dailyResponseMap: Record<string, Record<string, string>> = {}
  if (activeType === "daily") {
    const missionIds = [...typedActive, ...typedCompleted].map((m) => m.id)
    if (missionIds.length > 0) {
      const { data: responses } = await supabase
        .from("daily_mission_responses")
        .select("user_mission_id, response_json")
        .eq("user_id", user.id)
        .in("user_mission_id", missionIds)
      for (const r of responses ?? []) {
        dailyResponseMap[r.user_mission_id] = r.response_json as Record<string, string>
      }
    }
  }

  const emptyMsg = EMPTY_MESSAGES[activeType]

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">任務挑戰</h1>

      <MissionTypeTabs active={activeType} />

      {/* ── DAILY TAB ── */}
      {activeType === "daily" && (
        <>
          {typedActive.length === 0 && typedCompleted.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <p className="text-gray-400 text-sm">{emptyMsg.main}</p>
                <p className="text-gray-400 text-xs mt-1">{emptyMsg.sub}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Good habit section */}
              {(() => {
                const positiveAll = [...typedActive, ...typedCompleted].filter(
                  (m) => (m as any).template?.condition_json?.habit_direction === "positive"
                )
                if (!positiveAll.length) return null
                return (
                  <div>
                    <h2 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                      養成好習慣
                    </h2>
                    <div className="space-y-2">
                      {positiveAll.map((m) => (
                        <DailyMissionForm
                          key={m.id}
                          mission={{
                            id: m.id,
                            status: m.status,
                            template: (m as any).template,
                          }}
                          existingResponse={dailyResponseMap[m.id] ?? null}
                        />
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Bad habit section */}
              {(() => {
                const negativeAll = [...typedActive, ...typedCompleted].filter(
                  (m) => (m as any).template?.condition_json?.habit_direction === "negative"
                )
                if (!negativeAll.length) return null
                return (
                  <div>
                    <h2 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                      遠離壞習慣
                    </h2>
                    <div className="space-y-2">
                      {negativeAll.map((m) => (
                        <DailyMissionForm
                          key={m.id}
                          mission={{
                            id: m.id,
                            status: m.status,
                            template: (m as any).template,
                          }}
                          existingResponse={dailyResponseMap[m.id] ?? null}
                        />
                      ))}
                    </div>
                  </div>
                )
              })()}
            </>
          )}
        </>
      )}

      {/* ── WEEKLY / MONTHLY TABS ── */}
      {activeType !== "daily" && (
        <>
          {/* Active missions */}
          <div>
            <h2 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" /> 進行中（{typedActive.length}）
            </h2>
            {typedActive.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <p className="text-gray-400 text-sm">{emptyMsg.main}</p>
                  <p className="text-gray-400 text-xs mt-1">{emptyMsg.sub}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {typedActive.map((mission) => {
                  const template = (mission as any).template
                  const progress = Math.min(100, Math.round((mission.current_count / mission.target_count) * 100))
                  const daysLeft = Math.max(0, Math.ceil(
                    (new Date(mission.period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  ))

                  return (
                    <Card key={mission.id} className="overflow-hidden">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{template?.title ?? "任務"}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{template?.description ?? ""}</p>
                          </div>
                          <span className={`text-xs font-medium rounded-full px-2 py-0.5 ml-2 shrink-0 ${categoryColors[template?.category ?? "mixed"] ?? ""}`}>
                            {categoryLabels[template?.category ?? "mixed"]}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">進度 {mission.current_count}/{mission.target_count}</span>
                            <span className="text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> 還剩 {daysLeft} 天
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${progress >= 100 ? "bg-green-500" : "bg-blue-500"}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1">
                            <span className="text-sm">⚡</span>
                            <span className="text-sm font-semibold text-green-700">+{template?.xp_reward ?? 0} XP</span>
                          </div>
                          {progress >= 100 && !mission.xp_claimed && (
                            <ClaimMissionButton missionId={mission.id} xpReward={template?.xp_reward ?? 0} />
                          )}
                          {mission.xp_claimed && (
                            <Badge className="bg-green-100 text-green-700 border-0">
                              <CheckCircle className="w-3 h-3 mr-1" /> 已領取
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Completed missions */}
          {typedCompleted.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" /> 已完成（{typedCompleted.length}）
              </h2>
              <div className="space-y-2">
                {typedCompleted.slice(0, 10).map((mission) => {
                  const template = (mission as any).template
                  return (
                    <Card key={mission.id} className="bg-gray-50 border-gray-200">
                      <CardContent className="py-3 px-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm text-gray-700">{template?.title ?? "任務"}</p>
                          <p className="text-xs text-gray-400">
                            {mission.completed_at
                              ? new Date(mission.completed_at).toLocaleDateString("zh-TW", { month: "2-digit", day: "2-digit" })
                              : ""}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-green-600">+{template?.xp_reward ?? 0} XP</span>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
