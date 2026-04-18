"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import type { DailyFormCondition, DailyFormField } from "@/types"

interface Mission {
  id: string
  status: string
  template: {
    title: string
    xp_reward: number
    condition_json: DailyFormCondition
  }
}

interface Props {
  mission: Mission
  existingResponse?: Record<string, string> | null
}

function buildSentence(template: string, fields: DailyFormField[], values: Record<string, string>): string {
  // Replace each ＿ in order with the corresponding field value
  let result = template
  for (const field of fields) {
    result = result.replace("＿", values[field.key] || `＿${field.label}＿`)
  }
  return result
}

const DIRECTION_STYLE = {
  positive: { bg: "bg-green-50 border-green-200", tag: "bg-green-100 text-green-700", label: "養成好習慣" },
  negative: { bg: "bg-red-50 border-red-200",   tag: "bg-red-100 text-red-700",     label: "遠離壞習慣" },
}

export function DailyMissionForm({ mission, existingResponse }: Props) {
  const cond = mission.template.condition_json
  const style = DIRECTION_STYLE[cond.habit_direction] ?? DIRECTION_STYLE.positive
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Completed state
  if (existingResponse) {
    const sentence = buildSentence(cond.template, cond.fields, existingResponse)
    return (
      <Card className={`border ${style.bg}`}>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-start justify-between mb-2">
            <span className="font-semibold text-gray-900 text-sm">{mission.template.title}</span>
            <span className={`text-xs font-medium rounded-full px-2 py-0.5 ml-2 shrink-0 ${style.tag}`}>
              {style.label}
            </span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{sentence}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            <span className="text-xs text-green-600 font-medium">已完成 · +{mission.template.xp_reward} XP</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  async function handleSubmit() {
    const missing = cond.fields.filter((f) => !values[f.key]?.trim())
    if (missing.length > 0) {
      setError(`請填寫：${missing.map((f) => f.label).join("、")}`)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/gamification/daily-missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mission_id: mission.id, response_json: values }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "提交失敗")
        return
      }
      router.refresh()
    } catch {
      setError("網路錯誤，請重試")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={`border ${style.bg}`}>
      <CardContent className="pt-4 pb-4 space-y-3">
        <div className="flex items-start justify-between">
          <span className="font-semibold text-gray-900 text-sm">{mission.template.title}</span>
          <span className={`text-xs font-medium rounded-full px-2 py-0.5 ml-2 shrink-0 ${style.tag}`}>
            {style.label}
          </span>
        </div>

        {/* Fields */}
        <div className="space-y-2">
          {cond.fields.map((field) => (
            <div key={field.key}>
              <label className="text-xs text-gray-500 mb-0.5 block">{field.label}</label>
              <input
                type="text"
                value={values[field.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          ))}
        </div>

        {/* Example */}
        <p className="text-xs text-gray-400 italic">例：{cond.example}</p>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-green-700">⚡ +{mission.template.xp_reward} XP</span>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={loading}
            className="text-xs"
          >
            {loading ? "儲存中…" : "完成並儲存"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
