import type { SimConfig } from './config'
import type { CharacterStats } from './stats'
import { talentRank, type TalentPoints } from './talents'

export type DamageSource =
  | 'White' | 'Windfury' | 'Stormstrike' | 'Lightning Strike' | 'LS Nature' | 'Lightning Shield'
  | 'Earth Shock' | 'Flametongue' | 'Item procs'

export interface SimResult {
  dps: number
  stdev: number
  iterations: number
  /** DPS contributed by each source */
  breakdown: Record<string, number>
  counts: {
    swings: number; whiteMiss: number; whiteDodge: number; whiteParry: number; whiteGlance: number; whiteCrit: number
    windfuryProcs: number; stormstrikes: number; lightningStrikes: number; earthShocks: number; shieldOrbs: number
    oomTime: number
  }
  table: { missPct: number; dodgePct: number; parryPct: number; glancePct: number; glanceMult: number; critPct: number; armorReduction: number; spellHitPct: number }
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function attackTable(stats: CharacterStats, cfg: SimConfig) {
  const defense = cfg.targetLevel * 5
  const d = Math.max(0, defense - stats.weapon.skill)
  const baseMiss = d > 10 ? 5 + d * 0.2 : 5 + d * 0.1
  const missPct = Math.max(0, baseMiss - stats.hitPct)
  const dodgePct = 5 + d * 0.1
  const parryPct = cfg.attackFromBehind ? 0 : 5 + d * 0.1 + (cfg.targetLevel >= 63 ? 9 : 0)
  const glancePct = Math.max(0, 10 + d * 2)
  const low = Math.min(0.91, 1.3 - 0.05 * d)
  const high = Math.min(0.99, 1.2 - 0.03 * d)
  const glanceMult = (low + high) / 2
  const critSuppression = d > 10 ? 1.8 + 0.2 * d : 1.8 + 0.12 * d
  const critPct = Math.max(0, stats.critPct - critSuppression)
  const armor = Math.max(0, stats.targetArmor - stats.armorPen)
  const armorReduction = armor / (armor + 400 + 85 * (60 + 4.5 * (60 - 59)))
  const levelDiff = cfg.targetLevel - 60
  const baseSpellHit = levelDiff >= 3 ? 83 : 96 - levelDiff
  const spellHitPct = Math.min(99, baseSpellHit + stats.spellHitPct)
  return { missPct, dodgePct, parryPct, glancePct, glanceMult, critPct, armorReduction, spellHitPct }
}

export function simulate(stats: CharacterStats, points: TalentPoints, cfg: SimConfig, seed = 1, iterations = cfg.iterations): SimResult {
  const table = attackTable(stats, cfg)
  const T = cfg.fightLength
  const flurryRank = talentRank(points, 'Flurry')
  const flurryMult = 1 + [0, 0.08, 0.11, 0.14, 0.17, 0.2][flurryRank]
  const elementalWeapons = talentRank(points, 'Elemental Weapons') > 0
  const hasStormstrike = cfg.useStormstrike && talentRank(points, 'Stormstrike') > 0
  const hasLightningStrike = cfg.useLightningStrike && talentRank(points, 'Lightning Strike') > 0
  const hasBloodlust = cfg.useBloodlust && talentRank(points, 'Bloodlust') > 0
  const instantSpellCrit = 2 * talentRank(points, "Element's Grace")
  const shieldCharges = cfg.lightningShieldCharges + 2 * talentRank(points, 'Stable Shields')
  const esCooldown = Math.max(1, cfg.earthShockCooldown - [0, 0.3, 0.7, 1][talentRank(points, 'Reverberation')])
  const gcd = 1.5
  const devastationHit = 3 * talentRank(points, 'Elemental Devastation')
  const hasFocus = talentRank(points, 'Elemental Focus') > 0
  const baseApNoGear = 100 + 2 * stats.str

  const breakdown: Record<string, number> = {}
  const counts: SimResult['counts'] = {
    swings: 0, whiteMiss: 0, whiteDodge: 0, whiteParry: 0, whiteGlance: 0, whiteCrit: 0,
    windfuryProcs: 0, stormstrikes: 0, lightningStrikes: 0, earthShocks: 0, shieldOrbs: 0, oomTime: 0,
  }
  const iterDps: number[] = []

  for (let it = 0; it < iterations; it++) {
    const rng = mulberry32(seed * 1000003 + it)
    let total = 0
    const add = (src: DamageSource, dmg: number) => {
      total += dmg
      breakdown[src] = (breakdown[src] ?? 0) + dmg
    }

    let t = 0
    let nextSwing = 0
    let gcdReady = 0
    let ssReady = 0
    let lsReady = 0
    let esReady = 0
    let blReady = 0
    let racialReady = 0
    let flurryCharges = 0
    let ssCharges = 0
    let ssExpire = 0
    let ewStacks: number[] = []
    let crusaderExpire = 0
    let bloodlustExpire = 0
    let berserkingExpire = 0
    let bloodFuryExpire = 0
    let blHasteExpire = 0
    let devastationExpire = 0
    let clearcast = 0
    let shield = cfg.useLightningShield ? shieldCharges : 0
    let mana = stats.mana
    let lastRegen = 0

    const regen = () => {
      mana = Math.min(stats.mana, mana + (stats.mp5 / 5) * (t - lastRegen))
      lastRegen = t
    }
    const currentAp = () => {
      let ap = stats.ap
      if (t < crusaderExpire) ap += 200
      if (t < bloodFuryExpire) ap += baseApNoGear * 0.25
      return ap
    }
    const hasteMult = () => {
      let h = 1 + stats.hastePct / 100
      if (t < bloodlustExpire) h *= 1.2
      if (t < berserkingExpire) h *= 1.1
      if (t < blHasteExpire) h *= 1.08
      ewStacks = ewStacks.filter((e) => e > t)
      h *= 1 + 0.01 * ewStacks.length
      return h
    }
    const weaponDamage = (ap: number, pct = 1) => {
      const w = stats.weapon
      return (w.min + rng() * (w.max - w.min) + (ap / 14) * w.speed) * pct
    }
    const natureBonus = () => {
      if (ssCharges > 0 && t < ssExpire) {
        ssCharges--
        return 1 + cfg.stormstrikeNatureBonusPct / 100
      }
      return 1
    }
    const onCrit = () => {
      flurryCharges = 3
      if (t < bloodlustExpire) blHasteExpire = t + 6
      if (hasFocus) clearcast = 2
    }
    const spend = (cost: number) => {
      if (clearcast > 0) { clearcast--; cost *= 0.4 }
      mana -= cost
    }
    const spellHit = () => rng() * 100 < Math.min(99, table.spellHitPct + (t < devastationExpire ? devastationHit : 0))
    const spellDamage = (src: DamageSource, base: number, critBonus: number) => {
      if (!spellHit()) return
      let dmg = base * stats.natureMult * stats.damageMult * natureBonus()
      if (rng() * 100 < stats.spellCritPct + critBonus) { dmg *= 1.5; if (hasFocus) clearcast = 2 }
      add(src, dmg)
    }
    const shieldOrb = (mult: number) => {
      if (shield <= 0) return
      shield--
      counts.shieldOrbs++
      spellDamage('Lightning Shield', (cfg.lightningShieldDamage + cfg.lightningShieldCoef * stats.natureSpellPower) * mult, instantSpellCrit)
    }
    const onLanded = (fromExtraAttack: boolean, extraQueue: { bonusAp: number }[]) => {
      if (cfg.imbue === 'windfury' && !fromExtraAttack && rng() * 100 < cfg.windfuryProcChance) {
        counts.windfuryProcs++
        for (let i = 0; i < cfg.windfuryExtraAttacks; i++) extraQueue.push({ bonusAp: cfg.windfuryBonusAp * (1 + stats.windfuryPct / 100) })
        if (elementalWeapons) {
          ewStacks = ewStacks.filter((e) => e > t)
          if (ewStacks.length >= 2) ewStacks.shift()
          ewStacks.push(t + 5)
        }
      }
      if (cfg.imbue === 'flametongue') {
        let dmg = cfg.flametongueDamage * (stats.weapon.speed / 2.5) * stats.damageMult
        if (rng() * 100 < stats.spellCritPct) dmg *= 1.5
        add('Flametongue', dmg)
      }
      if (stats.crusader && rng() < (1 * stats.weapon.speed) / 60) crusaderExpire = t + 15
      for (const p of stats.procs) {
        // procChance > 100 is the DB marker for "use the spell's default" — treat as 1 PPM.
        const ppm = p.ppm > 0 ? p.ppm : p.procChance > 100 ? 1 : 0
        const chance = ppm > 0 ? (ppm * stats.weapon.speed) / 60 : p.procChance / 100
        if (rng() < chance) {
          const dmg = p.basePoints + rng() * Math.max(0, p.dieSides - 1)
          if (p.school > 0 || p.basePoints > 0) add('Item procs', dmg * stats.damageMult)
        }
      }
    }
    /** Resolve one melee attack. Returns true if it landed. */
    const melee = (src: DamageSource, dmg: number, white: boolean, fromExtraAttack: boolean, extraQueue: { bonusAp: number }[]) => {
      const r = rng() * 100
      let acc = table.missPct
      if (r < acc) { if (white) counts.whiteMiss++; return false }
      acc += table.dodgePct
      if (r < acc) { if (white) counts.whiteDodge++; return false }
      acc += table.parryPct
      if (r < acc) { if (white) counts.whiteParry++; return false }
      let mult = 1
      if (white) {
        acc += table.glancePct
        if (r < acc) { counts.whiteGlance++; mult = table.glanceMult }
      }
      if (mult === 1) {
        acc += table.critPct
        if (r < acc) {
          mult = 2
          if (white) counts.whiteCrit++
          onCrit()
          devastationExpire = t + 10
        }
      }
      add(src, dmg * mult * (1 - table.armorReduction) * stats.physicalMult * stats.damageMult)
      onLanded(fromExtraAttack, extraQueue)
      return true
    }
    const runExtraAttacks = (queue: { bonusAp: number }[]) => {
      while (queue.length) {
        const ex = queue.shift()!
        melee('Windfury', weaponDamage(currentAp() + ex.bonusAp), true, true, queue)
      }
    }

    while (t < T) {
      regen()
      if (hasBloodlust && t >= blReady) { bloodlustExpire = t + 30; blReady = t + cfg.bloodlustCooldown }
      if (cfg.useRacial && t >= racialReady) {
        if (cfg.race === 'Troll') { berserkingExpire = t + 10; racialReady = t + 180 }
        if (cfg.race === 'Orc') { bloodFuryExpire = t + 15; racialReady = t + 120 }
        if (cfg.race === 'Tauren') racialReady = Infinity
      }

      if (t >= nextSwing) {
        counts.swings++
        const queue: { bonusAp: number }[] = []
        melee('White', weaponDamage(currentAp()), true, false, queue)
        runExtraAttacks(queue)
        let speed = stats.weapon.speed / hasteMult()
        if (flurryCharges > 0) { speed /= flurryMult; flurryCharges-- }
        nextSwing = t + speed
      }

      if (t >= gcdReady) {
        const queue: { bonusAp: number }[] = []
        if (hasStormstrike && t >= ssReady && mana >= cfg.stormstrikeManaCost) {
          spend(cfg.stormstrikeManaCost)
          counts.stormstrikes++
          if (melee('Stormstrike', weaponDamage(currentAp()), false, false, queue)) {
            ssCharges = cfg.stormstrikeCharges
            ssExpire = t + 12
          }
          runExtraAttacks(queue)
          ssReady = t + cfg.stormstrikeCooldown
          gcdReady = t + gcd
        } else if (hasLightningStrike && t >= lsReady && mana >= cfg.lightningStrikeManaCost) {
          spend(cfg.lightningStrikeManaCost)
          counts.lightningStrikes++
          const base = weaponDamage(currentAp())
          if (melee('Lightning Strike', base * (cfg.lightningStrikeWeaponPct / 100), false, false, queue)) {
            add('LS Nature', base * (cfg.lightningStrikeNaturePct / 100) * stats.natureMult * stats.physicalMult * stats.damageMult * natureBonus())
            shieldOrb(cfg.empoweredShieldMultiplier)
          }
          runExtraAttacks(queue)
          lsReady = t + cfg.lightningStrikeCooldown
          gcdReady = t + gcd
        } else if (cfg.useLightningShield && shield <= 0 && mana >= cfg.lightningShieldManaCost) {
          mana -= cfg.lightningShieldManaCost
          shield = shieldCharges
          gcdReady = t + gcd
        } else if (cfg.useEarthShock && t >= esReady && mana - cfg.earthShockManaCost >= cfg.manaReserve) {
          spend(cfg.earthShockManaCost)
          counts.earthShocks++
          const base = cfg.earthShockMin + rng() * (cfg.earthShockMax - cfg.earthShockMin) + cfg.earthShockCoef * stats.natureSpellPower
          spellDamage('Earth Shock', base, instantSpellCrit)
          esReady = t + esCooldown
          gcdReady = t + gcd
        }
      }

      // advance to the next event
      let next = nextSwing
      const abilityTimes: number[] = []
      if (hasStormstrike) abilityTimes.push(ssReady)
      if (hasLightningStrike) abilityTimes.push(lsReady)
      if (cfg.useEarthShock) abilityTimes.push(esReady)
      if (cfg.useLightningShield && shield <= 0) abilityTimes.push(t)
      if (abilityTimes.length) {
        const nextAbility = Math.max(gcdReady, Math.min(...abilityTimes))
        if (nextAbility > t) next = Math.min(next, nextAbility)
        else next = Math.min(next, gcdReady > t ? gcdReady : nextSwing)
      }
      if (next <= t) next = t + 0.01
      if (mana < cfg.manaReserve) counts.oomTime += next - t
      t = next
    }
    iterDps.push(total / T)
  }

  const mean = iterDps.reduce((a, b) => a + b, 0) / iterations
  const variance = iterDps.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, iterations - 1)
  for (const k of Object.keys(breakdown)) breakdown[k] /= iterations * T
  return { dps: mean, stdev: Math.sqrt(variance), iterations, breakdown, counts, table }
}
