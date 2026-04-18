"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const STEPS = [
  {
    icon: "🌱",
    title: "歡迎來到健康守護！",
    description: "專為三高患者設計的健康管理 App，幫助你管理高血壓、高血糖、高血脂，每天進步一點點。",
    tip: null,
  },
  {
    icon: "🥗🏃💊",
    title: "每日健康打卡",
    description: "每天完成飲食、運動、用藥三項打卡，養成規律的健康習慣。",
    tip: "完成每項打卡可獲得 XP 經驗值與戰鬥能量 ⚡，連續打卡還能維持健康連續紀錄！",
  },
  {
    icon: "📋",
    title: "每日任務",
    description: "每天有 6 個行為科學設計的習慣任務，透過填寫承諾、反思與調整，逐步強化你的健康習慣。",
    tip: "完成任務可獲得 XP 與戰鬥能量，幫助你在遊戲中更強大！",
  },
  {
    icon: "⚔️",
    title: "打倒不健康的怪物！",
    description: "透過打卡和完成任務累積戰鬥能量，選擇你的角色，一一擊敗代表不良習慣的怪物。",
    tip: "能量上限 100，解鎖更多角色需要堅持特定健康習慣。",
  },
  {
    icon: "✅",
    title: "你已準備好了！",
    description: "開始記錄你的健康旅程，每一個小習慣都是通往健康生活的一步。",
    tip: null,
  },
]

export function OnboardingClient() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const isLast = step === STEPS.length - 1
  const current = STEPS[step]

  async function complete() {
    setLoading(true)
    await fetch("/api/onboarding/complete", { method: "POST" })
    router.push("/")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-teal-50 p-6">
      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === step ? "w-6 bg-green-500" : i < step ? "w-2 bg-green-400" : "w-2 bg-gray-300"
            }`}
          />
        ))}
      </div>

      {/* Card */}
      <Card className="w-full max-w-sm shadow-xl border-0">
        <CardContent className="pt-8 pb-6 px-6 text-center">
          <div className="text-6xl mb-4 leading-none">{current.icon}</div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{current.title}</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">{current.description}</p>
          {current.tip && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 text-left">
              💡 {current.tip}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Buttons */}
      <div className="flex w-full max-w-sm gap-3 mt-6">
        {!isLast ? (
          <>
            <Button
              variant="ghost"
              className="flex-1 text-gray-500"
              onClick={complete}
              disabled={loading}
            >
              跳過
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setStep((s) => s + 1)}
            >
              下一步 →
            </Button>
          </>
        ) : (
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            onClick={complete}
            disabled={loading}
          >
            {loading ? "載入中..." : "開始使用 🚀"}
          </Button>
        )}
      </div>

      {/* Step counter */}
      <p className="text-xs text-gray-400 mt-4">{step + 1} / {STEPS.length}</p>
    </div>
  )
}
