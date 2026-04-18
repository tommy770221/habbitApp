"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, Swords, Shield, LogOut, Trophy, Star } from "lucide-react"
import type { Monster, UserCharacter } from "@/types"

type Screen = "select" | "ready" | "battle" | "result"

interface BattleLog { text: string; type: "player" | "monster" | "system" }

interface Props {
  initialEnergy: number
  initialStage: number
  totalDefeated: number
  characters: UserCharacter[]
  currentMonster: Monster | null
}

// ── Skill effects ─────────────────────────────────────────────
function applySkill(
  slug: string,
  playerHp: number,
  monsterHp: number,
  baseAttack: number
): { playerHp: number; monsterHp: number; log: string } {
  switch (slug) {
    case "warrior": {
      const dmg = Math.round(baseAttack * 1.5)
      return { playerHp, monsterHp: monsterHp - dmg, log: `強力衝擊！造成 ${dmg} 點傷害！` }
    }
    case "mage": {
      const dmg = baseAttack
      const heal = 15
      return { playerHp: Math.min(100, playerHp + heal), monsterHp: monsterHp - dmg, log: `淨化術！造成 ${dmg} 傷害並回復 ${heal} HP！` }
    }
    case "fighter": {
      const dmg = 35
      return { playerHp, monsterHp: monsterHp - dmg, log: `爆發衝刺！造成 ${dmg} 點固定傷害！` }
    }
    case "guardian": {
      return { playerHp, monsterHp: monsterHp - baseAttack, log: `護盾術！本回合免疫傷害！` }
    }
    default: {
      const dmg = Math.round(baseAttack * 1.5)
      return { playerHp, monsterHp: monsterHp - dmg, log: `技能攻擊！造成 ${dmg} 點傷害！` }
    }
  }
}

