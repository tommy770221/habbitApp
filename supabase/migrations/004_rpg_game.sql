-- ============================================================
-- Migration 004: RPG Game System
-- Characters, Monsters, Battle Records, User Game State
-- ============================================================

-- ── Game Characters ──────────────────────────────────────────
CREATE TABLE public.game_characters (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL,
  icon          TEXT NOT NULL,
  habit_type    TEXT,
  base_attack   SMALLINT NOT NULL DEFAULT 15,
  base_defense  SMALLINT NOT NULL DEFAULT 5,
  base_hp       SMALLINT NOT NULL DEFAULT 100,
  skill_name    TEXT NOT NULL,
  skill_desc    TEXT NOT NULL,
  skill_cost    SMALLINT NOT NULL DEFAULT 30,
  unlock_count  SMALLINT NOT NULL DEFAULT 0,
  sort_order    SMALLINT NOT NULL DEFAULT 0
);
ALTER TABLE public.game_characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads characters" ON public.game_characters FOR SELECT USING (true);

-- ── Monsters ─────────────────────────────────────────────────
CREATE TABLE public.monsters (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL,
  icon          TEXT NOT NULL,
  max_hp        SMALLINT NOT NULL,
  attack_power  SMALLINT NOT NULL,
  stage_level   SMALLINT NOT NULL DEFAULT 1,
  xp_reward     SMALLINT NOT NULL DEFAULT 50,
  energy_reward SMALLINT NOT NULL DEFAULT 20,
  sort_order    SMALLINT NOT NULL DEFAULT 0
);
ALTER TABLE public.monsters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads monsters" ON public.monsters FOR SELECT USING (true);

-- ── User Game State ───────────────────────────────────────────
CREATE TABLE public.user_game_state (
  user_id                 UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  battle_energy           SMALLINT NOT NULL DEFAULT 0,
  current_stage           SMALLINT NOT NULL DEFAULT 1,
  total_monsters_defeated INTEGER NOT NULL DEFAULT 0,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.user_game_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own game state"
  ON public.user_game_state FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER update_user_game_state_updated_at
  BEFORE UPDATE ON public.user_game_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create game state when profile is created
CREATE OR REPLACE FUNCTION public.handle_new_game_state()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_game_state (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_profile_created_game
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_game_state();

-- ── User Character Collection ─────────────────────────────────
CREATE TABLE public.user_characters (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  character_id    UUID NOT NULL REFERENCES public.game_characters(id),
  unlock_progress SMALLINT NOT NULL DEFAULT 0,
  is_unlocked     BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT FALSE,
  unlocked_at     TIMESTAMPTZ,
  UNIQUE(user_id, character_id)
);
CREATE INDEX idx_user_characters_user ON public.user_characters(user_id);
ALTER TABLE public.user_characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own characters"
  ON public.user_characters FOR ALL USING (auth.uid() = user_id);

-- ── Battle Records ────────────────────────────────────────────
CREATE TABLE public.battle_records (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  monster_id     UUID NOT NULL REFERENCES public.monsters(id),
  character_id   UUID NOT NULL REFERENCES public.game_characters(id),
  result         TEXT NOT NULL CHECK (result IN ('victory', 'defeat', 'fled')),
  turns          SMALLINT NOT NULL DEFAULT 0,
  energy_used    SMALLINT NOT NULL DEFAULT 0,
  xp_reward      SMALLINT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_battle_records_user ON public.battle_records(user_id, created_at DESC);
ALTER TABLE public.battle_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own battles"
  ON public.battle_records FOR ALL USING (auth.uid() = user_id);

-- ── RPC: Add Battle Energy (atomic, capped at 100) ───────────
CREATE OR REPLACE FUNCTION public.add_battle_energy(
  p_user_id UUID,
  p_amount  SMALLINT
)
RETURNS SMALLINT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_new_energy SMALLINT;
BEGIN
  INSERT INTO public.user_game_state (user_id, battle_energy)
  VALUES (p_user_id, LEAST(100, p_amount))
  ON CONFLICT (user_id) DO UPDATE
    SET battle_energy = LEAST(100, public.user_game_state.battle_energy + p_amount),
        updated_at    = NOW()
  RETURNING battle_energy INTO v_new_energy;
  RETURN v_new_energy;
END;
$$;

-- ── Seed: Characters ──────────────────────────────────────────
INSERT INTO public.game_characters (slug, name, description, icon, habit_type, base_attack, base_defense, base_hp, skill_name, skill_desc, skill_cost, unlock_count, sort_order) VALUES
('warrior',  '健康勇士',   '平衡型戰士，適合初學者使用',         '⚔️',  NULL,         15, 8,  100, '強力衝擊', '造成普通攻擊 1.5 倍傷害',   30, 0,  1),
('mage',     '飲食法師',   '用飲食知識驅散不健康的力量',         '🧙',  'diet',       12, 6,  90,  '淨化術',   '攻擊怪物並回復 15 HP',      30, 10, 2),
('fighter',  '運動戰士',   '強悍體魄讓他面對任何挑戰',           '🥊',  'exercise',   20, 5,  110, '爆發衝刺', '造成 35 點固定傷害',        30, 10, 3),
('guardian', '藥師守護者', '精準用藥讓他在戰場上立於不敗之地',   '🛡️',  'medication', 10, 15, 120, '護盾術',   '本回合免疫怪物攻擊',        30, 10, 4);

-- ── Seed: Monsters ────────────────────────────────────────────
INSERT INTO public.monsters (slug, name, description, icon, max_hp, attack_power, stage_level, xp_reward, energy_reward, sort_order) VALUES
('laziness',          '懶惰蟲',     '讓人不想動的懶惰具現化',       '🐛',  60,  8,  1, 30,  10, 10),
('sugar_spirit',      '甜食精靈',   '用甜蜜誘惑侵蝕你的健康',       '🍬',  80,  10, 1, 40,  15, 20),
('junk_food_beast',   '暴食獸',     '失控食慾的可怕化身',           '🍔',  120, 14, 2, 60,  20, 30),
('sugar_drink_demon', '飲料惡魔',   '含糖飲料的黑暗靈魂',           '🥤',  100, 12, 2, 50,  18, 40),
('hypertension',      '高血壓魔',   '長期不良習慣累積的惡靈',       '😤',  150, 18, 3, 80,  25, 50),
('glucose_specter',   '高血糖惡靈', '失控血糖形成的邪惡幽靈',       '👻',  140, 16, 3, 75,  22, 60),
('obesity_giant',     '肥胖巨人',   '長年積累的不健康習慣怪物',     '🏋️', 200, 22, 4, 100, 30, 70),
('disease_lord',      '萬病之源',   '所有不健康習慣的最終型態',     '💀',  300, 28, 5, 200, 50, 80);
