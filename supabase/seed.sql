-- ============================================================
-- Seed: Badge Definitions + Mission Templates
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- BADGE DEFINITIONS
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.badge_definitions (slug, name, description, icon_url, category, rarity, xp_bonus, condition_json, sort_order) VALUES

-- Milestone: First actions
('first_bp',       '初次量壓',   '第一次記錄血壓數值', '🩺', 'metrics',  'common',    25, '{"type":"first_action","metric":"blood_pressure"}', 10),
('first_glucose',  '初次驗糖',   '第一次記錄血糖數值', '🩸', 'metrics',  'common',    25, '{"type":"first_action","metric":"blood_sugar"}',    11),
('first_lipids',   '初次驗脂',   '第一次記錄血脂數值', '💊', 'metrics',  'common',    25, '{"type":"first_action","metric":"blood_lipids"}',   12),
('first_diet',     '飲食初記',   '第一次完成飲食打卡', '🥗', 'habits',   'common',    25, '{"type":"first_action","habit":"diet"}',             20),
('first_exercise', '運動起步',   '第一次完成運動打卡', '🏃', 'habits',   'common',    25, '{"type":"first_action","habit":"exercise"}',         21),
('first_med',      '用藥初次',   '第一次完成用藥確認', '💊', 'habits',   'common',    25, '{"type":"first_action","habit":"medication"}',       22),

-- Streak badges
('streak_3',   '三日之約',   '連續打卡3天',    '🌱', 'streak', 'common',    25,  '{"type":"streak_days","value":3}',   30),
('streak_7',   '一週習慣',   '連續打卡7天',    '🔥', 'streak', 'common',    50,  '{"type":"streak_days","value":7}',   31),
('streak_14',  '兩週堅持',   '連續打卡14天',   '⚡', 'streak', 'common',    75,  '{"type":"streak_days","value":14}',  32),
('streak_30',  '月度堅持',   '連續打卡30天',   '🌟', 'streak', 'rare',     150,  '{"type":"streak_days","value":30}',  33),
('streak_90',  '季度英雄',   '連續打卡90天',   '🏆', 'streak', 'epic',     300,  '{"type":"streak_days","value":90}',  34),
('streak_180', '半年鐵人',   '連續打卡180天',  '💎', 'streak', 'epic',     500,  '{"type":"streak_days","value":180}', 35),
('streak_365', '年度達人',   '連續打卡365天',  '👑', 'streak', 'legendary',1000, '{"type":"streak_days","value":365}', 36),

-- Habit accumulation
('diet_30',      '飲食達人',   '累計完成30次飲食打卡',   '🥦', 'habits', 'rare',   75, '{"type":"total_count","habit":"diet","value":30}',      40),
('exercise_30',  '運動常客',   '累計完成30次運動打卡',   '💪', 'habits', 'rare',   75, '{"type":"total_count","habit":"exercise","value":30}',  41),
('exercise_100', '運動百場',   '累計完成100次運動打卡',  '🎯', 'habits', 'epic',  200, '{"type":"total_count","habit":"exercise","value":100}', 42),
('med_30',       '用藥守時',   '累計完成30次用藥打卡',   '⏰', 'habits', 'rare',   75, '{"type":"total_count","habit":"medication","value":30}',43),

-- Health metrics control
('bp_normal_week',   '血壓穩定週',  '連續7天血壓記錄在正常範圍', '❤️',  'metrics', 'epic',   200, '{"type":"consecutive_habit","metric":"blood_pressure","value":7}',  50),
('glucose_control',  '血糖控制者',  '10次餐後血糖在目標範圍內',   '🎯', 'metrics', 'rare',   150, '{"type":"metric_value","metric":"blood_sugar","value":10}',          51),
('bp_100',           '量壓百次',    '累計記錄血壓100次',           '📊', 'metrics', 'rare',    75, '{"type":"total_count","metric":"blood_pressure","value":100}',       52),

