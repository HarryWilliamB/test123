import type { Item, ItemStats } from '../engine/types'

export const STAT_LABELS: Record<string, string> = {
  str: 'Str', agi: 'Agi', sta: 'Sta', int: 'Int', spi: 'Spi', ap: 'AP', rap: 'RAP', crit: '% Crit', hit: '% Hit', haste: '% Haste',
  sp: 'SP', natureSp: 'Nature SP', fireSp: 'Fire SP', frostSp: 'Frost SP', shadowSp: 'Shadow SP', arcaneSp: 'Arcane SP', holySp: 'Holy SP',
  healing: 'Healing', spellCrit: '% Spell Crit', spellHit: '% Spell Hit', mp5: 'MP5', hp5: 'HP5', armorPen: 'Armor Pen', spellPen: 'Spell Pen',
  defense: 'Defense', dodge: '% Dodge', parry: '% Parry', block: '% Block', blockValue: 'Block Value', allRes: 'All Res', armor: 'Armor',
  physDmg: 'Weapon Dmg', windfuryPct: '% Windfury AP',
}

const ORDER = ['str', 'agi', 'sta', 'int', 'spi', 'ap', 'crit', 'hit', 'haste', 'sp', 'natureSp', 'spellCrit', 'spellHit', 'mp5', 'armorPen']

export function formatStats(stats: ItemStats): string {
  const parts: string[] = []
  const keys = Object.keys(stats).sort((a, b) => (ORDER.indexOf(a) + 100) % 100 - ((ORDER.indexOf(b) + 100) % 100))
  for (const k of keys) {
    const v = stats[k as keyof ItemStats]
    if (typeof v !== 'number' || v === 0) continue
    const label = STAT_LABELS[k] ?? k
    parts.push(label.startsWith('%') ? `${v > 0 ? '+' : ''}${v}${label}` : `${v > 0 ? '+' : ''}${v} ${label}`)
  }
  if (stats.skills) for (const [id, n] of Object.entries(stats.skills)) parts.push(`+${n} skill(${id})`)
  return parts.join(', ')
}

export function itemSummary(it: Item): string {
  const bits: string[] = []
  if (it.dmgMin !== undefined) bits.push(`${it.dmgMin}-${it.dmgMax} dmg, ${it.speed?.toFixed(2)} spd (${(((it.dmgMin + (it.dmgMax ?? 0)) / 2) / (it.speed ?? 1)).toFixed(1)} dps)`)
  const s = formatStats(it.stats)
  if (s) bits.push(s)
  if (it.effects?.length) bits.push(...it.effects)
  return bits.join(' | ')
}

export const QUALITY_CLASS = ['q0', 'q1', 'q2', 'q3', 'q4', 'q5']

export function fmt(n: number, digits = 1) {
  return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits })
}

export function signed(n: number, digits = 1) {
  return (n > 0 ? '+' : '') + fmt(n, digits)
}
