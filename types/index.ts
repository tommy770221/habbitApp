// ─── Auth / User ──────────────────────────────────────────────────

export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  birth_year: number | null
  gender: "male" | "female" | "other" | null
  has_hypertension: boolean
  has_diabetes: boolean
  has_hyperlipidemia: boolean
  target_systolic: number | null
  target_diastolic: number | null
  target_glucose_fasting: number | null
  target_glucose_postmeal: number | null
  target_ldl: number | null
  target_hdl: number | null
  target_triglycerides: number | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface HealthTargets {
  systolic?: number
  diastolic?: number
  glucose_fasting?: number
  glucose_postmeal?: number
  ldl?: number
  hdl?: number
  triglycerides?: number
}

// ─── Health Metrics ───────────────────────────────────────────────

export type MetricType = "blood_pressure" | "blood_sugar" | "blood_lipids"

export interface HealthMetric {
  id: string
  user_id: string
  recorded_at: string
  metric_type: MetricType
  // Blood pressure
  systolic: number | null
  diastolic: number | null
  pulse: number | null
  // Blood sugar
  glucose_value: number | null
  glucose_context: GlucoseContext | null
  // Lipids
  total_cholesterol: number | null
  ldl: number | null
  hdl: number | null
  triglycerides: number | null
  notes: string | null
  created_at: string
}

export type GlucoseContext =
  | "fasting"
  | "before_meal"
  | "after_meal_1h"
  | "after_meal_2h"
  | "before_sleep"
  | "random"

export const GLUCOSE_CONTEXT_LABELS: Record<GlucoseContext, string> = {
  fasting: "空腹",
  before_meal: "餐前",
  after_meal_1h: "餐後1小時",
  after_meal_2h: "餐後2小時",
  before_sleep: "睡前",
  random: "隨機",
}

export type MetricStatus = "正常" | "偏高" | "偏低" | "警告" | "危險"

export interface MetricStatusInfo {
  status: MetricStatus
  color: "green" | "yellow" | "orange" | "red" | "blue"
  bgClass: string
  textClass: string
  message: string
}

// ─── Habit Check-ins ──────────────────────────────────────────────

export type HabitType = "diet" | "exercise" | "medication"

export interface HabitCheckin {
  id: string
  user_id: string
  checkin_date: string // YYYY-MM-DD
  habit_type: HabitType
  // Diet
  diet_score: 1 | 2 | 3 | 4 | 5 | null
  diet_tags: DietTag[] | null
  diet_notes: string | null
  // Exercise
  exercise_type: string | null
  exercise_minutes: number | null
  exercise_intensity: "low" | "medium" | "high" | null
  // Medication
  medications_taken: boolean | null
  medication_notes: string | null
  // XP
  xp_awarded: number
  created_at: string
}

export type DietTag =
  | "低鹽"
  | "低糖"
  | "高纖"
  | "少油"
  | "多蔬果"
  | "控制份量"
  | "低升糖"

export type ExerciseType =
  | "散步"
  | "慢跑"
  | "游泳"
  | "騎車"
  | "太極拳"
  | "瑜伽"
  | "健身"
  | "舞蹈"
  | "其他"

export interface TodayCheckins {
  diet: HabitCheckin | null
  exercise: HabitCheckin | null
  medication: HabitCheckin | null
}

// ─── Gamification ─────────────────────────────────────────────────

export interface UserGamification {
  id: string
  user_id: string
  total_xp: number
  current_level: number
  current_streak: number
  longest_streak: number
  last_checkin_date: string | null
  streak_shield_count: number
  updated_at: string
}

export interface LevelDefinition {
  level: number
  title: string
  min_xp: number
  max_xp: number
  colorClass: string
  badgeClass: string
  icon: string
}

