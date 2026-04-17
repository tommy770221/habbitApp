import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Target, CheckCircle, Clock } from "lucide-react"
import { ClaimMissionButton } from "./ClaimMissionButton"

export default async function MissionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [activeMissionsResult, completedMissionsResult] = await Promise.all([
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
      .limit(10),
  ])

  const missions = activeMissionsResult.data ?? []
  const activeMissions = missions.filter((m) => m.status === "active")
  const completedMissions = missions.filter((m) => m.status === "completed")

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

  return (
    <div className="p-4 space-y-5">
      <h1 className="text-xl font-bold text-gray-900">週期挑戰</h1>

      {/* Active missions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
          <Target className="w-4 h-4" /> 進行中（{activeMissions.length}）
        </h2>
        {activeMissions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <p className="text-gray-400 text-sm">目前沒有進行中的任務</p>
              <p className="text-gray-400 text-xs mt-1">系統每週一自動生成新任務</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeMissions.map((mission) => {
              const template = (mission as any).template
              const progress = Math.min(100, Math.round((mission.current_count / mission.target_count) * 100))
              const daysLeft = Math.max(0, Math.ceil((new Date(mission.period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

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
      {completedMissions.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" /> 已完成（{completedMissions.length}）
          </h2>
          <div className="space-y-2">
            {completedMissions.map((mission) => {
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
    </div>
  )
}
