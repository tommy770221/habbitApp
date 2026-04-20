import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { toLocaleDateString } from "@/lib/utils"
import { checkAndAwardBadges } from "@/lib/gamification/awards"

const dietSchema = z.object({
  habit_type: z.literal("diet"),
  diet_score: z.number().min(1).max(5),
  diet_tags: z.array(z.string()).optional(),
  diet_notes: z.string().max(500).optional(),
  checkin_date: z.string().optional(),
})

const exerciseSchema = z.object({
  habit_type: z.literal("exercise"),
  exercise_type: z.string().max(50),
  exercise_minutes: z.number().min(1).max(600),
  exercise_intensity: z.enum(["low", "medium", "high"]),
  checkin_date: z.string().optional(),
})

const medicationSchema = z.object({
  habit_type: z.literal("medication"),
  medications_taken: z.boolean(),
  medication_notes: z.string().max(500).optional(),
  checkin_date: z.string().optional(),
})

const XP_BY_HABIT: Record<string, number> = {
  diet: 15,
  medication: 15,
}

function calcExerciseXP(minutes: number): number {
  return 20 + Math.min(20, Math.floor(minutes / 10) * 2)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { habit_type, checkin_date: rawDate, ...fields } = body
  const checkin_date = rawDate ?? toLocaleDateString()

  if (!habit_type) {
    return NextResponse.json({ error: "habit_type is required" }, { status: 400 })
  }

  let validated: Record<string, unknown>
  let xpAmount: number

  try {
    if (habit_type === "diet") {
      validated = dietSchema.parse({ habit_type, ...fields })
      xpAmount = XP_BY_HABIT.diet
    } else if (habit_type === "exercise") {
      validated = exerciseSchema.parse({ habit_type, ...fields })
      xpAmount = calcExerciseXP(fields.exercise_minutes ?? 0)
    } else if (habit_type === "medication") {
      validated = medicationSchema.parse({ habit_type, ...fields })
      xpAmount = XP_BY_HABIT.medication
    } else {
      return NextResponse.json({ error: "Invalid habit_type" }, { status: 400 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: "Validation failed", details: err.errors }, { status: 422 })
  }

  const { habit_type: _, ...insertFields } = validated as any

  const { data: checkin, error: upsertError } = await supabase
    .from("habit_checkins")
    .upsert(
      {
        user_id: user.id,
        checkin_date,
        habit_type,
        xp_awarded: xpAmount,
        ...insertFields,
      },
      { onConflict: "user_id,checkin_date,habit_type" }
    )
    .select()
    .single()

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  // Process daily check-in (updates streak)
  const { data: streakResult } = await supabase.rpc("process_daily_checkin", {
    p_user_id: user.id,
    p_date: checkin_date,
  })

  // Award XP for this habit
  const habitLabels: Record<string, string> = {
    diet: "飲食打卡",
    exercise: `運動打卡 (${fields.exercise_minutes ?? 0}分鐘)`,
    medication: "用藥確認",
  }

  const sourceTypes: Record<string, string> = {
    diet: "habit_diet",
    exercise: "habit_exercise",
    medication: "habit_medication",
  }

  const { data: xpResult } = await supabase.rpc("award_xp", {
    p_user_id: user.id,
    p_xp_amount: xpAmount,
    p_source_type: sourceTypes[habit_type],
    p_source_id: checkin.id,
    p_description: habitLabels[habit_type],
  })

  // Add battle energy (+10 per habit checkin)
  await supabase.rpc("add_battle_energy", { p_user_id: user.id, p_amount: 10 })

  // Update unlock progress for the habit-linked character
  const { data: habitChar } = await supabase
    .from("game_characters")
    .select("id, unlock_count")
    .eq("habit_type", habit_type)
    .maybeSingle()
  if (habitChar) {
    const { data: uc } = await supabase
      .from("user_characters")
      .select("unlock_progress, is_unlocked")
      .eq("user_id", user.id)
      .eq("character_id", habitChar.id)
      .maybeSingle()
    if (!uc?.is_unlocked) {
      const newProgress = (uc?.unlock_progress ?? 0) + 1
      const nowUnlocked = newProgress >= habitChar.unlock_count
      await supabase.from("user_characters").upsert(
        {
          user_id: user.id,
          character_id: habitChar.id,
          unlock_progress: newProgress,
          is_unlocked: nowUnlocked,
          unlocked_at: nowUnlocked ? new Date().toISOString() : null,
        },
        { onConflict: "user_id,character_id" }
      )
    }
  }

  const { awarded: badges, xp_total: badge_xp } = await checkAndAwardBadges(supabase, user.id)

  return NextResponse.json({
    checkin,
    xp_awarded: xpAmount,
    streak: streakResult?.streak ?? 0,
    streak_xp: streakResult?.streak_xp ?? 0,
    level_up: xpResult?.leveled_up ?? false,
    new_level: xpResult?.new_level,
    badges_awarded: badges,
    badge_xp,
  })
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date") ?? toLocaleDateString()
  const days = parseInt(searchParams.get("days") ?? "1")

  if (days === 1) {
    // Today's checkins
    const { data } = await supabase
      .from("habit_checkins")
      .select("*")
      .eq("user_id", user.id)
      .eq("checkin_date", date)

    return NextResponse.json({ checkins: data ?? [] })
  }

  // Range query
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data } = await supabase
    .from("habit_checkins")
    .select("*")
    .eq("user_id", user.id)
    .gte("checkin_date", toLocaleDateString(since))
    .order("checkin_date", { ascending: false })

  return NextResponse.json({ checkins: data ?? [] })
}
