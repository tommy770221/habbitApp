// Auto-generated Supabase types placeholder
// Run: npx supabase gen types typescript --project-id <id> > lib/supabase/database.types.ts
// after connecting your Supabase project.

type ProfileRow = {
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

type HealthMetricRow = {
  id: string
  user_id: string
  recorded_at: string
  metric_type: "blood_pressure" | "blood_sugar" | "blood_lipids"
  systolic: number | null
  diastolic: number | null
  pulse: number | null
  glucose_value: number | null
  glucose_context: string | null
  total_cholesterol: number | null
  ldl: number | null
  hdl: number | null
  triglycerides: number | null
  notes: string | null
  created_at: string
}

type HabitCheckinRow = {
  id: string
  user_id: string
  checkin_date: string
  habit_type: "diet" | "exercise" | "medication"
  diet_score: number | null
  diet_tags: string[] | null
  diet_notes: string | null
  exercise_type: string | null
  exercise_minutes: number | null
  exercise_intensity: "low" | "medium" | "high" | null
  medications_taken: boolean | null
  medication_notes: string | null
  xp_awarded: number
  created_at: string
}

type UserGamificationRow = {
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

type XPTransactionRow = {
  id: string
  user_id: string
  xp_amount: number
  source_type: string
  source_id: string | null
  description: string
  created_at: string
}

type BadgeDefinitionRow = {
  id: string
  slug: string
  name: string
  description: string
  icon_url: string
  category: string
  rarity: "common" | "rare" | "epic" | "legendary"
  xp_bonus: number
  condition_json: Record<string, unknown>
  sort_order: number
}

type UserBadgeRow = {
  id: string
  user_id: string
  badge_id: string
  unlocked_at: string
}

type MissionTemplateRow = {
  id: string
  title: string
  description: string
  mission_type: "weekly" | "monthly" | "special"
  category: string
  target_count: number
  xp_reward: number
  badge_reward: string | null
  condition_json: Record<string, unknown>
  is_active: boolean
  created_at: string
}

type UserMissionRow = {
  id: string
  user_id: string
  template_id: string
  period_start: string
  period_end: string
  current_count: number
  target_count: number
  status: "active" | "completed" | "expired" | "abandoned"
  completed_at: string | null
  xp_claimed: boolean
  created_at: string
}

type MedicationReminderRow = {
  id: string
  user_id: string
  medication_name: string
  reminder_times: string[]
  days_of_week: number[]
  is_active: boolean
  push_subscription_id: string | null
  created_at: string
}

type PushSubscriptionRow = {
  id: string
  user_id: string
  endpoint: string
  p256dh_key: string
  auth_key: string
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: Partial<ProfileRow> & { id: string }
        Update: Partial<ProfileRow>
      }
      health_metrics: {
        Row: HealthMetricRow
        Insert: Omit<HealthMetricRow, "id" | "created_at"> & { id?: string }
        Update: Partial<Omit<HealthMetricRow, "id" | "created_at" | "user_id">>
      }
      habit_checkins: {
        Row: HabitCheckinRow
        Insert: Omit<HabitCheckinRow, "id" | "created_at"> & { id?: string }
        Update: Partial<Omit<HabitCheckinRow, "id" | "created_at" | "user_id">>
      }
      user_gamification: {
        Row: UserGamificationRow
        Insert: Omit<UserGamificationRow, "id" | "updated_at"> & { id?: string }
        Update: Partial<Omit<UserGamificationRow, "id" | "user_id">>
      }
      xp_transactions: {
        Row: XPTransactionRow
        Insert: Omit<XPTransactionRow, "id" | "created_at"> & { id?: string }
        Update: never
      }
      badge_definitions: {
        Row: BadgeDefinitionRow
        Insert: Omit<BadgeDefinitionRow, "id"> & { id?: string }
        Update: Partial<Omit<BadgeDefinitionRow, "id">>
      }
      user_badges: {
        Row: UserBadgeRow
        Insert: Omit<UserBadgeRow, "id" | "unlocked_at"> & { id?: string }
        Update: never
      }
      mission_templates: {
        Row: MissionTemplateRow
        Insert: Omit<MissionTemplateRow, "id" | "created_at"> & { id?: string }
        Update: Partial<Omit<MissionTemplateRow, "id" | "created_at">>
      }
      user_missions: {
        Row: UserMissionRow
        Insert: Omit<UserMissionRow, "id" | "created_at"> & { id?: string }
        Update: Partial<Omit<UserMissionRow, "id" | "created_at" | "user_id">>
      }
      medication_reminders: {
        Row: MedicationReminderRow
        Insert: Omit<MedicationReminderRow, "id" | "created_at"> & { id?: string }
        Update: Partial<Omit<MedicationReminderRow, "id" | "created_at" | "user_id">>
      }
      push_subscriptions: {
        Row: PushSubscriptionRow
        Insert: Omit<PushSubscriptionRow, "id" | "created_at"> & { id?: string }
        Update: never
      }
    }
    Functions: {
      award_xp: {
        Args: {
          p_user_id: string
          p_xp_amount: number
          p_source_type: string
          p_source_id?: string
          p_description?: string
        }
        Returns: {
          total_xp: number
          old_level: number
          new_level: number
          leveled_up: boolean
        }
      }
      process_daily_checkin: {
        Args: { p_user_id: string; p_date?: string }
        Returns: {
          streak: number
          base_xp: number
          streak_xp: number
          total_xp_awarded: number
          already_checked_in: boolean
        }
      }
    }
    Enums: Record<string, never>
  }
}
