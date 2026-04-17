// XP rules and helpers (client-safe, no DB calls)

export const XP_RULES = {
  daily_checkin: 10,
  metric_blood_pressure: 20,
  metric_blood_sugar: 20,
  metric_blood_lipids: 25,
  habit_diet: 15,
  habit_exercise_base: 20,
  habit_medication: 15,
  // Mission XP defined per template in DB
  badge_common: 25,
  badge_rare: 75,
  badge_epic: 150,
  badge_legendary: 500,
} as const

export function calculateExerciseXP(minutes: number): number {
  return XP_RULES.habit_exercise_base + Math.min(20, Math.floor(minutes / 10) * 2)
}

export function calculateStreakBonusXP(streak: number): number {
  if (streak >= 30) return 30
  if (streak >= 14) return 20
  if (streak >= 7) return 15
  if (streak >= 3) return 10
  return 0
}

export function getMaxDailyXP(): number {
  // Perfect day: checkin + streak30bonus + all metrics + all habits
  return (
    XP_RULES.daily_checkin + 30 +
    XP_RULES.metric_blood_pressure +
    XP_RULES.metric_blood_sugar +
    XP_RULES.metric_blood_lipids +
    XP_RULES.habit_diet +
    (XP_RULES.habit_exercise_base + 20) + // max exercise
    XP_RULES.habit_medication
  )
}
