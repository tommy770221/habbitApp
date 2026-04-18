import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GameClient } from "./GameClient"

export default async function GamePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Ensure game state exists
  await supabase
    .from("user_game_state")
    .upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true })

  const [gameStateResult, userCharsResult, allCharsResult] = await Promise.all([
    supabase.from("user_game_state").select("*").eq("user_id", user.id).single(),
    supabase.from("user_characters").select("*, character:game_characters(*)").eq("user_id", user.id),
    supabase.from("game_characters").select("*").order("sort_order"),
  ])

  const gameState = gameStateResult.data
  let userChars = userCharsResult.data ?? []
  const allChars = allCharsResult.data ?? []

  // First-time: initialise character collection
  if (userChars.length === 0 && allChars.length > 0) {
    const inserts = allChars.map((c) => ({
      user_id: user.id,
      character_id: c.id,
      is_unlocked: c.unlock_count === 0,
      is_active: c.slug === "warrior",
      unlock_progress: 0,
    }))
    await supabase.from("user_characters").insert(inserts)
    const { data: refreshed } = await supabase
      .from("user_characters")
      .select("*, character:game_characters(*)")
      .eq("user_id", user.id)
    userChars = refreshed ?? []
  }

  // Find first undefeated monster in current stage
  const currentStage = gameState?.current_stage ?? 1
  const { data: stageMonsters } = await supabase
    .from("monsters")
    .select("*")
    .eq("stage_level", currentStage)
    .order("sort_order")

  const { data: defeatedRecords } = await supabase
    .from("battle_records")
    .select("monster_id")
    .eq("user_id", user.id)
    .eq("result", "victory")
    .in("monster_id", (stageMonsters ?? []).map((m) => m.id))

  const defeatedIds = new Set((defeatedRecords ?? []).map((r) => r.monster_id))
  const currentMonster = (stageMonsters ?? []).find((m) => !defeatedIds.has(m.id)) ?? null

  return (
    <GameClient
      initialEnergy={gameState?.battle_energy ?? 0}
      initialStage={gameState?.current_stage ?? 1}
      totalDefeated={gameState?.total_monsters_defeated ?? 0}
      characters={userChars}
      currentMonster={currentMonster}
    />
  )
}
