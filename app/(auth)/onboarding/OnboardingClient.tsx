"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"

const STEPS = [
  {
    title: "嗨！我是你的健康守護助手 🌱",
    description: "我會陪你管理高血壓、高血糖、高血脂，每天養成健康習慣，一起進步！讓我來介紹這個 App 怎麼用吧～",
    detail: null,
  },
  {
    title: "每日健康打卡 🥗🏃💊",
    description: "每天完成飲食、運動、用藥三項打卡，養成規律習慣。完成打卡可以獲得 XP 和戰鬥能量哦！",
    detail: [
      "飲食打卡 → 記錄今日飲食狀況",
      "運動打卡 → 記錄運動種類和時長",
      "用藥打卡 → 確認今日按時服藥",
    ],
  },
  {
    title: "每日任務 📋",
    description: "每天有 6 個行為科學設計的習慣任務！透過填寫承諾和反思，慢慢強化你的健康習慣。",
    detail: [
      "3 個養成好習慣任務（綠色）",
      "3 個遠離壞習慣任務（紅色）",
      "完成後獲得 XP 與戰鬥能量 ⚡",
    ],
  },
  {
    title: "打倒不健康的怪物！ ⚔️",
    description: "透過打卡和任務累積戰鬥能量，選擇你的角色，一一擊敗代表不良習慣的怪物！還能解鎖新角色喔！",
    detail: [
      "能量上限 100 點",
      "4 個角色各有專屬技能",
      "共 8 隻怪物、5 個關卡",
    ],
  },
  {
    title: "你已經準備好了！ ✅",
    description: "記住，每一個小小的健康習慣，都是通往健康生活的一步。我會一直陪著你，加油！",
    detail: null,
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-teal-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center pt-2 mb-2">
        <span className="text-sm font-medium text-gray-500">使用教學</span>
        {!isLast && (
          <button
            onClick={complete}
            disabled={loading}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            跳過
          </button>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 justify-center mb-8">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === step ? "w-6 bg-green-500" : i < step ? "w-2 bg-green-400" : "w-2 bg-gray-300"
            }`}
          />
        ))}
      </div>

      {/* Chat layout */}
      <div className="flex-1 flex flex-col justify-center gap-6">
        {/* AI character + speech bubble */}
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            <Image
              src="/ai-assistant.png"
              alt="AI健康助手"
              width={80}
              height={80}
              className="object-contain drop-shadow-md"
            />
          </div>

          {/* Speech bubble */}
          <div className="relative flex-1">
            {/* Tail pointing left */}
            <div className="absolute -left-2 top-5 w-0 h-0
              border-t-[8px] border-t-transparent
              border-r-[10px] border-r-white
              border-b-[8px] border-b-transparent"
            />
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-4 shadow-md">
              <p className="font-bold text-gray-900 text-base mb-2">{current.title}</p>
              <p className="text-gray-600 text-sm leading-relaxed">{current.description}</p>
            </div>
          </div>
        </div>

        {/* Detail list */}
        {current.detail && (
          <div className="ml-[92px] space-y-2">
            {current.detail.map((item, i) => (
              <div key={i} className="flex items-start gap-2 bg-white rounded-xl px-3 py-2.5 shadow-sm">
                <span className="text-green-500 font-bold text-sm shrink-0">✓</span>
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <Button variant="outline" className="flex-1" onClick={() => setStep((s) => s - 1)}>
            ← 上一步
          </Button>
        )}
        {!isLast ? (
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => setStep((s) => s + 1)}
          >
            下一步 →
          </Button>
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

      <p className="text-xs text-gray-400 mt-3 text-center">{step + 1} / {STEPS.length}</p>
    </div>
  )
}
