"use client"

import { useRouter } from "next/navigation"

const TABS = [
  { key: "daily",   label: "每日任務" },
  { key: "weekly",  label: "每週任務" },
  { key: "monthly", label: "每月任務" },
] as const

type TabKey = typeof TABS[number]["key"]

export function MissionTypeTabs({ active }: { active: TabKey }) {
  const router = useRouter()

  return (
    <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => router.replace(`/missions?type=${tab.key}`)}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            active === tab.key
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