-- Level milestones
('level_5',  '中堅健康者', '達到第5等級',  '🛡️', 'milestone', 'common',    50, '{"type":"level_reached","value":5}',  60),
('level_10', '健康達人',   '達到最高第10等級', '👑', 'milestone', 'legendary', 500, '{"type":"level_reached","value":10}', 61),

-- Mission milestones
('mission_5',  '任務新秀', '完成5個任務',   '📋', 'milestone', 'common', 50,  '{"type":"mission_count","value":5}',  70),
('mission_20', '任務達人', '完成20個任務',  '🏅', 'milestone', 'rare',   150, '{"type":"mission_count","value":20}', 71),

-- Special
('all_habits_week', '完美一週', '連續7天三項習慣全部完成打卡', '⭐', 'special', 'epic', 300, '{"type":"consecutive_habit","value":7,"requires_all":true}', 80);

-- ─────────────────────────────────────────────────────────────
-- MISSION TEMPLATES
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.mission_templates (title, description, mission_type, category, target_count, xp_reward, condition_json) VALUES

-- Weekly missions (blood pressure)
('本週每天記錄血壓', '連續7天記錄血壓數值，養成定期監測的好習慣', 'weekly', 'metrics', 7, 100,
  '{"type":"count","metric":"blood_pressure","period":"week"}'),

-- Weekly missions (blood sugar)
('本週記錄血糖5次', '本週內記錄5次血糖數值', 'weekly', 'metrics', 5, 80,
  '{"type":"count","metric":"blood_sugar","period":"week"}'),

-- Weekly missions (exercise)
('本週運動達150分鐘', '本週累計運動時間達到150分鐘', 'weekly', 'exercise', 150, 100,
  '{"type":"count","habit":"exercise","count_field":"exercise_minutes","period":"week"}'),

('本週運動達300分鐘', '本週累計運動時間達到300分鐘（進階挑戰）', 'weekly', 'exercise', 300, 150,
  '{"type":"count","habit":"exercise","count_field":"exercise_minutes","period":"week"}'),

-- Weekly missions (diet)
('本週飲食打卡5天', '本週完成5天飲食打卡記錄', 'weekly', 'diet', 5, 80,
  '{"type":"count","habit":"diet","period":"week"}'),

('本週飲食評分均≥3', '本週每次飲食打卡評分達3分以上（5天）', 'weekly', 'diet', 5, 100,
  '{"type":"count","habit":"diet","filter":{"diet_score_min":3},"period":"week"}'),

-- Weekly missions (medication)
('本週準時服藥7天', '連續7天完成用藥確認打卡', 'weekly', 'medication', 7, 100,
  '{"type":"count","habit":"medication","period":"week"}'),

-- Weekly missions (mixed)
('本週完成所有習慣3天', '連續3天完成飲食、運動、用藥三項打卡', 'weekly', 'mixed', 3, 130,
  '{"type":"count","habit":"all","period":"week"}'),

('健康全能週', '本週每天至少記錄一項健康數值', 'weekly', 'metrics', 7, 120,
  '{"type":"count","any_metric":true,"period":"week"}'),

-- Monthly missions
('月度打卡達人', '本月完成20天以上任意習慣打卡', 'monthly', 'mixed', 20, 300,
  '{"type":"count","habit":"any","period":"month"}'),

('月度血壓監測師', '本月記錄血壓20次以上', 'monthly', 'metrics', 20, 250,
  '{"type":"count","metric":"blood_pressure","period":"month"}'),

('月度運動1000分鐘', '本月累計運動達1000分鐘', 'monthly', 'exercise', 1000, 400,
  '{"type":"count","habit":"exercise","count_field":"exercise_minutes","period":"month"}'),

