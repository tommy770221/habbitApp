-- ============================================================
-- Migration 003: Daily Missions + Daily Mission Responses
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Extend mission_type to include 'daily'
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.mission_templates
  DROP CONSTRAINT mission_templates_mission_type_check;
ALTER TABLE public.mission_templates
  ADD CONSTRAINT mission_templates_mission_type_check
  CHECK (mission_type IN ('daily', 'weekly', 'monthly', 'special'));

-- ─────────────────────────────────────────────────────────────
-- DAILY MISSION RESPONSES
-- Stores the user's filled-in text for each daily form mission
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.daily_mission_responses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_mission_id UUID NOT NULL REFERENCES public.user_missions(id) ON DELETE CASCADE,
  response_json   JSONB NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_daily_responses_user
  ON public.daily_mission_responses(user_id, created_at DESC);

ALTER TABLE public.daily_mission_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own daily responses"
  ON public.daily_mission_responses FOR ALL
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 6 DAILY MISSION TEMPLATES (form-based)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.mission_templates (title, description, mission_type, category, target_count, xp_reward, condition_json) VALUES
(
  '好習慣承諾',
  '用具體計畫承諾你今天要養成的好習慣',
  'daily', 'mixed', 1, 20,
  '{"type":"daily_form","habit_direction":"positive","pattern":"commitment","template":"我會在＿點＿分在＿地點，進行＿活動持續＿多久","example":"我會在早上8點00分在河堤，進行跑步訓練持續30分鐘","fields":[{"key":"time_hour","label":"幾點","placeholder":"例: 早上8"},{"key":"time_minute","label":"幾分","placeholder":"例: 00"},{"key":"location","label":"地點","placeholder":"例: 河堤"},{"key":"activity","label":"活動","placeholder":"例: 跑步訓練"},{"key":"duration","label":"持續多久","placeholder":"例: 30分鐘"}]}'
),
(
  '好習慣渴望',
  '釐清你養成好習慣的動機與需求',
  'daily', 'mixed', 1, 20,
  '{"type":"daily_form","habit_direction":"positive","pattern":"craving","template":"我渴望＿渴望，進行＿活動可以滿足我＿需求，為我帶來＿好處","example":"我渴望變瘦，進行飲食控制可以滿足我變瘦的需求，為我帶來提升外貌的好處","fields":[{"key":"desire","label":"渴望","placeholder":"例: 變瘦"},{"key":"activity","label":"活動","placeholder":"例: 飲食控制"},{"key":"need","label":"滿足的需求","placeholder":"例: 變瘦的需求"},{"key":"benefit","label":"帶來的好處","placeholder":"例: 提升外貌"}]}'
),
(
  '好習慣阻力',
  '設計一個減少阻力的小步驟讓好習慣更容易開始',
  'daily', 'mixed', 1, 20,
  '{"type":"daily_form","habit_direction":"positive","pattern":"friction","template":"我會＿行動以減少我進行＿活動的阻力","example":"我會每天從運動2分鐘開始，以減少我無法運動30分鐘的阻力","fields":[{"key":"action","label":"我會做的事","placeholder":"例: 每天從2分鐘開始"},{"key":"activity","label":"活動","placeholder":"例: 運動30分鐘"}]}'
),
(
  '壞習慣承諾',
  '用具體情境承諾你要避開的壞習慣',
  'daily', 'mixed', 1, 20,
  '{"type":"daily_form","habit_direction":"negative","pattern":"commitment","template":"我將不會在＿點＿分在＿地點，進行＿活動","example":"我將不會在中午12:00在飲料店進行購買含糖飲料","fields":[{"key":"time_hour","label":"幾點","placeholder":"例: 中午12"},{"key":"time_minute","label":"幾分","placeholder":"例: 00"},{"key":"location","label":"地點","placeholder":"例: 飲料店"},{"key":"activity","label":"要避免的活動","placeholder":"例: 購買含糖飲料"}]}'
),
(
  '壞習慣渴望',
  '重新框架壞習慣無法滿足你真正的需求',
  'daily', 'mixed', 1, 20,
  '{"type":"daily_form","habit_direction":"negative","pattern":"craving","template":"我渴望＿渴望，進行＿活動不可以滿足我＿需求，為我帶來＿壞處","example":"我渴望變瘦，進行暴飲暴食不可以滿足我變瘦的需求，為我帶來身體不健康的壞處","fields":[{"key":"desire","label":"渴望","placeholder":"例: 變瘦"},{"key":"activity","label":"壞習慣活動","placeholder":"例: 暴飲暴食"},{"key":"need","label":"無法滿足的需求","placeholder":"例: 變瘦的需求"},{"key":"harm","label":"帶來的壞處","placeholder":"例: 身體不健康"}]}'
),
(
  '壞習慣阻力',
  '設計一個增加阻力的方法讓壞習慣更難發生',
  'daily', 'mixed', 1, 20,
  '{"type":"daily_form","habit_direction":"negative","pattern":"friction","template":"我會＿行動以增加我進行＿活動的阻力","example":"我會每天避開飲料店，以增加我喝含糖飲料的阻力","fields":[{"key":"action","label":"我會做的事","placeholder":"例: 每天避開飲料店"},{"key":"activity","label":"壞習慣活動","placeholder":"例: 喝含糖飲料"}]}'
);
