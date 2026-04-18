import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { checkAndAwardBadges } from "@/lib/gamification/awards"
import type { BattleResult } from "@/types"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { monster_id, character_id, result, turns, energy_used } = body as {
    monster_id: string
    character_id: string
    result: BattleResult
    turns: number
    energy_used: number
  }

  if (!monster_id || !character_id || !result || turns == null || energy_used == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // Validate monster and character
  const [{ data: monster }, { data: charRow }] = await Promise.all([
    supabase.from("monsters").select("*").eq("id", monster_id).single(),
    supabase.from("user_characters").select("id").eq("user_id", user.id).eq("character_id", character_id).single(),
  ])

  if (!monster) return NextResponse.json({ error: "Monster not found" }, { status: 404 })
  if (!charRow) return NextResponse.json({ error: "Character not found" }, { status: 404 })

  // Deduct energy atomically (floor at 0, so pass negative amount)
  await supabase.rpc("add_battle_energy", { p_user_id: user.id, p_amount: -energy_used })

  // Record battle
  await supabase.from("battle_records").insert({
    user_id: user.id,
    monster_id,
    character_id,
    result,
    turns,
    energy_used,
    xp_reward: result === "victory" ? monster.xp_reward : 0,
  })

  let xpAwarded = 0
  let leveledUp = false
  let newLevel: number | undefined
  let stageAdvanced = false
  let newEnergy = 0

  if (result === "victory") {
    // Award XP
    const { data: xpResult } = await supabase.rpc("award_xp", {
      p_user_id: user.id,
      p_xp_amount: monster.xp_reward,
      p_source_type: "mission_complete",
      p_source_id: null,
      p_description: `擊敗 ${monster.name}`,
    })
    xpAwarded = monster.xp_reward
    leveledUp = xpResult?.leveled_up ?? false
    newLevel = xpResult?.new_level

    // Get current state
    const { data: gs } = await supabase
      .from("user_game_state")
      .select("*")
      .eq("user_id", user.id)
      .single()

    const currentStage = gs?.current_stage ?? 1
    const totalDefeated = (gs?.total_monsters_defeated ?? 0) + 1

    // Check if user has defeated all unique monsters in current stage
    const { data: stageMonsters } = await supabase
      .from("monsters")
      .select("id")
      .eq("stage_level", currentStage)

    const stageMonsterIds = (stageMonsters ?? []).map((m) => m.id)

    const { data: defeatedRecords } = await supabase
      .from("battle_records")
      .select("monster_id")
      .eq("user_id", user.id)
      .eq("result", "victory")
      .in("monster_id", stageMonsterIds)

    const defeatedIds = new Set((defeatedRecords ?? []).map((r) => r.monster_id))
    defeatedIds.add(monster_id) // include current victory

    const allDefeated = stageMonsterIds.every((id) => defeatedIds.has(id))
    const nextStage = allDefeated ? Math.min(currentStage + 1, 5) : currentStage
    stageAdvanced = allDefeated && nextStage > currentStage

    const energyRefill = Math.min(100, (gs?.battle_energy ?? 0) + monster.energy_reward)
    newEnergy = energyRefill

    await supabase.from("user_game_state").update({
      total_monsters_defeated: totalDefeated,
      current_stage: nextStage,
      battle_energy: energyRefill,
    }).eq("user_id", user.id)
  } else {
    const { data: gs } = await supabase
      .from("user_game_state")
      .select("battle_energy")
      .eq("user_id", user.id)
      .single()
    newEnergy = gs?.battle_energy ?? 0
  }

  // Check badges
  const { awarded: badges } = await checkAndAwardBadges(supabase, user.id)

  // Fetch next monster (first undefeated in current stage)
  const { data: gs2 } = await supabase
    .from("user_game_state")
    .select("current_stage")
    .eq("user_id", user.id)
    .single()

  const nextStageLevel = gs2?.current_stage ?? 1
  const { data: nextStageMonsters } = await supabase
    .from("monsters")
    .select("*")
    .eq("stage_level", nextStageLevel)
    .order("sort_order")

  const { data: nextDefeatedRecords } = await supabase
    .from("battle_records")
    .select("monster_id")
    .eq("user_id", user.id)
    .eq("result", "victory")
    .in("monster_id", (nextStageMonsters ?? []).map((m) => m.id))

  const nextDefeatedIds = new Set((nextDefeatedRecords ?? []).map((r) => r.monster_id))
  const nextMonster = (nextStageMonsters ?? []).find((m) => !nextDefeatedIds.has(m.id)) ?? null

  return NextResponse.json({
    result,
    xp_awarded: xpAwarded,
    level_up: leveledUp,
    new_level: newLevel,
    energy_remaining: newEnergy,
    stage_advanced: stageAdvanced,
    next_monster: nextMonster ?? null,
    badges_awarded: badges,
  })
}
