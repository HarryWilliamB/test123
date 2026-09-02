import type { SimConfig } from './config'
import { simulate } from './sim'
import { computeStats } from './stats'
import type { TalentPoints } from './talents'
import type { Gear, ItemDb, ItemStats } from './types'

export interface StatWeight { stat: string; label: string; perPoint: number; relative: number }

const PROBES: { stat: keyof ItemStats; label: string; amount: number }[] = [
  { stat: 'ap', label: 'Attack Power', amount: 100 },
  { stat: 'str', label: 'Strength', amount: 50 },
  { stat: 'agi', label: 'Agility', amount: 50 },
  { stat: 'crit', label: 'Crit %', amount: 3 },
  { stat: 'hit', label: 'Hit %', amount: 3 },
  { stat: 'haste', label: 'Haste %', amount: 5 },
  { stat: 'sp', label: 'Spell Power', amount: 100 },
  { stat: 'natureSp', label: 'Nature Spell Power', amount: 100 },
  { stat: 'int', label: 'Intellect', amount: 50 },
  { stat: 'spellCrit', label: 'Spell Crit %', amount: 3 },
  { stat: 'spellHit', label: 'Spell Hit %', amount: 3 },
  { stat: 'mp5', label: 'MP5', amount: 30 },
  { stat: 'armorPen', label: 'Armor Pen', amount: 500 },
]

export function statWeights(db: ItemDb, gear: Gear, points: TalentPoints, cfg: SimConfig, iterations: number): { baseDps: number; weights: StatWeight[] } {
  const base = simulate(computeStats(db, gear, points, cfg), points, cfg, 7, iterations).dps
  const weights = PROBES.map((p) => {
    const dps = simulate(computeStats(db, gear, points, cfg, { [p.stat]: p.amount }), points, cfg, 7, iterations).dps
    return { stat: p.stat, label: p.label, perPoint: (dps - base) / p.amount, relative: 0 }
  })
  const ap = weights.find((w) => w.stat === 'ap')?.perPoint ?? 1
  for (const w of weights) w.relative = ap > 0 ? w.perPoint / ap : 0
  return { baseDps: base, weights }
}
