-- ============================================================
-- Migration 001: Initial Schema
-- Profiles, Health Metrics, Habit Check-ins
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name            TEXT NOT NULL DEFAULT '',
  avatar_url              TEXT,
  birth_year              SMALLINT,
  gender                  TEXT CHECK (gender IN ('male', 'female', 'other')),
  -- 三高 flags
  has_hypertension        BOOLEAN NOT NULL DEFAULT FALSE,
  has_diabetes            BOOLEAN NOT NULL DEFAULT FALSE,
  has_hyperlipidemia      BOOLEAN NOT NULL DEFAULT FALSE,
  -- Personal health targets
  target_systolic         SMALLINT,
  target_diastolic        SMALLINT,
  target_glucose_fasting  NUMERIC(5,2),
  target_glucose_postmeal NUMERIC(5,2),
  target_ldl              NUMERIC(5,2),
  target_hdl              NUMERIC(5,2),
  target_triglycerides    NUMERIC(5,2),
  -- Onboarding completion flag
  onboarding_completed    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────
-- HEALTH METRICS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.health_metrics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metric_type     TEXT NOT NULL CHECK (metric_type IN ('blood_pressure', 'blood_sugar', 'blood_lipids')),
  -- Blood Pressure (mmHg)
  systolic        SMALLINT,
  diastolic       SMALLINT,
  pulse           SMALLINT,
  -- Blood Sugar (mmol/L)
  glucose_value   NUMERIC(5,2),
  glucose_context TEXT CHECK (glucose_context IN (
    'fasting', 'before_meal', 'after_meal_1h',
    'after_meal_2h', 'before_sleep', 'random'
  )),
  -- Blood Lipids (mmol/L)
  total_cholesterol NUMERIC(5,2),
  ldl               NUMERIC(5,2),
  hdl               NUMERIC(5,2),
  triglycerides     NUMERIC(5,2),
  -- Common
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_health_metrics_user_date
  ON public.health_metrics(user_id, recorded_at DESC);
CREATE INDEX idx_health_metrics_type
  ON public.health_metrics(user_id, metric_type, recorded_at DESC);

ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own health metrics"
  ON public.health_metrics FOR ALL
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- HABIT CHECK-INS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.habit_checkins (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  checkin_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  habit_type          TEXT NOT NULL CHECK (habit_type IN ('diet', 'exercise', 'medication')),
  -- Diet
  diet_score          SMALLINT CHECK (diet_score BETWEEN 1 AND 5),
  diet_tags           TEXT[],
  diet_notes          TEXT,
  -- Exercise
  exercise_type       TEXT,
  exercise_minutes    SMALLINT,
  exercise_intensity  TEXT CHECK (exercise_intensity IN ('low', 'medium', 'high')),
  -- Medication
  medications_taken   BOOLEAN,
  medication_notes    TEXT,
  -- XP
  xp_awarded          SMALLINT NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One entry per user per date per habit type
  UNIQUE(user_id, checkin_date, habit_type)
);

CREATE INDEX idx_habit_checkins_user_date
  ON public.habit_checkins(user_id, checkin_date DESC);

ALTER TABLE public.habit_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own habit checkins"
  ON public.habit_checkins FOR ALL
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- MEDICATION REMINDERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.medication_reminders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  medication_name       TEXT NOT NULL,
  reminder_times        TIME[] NOT NULL,
  days_of_week          SMALLINT[] NOT NULL DEFAULT '{1,2,3,4,5,6,7}',
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  push_subscription_id  UUID,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.medication_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own medication reminders"
  ON public.medication_reminders FOR ALL
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- PUSH SUBSCRIPTIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL UNIQUE,
  p256dh_key  TEXT NOT NULL,
  auth_key    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own push subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id);
