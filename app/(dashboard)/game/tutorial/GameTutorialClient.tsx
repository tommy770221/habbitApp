"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft } from "lucide-react"

const STEPS = [
  {
    icon: "⚔️",
    title: "健康 RPG 打怪遊戲",
    description: "透過健康行為累積戰鬥能量，選擇角色，擊敗代表不良習慣的怪物。打倒怪物可獲得 XP，幫助你升級！",
    detail: null,
  },
  {
    icon: "⚡",
    title: "戰鬥能量（上限 100）",
    description: "每次行動都需要消耗能量，透過健康行為補充：",
    detail: [
      { label: "習慣打卡（飲食/運動/用藥）", value: "+10 ⚡" },
      { label: "記錄健康數據（血壓/血糖/血脂）", value: "+10 ⚡" },
      { label: "完成每日任務", value: "+5 ⚡" },
    ],
  },
  {
    icon: "🧑‍🤝‍🧑",
    title: "4 個角色，各有專長",
    description: "每個角色有不同的屬性與技能，鼓勵養成不同健康習慣才能解鎖：",
    detail: [
      { label: "⚔️ 健康勇士", value: "預設解鎖" },
      { label: "🧙 飲食法師", value: "飲食打卡 10 次" },
      { label: "🥊 運動戰士", value: "運動打卡 10 次" },
      { label: "🛡️ 藥師守護者", value: "用藥打卡 10 次" },
    ],
  },
  {
    icon: "🎮",
    title: "回合制戰鬥",
    description: "每回合選擇行動，怪物會在你攻擊後立即反擊：",
    detail: [
      { label: "普通攻擊", value: "-10 ⚡，基礎傷害" },
      { label: "技能攻擊", value: "-30 ⚡，強力效果" },
      { label: "逃跑", value: "-5 ⚡，撤退離場" },
    ],
  },
  {
    icon: "✨",
    title: "各角色的專屬技能",
    description: "技能消耗 30 點能量，效果比普通攻擊強大得多：",
    detail: [
      { label: "⚔️ 強力衝擊", value: "攻擊 ×1.5 倍傷害" },
      { label: "🧙 淨化術", value: "攻擊 + 回復 15 HP" },
      { label: "🥊 爆發衝刺", value: "固定 35 點傷害" },
      { label: "🛡️ 護盾術", value: "本回合免疫怪物攻擊" },
    ],
  },
  {
    icon: "👾",
    title: "8 隻怪物，5 個關卡",
    description: "擊敗一個關卡所有怪物後自動晉級，最終挑戰萬病之源！",
    detail: [
      { label: "關卡 1", value: "🐛 懶惰蟲、🍬 甜食精靈" },
      { label: "關卡 2", value: "🍔 暴食獸、🥤 飲料惡魔" },
      { label: "關卡 3", value: "😤 高血壓魔、👻 高血糖惡靈" },
      { label: "關卡 4-5", value: "🏋️ 肥胖巨人、💀 萬病之源（Boss）" },
    ],
  },
  {
    icon: "🚀",
    title: "準備出發！",
    description: "保持打卡累積能量、解鎖新角色，逐一擊敗代表不健康習慣的怪物，成為健康守護者！",
    detail: null,
  },
]

export function GameTutorialClient() {
  const router = useRouter()
  const [step, setStep] = useState(0)

  const isLast = step === STEPS.length - 1
  const current = STEPS[step]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6 pt-2">
        <button onClick={() => router.back()} className="p-1 rounded-lg hover:bg-white/60 transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-base font-semibold text-gray-700">遊戲教學</h1>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mb-6 justify-center">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === step ? "w-6 bg-purple-500" : i < step ? "w-2 bg-purple-400" : "w-2 bg-gray-300"
            }`}
          />
        ))}
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col justify-center">
        <Card className="w-full shadow-xl border-0">
          <CardContent className="pt-8 pb-6 px-6">
            <div className="text-6xl mb-4 text-center leading-none">{current.icon}</div>
            <h2 className="text-xl font-bold text-gray-900 mb-3 text-center">{current.title}</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4 text-center">{current.description}</p>

            {current.detail && (
              <div className="space-y-2 mt-2">
                {current.detail.map((row, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-sm text-gray-700">{row.label}</span>
                    <span className="text-sm font-semibold text-purple-600 shrink-0 ml-2">{row.value}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-6">
        {step > 0 && (
          <Button variant="outline" className="flex-1" onClick={() => setStep((s) => s - 1)}>
            ← 上一步
          </Button>
        )}
        {!isLast ? (
          <Button
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => setStep((s) => s + 1)}
          >
            下一步 →
          </Button>
        ) : (
          <Button
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => router.push("/game")}
          >
            開始遊戲 ⚔️
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3 text-center">{step + 1} / {STEPS.length}</p>
    </div>
  )
}
