import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { checkAndAwardBadges } from "@/lib/gamification/awards"

// POST: claim XP for completed mission
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const missionId = searchParams.get("id")
  if (!missionId) return NextResponse.json({ error: "Mission ID required" }, { status: 400 })

  // Get mission and verify ownership + eligibility
  const { data: mission } = await supabase
    .from("user_missions")
    .select("*, template:mission_templates(xp_reward)")
    .eq("id", missionId)
    .eq("user_id", user.id)
    .single()

  if (!mission) return NextResponse.json({ error: "Mission not found" }, { status: 404 })
  if (mission.xp_claimed) return NextResponse.json({ error: "XP already claimed" }, { status: 400 })
  if (mission.current_count < mission.target_count) {
    return NextResponse.json({ error: "Mission not completed" }, { status: 400 })
  }

  const xpReward = (mission as any).template?.xp_reward ?? 0

  // Mark as claimed and completed
  await supabase.from("user_missions").update({
    xp_claimed: true,
    status: "completed",
    completed_at: new Date().toISOString(),
  }).eq("id", missionId)

  // Award XP
  const { data: xpResult } = await supabase.rpc("award_xp", {
    p_user_id: user.id,
    p_xp_amount: xpReward,
    p_source_type: "mission_complete",
    p_source_id: missionId,
    p_description: "任務完成獎勵",
  })

  const { awarded: badges, xp_total: badge_xp } = await checkAndAwardBadges(supabase, user.id)

  return NextResponse.json({
    xp_awarded: xpReward,
    level_up: xpResult?.leveled_up ?? false,
    badges_awarded: badges,
    badge_xp,
  })
}