-- Daily missions (form-based)
('好習慣承諾', '用具體計畫承諾你今天要養成的好習慣', 'daily', 'mixed', 1, 20,
  '{"type":"daily_form","habit_direction":"positive","pattern":"commitment","template":"我會在＿點＿分在＿地點，進行＿活動持續＿多久","example":"我會在早上8點00分在河堤，進行跑步訓練持續30分鐘","fields":[{"key":"time_hour","label":"幾點","placeholder":"例: 早上8"},{"key":"time_minute","label":"幾分","placeholder":"例: 00"},{"key":"location","label":"地點","placeholder":"例: 河堤"},{"key":"activity","label":"活動","placeholder":"例: 跑步訓練"},{"key":"duration","label":"持續多久","placeholder":"例: 30分鐘"}]}'),

('好習慣渴望', '釐清你養成好習慣的動機與需求', 'daily', 'mixed', 1, 20,
  '{"type":"daily_form","habit_direction":"positive","pattern":"craving","template":"我渴望＿渴望，進行＿活動可以滿足我＿需求，為我帶來＿好處","example":"我渴望變瘦，進行飲食控制可以滿足我變瘦的需求，為我帶來提升外貌的好處","fields":[{"key":"desire","label":"渴望","placeholder":"例: 變瘦"},{"key":"activity","label":"活動","placeholder":"例: 飲食控制"},{"key":"need","label":"滿足的需求","placeholder":"例: 變瘦的需求"},{"key":"benefit","label":"帶來的好處","placeholder":"例: 提升外貌"}]}'),

('好習慣阻力', '設計一個減少阻力的小步驟讓好習慣更容易開始', 'daily', 'mixed', 1, 20,
  '{"type":"daily_form","habit_direction":"positive","pattern":"friction","template":"我會＿行動以減少我進行＿活動的阻力","example":"我會每天從運動2分鐘開始，以減少我無法運動30分鐘的阻力","fields":[{"key":"action","label":"我會做的事","placeholder":"例: 每天從2分鐘開始"},{"key":"activity","label":"活動","placeholder":"例: 運動30分鐘"}]}'),

('壞習慣承諾', '用具體情境承諾你要避開的壞習慣', 'daily', 'mixed', 1, 20,
  '{"type":"daily_form","habit_direction":"negative","pattern":"commitment","template":"我將不會在＿點＿分在＿地點，進行＿活動","example":"我將不會在中午12:00在飲料店進行購買含糖飲料","fields":[{"key":"time_hour","label":"幾點","placeholder":"例: 中午12"},{"key":"time_minute","label":"幾分","placeholder":"例: 00"},{"key":"location","label":"地點","placeholder":"例: 飲料店"},{"key":"activity","label":"要避免的活動","placeholder":"例: 購買含糖飲料"}]}'),

('壞習慣渴望', '重新框架壞習慣無法滿足你真正的需求', 'daily', 'mixed', 1, 20,
  '{"type":"daily_form","habit_direction":"negative","pattern":"craving","template":"我渴望＿渴望，進行＿活動不可以滿足我＿需求，為我帶來＿壞處","example":"我渴望變瘦，進行暴飲暴食不可以滿足我變瘦的需求，為我帶來身體不健康的壞處","fields":[{"key":"desire","label":"渴望","placeholder":"例: 變瘦"},{"key":"activity","label":"壞習慣活動","placeholder":"例: 暴飲暴食"},{"key":"need","label":"無法滿足的需求","placeholder":"例: 變瘦的需求"},{"key":"harm","label":"帶來的壞處","placeholder":"例: 身體不健康"}]}'),

('壞習慣阻力', '設計一個增加阻力的方法讓壞習慣更難發生', 'daily', 'mixed', 1, 20,
  '{"type":"daily_form","habit_direction":"negative","pattern":"friction","template":"我會＿行動以增加我進行＿活動的阻力","example":"我會每天避開飲料店，以增加我喝含糖飲料的阻力","fields":[{"key":"action","label":"我會做的事","placeholder":"例: 每天避開飲料店"},{"key":"activity","label":"壞習慣活動","placeholder":"例: 喝含糖飲料"}]}');
