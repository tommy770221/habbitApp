import type { SupabaseClient } from "@supabase/supabase-js"
import { XP_RULES } from "./xp"

interface BadgeCondition {
  type: "first_action" | "streak_days" | "total_count" | "metric_value" | "level_reached" | "mission_count" | "consecutive_habit"
  value?: number
  metric?: string
  habit?: string
  requires_all?: boolean
}

interface BadgeRow {
  id: string
  name: string
  rarity: "common" | "rare" | "epic" | "legendary"
  xp_bonus: number
  condition_json: BadgeCondition
}

const RARITY_XP: Record<string, number> = {
  common: XP_RULES.badge_common,
  rare: XP_RULES.badge_rare,
  epic: XP_RULES.badge_epic,
  legendary: XP_RULES.badge_legendary,
}

export async function checkAndAwardBadges(
  supabase: SupabaseClient,
  userId: string
): Promise<{ awarded: string[]; xp_total: number }> {
  const [{ data: allBadges }, { data: userBadges }] = await Promise.all([
    supabase.from("badge_definitions").select("id, name, rarity, xp_bonus, condition_json"),
    supabase.from("user_badges").select("badge_id").eq("user_id", userId),
  ])

  if (!allBadges?.length) return { awarded: [], xp_total: 0 }

  const ownedIds = new Set((userBadges ?? []).map((b: any) => b.badge_id))
  const unearned = (allBadges as BadgeRow[]).filter(b => !ownedIds.has(b.id))
  if (!unearned.length) return { awarded: [], xp_total: 0 }

  // Bulk-fetch shared data needed across multiple condition types
  const [
    { data: gamif },
    { data: habitRows },
    { data: metricRows },
    { count: completedMissions },
  ] = await Promise.all([
    supabase.from("user_gamification").select("current_streak, current_level").eq("user_id", userId).single(),
    supabase.from("habit_checkins").select("habit_type").eq("user_id", userId),
    supabase.from("health_metrics").select("metric_type").eq("user_id", userId),
    supabase.from("user_missions").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "completed"),
  ])

  const habitCount: Record<string, number> = {}
  for (const r of habitRows ?? []) habitCount[r.habit_type] = (habitCount[r.habit_type] ?? 0) + 1

  const metricCount: Record<string, number> = {}
  for (const r of metricRows ?? []) metricCount[r.metric_type] = (metricCount[r.metric_type] ?? 0) + 1

  const currentStreak = gamif?.current_streak ?? 0
  const currentLevel = gamif?.current_level ?? 1

  const earned: BadgeRow[] = []

  for (const badge of unearned) {
    const cond = badge.condition_json
    let qualifies = false

    switch (cond.type) {
      case "first_action":
        if (cond.habit) qualifies = (habitCount[cond.habit] ?? 0) >= 1
        else if (cond.metric) qualifies = (metricCount[cond.metric] ?? 0) >= 1
        break

      case "streak_days":
        qualifies = currentStreak >= (cond.value ?? 0)
        break

      case "total_count":
        if (cond.habit) qualifies = (habitCount[cond.habit] ?? 0) >= (cond.value ?? 0)
        else if (cond.metric) qualifies = (metricCount[cond.metric] ?? 0) >= (cond.value ?? 0)
        break

      case "level_reached":
        qualifies = currentLevel >= (cond.value ?? 0)
        break

      case "mission_count":
        qualifies = (completedMissions ?? 0) >= (cond.value ?? 0)
        break

      case "metric_value":
        // glucose_control: N blood sugar readings in normal range
        if (cond.metric === "blood_sugar") {
          const { data: glucoseRows } = await supabase
            .from("health_metrics")
            .select("glucose_value, glucose_context")
            .eq("user_id", userId)
            .eq("metric_type", "blood_sugar")
          const normalCount = (glucoseRows ?? []).filter((r: any) =>
            r.glucose_context === "fasting" || r.glucose_context === "before_meal"
              ? r.glucose_value < 5.6
              : r.glucose_value < 7.8
          ).length
          qualifies = normalCount >= (cond.value ?? 10)
        }
        break

      case "consecutive_habit":
        if (cond.requires_all) {
          // All 3 habits completed on N consecutive calendar days (up to today)
          const since = new Date()
          since.setDate(since.getDate() - (cond.value ?? 7) + 1)
          const sinceStr = since.toISOString().split("T")[0]
          const { data: recentCheckins } = await supabase
            .from("habit_checkins")
            .select("checkin_date, habit_type")
            .eq("user_id", userId)
            .gte("checkin_date", sinceStr)
          if (recentCheckins) {
            const byDate: Record<string, Set<string>> = {}
            for (const r of recentCheckins) {
              if (!byDate[r.checkin_date]) byDate[r.checkin_date] = new Set()
              byDate[r.checkin_date].add(r.habit_type)
            }
            const fullDays = Object.values(byDate).filter(
              types => types.has("diet") && types.has("exercise") && types.has("medication")
            ).length
            qualifies = fullDays >= (cond.value ?? 7)
          }
        } else if (cond.metric === "blood_pressure") {
          // Last N BP readings all within normal range (systolic ≤139, diastolic ≤89)
          const { data: bpRows } = await supabase
            .from("health_metrics")
            .select("systolic, diastolic")
            .eq("user_id", userId)
            .eq("metric_type", "blood_pressure")
            .order("recorded_at", { ascending: false })
            .limit(cond.value ?? 7)
          if ((bpRows?.length ?? 0) >= (cond.value ?? 7)) {
            qualifies = bpRows!.every((r: any) => r.systolic <= 139 && r.diastolic <= 89)
          }
        }
        break
    }

    if (qualifies) earned.push(badge)
  }

  if (!earned.length) return { awarded: [], xp_total: 0 }

  const now = new Date().toISOString()
  await supabase.from("user_badges").upsert(
    earned.map(b => ({ user_id: userId, badge_id: b.id, unlocked_at: now })),
    { onConflict: "user_id,badge_id", ignoreDuplicates: true }
  )

  let xpTotal = 0
  for (const badge of earned) {
    const xp = badge.xp_bonus || RARITY_XP[badge.rarity] || 25
    xpTotal += xp
    await supabase.rpc("award_xp", {
      p_user_id: userId,
      p_xp_amount: xp,
      p_source_type: "badge_unlock",
      p_source_id: badge.id,
      p_description: `解鎖徽章：${badge.name}`,
    })
  }

  return { awarded: earned.map(b => b.name), xp_total: xpTotal }
}
