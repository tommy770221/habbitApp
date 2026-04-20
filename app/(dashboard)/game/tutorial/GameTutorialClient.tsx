"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

const STEPS = [
  {
    title: "來跟我學怎麼打怪吧！⚔️",
    description: "這個遊戲讓你用健康行為累積能量，選擇角色，擊敗代表不良習慣的怪物，還能獲得 XP 升級！",
    detail: null,
  },
  {
    title: "戰鬥能量是關鍵 ⚡",
    description: "能量上限 100 點，每次戰鬥行動都需要消耗能量。靠健康行為補充：",
    detail: [
      { label: "習慣打卡（飲食/運動/用藥）", value: "+10 ⚡" },
      { label: "記錄健康數據（血壓/血糖/血脂）", value: "+10 ⚡" },
      { label: "完成每日任務", value: "+5 ⚡" },
    ],
  },
  {
    title: "選擇你的角色 🧑‍🤝‍🧑",
    description: "共有 4 個角色，各有專屬技能。持續打卡就能解鎖新角色！",
    detail: [
      { label: "⚔️ 健康勇士", value: "預設解鎖" },
      { label: "🧙 飲食法師", value: "飲食打卡 10 次" },
      { label: "🥊 運動戰士", value: "運動打卡 10 次" },
      { label: "🛡️ 藥師守護者", value: "用藥打卡 10 次" },
    ],
  },
  {
    title: "每回合選擇行動 🎮",
    description: "你攻擊後，怪物會立即反擊。選對行動才能以最少能量獲勝！",
    detail: [
      { label: "普通攻擊", value: "-10 ⚡，基礎傷害" },
      { label: "技能攻擊", value: "-30 ⚡，強力效果" },
      { label: "逃跑", value: "-5 ⚡，撤退離場" },
    ],
  },
  {
    title: "各角色的專屬技能 ✨",
    description: "技能消耗 30 點能量，但效果遠比普通攻擊強大，關鍵時刻要善用！",
    detail: [
      { label: "⚔️ 強力衝擊", value: "攻擊 ×1.5 倍" },
      { label: "🧙 淨化術", value: "攻擊 + 回血 15 HP" },
      { label: "🥊 爆發衝刺", value: "固定 35 點傷害" },
      { label: "🛡️ 護盾術", value: "本回合免疫傷害" },
    ],
  },
  {
    title: "8 隻怪物等你挑戰 👾",
    description: "打敗一個關卡所有怪物後自動晉級，最終挑戰萬病之源 Boss！",
    detail: [
      { label: "關卡 1", value: "🐛 懶惰蟲、🍬 甜食精靈" },
      { label: "關卡 2", value: "🍔 暴食獸、🥤 飲料惡魔" },
      { label: "關卡 3", value: "😤 高血壓魔、👻 高血糖惡靈" },
      { label: "關卡 4-5", value: "🏋️ 肥胖巨人、💀 萬病之源" },
    ],
  },
  {
    title: "準備好出發了嗎？🚀",
    description: "記住，打卡越勤，能量越多，戰鬥越強！我會為你加油的，一起擊敗所有怪物吧！",
    detail: null,
  },
]

export function GameTutorialClient() {
  const router = useRouter()
  const [step, setStep] = useState(0)

  const isLast = step === STEPS.length - 1
  const current = STEPS[step]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 pt-2 mb-4">
        <button onClick={() => router.back()} className="p-1 rounded-lg hover:bg-white/60 transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-base font-semibold text-gray-700">遊戲教學</h1>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 justify-center mb-6">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === step ? "w-6 bg-purple-500" : i < step ? "w-2 bg-purple-400" : "w-2 bg-gray-300"
            }`}
          />
        ))}
      </div>

      {/* Chat layout */}
      <div className="flex-1 flex flex-col justify-center gap-4">
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
            {current.detail.map((row, i) => (
              <div key={i} className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 shadow-sm">
                <span className="text-sm text-gray-700">{row.label}</span>
                <span className="text-sm font-semibold text-purple-600 shrink-0 ml-2">{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
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
