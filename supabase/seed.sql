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
  '{"type":"count","habit":"exercise","count_field":"exercise_minutes","period":"month"}');
