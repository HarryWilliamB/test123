import type { BuffFlags, Enchants, SimConfig } from './config'
import { talentRank, type TalentPoints } from './talents'
import type { Gear, GearSlot, Item, ItemDb, ItemProc, ItemStats } from './types'

export interface BaseStats { str: number; agi: number; sta: number; int: number; spi: number }

/** Approximate level 60 shaman base stats (vanilla values). */
export const RACE_BASE: Record<string, BaseStats> = {
  Orc: { str: 105, agi: 64, sta: 116, int: 105, spi: 127 },
  Tauren: { str: 107, agi: 59, sta: 117, int: 103, spi: 127 },
  Troll: { str: 103, agi: 74, sta: 115, int: 103, spi: 124 },
}

export interface Weapon {
  min: number
  max: number
  speed: number
  twoHand: boolean
  type: string | null
  skill: number
}

export interface CharacterStats {
  str: number
  agi: number
  sta: number
  int: number
  spi: number
  ap: number
  critPct: number
  hitPct: number
  hastePct: number
  spellPower: number
  natureSpellPower: number
  spellCritPct: number
  spellHitPct: number
  mp5: number
  mana: number
  armorPen: number
  weapon: Weapon
  /** Multiplier applied to all damage (e.g. Darkmoon Faire buff). */
  damageMult: number
  physicalMult: number
  natureMult: number
  procs: ItemProc[]
  crusader: boolean
  targetArmor: number
  windfuryPct: number
  /** Raw sums for display */
  gearStats: ItemStats
  sets: SetStatus[]
}

export interface SetStatus {
  name: string
  count: number
  bonuses: { need: number; text: string; active: boolean; modelled: boolean }[]
}

const SET_BONUS_RE = [
  /\+\d+ Attack Power/,
  /Improves your chance to get a critical strike by \d+%/,
  /Improves your chance to hit by \d+%/,
  /\+\d+ (Strength|Agility|Stamina|Intellect|Spirit)/,
  /Increases damage and healing done by magical spells and effects by up to \d+/,
  /critical strike with (Nature spells|all Shock spells|spells) by \d+%/,
  /Restores \d+ mana per 5 sec/,
  /\d+% chance of dealing \d+ to \d+ (Fire|Nature|Frost|Shadow|Arcane) damage on a successful melee attack/,
]

function addStats(into: ItemStats, from: ItemStats) {
  for (const [k, v] of Object.entries(from)) {
    if (k === 'skills') {
      into.skills = { ...(into.skills ?? {}) }
      for (const [s, n] of Object.entries(v as Record<string, number>)) into.skills[s] = (into.skills[s] ?? 0) + n
    } else if (typeof v === 'number') {
      const key = k as Exclude<keyof ItemStats, 'skills'>
      into[key] = (into[key] ?? 0) + v
    }
  }
}

const WEAPON_SKILL_IDS: Record<string, string> = {
  Axe: '44', 'Two-Handed Axe': '172', Mace: '54', 'Two-Handed Mace': '160', Staff: '136', 'Fist Weapon': '473', Dagger: '173',
}

export function enchantStats(enchants: Enchants, twoHand: boolean): ItemStats {
  const s: ItemStats = {}
  const add = (x: ItemStats) => addStats(s, x)
  switch (enchants.weapon) {
    case 'agi15': add({ agi: 15 }); break
    case 'agi25': add({ agi: twoHand ? 25 : 15 }); break
    case 'str15': add({ str: twoHand ? 15 : 0 }); break
    case 'dmg5': add({ physDmg: 5 }); break
    case 'dmg9': add({ physDmg: twoHand ? 9 : 5 }); break
  }
  for (const slot of ['head', 'legs'] as const) {
    switch (enchants[slot]) {
      case 'rapidity': add({ haste: 1 }); break
      case 'voracityStr': add({ str: 8 }); break
      case 'voracityAgi': add({ agi: 8 }); break
      case 'falconsCall': add({ hit: 1, rap: 24, sta: 10 }); break
    }
  }
  switch (enchants.shoulder) {
    case 'zandalarMight': add({ ap: 30 }); break
    case 'scourgeMight': add({ ap: 26, crit: 1 }); break
  }
  if (enchants.back === 'agi3') add({ agi: 3 })
  if (enchants.chest === 'stats4') add({ str: 4, agi: 4, sta: 4, int: 4, spi: 4 })
  if (enchants.chest === 'stats3') add({ str: 3, agi: 3, sta: 3, int: 3, spi: 3 })
  switch (enchants.wrist) {
    case 'str9': add({ str: 9 }); break
    case 'sta9': add({ sta: 9 }); break
    case 'int5': add({ int: 5 }); break
  }
  switch (enchants.hands) {
    case 'agi15': add({ agi: 15 }); break
    case 'str7': add({ str: 7 }); break
    case 'haste1': add({ haste: 1 }); break
  }
  if (enchants.feet === 'agi7') add({ agi: 7 })
  return s
}

