import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { checkAndAwardBadges } from "@/lib/gamification/awards"

// POST /api/gamification/daily-missions
// Body: { mission_id: string, response_json: Record<string, string> }
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { mission_id, response_json } = body

  if (!mission_id || typeof response_json !== "object" || !response_json) {
    return NextResponse.json({ error: "mission_id and response_json are required" }, { status: 400 })
  }

  // Fetch mission with template to validate
  const { data: mission } = await supabase
    .from("user_missions")
    .select("*, template:mission_templates(xp_reward, condition_json)")
    .eq("id", mission_id)
    .eq("user_id", user.id)
    .single()

  if (!mission) return NextResponse.json({ error: "Mission not found" }, { status: 404 })
  if (mission.status !== "active") {
    return NextResponse.json({ error: "Mission is not active" }, { status: 400 })
  }
  if (mission.current_count >= mission.target_count) {
    return NextResponse.json({ error: "Mission already completed" }, { status: 400 })
  }

  const template = (mission as any).template
  const conditionJson = template?.condition_json as any

  // Validate required fields are present and non-empty
  const fields: Array<{ key: string }> = conditionJson?.fields ?? []
  const missingFields = fields.filter((f) => !response_json[f.key]?.trim())
  if (missingFields.length > 0) {
    return NextResponse.json(
      { error: "Missing required fields", fields: missingFields.map((f) => f.key) },
      { status: 422 }
    )
  }

  const now = new Date().toISOString()

  // Save response
  const { error: responseError } = await supabase
    .from("daily_mission_responses")
    .insert({ user_id: user.id, user_mission_id: mission_id, response_json })

  if (responseError) {
    return NextResponse.json({ error: responseError.message }, { status: 500 })
  }

  // Mark mission completed
  await supabase
    .from("user_missions")
    .update({ current_count: 1, status: "completed", completed_at: now, xp_claimed: true })
    .eq("id", mission_id)

  // Award XP
  const xpAmount = template?.xp_reward ?? 20
  const { data: xpResult } = await supabase.rpc("award_xp", {
    p_user_id: user.id,
    p_xp_amount: xpAmount,
    p_source_type: "mission_complete",
    p_source_id: mission_id,
    p_description: "每日任務完成獎勵",
  })

  // Check badge eligibility
  const { awarded: badges, xp_total: badge_xp } = await checkAndAwardBadges(supabase, user.id)

  return NextResponse.json({
    xp_awarded: xpAmount,
    level_up: xpResult?.leveled_up ?? false,
    new_level: xpResult?.new_level,
    badges_awarded: badges,
    badge_xp,
  })
}
