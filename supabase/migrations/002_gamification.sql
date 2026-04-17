-- ============================================================
-- Migration 002: Gamification System
-- XP, Levels, Streaks, Missions, Badges
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- USER GAMIFICATION STATE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.user_gamification (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_xp            INTEGER NOT NULL DEFAULT 0,
  current_level       SMALLINT NOT NULL DEFAULT 1,
  current_streak      SMALLINT NOT NULL DEFAULT 0,
  longest_streak      SMALLINT NOT NULL DEFAULT 0,
  last_checkin_date   DATE,
  streak_shield_count SMALLINT NOT NULL DEFAULT 0,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_user_gamification_updated_at
  BEFORE UPDATE ON public.user_gamification
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own gamification"
  ON public.user_gamification FOR ALL
  USING (auth.uid() = user_id);

-- Auto-create gamification record when profile is created
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_gamification (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();

-- ─────────────────────────────────────────────────────────────
-- XP TRANSACTIONS LOG
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.xp_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  xp_amount   SMALLINT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'daily_checkin', 'streak_bonus', 'metric_input',
    'habit_diet', 'habit_exercise', 'habit_medication',
    'mission_complete', 'badge_unlock', 'level_up_bonus'
  )),
  source_id   UUID,
  description TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_xp_transactions_user
  ON public.xp_transactions(user_id, created_at DESC);

ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own xp transactions"
  ON public.xp_transactions FOR ALL
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- AWARD XP RPC (atomic XP + level update)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id     UUID,
  p_xp_amount   SMALLINT,
  p_source_type TEXT,
  p_source_id   UUID DEFAULT NULL,
  p_description TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_new_xp        INTEGER;
  v_old_level     SMALLINT;
  v_new_level     SMALLINT;
  v_leveled_up    BOOLEAN := FALSE;