export const LEVEL_DEFINITIONS: LevelDefinition[] = [
  { level: 1, title: "健康新手", min_xp: 0, max_xp: 199, colorClass: "text-slate-600", badgeClass: "bg-slate-100 text-slate-700", icon: "🌱" },
  { level: 2, title: "健康學徒", min_xp: 200, max_xp: 499, colorClass: "text-blue-600", badgeClass: "bg-blue-100 text-blue-700", icon: "💧" },
  { level: 3, title: "健康探索者", min_xp: 500, max_xp: 999, colorClass: "text-cyan-600", badgeClass: "bg-cyan-100 text-cyan-700", icon: "🔍" },
  { level: 4, title: "健康實踐者", min_xp: 1000, max_xp: 1999, colorClass: "text-teal-600", badgeClass: "bg-teal-100 text-teal-700", icon: "⚡" },
  { level: 5, title: "健康守護者", min_xp: 2000, max_xp: 3499, colorClass: "text-green-600", badgeClass: "bg-green-100 text-green-700", icon: "🛡️" },
  { level: 6, title: "健康進階者", min_xp: 3500, max_xp: 5499, colorClass: "text-lime-600", badgeClass: "bg-lime-100 text-lime-700", icon: "🌿" },
  { level: 7, title: "健康挑戰者", min_xp: 5500, max_xp: 7999, colorClass: "text-yellow-600", badgeClass: "bg-yellow-100 text-yellow-700", icon: "⚔️" },
  { level: 8, title: "健康菁英", min_xp: 8000, max_xp: 11499, colorClass: "text-orange-600", badgeClass: "bg-orange-100 text-orange-700", icon: "🏅" },
  { level: 9, title: "健康導師", min_xp: 11500, max_xp: 14999, colorClass: "text-rose-600", badgeClass: "bg-rose-100 text-rose-700", icon: "🎓" },
  { level: 10, title: "健康達人", min_xp: 15000, max_xp: Infinity, colorClass: "text-purple-600", badgeClass: "bg-gradient-to-r from-purple-100 to-yellow-100 text-purple-700", icon: "👑" },
]

export function getLevelDefinition(level: number): LevelDefinition {
  return LEVEL_DEFINITIONS[Math.min(level - 1, 9)]
}

export function getLevelFromXP(xp: number): number {
  for (let i = LEVEL_DEFINITIONS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_DEFINITIONS[i].min_xp) return LEVEL_DEFINITIONS[i].level
  }
  return 1
}

export function getXPProgress(xp: number, level: number): number {
  const def = getLevelDefinition(level)
  if (level >= 10) return 100
  const range = def.max_xp - def.min_xp + 1
  const progress = xp - def.min_xp
  return Math.min(100, Math.round((progress / range) * 100))
}

export interface XPTransaction {
  id: string
  user_id: string
  xp_amount: number
  source_type: XPSourceType
  source_id: string | null
  description: string
  created_at: string
}

export type XPSourceType =
  | "daily_checkin"
  | "streak_bonus"
  | "metric_input"
  | "habit_diet"
  | "habit_exercise"
  | "habit_medication"
  | "mission_complete"
  | "badge_unlock"
  | "level_up_bonus"

// ─── Missions ─────────────────────────────────────────────────────

export type MissionType = "daily" | "weekly" | "monthly" | "special"
export type MissionCategory =
  | "metrics"
  | "diet"
  | "exercise"
  | "medication"
  | "streak"
  | "mixed"
export type MissionStatus = "active" | "completed" | "expired" | "abandoned"

export interface MissionTemplate {
  id: string
  title: string
  description: string
  mission_type: MissionType
  category: MissionCategory
  target_count: number
  xp_reward: number
  badge_reward: string | null
  condition_json: MissionCondition
  is_active: boolean
  created_at: string
}

export interface MissionCondition {
  type: "count" | "streak" | "value_threshold" | "composite"
  metric?: MetricType
  habit?: HabitType
  threshold?: number
  operator?: ">=" | "<=" | "==" | "range"
  range?: [number, number]
  sub_conditions?: MissionCondition[]
}

export interface DailyFormField {
  key: string
  label: string
  placeholder: string
}

