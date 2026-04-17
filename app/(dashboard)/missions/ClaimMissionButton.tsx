"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { showXPGain } from "@/components/gamification/XPGainToast"
import { useRouter } from "next/navigation"

export function ClaimMissionButton({ missionId, xpReward }: { missionId: string; xpReward: number }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleClaim() {
    setLoading(true)
    try {
      const res = await fetch(`/api/gamification/missions?id=${missionId}`, {
        method: "POST",
      })
      if (res.ok) {
        showXPGain(xpReward, "任務完成獎勵")
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button size="sm" onClick={handleClaim} disabled={loading} className="bg-green-500 hover:bg-green-600">
      {loading ? "領取中..." : "領取 XP"}
    </Button>
  )
}
