export interface ItemStats {
  str?: number
  agi?: number
  sta?: number
  int?: number
  spi?: number
  ap?: number
  rap?: number
  crit?: number
  hit?: number
  haste?: number
  sp?: number
  natureSp?: number
  fireSp?: number
  frostSp?: number
  shadowSp?: number
  arcaneSp?: number
  holySp?: number
  healing?: number
  spellCrit?: number
  spellHit?: number
  mp5?: number
  hp5?: number
  armorPen?: number
  spellPen?: number
  defense?: number
  dodge?: number
  parry?: number
  block?: number
  blockValue?: number
  allRes?: number
  armor?: number
  physDmg?: number
  windfuryPct?: number
  skills?: Record<string, number>
}

export interface ItemProc {
  spellId: number
  ppm: number
  procChance: number
  text: string
  school: number
  basePoints: number
  dieSides: number
}

export type Slot =
  | 'Head' | 'Neck' | 'Shoulder' | 'Back' | 'Chest' | 'Wrist' | 'Hands' | 'Waist' | 'Legs' | 'Feet'
  | 'Finger' | 'Trinket' | 'One-Hand' | 'Two-Hand' | 'Main Hand' | 'Off Hand' | 'Held In Off-hand'
  | 'Relic' | 'Ranged' | 'Shirt' | 'Thrown' | 'Tabard'

export interface Item {
  id: number
  name: string
  quality: number
  ilvl: number
  reqLevel: number
  slot: Slot
  type: string | null
  stats: ItemStats
  dmgMin?: number
  dmgMax?: number
  speed?: number
  dmgSchool?: number
  dmg2?: [number, number, number]
  armor?: number
  blockValue?: number
  resist?: Record<string, number>
  effects?: string[]
  procs?: ItemProc[]
  setId?: number
  classes?: number
  source?: string
  verified?: boolean
  icon?: string
}

export interface ItemSet {
  name: string
  items: number[]
  bonuses: [number, string][]
}

export interface ItemDb {
  items: Item[]
  sets: Record<string, ItemSet>
}

export interface Talent {
  tree: number
  treeName: string
  slot: number
  row: number
  col: number
  name: string
  ranks: number
  requires: number | null
  icon: string
  description: string
  spellIds: string
}

/** Equipment slots used by the calculator, in display order. */
export const GEAR_SLOTS = [
  'head', 'neck', 'shoulder', 'back', 'chest', 'wrist', 'hands', 'waist', 'legs', 'feet',
  'finger1', 'finger2', 'trinket1', 'trinket2', 'mainHand', 'offHand', 'relic',
] as const
export type GearSlot = (typeof GEAR_SLOTS)[number]

export type Gear = Partial<Record<GearSlot, number>>

/** Which item slots may go in each gear slot. */
export const SLOT_ACCEPTS: Record<GearSlot, Slot[]> = {
  head: ['Head'], neck: ['Neck'], shoulder: ['Shoulder'], back: ['Back'], chest: ['Chest'], wrist: ['Wrist'],
  hands: ['Hands'], waist: ['Waist'], legs: ['Legs'], feet: ['Feet'], finger1: ['Finger'], finger2: ['Finger'],
  trinket1: ['Trinket'], trinket2: ['Trinket'], mainHand: ['One-Hand', 'Main Hand', 'Two-Hand'],
  offHand: ['Off Hand', 'Held In Off-hand'], relic: ['Relic'],
}

export const SLOT_LABELS: Record<GearSlot, string> = {
  head: 'Head', neck: 'Neck', shoulder: 'Shoulder', back: 'Back', chest: 'Chest', wrist: 'Wrist', hands: 'Hands',
  waist: 'Waist', legs: 'Legs', feet: 'Feet', finger1: 'Ring 1', finger2: 'Ring 2', trinket1: 'Trinket 1',
  trinket2: 'Trinket 2', mainHand: 'Weapon', offHand: 'Shield / Off-hand', relic: 'Totem',
}