export function buffStats(b: BuffFlags, points: TalentPoints): { stats: ItemStats; statMult: number; damageMult: number; armorReduction: number } {
  const s: ItemStats = {}
  const add = (x: ItemStats) => addStats(s, x)
  const enhTotems = 1 + [0, 0.12, 0.25][talentRank(points, 'Enhancing Totems')]
  if (b.strengthOfEarth) add({ str: Math.round(61 * enhTotems) })
  if (b.graceOfAir) add({ agi: Math.round(77 * enhTotems) })
  if (b.manaSpring) add({ mp5: 12 })
  if (b.battleShout) add({ ap: 232 })
  if (b.markOfTheWild) add({ str: 12, agi: 12, sta: 12, int: 12, spi: 12 })
  if (b.mongoose) add({ agi: 25, crit: 2 })
  if (b.jujuPower) add({ str: 30 })
  if (b.jujuMight) add({ ap: 40 })
  if (b.firewater) add({ ap: 35 })
  if (b.strengthFood) add({ str: 20 })
  if (b.rallyingCry) add({ crit: 5, ap: 140 })
  if (b.songflower) add({ crit: 5, str: 15, agi: 15, sta: 15, int: 15, spi: 15 })
  if (b.warchiefsBlessing) add({ haste: 15 })
  let armorReduction = 0
  if (b.sunderArmor) armorReduction += 2250
  if (b.faerieFire) armorReduction += 505
  if (b.curseOfRecklessness) armorReduction += 640
  return { stats: s, statMult: b.spiritOfZandalar ? 1.15 : 1, damageMult: b.darkmoonDamage ? 1.1 : 1, armorReduction }
}

export function itemsInGear(db: ItemDb, gear: Gear): Partial<Record<GearSlot, Item>> {
  const byId = new Map(db.items.map((i) => [i.id, i]))
  const out: Partial<Record<GearSlot, Item>> = {}
  for (const [slot, id] of Object.entries(gear) as [GearSlot, number | undefined][]) {
    if (id !== undefined) {
      const it = byId.get(id)
      if (it) out[slot] = it
    }
  }
  return out
}