export function GameClient({ initialEnergy, initialStage, totalDefeated, characters, currentMonster }: Props) {
  const router = useRouter()
  const [screen, setScreen] = useState<Screen>("select")
  const [energy, setEnergy] = useState(initialEnergy)
  const [stage, setStage] = useState(initialStage)
  const [defeated, setDefeated] = useState(totalDefeated)
  const [monster, setMonster] = useState<Monster | null>(currentMonster)

  const [selectedChar, setSelectedChar] = useState<UserCharacter | null>(
    characters.find((c) => c.is_active && c.is_unlocked) ?? characters.find((c) => c.is_unlocked) ?? null
  )

  // Battle state
  const [playerHp, setPlayerHp] = useState(100)
  const [monsterHp, setMonsterHp] = useState(monster?.max_hp ?? 100)
  const [logs, setLogs] = useState<BattleLog[]>([])
  const [turns, setTurns] = useState(0)
  const [energyUsed, setEnergyUsed] = useState(0)
  const [shielded, setShielded] = useState(false)
  const [result, setResult] = useState<"victory" | "defeat" | "fled" | null>(null)
  const [xpGained, setXpGained] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)

  function addLog(text: string, type: BattleLog["type"]) {
    setLogs((prev) => [...prev.slice(-20), { text, type }])
    setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
  }

  function startBattle() {
    if (!selectedChar || !monster) return
    setPlayerHp(selectedChar.character.base_hp)
    setMonsterHp(monster.max_hp)
    setLogs([{ text: `${monster.name} 出現了！`, type: "system" }])
    setTurns(0)
    setEnergyUsed(0)
    setShielded(false)
    setResult(null)
    setScreen("battle")
  }

  function checkBattleEnd(pHp: number, mHp: number): "victory" | "defeat" | null {
    if (mHp <= 0) return "victory"
    if (pHp <= 0) return "defeat"
    return null
  }

  async function endBattle(outcome: "victory" | "defeat" | "fled", finalEnergyUsed: number, finalTurns: number) {
    setResult(outcome)
    setSubmitting(true)
    try {
      const res = await fetch("/api/game/battle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monster_id: monster?.id,
          character_id: selectedChar?.character_id,
          result: outcome,
          turns: finalTurns,
          energy_used: finalEnergyUsed,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setEnergy(data.energy_remaining ?? energy)
        if (outcome === "victory") {
          setXpGained(data.xp_awarded ?? 0)
          setDefeated((d) => d + 1)
          if (data.stage_advanced) setStage((s) => s + 1)
          if (data.next_monster) setMonster(data.next_monster)
        }
      }
    } finally {
      setSubmitting(false)
      setScreen("result")
    }
  }

  function handleAttack() {
    if (!monster || !selectedChar || result) return
    if (energy - energyUsed < 10) {
      addLog("⚡ 能量不足！需要 10 點能量攻擊。", "system")
      return
    }

    const char = selectedChar.character
    const dmg = char.base_attack + Math.floor(Math.random() * 5)
    const newMonsterHp = Math.max(0, monsterHp - dmg)
    addLog(`你攻擊了 ${monster.name}，造成 ${dmg} 點傷害！`, "player")
    setMonsterHp(newMonsterHp)

    const newEnergyUsed = energyUsed + 10
    setEnergyUsed(newEnergyUsed)
    const newTurns = turns + 1
    setTurns(newTurns)

    const end = checkBattleEnd(playerHp, newMonsterHp)
    if (end) { endBattle(end, newEnergyUsed, newTurns); return }

    // Monster counter-attack
    if (!shielded) {
      const monsterDmg = Math.max(1, monster.attack_power - char.base_defense + Math.floor(Math.random() * 4))
      const newPlayerHp = Math.max(0, playerHp - monsterDmg)
      addLog(`${monster.name} 反擊！你受到 ${monsterDmg} 點傷害。`, "monster")
      setPlayerHp(newPlayerHp)
      const end2 = checkBattleEnd(newPlayerHp, newMonsterHp)
      if (end2) { endBattle(end2, newEnergyUsed, newTurns) }
    } else {
      addLog("🛡️ 護盾抵擋了攻擊！", "system")
      setShielded(false)
    }
  }

  function handleSkill() {
    if (!monster || !selectedChar || result) return
    const skillCost = selectedChar.character.skill_cost
    if (energy - energyUsed < skillCost) {
      addLog(`⚡ 能量不足！技能需要 ${skillCost} 點能量。`, "system")
      return
    }

    const char = selectedChar.character
    const isGuardian = char.slug === "guardian"
    const { playerHp: newPHp, monsterHp: newMHp, log } = applySkill(
      char.slug, playerHp, monsterHp, char.base_attack
    )

    addLog(log, "player")
    setMonsterHp(Math.max(0, newMHp))
    setPlayerHp(Math.min(char.base_hp, newPHp))
    if (isGuardian) setShielded(true)

    const newEnergyUsed = energyUsed + skillCost
    setEnergyUsed(newEnergyUsed)
    const newTurns = turns + 1
    setTurns(newTurns)

    const end = checkBattleEnd(newPHp, Math.max(0, newMHp))
    if (end) { endBattle(end, newEnergyUsed, newTurns); return }

    if (!isGuardian) {
      const monsterDmg = Math.max(1, monster.attack_power - char.base_defense + Math.floor(Math.random() * 4))
      const newPlayerHp2 = Math.max(0, newPHp - monsterDmg)
      addLog(`${monster.name} 反擊！你受到 ${monsterDmg} 點傷害。`, "monster")
      setPlayerHp(newPlayerHp2)
      const end2 = checkBattleEnd(newPlayerHp2, Math.max(0, newMHp))
      if (end2) endBattle(end2, newEnergyUsed, newTurns)
    }
  }

  function handleFlee() {
    if (result) return
    addLog("你選擇了逃跑…", "system")
    endBattle("fled", Math.min(energyUsed + 5, energy), turns)
  }

  const hpPct = (hp: number, max: number) => Math.max(0, Math.min(100, Math.round((hp / max) * 100)))
  const availEnergy = energy - energyUsed
  const charMaxHp = selectedChar?.character.base_hp ?? 100

  // ── SCREEN: Select Character ──────────────────────────────
  if (screen === "select") {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">遊戲</h1>
          <div className="flex items-center gap-1 text-sm text-amber-600 font-semibold">
            <Zap className="w-4 h-4" />
            <span>{energy} / 100</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">目前關卡</p>
            <p className="font-bold text-purple-700">第 {stage} 關</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">擊敗怪物</p>
            <p className="font-bold text-purple-700">{defeated} 隻</p>
          </div>
          {monster && (
            <div className="text-right">
              <p className="text-xs text-gray-500">當前敵人</p>
              <p className="font-bold">{monster.icon} {monster.name}</p>
            </div>
          )}
        </div>

        <h2 className="text-sm font-semibold text-gray-700">選擇角色</h2>
        <div className="grid grid-cols-2 gap-3">
          {characters.map((uc) => {
            const c = uc.character
            const locked = !uc.is_unlocked
            const selected = selectedChar?.character_id === uc.character_id
            return (
              <button
                key={uc.id}
                onClick={() => !locked && setSelectedChar(uc)}
                className={`rounded-xl border-2 p-3 text-left transition-all ${
                  selected ? "border-purple-500 bg-purple-50" :
                  locked ? "border-gray-200 bg-gray-50 opacity-60" :
                  "border-gray-200 bg-white hover:border-purple-300"
                }`}
              >
                <div className="text-3xl mb-1">{c.icon}</div>
                <p className="font-semibold text-sm text-gray-900">{c.name}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{c.description}</p>
                {locked ? (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-0.5">
                      <span>解鎖進度</span>
                      <span>{uc.unlock_progress}/{c.unlock_count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="h-1.5 bg-purple-400 rounded-full"
                        style={{ width: `${Math.min(100, (uc.unlock_progress / c.unlock_count) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {c.habit_type === "diet" ? "飲食打卡" : c.habit_type === "exercise" ? "運動打卡" : "用藥打卡"} {c.unlock_count} 次解鎖
                    </p>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-gray-500">
                    <span>⚔️ {c.base_attack} 🛡️ {c.base_defense} ❤️ {c.base_hp}</span>
                    <p className="text-purple-600 mt-0.5">✨ {c.skill_name}</p>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {monster && selectedChar && (
          <Button
            className="w-full bg-purple-600 hover:bg-purple-700"
            onClick={() => setScreen("ready")}
          >
            <Swords className="w-4 h-4 mr-2" /> 出戰！
          </Button>
        )}
        {!monster && (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <p className="text-gray-400 text-sm">🎉 所有怪物已被擊敗！</p>
              <p className="text-gray-400 text-xs mt-1">新怪物即將出現…</p>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // ── SCREEN: Battle Ready ──────────────────────────────────
  if (screen === "ready" && monster && selectedChar) {
    const char = selectedChar.character
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold text-gray-900">準備出戰</h1>

        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
          <CardContent className="pt-4 text-center">
            <div className="text-5xl mb-2">{monster.icon}</div>
            <p className="font-bold text-lg text-gray-900">{monster.name}</p>
            <p className="text-sm text-gray-500 mt-1">{monster.description}</p>
            <div className="flex justify-center gap-6 mt-3 text-sm">
              <span className="text-red-600">❤️ HP {monster.max_hp}</span>
              <span className="text-orange-600">⚔️ 攻擊 {monster.attack_power}</span>
              <span className="text-yellow-600">🏆 +{monster.xp_reward} XP</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="pt-4 text-center">
            <div className="text-5xl mb-2">{char.icon}</div>
            <p className="font-bold text-lg">{char.name}</p>
            <div className="flex justify-center gap-6 mt-3 text-sm">
              <span>❤️ {char.base_hp}</span>
              <span>⚔️ {char.base_attack}</span>
              <span>🛡️ {char.base_defense}</span>
            </div>
            <div className="mt-2 text-sm text-purple-600">
              ✨ {char.skill_name}（{char.skill_cost} 能量）：{char.skill_desc}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
          <Zap className="w-4 h-4" />
          <span>當前能量：{energy} / 100</span>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setScreen("select")}>
            返回
          </Button>
          <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={startBattle}>
            <Swords className="w-4 h-4 mr-2" /> 開始戰鬥！
          </Button>
        </div>
      </div>
    )
  }

  // ── SCREEN: Battle ────────────────────────────────────────
  if (screen === "battle" && monster && selectedChar) {
    const char = selectedChar.character
    const mHpPct = hpPct(monsterHp, monster.max_hp)
    const pHpPct = hpPct(playerHp, charMaxHp)
    const inBattle = !result

    return (
      <div className="p-4 flex flex-col gap-3 min-h-screen">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold text-gray-900">戰鬥中</h1>
          <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold bg-amber-50 rounded-full px-2 py-1">
            <Zap className="w-3 h-3" />
            <span>{availEnergy} / 100</span>
          </div>
        </div>

        {/* Monster */}
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{monster.icon}</span>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{monster.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all bg-red-500"
                      style={{ width: `${mHpPct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">{monsterHp}/{monster.max_hp}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Battle log */}
        <div className="bg-gray-900 rounded-xl p-3 h-28 overflow-y-auto flex flex-col gap-1">
          {logs.map((l, i) => (
            <p key={i} className={`text-xs ${
              l.type === "player" ? "text-blue-300" :
              l.type === "monster" ? "text-red-300" : "text-gray-400"
            }`}>{l.text}</p>
          ))}
          <div ref={logsEndRef} />
        </div>

        {/* Player */}
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-purple-200">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{char.icon}</span>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{char.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all bg-green-500"
                      style={{ width: `${pHpPct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">{playerHp}/{charMaxHp}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2 mt-auto">
          <Button
            className="bg-blue-600 hover:bg-blue-700 flex flex-col h-16 gap-1"
            onClick={handleAttack}
            disabled={!inBattle || availEnergy < 10 || submitting}
          >
            <Swords className="w-4 h-4" />
            <span className="text-xs">普通攻擊</span>
            <span className="text-xs opacity-75">-10⚡</span>
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700 flex flex-col h-16 gap-1"
            onClick={handleSkill}
            disabled={!inBattle || availEnergy < char.skill_cost || submitting}
          >
            <Star className="w-4 h-4" />
            <span className="text-xs">{char.skill_name}</span>
            <span className="text-xs opacity-75">-{char.skill_cost}⚡</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col h-16 gap-1 border-gray-300"
            onClick={handleFlee}
            disabled={!inBattle || submitting}
          >
            <LogOut className="w-4 h-4" />
            <span className="text-xs">逃跑</span>
            <span className="text-xs opacity-75 text-gray-400">-5⚡</span>
          </Button>
        </div>
      </div>
    )
  }

  // ── SCREEN: Result ────────────────────────────────────────
  if (screen === "result") {
    const isVictory = result === "victory"
    const isFled = result === "fled"
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-screen gap-6">
        <div className="text-7xl">
          {isVictory ? "🏆" : isFled ? "🏃" : "💀"}
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          {isVictory ? "勝利！" : isFled ? "撤退！" : "落敗…"}
        </h2>
        {isVictory && (
          <Card className="w-full bg-gradient-to-br from-yellow-50 to-green-50 border-yellow-200">
            <CardContent className="pt-4 text-center">
              <p className="text-sm text-gray-600">獎勵</p>
              <p className="text-2xl font-bold text-green-700 mt-1">+{xpGained} XP</p>
              <p className="text-sm text-amber-600 mt-1">
                <Zap className="w-3.5 h-3.5 inline mr-0.5" />
                能量：{energy}
              </p>
            </CardContent>
          </Card>
        )}
        {!isVictory && (
          <p className="text-sm text-gray-500 text-center">
            {isFled ? "下次再挑戰吧！消耗了 5 點能量。" : "能量不足或體力耗盡，趕快打卡補充能量再來！"}
          </p>
        )}
        <div className="flex gap-3 w-full">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => { setScreen("select"); router.refresh() }}
          >
            返回選角
          </Button>
          {monster && (
            <Button
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              onClick={() => { setEnergyUsed(0); setResult(null); startBattle() }}
            >
              <Swords className="w-4 h-4 mr-2" />
              再戰！
            </Button>
          )}
        </div>
      </div>
    )
  }

  return null
}