export interface DailyFormCondition {
  type: "daily_form"
  habit_direction: "positive" | "negative"
  pattern: "commitment" | "craving" | "friction"
  template: string
  example: string
  fields: DailyFormField[]
}

export interface DailyMissionResponse {
  id: string
  user_id: string
  user_mission_id: string
  response_json: Record<string, string>
  created_at: string
}

export interface UserMission {
  id: string
  user_id: string
  template_id: string
  template: MissionTemplate
  period_start: string
  period_end: string
  current_count: number
  target_count: number
  status: MissionStatus
  completed_at: string | null
  xp_claimed: boolean
  created_at: string
  progress_percent: number // computed
}

// ─── RPG Game ─────────────────────────────────────────────────────

export interface GameCharacter {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  habit_type: string | null
  base_attack: number
  base_defense: number
  base_hp: number
  skill_name: string
  skill_desc: string
  skill_cost: number
  unlock_count: number
  sort_order: number
}

export interface Monster {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  max_hp: number
  attack_power: number
  stage_level: number
  xp_reward: number
  energy_reward: number
}

export interface UserGameState {
  user_id: string
  battle_energy: number
  current_stage: number
  total_monsters_defeated: number
}

export interface UserCharacter {
  id: string
  user_id: string
  character_id: string
  character: GameCharacter
  unlock_progress: number
  is_unlocked: boolean
  is_active: boolean
  unlocked_at: string | null
}

export type BattleResult = "victory" | "defeat" | "fled"

// ─── Badges ───────────────────────────────────────────────────────

export type BadgeCategory =
  | "milestone"
  | "streak"
  | "metrics"
  | "habits"
  | "social"
  | "special"
export type BadgeRarity = "common" | "rare" | "epic" | "legendary"

export interface BadgeDefinition {
  id: string
  slug: string
  name: string
  description: string
  icon_url: string
  category: BadgeCategory
  rarity: BadgeRarity
  xp_bonus: number
  condition_json: BadgeCondition
  sort_order: number
}

export interface BadgeCondition {
  type:
    | "first_action"
    | "streak_days"
    | "total_count"
    | "metric_value"
    | "level_reached"
    | "mission_count"
    | "consecutive_habit"
  value?: number
  metric?: MetricType
  habit?: HabitType
  consecutive?: boolean
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  badge: BadgeDefinition
  unlocked_at: string
}

export const BADGE_RARITY_CONFIG: Record<
  BadgeRarity,
  { label: string; borderClass: string; glowClass: string; textClass: string }
> = {
  common: {
    label: "普通",
    borderClass: "border-slate-300",
    glowClass: "",
    textClass: "text-slate-600",
  },
  rare: {
    label: "稀有",
    borderClass: "border-blue-400",
    glowClass: "shadow-blue-200",
    textClass: "text-blue-600",
  },
  epic: {
    label: "史詩",
    borderClass: "border-purple-400",
    glowClass: "shadow-purple-200",
    textClass: "text-purple-600",
  },
  legendary: {
    label: "傳說",
    borderClass: "border-yellow-400",
    glowClass: "shadow-yellow-200",
    textClass: "text-yellow-600",
  },
}

// ─── Notifications ────────────────────────────────────────────────

export interface MedicationReminder {
  id: string
  user_id: string
  medication_name: string
  reminder_times: string[] // ['08:00', '20:00']
  days_of_week: number[] // 1=Mon...7=Sun
  is_active: boolean
  push_subscription_id: string | null
  created_at: string
}

export interface PushSubscription {
  id: string
  user_id: string
  endpoint: string
  p256dh_key: string
  auth_key: string
  created_at: string
}

// ─── Dashboard ────────────────────────────────────────────────────

export interface DashboardData {
  profile: Profile
  gamification: UserGamification
  today_checkins: TodayCheckins
  recent_metrics: HealthMetric[]
  active_missions: UserMission[]
  recent_badges: UserBadge[]
  today_xp: number
}