BEGIN
  -- Insert XP transaction
  INSERT INTO public.xp_transactions (user_id, xp_amount, source_type, source_id, description)
  VALUES (p_user_id, p_xp_amount, p_source_type, p_source_id, p_description);

  -- Update total XP and get old level
  UPDATE public.user_gamification
  SET total_xp = total_xp + p_xp_amount
  WHERE user_id = p_user_id
  RETURNING total_xp, current_level INTO v_new_xp, v_old_level;

  -- Calculate new level based on XP thresholds
  v_new_level := CASE
    WHEN v_new_xp >= 15000 THEN 10
    WHEN v_new_xp >= 11500 THEN 9
    WHEN v_new_xp >= 8000  THEN 8
    WHEN v_new_xp >= 5500  THEN 7
    WHEN v_new_xp >= 3500  THEN 6
    WHEN v_new_xp >= 2000  THEN 5
    WHEN v_new_xp >= 1000  THEN 4
    WHEN v_new_xp >= 500   THEN 3
    WHEN v_new_xp >= 200   THEN 2
    ELSE 1
  END;

  -- Update level if changed
  IF v_new_level > v_old_level THEN
    UPDATE public.user_gamification
    SET current_level = v_new_level
    WHERE user_id = p_user_id;
    v_leveled_up := TRUE;
  END IF;

  RETURN jsonb_build_object(
    'total_xp', v_new_xp,
    'old_level', v_old_level,
    'new_level', v_new_level,
    'leveled_up', v_leveled_up
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- DAILY CHECK-IN + STREAK RPC
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.process_daily_checkin(
  p_user_id UUID,
  p_date    DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_gamification      public.user_gamification%ROWTYPE;
  v_new_streak        SMALLINT;
  v_streak_xp         SMALLINT := 0;
  v_base_xp           SMALLINT := 10;
  v_days_since_last   INTEGER;
BEGIN
  SELECT * INTO v_gamification
  FROM public.user_gamification
  WHERE user_id = p_user_id;

  -- Already checked in today
  IF v_gamification.last_checkin_date = p_date THEN
    RETURN jsonb_build_object('already_checked_in', true, 'streak', v_gamification.current_streak);
  END IF;

  v_days_since_last := COALESCE(p_date - v_gamification.last_checkin_date, 999);

  IF v_days_since_last = 1 THEN
    -- Consecutive day: increment streak
    v_new_streak := v_gamification.current_streak + 1;
  ELSIF v_days_since_last = 2 AND v_gamification.streak_shield_count > 0 THEN
    -- Missed 1 day but has shield: protect streak
    v_new_streak := v_gamification.current_streak + 1;
    UPDATE public.user_gamification
    SET streak_shield_count = streak_shield_count - 1
    WHERE user_id = p_user_id;
  ELSE
    -- Streak broken
    v_new_streak := 1;
  END IF;

  -- Calculate streak bonus XP
  v_streak_xp := CASE
    WHEN v_new_streak >= 30 THEN 30
    WHEN v_new_streak >= 14 THEN 20
    WHEN v_new_streak >= 7  THEN 15
    WHEN v_new_streak >= 3  THEN 10
    ELSE 0
  END;

  -- Award streak shields at milestones
  IF v_new_streak IN (7, 30) THEN
    UPDATE public.user_gamification
    SET streak_shield_count = LEAST(streak_shield_count + 1, 3)
    WHERE user_id = p_user_id;
  ELSIF v_new_streak = 90 THEN
    UPDATE public.user_gamification
    SET streak_shield_count = LEAST(streak_shield_count + 2, 3)
    WHERE user_id = p_user_id;
  END IF;

  -- Update streak and last checkin date
  UPDATE public.user_gamification
  SET
    current_streak    = v_new_streak,
    longest_streak    = GREATEST(longest_streak, v_new_streak),
    last_checkin_date = p_date
  WHERE user_id = p_user_id;

  -- Award base XP
  PERFORM public.award_xp(p_user_id, v_base_xp, 'daily_checkin', NULL, '每日簽到');

  -- Award streak bonus XP if any
  IF v_streak_xp > 0 THEN
    PERFORM public.award_xp(p_user_id, v_streak_xp, 'streak_bonus', NULL,
      '連續' || v_new_streak || '天加成');
  END IF;

  RETURN jsonb_build_object(
    'streak', v_new_streak,
    'base_xp', v_base_xp,
    'streak_xp', v_streak_xp,
    'total_xp_awarded', v_base_xp + v_streak_xp,
    'already_checked_in', false
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- BADGE DEFINITIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.badge_definitions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT NOT NULL,
  icon_url        TEXT NOT NULL DEFAULT '',
  category        TEXT NOT NULL CHECK (category IN (
    'milestone', 'streak', 'metrics', 'habits', 'social', 'special'
  )),
  rarity          TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN (
    'common', 'rare', 'epic', 'legendary'
  )),
  xp_bonus        SMALLINT NOT NULL DEFAULT 0,
  condition_json  JSONB NOT NULL,
  sort_order      SMALLINT NOT NULL DEFAULT 0
);

-- Anyone can read badge definitions
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read badge definitions"
  ON public.badge_definitions FOR SELECT
  USING (true);

-- ─────────────────────────────────────────────────────────────
-- USER BADGES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.user_badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id    UUID NOT NULL REFERENCES public.badge_definitions(id),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user
  ON public.user_badges(user_id, unlocked_at DESC);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own badges"
  ON public.user_badges FOR ALL
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- MISSION TEMPLATES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.mission_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  mission_type    TEXT NOT NULL CHECK (mission_type IN ('weekly', 'monthly', 'special')),
  category        TEXT NOT NULL CHECK (category IN (
    'metrics', 'diet', 'exercise', 'medication', 'streak', 'mixed'
  )),
  target_count    INTEGER NOT NULL DEFAULT 1,
  xp_reward       SMALLINT NOT NULL,
  badge_reward    UUID REFERENCES public.badge_definitions(id),
  condition_json  JSONB NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.mission_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read mission templates"
  ON public.mission_templates FOR SELECT
  USING (true);

-- ─────────────────────────────────────────────────────────────
-- USER MISSIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.user_missions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id   UUID NOT NULL REFERENCES public.mission_templates(id),
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  current_count INTEGER NOT NULL DEFAULT 0,
  target_count  INTEGER NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'expired', 'abandoned')),
  completed_at  TIMESTAMPTZ,
  xp_claimed    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, template_id, period_start)
);

CREATE INDEX idx_user_missions_user_active
  ON public.user_missions(user_id, status)
  WHERE status = 'active';

ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own missions"
  ON public.user_missions FOR ALL
  USING (auth.uid() = user_id);
