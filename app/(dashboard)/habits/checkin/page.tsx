"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { showXPGain, showLevelUp } from "@/components/gamification/XPGainToast"
import { ArrowLeft, Star } from "lucide-react"
import Link from "next/link"
import type { DietTag, ExerciseType } from "@/types"
import { cn } from "@/lib/utils"

const DIET_TAGS: DietTag[] = ["低鹽", "低糖", "高纖", "少油", "多蔬果", "控制份量", "低升糖"]
const EXERCISE_TYPES: ExerciseType[] = ["散步", "慢跑", "游泳", "騎車", "太極拳", "瑜伽", "健身", "舞蹈", "其他"]

function CheckinForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultType = searchParams.get("type") ?? "diet"

  const [activeTab, setActiveTab] = useState(defaultType)
  const [loading, setLoading] = useState(false)

  // Diet state
  const [dietScore, setDietScore] = useState<number>(0)
  const [selectedTags, setSelectedTags] = useState<Set<DietTag>>(new Set())
  const [dietNotes, setDietNotes] = useState("")

  // Exercise state
  const [exerciseType, setExerciseType] = useState<ExerciseType>("散步")
  const [exerciseMinutes, setExerciseMinutes] = useState("")
  const [exerciseIntensity, setExerciseIntensity] = useState<"low" | "medium" | "high">("low")

  // Medication state
  const [medicationsTaken, setMedicationsTaken] = useState<boolean | null>(null)
  const [medicationNotes, setMedicationNotes] = useState("")

  function toggleTag(tag: DietTag) {
    const next = new Set(selectedTags)
    if (next.has(tag)) next.delete(tag)
    else next.add(tag)
    setSelectedTags(next)
  }

  async function submit(habitType: string, payload: Record<string, unknown>) {
    setLoading(true)
    try {
      const res = await fetch("/api/habits/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habit_type: habitType, ...payload }),
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.error ?? "打卡失敗")
        return
      }

      const data = await res.json()
      const totalXP = data.xp_awarded + (data.streak_xp ?? 0)
      showXPGain(totalXP, habitType === "diet" ? "飲食打卡" : habitType === "exercise" ? "運動打卡" : "用藥確認")
      if (data.level_up) showLevelUp(data.new_level, "")
      router.push("/habits")
    } catch {
      alert("網路錯誤，請稍後再試")
    } finally {
      setLoading(false)
    }
  }

  const intensityLabels = { low: "輕度", medium: "中度", high: "高強度" }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/habits">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">習慣打卡</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="diet">🥗 飲食</TabsTrigger>
          <TabsTrigger value="exercise">🏃 運動</TabsTrigger>
          <TabsTrigger value="medication">💊 用藥</TabsTrigger>
        </TabsList>

        {/* Diet Checkin */}
        <TabsContent value="diet">
          <Card>
            <CardHeader><CardTitle className="text-base">今日飲食評估</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {/* Score */}
              <div className="space-y-2">
                <Label>今日飲食評分</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setDietScore(n)}
                      className="p-1"
                    >
                      <Star
                        className={cn(
                          "w-8 h-8 transition-colors",
                          n <= dietScore ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        )}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  {dietScore === 0 ? "請選擇評分" :
                    dietScore === 1 ? "飲食不佳，需要改善" :
                    dietScore === 2 ? "飲食尚可，有待改進" :
                    dietScore === 3 ? "飲食普通，持續努力" :
                    dietScore === 4 ? "飲食良好，繼續保持" :
                    "飲食優秀，非常棒！"}
                </p>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>今日飲食特點（可多選）</Label>
                <div className="flex flex-wrap gap-2">
                  {DIET_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm border transition-colors",
                        selectedTags.has(tag)
                          ? "bg-green-500 text-white border-green-500"
                          : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label>備註（可選）</Label>
                <Textarea placeholder="今天吃了什麼…" value={dietNotes} onChange={(e) => setDietNotes(e.target.value)} rows={2} />
              </div>

              <Button
                className="w-full"
                disabled={dietScore === 0 || loading}
                onClick={() => submit("diet", {
                  diet_score: dietScore,
                  diet_tags: Array.from(selectedTags),
                  ...(dietNotes && { diet_notes: dietNotes }),
                })}
              >
                {loading ? "打卡中..." : "完成飲食打卡 (+15 XP)"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exercise Checkin */}
        <TabsContent value="exercise">
          <Card>
            <CardHeader><CardTitle className="text-base">今日運動記錄</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>運動類型</Label>
                <Select value={exerciseType} onValueChange={(v) => setExerciseType(v as ExerciseType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXERCISE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>運動時間（分鐘）</Label>
                <Input
                  type="number"
                  placeholder="30"
                  value={exerciseMinutes}
                  onChange={(e) => setExerciseMinutes(e.target.value)}
                  min={1} max={600}
                />
              </div>

              <div className="space-y-2">
                <Label>運動強度</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["low", "medium", "high"] as const).map((intensity) => (
                    <button
                      key={intensity}
                      type="button"
                      onClick={() => setExerciseIntensity(intensity)}
                      className={cn(
                        "py-2 px-3 rounded-xl border text-sm font-medium transition-colors",
                        exerciseIntensity === intensity
                          ? "bg-green-500 text-white border-green-500"
                          : "bg-white text-gray-600 border-gray-200"
                      )}
                    >
                      {intensityLabels[intensity]}
                    </button>
                  ))}
                </div>
              </div>

              {exerciseMinutes && (
                <div className="bg-green-50 rounded-xl px-4 py-2">
                  <p className="text-sm text-green-700 font-medium">
                    預計獲得 +{20 + Math.min(20, Math.floor(Number(exerciseMinutes) / 10) * 2)} XP
                  </p>
                  <p className="text-xs text-green-600">基礎20 + 時間加成（每10分鐘+2，上限+20）</p>
                </div>
              )}

              <Button
                className="w-full"
                disabled={!exerciseMinutes || Number(exerciseMinutes) < 1 || loading}
                onClick={() => submit("exercise", {
                  exercise_type: exerciseType,
                  exercise_minutes: Number(exerciseMinutes),
                  exercise_intensity: exerciseIntensity,
                })}
              >
                {loading ? "打卡中..." : `完成運動打卡`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medication Checkin */}
        <TabsContent value="medication">
          <Card>
            <CardHeader><CardTitle className="text-base">今日用藥確認</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>今日是否已服藥？</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMedicationsTaken(true)}
                    className={cn(
                      "py-4 rounded-xl border-2 font-medium transition-colors",
                      medicationsTaken === true
                        ? "bg-green-500 text-white border-green-500"
                        : "bg-white text-gray-600 border-gray-200"
                    )}
                  >
                    ✅ 已服藥
                  </button>
                  <button
                    type="button"
                    onClick={() => setMedicationsTaken(false)}
                    className={cn(
                      "py-4 rounded-xl border-2 font-medium transition-colors",
                      medicationsTaken === false
                        ? "bg-red-50 text-red-600 border-red-300"
                        : "bg-white text-gray-600 border-gray-200"
                    )}
                  >
                    ❌ 未服藥
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <Label>備註（可選）</Label>
                <Textarea
                  placeholder="服藥情況說明…"
                  value={medicationNotes}
                  onChange={(e) => setMedicationNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {medicationsTaken === false && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <p className="text-sm text-amber-700">⚠️ 記得和醫師討論補藥時間，切勿自行停藥</p>
                </div>
              )}

              <Button
                className="w-full"
                disabled={medicationsTaken === null || loading}
                onClick={() => submit("medication", {
                  medications_taken: medicationsTaken,
                  ...(medicationNotes && { medication_notes: medicationNotes }),
                })}
              >
                {loading ? "打卡中..." : "完成用藥打卡 (+15 XP)"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function HabitCheckinPage() {
  return (
    <Suspense fallback={<div className="p-4">載入中...</div>}>
      <CheckinForm />
    </Suspense>
  )
}