export function computeStats(db: ItemDb, gear: Gear, points: TalentPoints, cfg: SimConfig, extra: ItemStats = {}): CharacterStats {
  const equipped = itemsInGear(db, gear)
  const gearStats: ItemStats = {}
  const procs: ItemProc[] = []
  for (const it of Object.values(equipped)) {
    if (!it) continue
    addStats(gearStats, it.stats)
    if (it.procs) procs.push(...it.procs)
  }
  // set bonuses: only stat-like bonuses we can parse
  const setCounts = new Map<number, number>()
  for (const it of Object.values(equipped)) if (it?.setId) setCounts.set(it.setId, (setCounts.get(it.setId) ?? 0) + 1)
  const sets: SetStatus[] = []
  for (const [setId, n] of setCounts) {
    const set = db.sets[String(setId)]
    if (!set) continue
    const status: SetStatus = { name: set.name, count: n, bonuses: [] }
    sets.push(status)
    for (const [need, text] of set.bonuses) {
      const active = n >= need
      const modelled = SET_BONUS_RE.some((rx) => rx.test(text))
      status.bonuses.push({ need, text, active, modelled })
      if (!active) continue
      let m: RegExpMatchArray | null
      if ((m = text.match(/\+(\d+) Attack Power/))) addStats(gearStats, { ap: Number(m[1]) })
      else if ((m = text.match(/Improves your chance to get a critical strike by (\d+)%/))) addStats(gearStats, { crit: Number(m[1]) })
      else if ((m = text.match(/Improves your chance to hit by (\d+)%/))) addStats(gearStats, { hit: Number(m[1]) })
      else if ((m = text.match(/\+(\d+) (Strength|Agility|Stamina|Intellect|Spirit)/))) {
        const key = { Strength: 'str', Agility: 'agi', Stamina: 'sta', Intellect: 'int', Spirit: 'spi' }[m[2]] as keyof ItemStats
        addStats(gearStats, { [key]: Number(m[1]) })
      } else if ((m = text.match(/Increases damage and healing done by magical spells and effects by up to (\d+)/))) addStats(gearStats, { sp: Number(m[1]) })
      else if ((m = text.match(/critical strike with (?:Nature spells|all Shock spells|spells) by (\d+)%/))) addStats(gearStats, { spellCrit: Number(m[1]) })
      else if ((m = text.match(/Restores (\d+) mana per 5 sec/))) addStats(gearStats, { mp5: Number(m[1]) })
      else if ((m = text.match(/(\d+)% chance of dealing (\d+) to (\d+) (Fire|Nature|Frost|Shadow|Arcane) damage on a successful melee attack/))) {
        procs.push({ spellId: 0, ppm: 0, procChance: Number(m[1]), text: `${set.name} (${need})`, school: 1, basePoints: Number(m[2]), dieSides: Number(m[3]) - Number(m[2]) + 1 })
      }
    }
  }

  const mh = equipped.mainHand
  const twoHand = mh?.slot === 'Two-Hand'
  const all: ItemStats = {}
  addStats(all, gearStats)
  addStats(all, enchantStats(cfg.enchants, twoHand))
  const buffs = buffStats(cfg.buffs, points)
  addStats(all, buffs.stats)
  addStats(all, extra)

  const base = RACE_BASE[cfg.race]
  const ak = 1 + 0.01 * talentRank(points, 'Ancestral Knowledge')
  const statMult = ak * buffs.statMult
  const str = Math.floor((base.str + (all.str ?? 0)) * statMult)
  const agi = Math.floor((base.agi + (all.agi ?? 0)) * statMult)
  const sta = Math.floor((base.sta + (all.sta ?? 0)) * statMult)
  const int = Math.floor((base.int + (all.int ?? 0)) * statMult)
  const spi = Math.floor((base.spi + (all.spi ?? 0)) * statMult)

  let ap = 60 * 2 - 20 + str * 2 + (all.ap ?? 0)
  if (cfg.imbue === 'rockbiter') ap += cfg.rockbiterAp

  const skillId = mh?.type ? WEAPON_SKILL_IDS[mh.type] : undefined
  let skill = 300 + (skillId && all.skills ? all.skills[skillId] ?? 0 : 0)
  if (cfg.race === 'Orc' && (mh?.type === 'Axe' || mh?.type === 'Two-Handed Axe')) skill += 5

  const critPct = cfg.baseCritPct + agi / 20 + (all.crit ?? 0) + talentRank(points, 'Thundering Strikes')
  const hitPct = (all.hit ?? 0) + talentRank(points, 'Elemental Devastation')
  const spellHitPct = (all.spellHit ?? 0) + talentRank(points, 'Elemental Devastation')
  const spellPower = all.sp ?? 0
  const natureSpellPower = spellPower + (all.natureSp ?? 0)
  const spellCritPct = cfg.baseSpellCritPct + int / 59.5 + (all.spellCrit ?? 0)

  const weapon: Weapon = mh
    ? { min: (mh.dmgMin ?? 1) + (all.physDmg ?? 0), max: (mh.dmgMax ?? 2) + (all.physDmg ?? 0), speed: mh.speed ?? 2, twoHand, type: mh.type, skill }
    : { min: 1 + (all.physDmg ?? 0), max: 2 + (all.physDmg ?? 0), speed: 2, twoHand: false, type: null, skill }

  return {
    str, agi, sta, int, spi, ap, critPct, hitPct,
    hastePct: all.haste ?? 0,
    spellPower, natureSpellPower, spellCritPct, spellHitPct,
    mp5: all.mp5 ?? 0,
    mana: 1400 + int * 15,
    armorPen: all.armorPen ?? 0,
    weapon,
    damageMult: buffs.damageMult,
    physicalMult: 1 + 0.02 * talentRank(points, "Element's Grace"),
    natureMult: 1 + 0.01 * talentRank(points, 'Concussion'),
    procs,
    crusader: cfg.enchants.weapon === 'crusader',
    targetArmor: Math.max(0, cfg.targetArmor - buffs.armorReduction),
    windfuryPct: all.windfuryPct ?? 0,
    gearStats,
    sets,
  }
}
